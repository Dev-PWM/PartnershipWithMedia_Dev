import { NextResponse } from "next/server";
import { getStripe, offers, type OfferKey } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

export async function POST(request: Request) {
  let body: { offer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const offer = offers[body.offer as OfferKey];
  if (!offer?.priceId) {
    return NextResponse.json({ error: "That option isn't available yet." }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: offer.mode,
      line_items: [{ price: offer.priceId, quantity: 1 }],
      success_url: `${siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
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
