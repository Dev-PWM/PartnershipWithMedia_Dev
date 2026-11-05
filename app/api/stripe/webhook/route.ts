import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { notifyOwner } from "@/lib/email";
import { dashboard, EmailNotConfigured, fulfill, money, requireEmail } from "@/lib/fulfillment";
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
  try {
    await handle(event);
  } catch (err) {
    if (!(err instanceof EmailNotConfigured)) throw err;
    console.error("Stripe webhook: RESEND_API_KEY is not set, refusing the event so Stripe retries it.", event.type);
    return NextResponse.json({ error: "Email is not configured." }, { status: 503 });
  }
  return NextResponse.json({ received: true });
}


async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      // A completed session can still be unpaid for delayed payment methods.
      if (session.payment_status !== "unpaid") await fulfill(session);
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
