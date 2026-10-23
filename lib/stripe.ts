import Stripe from "stripe";

// One client per server process. Never import this from a client component.
let client: Stripe | undefined;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  return (client ??= new Stripe(key));
}

// Each offer is a price in Stripe whose lookup key matches the name here: one-time
// for the packages and deposit, monthly for the maintenance plan. Amounts live
// only in Stripe: to change one, create a new price and move the lookup key to
// it (Dashboard → price → Lookup key, or transfer_lookup_key).
export const offers = ["origin", "nexus", "aura", "matrix", "project_deposit", "maintenance_monthly"] as const;

export type Offer = (typeof offers)[number];

export const isOffer = (value: unknown): value is Offer => offers.includes(value as Offer);
