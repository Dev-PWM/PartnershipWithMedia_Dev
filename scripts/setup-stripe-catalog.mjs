// Creates the Stripe products and prices the site sells, each price tagged with
// the lookup key checkout uses (lib/stripe.ts). Safe to re-run: offers that
// already have an active price are left alone.
//
// Amounts and copy come from lib/content.ts, so what the page shows is what
// Stripe charges.
//
//   STRIPE_SECRET_KEY=sk_live_... npm run stripe:setup -- --dry-run
//   STRIPE_SECRET_KEY=sk_live_... npm run stripe:setup

import Stripe from "stripe";
import { deposit, packages } from "../lib/content.ts";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY to the account you want to set up.");
  process.exit(1);
}
const dryRun = process.argv.includes("--dry-run");
const mode = key.includes("_live_") ? "LIVE" : "test";
const stripe = new Stripe(key);

const cents = (price) => Math.round(Number(price.replace(/[$,]/g, "")) * 100);

const catalog = [
  ...packages.map((p) => ({ lookupKey: p.offer, name: p.name, description: p.body, amount: cents(p.price) })),
  { lookupKey: deposit.offer, name: "Project Deposit", description: deposit.body, amount: cents(deposit.price) },
];

console.log(`Stripe ${mode} mode${dryRun ? " (dry run, nothing will change)" : ""}\n`);

let mismatches = 0;
for (const item of catalog) {
  const label = `${item.name} (${item.lookupKey}, $${(item.amount / 100).toLocaleString("en-US")})`;
  const { data } = await stripe.prices.list({ lookup_keys: [item.lookupKey], active: true, limit: 1 });
  const existing = data[0];

  if (existing) {
    if (existing.unit_amount === item.amount && existing.currency === "usd") {
      console.log(`ok       ${label}: ${existing.id}`);
    } else {
      // Prices are immutable; changing one means a new price, which is a
      // deliberate step rather than something to do silently.
      mismatches++;
      console.log(`MISMATCH ${label}: Stripe has ${existing.unit_amount} ${existing.currency} on ${existing.id}`);
    }
    continue;
  }

  if (dryRun) {
    console.log(`create   ${label}`);
    continue;
  }
  const product = await stripe.products.create({ name: item.name, description: item.description });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: item.amount,
    lookup_key: item.lookupKey,
  });
  await stripe.products.update(product.id, { default_price: price.id });
  console.log(`created  ${label}: ${price.id}`);
}

if (mismatches) {
  console.log(`\n${mismatches} price(s) differ from lib/content.ts. Fix the copy, or create a new price in Stripe and move the lookup key to it.`);
  process.exit(1);
}
