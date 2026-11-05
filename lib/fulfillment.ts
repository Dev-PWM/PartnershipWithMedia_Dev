import "server-only";
import type Stripe from "stripe";
import { ownerAddress, sendEmail } from "@/lib/email";
import { ownerNotice, purchaseThankYou } from "@/lib/emails";
import { claimSaleEmail, finishSaleEmail, orderFlowLive, orderIdentity, ordersConfigProblem, OrdersMisconfigured,
  OrdersUnavailable, recordPaidOrder, saleState, type SaleEmail } from "@/lib/orders";
import { isOffer, needsAgreement } from "@/lib/stripe";

// The sale path shared by the Stripe webhook and the daily order reconciliation, so both record and email a sale the
// same way.

// Without Resend an event we email about would be acknowledged and its emails silently dropped. Each handler calls
// this once it knows the event is ours and after anything it must save (the paid order), then the webhook answers 503:
// Stripe keeps retrying for three days, shows the endpoint failing and emails the account about it. Once the key is
// back, a retry sends everything once. Other sites' events on the shared account are still acknowledged.
export class EmailNotConfigured extends Error {}
export function requireEmail() {
  if (!process.env.RESEND_API_KEY) throw new EmailNotConfigured();
}

export const money = (cents: number | null, currency: string | null) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "usd" }).format((cents ?? 0) / 100);

export const dashboard = (path: string) => `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") || process.env.STRIPE_SECRET_KEY?.startsWith("rk_test") ? "test/" : ""}${path}`;

