import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

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
      if (session.payment_status !== "unpaid") await fulfill(session);
      break;
    }
    case "checkout.session.async_payment_failed":
    case "invoice.payment_failed":
    case "customer.subscription.deleted":
    case "charge.dispute.created":
      await flag(event);
      break;
  }

  return NextResponse.json({ received: true });
}

// Stripe retries on non-2xx and may deliver twice, so keep both idempotent
// (key on session.id / event.id).
async function fulfill(session: Stripe.Checkout.Session) {
  // TODO: record the order / start the retainer, email the client.
  console.log("Stripe: paid", session.id, session.mode);
}

async function flag(event: Stripe.Event) {
  // TODO: notify yourself; payment failures and disputes need a human.
  console.warn("Stripe: needs attention", event.type, event.id);
}
