// Creates the Stripe products and prices the site sells, each price tagged with
// the lookup key checkout uses (lib/stripe.ts). Safe to re-run: offers that
// already have an active price keep it, and only their product's name and
// description are brought in line with the copy.
//
// Amounts and copy come from lib/content.ts, so what the page shows is what
// Stripe charges and what the Checkout page says.
//
//   STRIPE_SECRET_KEY=sk_live_... npm run stripe:setup -- --dry-run
//   STRIPE_SECRET_KEY=sk_live_... npm run stripe:setup

import Stripe from "stripe";
import { deposit, maintenance, packages } from "../lib/content.ts";

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
  {
    lookupKey: maintenance.offer,
    name: maintenance.name,
    description: maintenance.body,
    amount: cents(maintenance.price),
    interval: maintenance.interval,
  },
];

console.log(`Stripe ${mode} mode${dryRun ? " (dry run, nothing will change)" : ""}\n`);

let mismatches = 0;
for (const item of catalog) {
  const per = item.interval ? `/${item.interval}` : "";
  const label = `${item.name} (${item.lookupKey}, $${(item.amount / 100).toLocaleString("en-US")}${per})`;
  const { data } = await stripe.prices.list({
    lookup_keys: [item.lookupKey],
    active: true,
    limit: 1,
    expand: ["data.product"],
  });
  const existing = data[0];

  if (existing) {
    // A one-time price must not pass for a monthly one, or the other way round.
    const sameBilling = (existing.recurring?.interval ?? undefined) === item.interval;
    if (existing.unit_amount === item.amount && existing.currency === "usd" && sameBilling) {
      console.log(`ok       ${label}: ${existing.id}`);
      await syncProduct(existing.product, item);
    } else {
      // Prices are immutable; changing one means a new price, which is a
      // deliberate step rather than something to do silently.
      mismatches++;
      const billing = existing.recurring ? `every ${existing.recurring.interval}` : "one-time";
      console.log(`MISMATCH ${label}: Stripe has ${existing.unit_amount} ${existing.currency} ${billing} on ${existing.id}`);
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
    ...(item.interval && { recurring: { interval: item.interval } }),
  });
  await stripe.products.update(product.id, { default_price: price.id });
  console.log(`created  ${label}: ${price.id}`);
}

// The product's name and description show on the Checkout page. Unlike prices,
// products can be edited in place, so keep them in step with lib/content.ts.
async function syncProduct(product, item) {
  if (product.name === item.name && (product.description ?? "") === item.description) return;
  console.log(`         ${dryRun ? "would update" : "updated"} name/description on ${product.id}`);
  if (!dryRun) await stripe.products.update(product.id, { name: item.name, description: item.description });
}

if (mismatches) {
  console.log(`\n${mismatches} price(s) differ from lib/content.ts. Fix the copy, or create a new price in Stripe and move the lookup key to it.`);
  process.exit(1);
}
