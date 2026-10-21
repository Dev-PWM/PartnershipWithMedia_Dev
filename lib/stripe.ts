import Stripe from "stripe";

// One client per server process. Never import this from a client component.
let client: Stripe | undefined;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  return (client ??= new Stripe(key));
}

// Prices are created in the Stripe Dashboard so amounts live in one place.
// "project" is a one-time deposit price.
export const offers = {
  project: { priceId: process.env.STRIPE_PRICE_PROJECT_DEPOSIT, mode: "payment" },
} as const;

export type OfferKey = keyof typeof offers;
