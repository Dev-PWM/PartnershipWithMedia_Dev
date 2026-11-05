import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { notifyOwner, ownerAddress, sendEmail } from "@/lib/email";
import { ownerNotice, purchaseThankYou } from "@/lib/emails";
import { orderFlowLive, ordersConfigProblem, OrdersMisconfigured, recordPaidOrder } from "@/lib/orders";
import { getStripe, isOffer, needsAgreement } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Not configured." }, { status: 400 });

  // The signature covers the raw bytes, so read text() rather than json().
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  try {
    await handle(event);
  } catch (err) {
    if (!(err instanceof EmailNotConfigured)) throw err;
    console.error("Stripe webhook: RESEND_API_KEY is not set, refusing the event so Stripe retries it.", event.type);
    return NextResponse.json({ error: "Email is not configured." }, { status: 503 });
  }
  return NextResponse.json({ received: true });
}

// Without Resend an event we email about would be acknowledged and its emails silently dropped. Each handler calls
// this once it knows the event is ours and after anything it must save (the paid order), then the webhook answers 503:
// Stripe keeps retrying for three days, shows the endpoint failing and emails the account about it. Once the key is
// back, a retry sends everything once. Other sites' events on the shared account are still acknowledged.
class EmailNotConfigured extends Error {}
function requireEmail() {
  if (!process.env.RESEND_API_KEY) throw new EmailNotConfigured();
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      // A completed session can still be unpaid for delayed payment methods.
      if (session.payment_status !== "unpaid") await fulfill(event.id, session);
      break;
    }
    // Renewals, failed renewals and cancellations: only for this site's plans. Client sites share this Stripe account,
    // and their subscriptions carry no offer of ours (ours copy it from the session via subscription_data.metadata).
    case "invoice.paid": {
      // The first invoice is already covered by checkout.session.completed.
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason === "subscription_cycle" && ours(invoice.parent?.subscription_details?.metadata)) await renewed(event.id, invoice);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (ours(invoice.parent?.subscription_details?.metadata)) await paymentFailed(event.id, invoice);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      if (ours(sub.metadata)) await subscriptionEnded(event.id, sub);
      break;
    }
    case "checkout.session.async_payment_failed":
      if (ours((event.data.object as Stripe.Checkout.Session).metadata)) await flag(event);
      break;
    // Disputes and fraud warnings stay account-wide on purpose: they take money from this Stripe account whichever
    // site made the sale, and a charge doesn't say which site that was.
    case "charge.dispute.created":
    case "radar.early_fraud_warning.created":
      await flag(event);
      break;
  }
}

const ours = (metadata: Stripe.Metadata | null | undefined) => isOffer(metadata?.offer);

const money = (cents: number | null, currency: string | null) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "usd" }).format((cents ?? 0) / 100);

const dashboard = (path: string) => `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") || process.env.STRIPE_SECRET_KEY?.startsWith("rk_test") ? "test/" : ""}${path}`;

// Stripe retries on non-2xx and may deliver twice; the event id doubles as the
// email idempotency key so a retry doesn't send a second email. Stripe emails
// the customer their receipt itself (Dashboard → Settings → Customer emails).
async function fulfill(eventId: string, session: Stripe.Checkout.Session) {
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

const client = (invoice: Stripe.Invoice) =>
  `Client: ${invoice.customer_name ?? "-"} <${invoice.customer_email ?? "-"}>`;

async function renewed(eventId: string, invoice: Stripe.Invoice) {
  requireEmail();
  const who = invoice.customer_name || invoice.customer_email || "A subscriber";
  const text = [
    `Subscription renewed: ${money(invoice.amount_paid, invoice.currency)}`,
    client(invoice),
    "",
    dashboard(`invoices/${invoice.id}`),
  ].join("\n");
  await notifyOwner(`Subscription renewed — ${who}`, text, eventId);
}

// Stripe retries failed renewals itself (Dashboard → Billing → Revenue recovery)
// and can email the client; this only tells you it happened.
async function paymentFailed(eventId: string, invoice: Stripe.Invoice) {
  requireEmail();
  const who = invoice.customer_name || invoice.customer_email || "A subscriber";
  const retry = invoice.next_payment_attempt
    ? `Stripe will retry on ${new Date(invoice.next_payment_attempt * 1000).toDateString()}.`
    : "No more retries are scheduled.";
  const text = [
    `Payment failed: ${money(invoice.amount_due, invoice.currency)} (attempt ${invoice.attempt_count})`,
    client(invoice),
    retry,
    "",
    dashboard(`invoices/${invoice.id}`),
  ].join("\n");
  await notifyOwner(`Payment failed — ${who}`, text, eventId);
}

async function subscriptionEnded(eventId: string, sub: Stripe.Subscription) {
  requireEmail();
  const details = sub.cancellation_details;
  const text = [
    `Subscription ended. Reason: ${details?.feedback ?? details?.reason ?? "not given"}.`,
    ...(details?.comment ? [`Their note: ${details.comment}`] : []),
    `Customer: ${typeof sub.customer === "string" ? sub.customer : sub.customer.id}`,
    "",
    dashboard(`subscriptions/${sub.id}`),
  ].join("\n");
  await notifyOwner("Subscription ended", text, eventId);
}

async function flag(event: Stripe.Event) {
  requireEmail();
  const obj = event.data.object as { id: string };
  const text = [`Stripe event ${event.type} needs a look.`, "", dashboard(`events/${event.id}`), `Object: ${obj.id}`].join("\n");
  await notifyOwner(`Needs attention: ${event.type}`, text, event.id);
}
