import { NextResponse } from "next/server";
import { getStripe, isOffer } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

export async function POST(request: Request) {
  let body: { offer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isOffer(body.offer)) {
    return NextResponse.json({ error: "That option isn't available." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const { data: prices } = await stripe.prices.list({ lookup_keys: [body.offer], active: true, limit: 1 });
    const price = prices[0];
    if (!price) {
      console.error("Checkout: no active price with lookup key", body.offer);
      return NextResponse.json({ error: "That option isn't available yet." }, { status: 400 });
    }
    // The price decides the flow: a recurring price starts a subscription.
    const subscribing = price.type === "recurring";

    const session = await stripe.checkout.sessions.create({
      mode: subscribing ? "subscription" : "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { offer: body.offer },
      // Copied onto the subscription, so its renewal and cancellation events
      // still say which plan they belong to.
      ...(subscribing && { subscription_data: { metadata: { offer: body.offer } } }),
      success_url: `${siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}${subscribing ? "&plan=subscription" : ""}`,
      cancel_url: `${siteUrl}/#contact`,
      // Stripe Tax only collects in jurisdictions with an active registration.
      // Flip STRIPE_AUTOMATIC_TAX=true once registrations exist (Dashboard → Tax).
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
      // Tags this flow in the Dashboard; the suffix is a fixed random label.
      integration_identifier: "pwm-site-checkout-qkzvmtra",
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout: Stripe error", err);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
