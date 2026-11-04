import { NextResponse } from "next/server";
import { CURRENT_AGREEMENT, agreementDigest, agreementPlainText, signingOpen } from "@/lib/agreement";
import { notifyOwner, ownerAddress, sendEmail } from "@/lib/email";
import { orderScope } from "@/lib/content";
import { agreementSignedCopy, offerName, ownerNotice } from "@/lib/emails";
import { findOrder, formatMoney, isOrderToken, ordersConfigProblem, ordersEnabled, OrdersUnavailable, signAgreementRecord } from "@/lib/orders";
import { GuardError, clientIp, guardResponse, rateLimit, readGuardedJson } from "@/lib/request-guard";
import { siteUrl } from "@/lib/site";
import type { Offer } from "@/lib/stripe";

// POST { token, version, name, consent }: the buyer signs the service agreement from their private order page.
// The SQL function decides the outcome under a row lock, so repeated or simultaneous submissions sign once.
// Emails go out after the signature is stored; if they fail the signature still stands and the page shows it.

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

// A typed legal name: printable characters only, spaces collapsed, with at least one letter.
function cleanName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.replace(/[\p{C}]/gu, "").replace(/\s+/g, " ").trim();
  return name.length >= 2 && name.length <= 120 && /\p{L}/u.test(name) ? name : null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readGuardedJson(request, 2048);
    rateLimit(`sign:${clientIp(request)}`, 10, 10 * 60_000);
  } catch (err) {
    if (err instanceof GuardError) return guardResponse(err);
    throw err;
  }
  if (!ordersEnabled() || ordersConfigProblem()) return fail("Signing isn't available right now. Please try again later.", 503);
  if (!isOrderToken(body.token)) return fail("This order link isn't valid.", 404);
  if (body.consent !== true) return fail("Please confirm you agree to sign electronically.", 400);
  const signerName = cleanName(body.name);
  if (!signerName) return fail("Please type your full name.", 400);
  if (body.version !== CURRENT_AGREEMENT.version) return fail("The agreement was updated. Reload the page to read the current version.", 409);
  if (!signingOpen()) return fail("This agreement isn't open for signing yet.", 403);

  const token = body.token;
  try {
    const order = await findOrder(token);
    if (!order) return fail("This order link isn't valid.", 404);
    // A signed order still goes through sign_client_agreement below: its already_signed answer resends the copies.
    if (!order.agreement && (!order.requires_agreement || order.status !== "paid")) return fail("This order isn't waiting for a signature.", 409);

    const scope = orderScope(order.offer);
    const sha256 = agreementDigest(CURRENT_AGREEMENT, {
      code: order.code, offer: order.offer, amountCents: order.amount_cents, currency: order.currency, signerName, scope,
    });
    const result = await signAgreementRecord({
      token, version: CURRENT_AGREEMENT.version, sha256, signerName, ip: clientIp(request), userAgent: request.headers.get("user-agent") || "",
    });
    if (result.result === "already_signed") {
      // The first emails may have failed after the signature was stored, and nothing else retries them. Send them
      // again from the stored signature (not this request's name); the idempotency keys stop repeats within 24h.
      // An older agreement version can't be rebuilt from today's text, so it is left alone.
      if (result.agreement_version === CURRENT_AGREEMENT.version) {
        await sendSignedEmails({ ...result, token, sha256: result.agreement_sha256, signerName: result.signer_name, scope });
      }
      return NextResponse.json({ ok: true, alreadySigned: true });
    }
    if (result.result === "not_found") return fail("This order link isn't valid.", 404);
    if (result.result === "not_signable") return fail("This order isn't waiting for a signature.", 409);

    await sendSignedEmails({ ...result, token, sha256, signerName, scope });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (!(err instanceof OrdersUnavailable)) throw err;
    console.error("Sign agreement:", err.message);
    return fail("Couldn't record your signature right now. Please try again in a few minutes.", 503);
  }
}

async function sendSignedEmails(s: {
  scope: ReturnType<typeof orderScope>;
  code: string; offer: string; buyer_email: string | null; amount_cents: number | null; currency: string | null; signed_at: string;
  token: string; sha256: string; signerName: string;
}) {
  const amount = formatMoney(s.amount_cents, s.currency);
  const signedAt = new Date(s.signed_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/Los_Angeles" }) + " (Pacific)";
  const orderUrl = `${siteUrl}/orders/${s.token}`;
  const scope = s.scope;
  const sends: Promise<unknown>[] = [];
  if (s.buyer_email) {
    const copy = agreementSignedCopy({
      name: s.signerName, offer: s.offer as Offer, code: s.code, amount, version: CURRENT_AGREEMENT.version, sha256: s.sha256, signedAt, orderUrl,
      agreementText: [
        "WHAT'S INCLUDED", scope.description, `Typical timeline: ${scope.timeline}`, "What you provide:", ...scope.youProvide.map((x) => `- ${x}`), "",
        agreementPlainText(CURRENT_AGREEMENT),
      ].join("\n"),
    });
    sends.push(sendEmail({ to: s.buyer_email, subject: copy.subject, html: copy.html, text: copy.text, replyTo: ownerAddress().split(",")[0].trim(), idempotencyKey: `agreement:${s.code}:buyer` }));
  }
  const kind = offerName(s.offer as Offer);
  const notice = ownerNotice({
    eyebrow: "Agreement signed",
    title: `${s.code}: ready to start`,
    intro: `${s.signerName} signed the ${kind} agreement. Kickoff is due within one business day.`,
    details: [["Order", s.code], ["Package", kind], ["Amount", amount], ["Signed by", s.signerName], ["Signed at", signedAt], ["Version", CURRENT_AGREEMENT.version]],
    note: "Move the order to kickoff with: npm run orders -- status " + s.code + " kickoff",
  });
  sends.push(notifyOwner(`Agreement signed — ${s.code}`, `${s.signerName} signed the ${kind} agreement for ${s.code}.`, `agreement:${s.code}:owner`, notice.html));
  for (const r of await Promise.allSettled(sends)) if (r.status === "rejected") console.error("Sign agreement: email not sent.", r.reason);
}
