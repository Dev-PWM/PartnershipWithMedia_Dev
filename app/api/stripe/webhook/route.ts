import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { notifyOwner } from "@/lib/email";
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
      if (session.payment_status !== "unpaid") await fulfill(event.id, session);
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

const money = (cents: number | null, currency: string | null) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "usd" }).format((cents ?? 0) / 100);

const dashboard = (path: string) => `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") || process.env.STRIPE_SECRET_KEY?.startsWith("rk_test") ? "test/" : ""}${path}`;

// Stripe retries on non-2xx and may deliver twice; the event id doubles as the
// email idempotency key so a retry doesn't send a second email. Stripe emails
// the customer their receipt itself (Dashboard → Settings → Customer emails).
async function fulfill(eventId: string, session: Stripe.Checkout.Session) {
  const kind = session.mode === "subscription" ? "Retainer started" : "Deposit paid";
  const who = session.customer_details?.name || session.customer_details?.email || "A client";
  const text = [
    `${kind}: ${money(session.amount_total, session.currency)}`,
    `Client: ${session.customer_details?.name ?? "-"} <${session.customer_details?.email ?? "-"}>`,
    "",
    dashboard(`checkout/sessions/${session.id}`),
  ].join("\n");
  await notifyOwner(`${kind} — ${who}`, text, eventId);
}

async function flag(event: Stripe.Event) {
  const obj = event.data.object as { id: string };
  const text = [`Stripe event ${event.type} needs a look.`, "", dashboard(`events/${event.id}`), `Object: ${obj.id}`].join("\n");
  await notifyOwner(`Needs attention: ${event.type}`, text, event.id);
}