// Durable recipient receipts prevent completed sends from repeating. Session-based Resend keys cover an uncertain
// send while its receipt is not yet recorded, within Resend's 24-hour window. Stripe sends its own official receipt.
export async function fulfill(session: Stripe.Checkout.Session) {
  // Keyed on the Checkout session, not the webhook event: a Stripe retry and the daily reconciliation both see the
  // same key, so Resend sends each email once per sale within its 24-hour window.
  const eventId = `sale:${session.id}`;
  const offer = session.metadata?.offer;
  // This Stripe account also takes payments for client sites (Nick's Process Services
  // registers its own webhook on it), and Stripe sends every account event to every
  // endpoint. Only sessions this site created carry one of its offers.
  if (!isOffer(offer)) return;
  const kind =
    offer === "project_deposit"
      ? "Start Deposit paid"
      : offer === "care_pass"
        ? "24-Hour Care Pass bought"
      : offer === "maintenance_monthly"
        ? "New maintenance subscriber"
        : `${offer ? offer[0].toUpperCase() + offer.slice(1) : "Package"} purchased`;
  const who = session.customer_details?.name || session.customer_details?.email || "A client";
  const text = [
    `${kind}: ${money(session.amount_total, session.currency)}`,
    `Client: ${session.customer_details?.name ?? "-"} <${session.customer_details?.email ?? "-"}>`,
    // From a client site's buy link (/buy/<offer>?site=...). Anyone can set it, so check the
    // buyer's email above matches that client before deploying anything.
    ...(session.metadata?.client_site ? [`Website (from buy link, unverified): ${session.metadata.client_site}`] : []),
    "",
    typeof session.subscription === "string"
      ? dashboard(`subscriptions/${session.subscription}`)
      : dashboard(`checkout/sessions/${session.id}`),
  ].join("\n");
  const amount = money(session.amount_total, session.currency);
  const buyer = session.customer_details?.email;
  const site = session.metadata?.client_site;
  // Once orders are configured, setup errors must fail too: acknowledging them loses the order after Stripe's retries.
  const configProblem = ordersConfigProblem();
  if (configProblem) throw new OrdersMisconfigured(configProblem);
  let order: Awaited<ReturnType<typeof recordPaidOrder>> | undefined;
  if (orderFlowLive()) {
    const state = await saleState(session.id);
    if (state?.complete) return;
    if (state && state.token_hash !== orderIdentity(session.id).tokenHash) {
      throw new OrdersMisconfigured("ORDER_LINK_SECRET changed: refusing to email a broken order link.");
    }
    order = await recordPaidOrder({
      sessionId: session.id, offer, amountCents: session.amount_total, currency: session.currency,
      buyerName: session.customer_details?.name ?? null, buyerEmail: buyer ?? null, clientSite: site ?? null,
    });
  }
  requireEmail();
  const needsSignature = Boolean(order) && needsAgreement(offer);
  const notes = [
    site ? "The website came from the buy link, so anyone could have typed it. Check the buyer's email matches that client before deploying." : "",
    needsSignature ? "Build work waits for the buyer to sign the agreement on their order page." : "",
    // Without an address the buyer never gets their link, so it goes to you to pass on.
    order && !buyer ? `Stripe gave no buyer email. Send them their private order link: ${order.url}` : "",
  ].filter(Boolean);
  const stripeUrl = typeof session.subscription === "string" ? dashboard(`subscriptions/${session.subscription}`) : dashboard(`checkout/sessions/${session.id}`);
  const notice = ownerNotice({
    eyebrow: "New sale",
    title: `${kind}: ${amount}`,
    intro: `${who} paid. Follow up from their order and check the email delivery log if they need help.`,
    details: [["Package", kind], ["Amount", amount], ["Name", session.customer_details?.name ?? "-"], ["Email", buyer ?? "-"],
      ...(site ? [["Website (unverified)", site] as [string, string]] : []),
      ...(order ? [["Order", order.code] as [string, string]] : [])],
    button: { label: "Open in Stripe", url: stripeUrl },
    note: notes.join("\n") || undefined,
  });
  // The plain-text part carries the order and notes too, for mail apps that show text only.
  const ownerText = [text, ...(order ? ["", `Order: ${order.code}`] : []), ...(notes.length ? ["", ...notes] : [])].join("\n");
  const from = process.env.CONTACT_FROM_EMAIL ?? "PWM_DEV Site <onboarding@resend.dev>";
  const ownerEmail: SaleEmail = {
    to: ownerAddress().split(",").map((s) => s.trim()), from,
    subject: `${kind} — ${who}`, text: ownerText, html: notice.html,
    ...(buyer ? { replyTo: buyer } : {}), idempotencyKey: eventId,
  };
  const messages: [string, SaleEmail][] = [["owner", ownerEmail]];
  if (buyer) {
    const thanks = purchaseThankYou({ offer, name: session.customer_details?.name, amount, site, order: order && { code: order.code, url: order.url, needsSignature } });
    messages.push(["buyer", {
      to: [buyer], from, subject: thanks.subject, html: thanks.html, text: thanks.text,
      replyTo: ownerAddress().split(",")[0].trim(), idempotencyKey: `${eventId}:buyer`,
    }]);
  }
  // Each recipient progresses independently. If one email fails, the other still goes out; a retry resumes only the
  // unfinished one. Sent receipts survive Resend's 24h key expiry. The stored payload stays identical on every retry.
  const results = await Promise.allSettled(messages.map(async ([recipient, payload]) => {
    if (!order) {
      if (!await sendEmail(payload)) throw new EmailNotConfigured();
      return;
    }
    const claim = await claimSaleEmail(session.id, recipient, payload);
    if (claim.result === "sent") return;
    if (claim.result === "busy") throw new OrdersUnavailable("Sale email is in progress; retry after its lease expires.");
    try {
      if (!await sendEmail(claim.payload)) throw new EmailNotConfigured();
    } catch (err) {
      await finishSaleEmail(session.id, recipient, claim.token, false);
      throw err;
    }
    // If this write fails after Resend accepted the email, keep the lease. A retry reuses the frozen payload and key.
    // Beyond Resend's 24h window an ambiguous send may duplicate; prioritize eventual delivery over silently losing it.
    if (!await finishSaleEmail(session.id, recipient, claim.token, true)) throw new OrdersUnavailable("Sale email lease lost.");
  }));
  const failure = results.find((r) => r.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}
