import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { notifyOwner, ownerAddress, sendEmail } from "@/lib/email";
import { ownerNotice, purchaseThankYou } from "@/lib/emails";
import { getStripe, isOffer } from "@/lib/stripe";

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

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      // A completed session can still be unpaid for delayed payment methods.
      if (session.payment_status !== "unpaid") await fulfill(event.id, session);
      break;
    }
    case "invoice.paid": {
      // The first invoice is already covered by checkout.session.completed.
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.billing_reason === "subscription_cycle") await renewed(event.id, invoice);
      break;
    }
    case "invoice.payment_failed":
      await paymentFailed(event.id, event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.deleted":
      await subscriptionEnded(event.id, event.data.object as Stripe.Subscription);
      break;
    case "checkout.session.async_payment_failed":
    case "charge.dispute.created":
    case "radar.early_fraud_warning.created":
      await flag(event);
      break;
  }

  return NextResponse.json({ received: true });
}

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
      ? "Deposit paid"
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
  const stripeUrl = typeof session.subscription === "string" ? dashboard(`subscriptions/${session.subscription}`) : dashboard(`checkout/sessions/${session.id}`);
  const notice = ownerNotice({
    eyebrow: "New sale",
    title: `${kind}: ${amount}`,
    intro: `${who} just paid. The buyer has been sent a thank-you email with next steps.`,
    details: [["Package", kind], ["Amount", amount], ["Name", session.customer_details?.name ?? "-"], ["Email", buyer ?? "-"],
      ...(site ? [["Website (unverified)", site] as [string, string]] : [])],
    button: { label: "Open in Stripe", url: stripeUrl },
    note: site ? "The website came from the buy link, so anyone could have typed it. Check the buyer's email matches that client before deploying." : undefined,
  });
  await notifyOwner(`${kind} — ${who}`, text, eventId, notice.html, buyer ?? undefined);
  // The buyer's thank-you. A Resend error throws, so Stripe retries; both emails' idempotency keys stop repeats.
  if (buyer) {
    const thanks = purchaseThankYou({ offer, name: session.customer_details?.name, amount, site });
    await sendEmail({ to: buyer, subject: thanks.subject, html: thanks.html, text: thanks.text, replyTo: ownerAddress().split(",")[0].trim(), idempotencyKey: `${eventId}:buyer` });
  }
}

const client = (invoice: Stripe.Invoice) =>
  `Client: ${invoice.customer_name ?? "-"} <${invoice.customer_email ?? "-"}>`;

async function renewed(eventId: string, invoice: Stripe.Invoice) {
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
  const obj = event.data.object as { id: string };
  const text = [`Stripe event ${event.type} needs a look.`, "", dashboard(`events/${event.id}`), `Object: ${obj.id}`].join("\n");
  await notifyOwner(`Needs attention: ${event.type}`, text, event.id);
}
