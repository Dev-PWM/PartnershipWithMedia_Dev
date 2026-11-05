import type Stripe from "stripe";
import { notifyOwner, ownerAddress, sendEmail } from "@/lib/email";
import { ownerNotice, purchaseThankYou } from "@/lib/emails";
import { orderFlowLive, ordersConfigProblem, OrdersMisconfigured, recordPaidOrder } from "@/lib/orders";
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

// Stripe retries on non-2xx and may deliver twice; the session id is the email idempotency key so a retry, or the
// reconciliation run, doesn't send a second email. Stripe emails
// the customer their receipt itself (Dashboard → Settings → Customer emails).
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
  // The order record comes first: a database outage throws here, before any email, so Stripe's retry sends them once
  // with the order link. A setup mistake (no link secret, a rejected key, the wrong project) is logged and skipped so
  // purchase emails still go out.
  const configProblem = ordersConfigProblem();
  if (configProblem) console.error("Orders: not recorded.", configProblem);
  let order: Awaited<ReturnType<typeof recordPaidOrder>> | undefined;
  if (orderFlowLive()) {
    try {
      order = await recordPaidOrder({
        sessionId: session.id, offer, amountCents: session.amount_total, currency: session.currency,
        buyerName: session.customer_details?.name ?? null, buyerEmail: buyer ?? null, clientSite: site ?? null,
      });
    } catch (err) {
      if (!(err instanceof OrdersMisconfigured)) throw err;
      console.error("Orders: not recorded, Supabase setup is wrong.", err.message);
    }
  }
  // The order is saved whatever the email setup; only the emails wait for Resend.
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
    intro: `${who} just paid. The buyer has been sent a thank-you email with next steps.`,
    details: [["Package", kind], ["Amount", amount], ["Name", session.customer_details?.name ?? "-"], ["Email", buyer ?? "-"],
      ...(site ? [["Website (unverified)", site] as [string, string]] : []),
      ...(order ? [["Order", order.code] as [string, string]] : [])],
    button: { label: "Open in Stripe", url: stripeUrl },
    note: notes.join("\n") || undefined,
  });
  // The plain-text part carries the order and notes too, for mail apps that show text only.
  const ownerText = [text, ...(order ? ["", `Order: ${order.code}`] : []), ...(notes.length ? ["", ...notes] : [])].join("\n");
  await notifyOwner(`${kind} — ${who}`, ownerText, eventId, notice.html, buyer ?? undefined);
  // The buyer's thank-you. A Resend error throws, so Stripe retries; both emails' idempotency keys stop repeats.
  if (buyer) {
    const thanks = purchaseThankYou({ offer, name: session.customer_details?.name, amount, site, order: order && { code: order.code, url: order.url, needsSignature } });
    await sendEmail({ to: buyer, subject: thanks.subject, html: thanks.html, text: thanks.text, replyTo: ownerAddress().split(",")[0].trim(), idempotencyKey: `${eventId}:buyer` });
  }
}
