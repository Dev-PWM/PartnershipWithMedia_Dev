import { NextResponse } from "next/server";
import { signingOpen } from "@/lib/agreement";
import { notifyOwner, ownerAddress, sendEmail } from "@/lib/email";
import { offerName, ownerNotice, signingReminder } from "@/lib/emails";
import {
  formatMoney, orderIdentity, ordersAwaitingSignature, ordersConfigProblem, ordersEnabled, OrdersUnavailable, recordReminder,
  type AwaitingSignature, type ReminderStep,
} from "@/lib/orders";
import type { Offer } from "@/lib/stripe";

// GET, once a day from Vercel Cron (vercel.json). Nudges buyers who paid for a build package but haven't signed:
// a reminder on day 2, a last one on day 5, then a notice to you on day 7 to reach out personally.
// Each step is recorded in the database after it sends, and carries an idempotency key, so reruns don't repeat it.
// Vercel sends `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET set the route refuses every call.

const DAY = 86_400_000;

// Which step is due for an order this many days old, given the steps already sent. One step per run, in order, so an
// order that missed runs (an outage, or created before this shipped) catches up a day at a time instead of getting
// both reminders at once.
function dueStep(ageDays: number, sent: ReminderStep[]): ReminderStep | null {
  if (!sent.includes("buyer_1")) return ageDays >= 2 ? "buyer_1" : null;
  if (!sent.includes("buyer_2")) return ageDays >= 5 ? "buyer_2" : null;
  if (!sent.includes("owner")) return ageDays >= 7 ? "owner" : null;
  return null;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ordersEnabled() || ordersConfigProblem() || !signingOpen()) return NextResponse.json({ ok: true, skipped: "orders off" });

  let orders: AwaitingSignature[];
  try {
    orders = await ordersAwaitingSignature();
  } catch (err) {
    if (!(err instanceof OrdersUnavailable)) throw err;
    console.error("Signing reminders:", err.message);
    return NextResponse.json({ error: "Orders unavailable" }, { status: 503 });
  }

  const now = Date.now();
  const sent: string[] = [];
  for (const o of orders) {
    const step = dueStep((now - new Date(o.created_at).getTime()) / DAY, o.sent);
    if (!step) continue;
    // A buyer step for an order without an email has no one to go to; tell the owner instead, once.
    const target = step !== "owner" && !o.buyer_email ? "owner" : step;
    if (target === "owner" && o.sent.includes("owner")) continue;
    try {
      await send(o, target);
      // Recording the step that was due keeps the schedule moving even when the owner got it instead.
      await recordSent(o.code, step);
      if (target !== step) await recordSent(o.code, "owner");
      sent.push(`${o.code}:${target}`);
    } catch (err) {
      // One failure shouldn't stop the others; tomorrow's run retries this order.
      console.error(`Signing reminders: ${o.code} ${target} failed.`, err);
    }
  }
  return NextResponse.json({ ok: true, sent });
}

// The email is already out at this point. If saving that fails, tomorrow's run sends it again, and by then Resend's
// 24h idempotency key has expired, so the buyer gets a duplicate. A brief database blip is the likely cause, so retry
// the save a few times before giving up. Recording is idempotent (on conflict do nothing), so a retry is safe.
async function recordSent(code: string, step: ReminderStep) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await recordReminder(code, step);
    } catch (err) {
      if (!(err instanceof OrdersUnavailable) || attempt === 3) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
}

async function send(o: AwaitingSignature, step: ReminderStep) {
  const { url } = orderIdentity(o.stripe_session_id);
  const key = `reminder:${o.code}:${step}`;
  if (step === "owner") {
    const kind = offerName(o.offer as Offer);
    const days = Math.floor((Date.now() - new Date(o.created_at).getTime()) / DAY);
    const notice = ownerNotice({
      eyebrow: "Still unsigned",
      title: `${o.code}: ${days} days without a signature`,
      intro: `${o.buyer_name || "The buyer"} paid for ${kind} but hasn't signed the agreement${o.buyer_email ? " after two reminders" : ", and Stripe gave no email to remind them"}. A personal note usually does it.`,
      details: [["Order", o.code], ["Package", kind], ["Amount", formatMoney(o.amount_cents, o.currency)], ["Name", o.buyer_name || "-"], ["Email", o.buyer_email || "-"]],
      note: `Their private order link, to include in your note: ${url}`,
    });
    await notifyOwner(`Unsigned for ${days} days — ${o.code}`, `${o.code} is paid but unsigned after ${days} days. Order link: ${url}`, key, notice.html, o.buyer_email ?? undefined);
    return;
  }
  const mail = signingReminder({ name: o.buyer_name, offer: o.offer as Offer, code: o.code, orderUrl: url, final: step === "buyer_2" });
  const ok = await sendEmail({ to: o.buyer_email!, subject: mail.subject, html: mail.html, text: mail.text, replyTo: ownerAddress().split(",")[0].trim(), idempotencyKey: key });
  if (!ok) throw new Error("Resend is not configured.");
}
