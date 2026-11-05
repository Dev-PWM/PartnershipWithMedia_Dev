// Historical recovery must verify the original payment, rather than treating Checkout's paid flag as current funds.
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { recoveryPaymentEligible } from "@/lib/reconcile-payment";

const charge = { id: "ch_initial", paid: true, captured: true, refunded: false, disputed: false, amount_refunded: 0 };
const intent = { id: "pi_initial", status: "succeeded", latest_charge: charge };
const checkout = { id: "cs_test_recovery", mode: "payment", currency: "usd", amount_total: 4999, payment_intent: "pi_initial" };
async function* stream(items: unknown[]) { yield* items; }
function fixture(extra: {
  charge?: Record<string, unknown>; refunds?: unknown[]; subStatus?: string; evidence?: unknown[]; fail?: boolean;
} = {}) {
  const calls: string[] = [];
  const client = {
    paymentIntents: { retrieve: async (id: string) => { calls.push(id); if (extra.fail) throw new Error("Stripe unavailable"); return { ...intent, latest_charge: { ...charge, ...extra.charge } }; } },
    charges: { retrieve: async () => ({ ...charge, ...extra.charge }) },
    refunds: { list: () => stream(extra.refunds ?? []) },
    subscriptions: { retrieve: async () => ({ id: "sub_initial", status: extra.subStatus ?? "active", latest_invoice: "in_later_renewal" }) },
    invoices: { retrieve: async (id: string) => { calls.push(id); return { id, status: "paid", parent: { subscription_details: { subscription: "sub_initial" } } }; } },
    invoicePayments: { list: (args: { invoice: string }) => {
      calls.push(`payments:${args.invoice}`);
      return stream(extra.evidence ?? [{ payment: { type: "payment_intent", payment_intent: "pi_initial" }, amount_paid: 4999, currency: "usd" }]);
    } },
  } as unknown as Stripe;
  return { calls, client, eligible: (session: Record<string, unknown> = checkout) => recoveryPaymentEligible(client, session as unknown as Stripe.Checkout.Session) };
}
let passed = 0;
async function check(name: string, fn: () => Promise<void>) { await fn(); passed++; console.log(`PASS ${name}`); }

await check("recovery accepts a captured payment and checks its payment intent", async () => {
  const f = fixture(); assert.equal(await f.eligible(), true); assert.deepEqual(f.calls, ["pi_initial"]);
});
await check("refunded, partially refunded, disputed and uncaptured payments are held", async () => {
  for (const unsafe of [{ refunded: true }, { amount_refunded: 100 }, { disputed: true }, { captured: false }, { paid: false }]) {
    assert.equal(await fixture({ charge: unsafe }).eligible(), false, JSON.stringify(unsafe));
  }
});
await check("pending, successful and unknown refund states are held; failed/cancelled attempts don't void a sale", async () => {
  for (const status of ["pending", "requires_action", "succeeded", null, "future_status"]) {
    assert.equal(await fixture({ refunds: [{ status }] }).eligible(), false, String(status));
  }
  assert.equal(await fixture({ refunds: [{ status: "failed" }, { status: "canceled" }] }).eligible(), true);
  const longList = [...Array.from({ length: 100 }, () => ({ status: "failed" })), { status: "pending" }];
  assert.equal(await fixture({ refunds: longList }).eligible(), false, "stopped before a later refund page");
});
await check("maintenance recovery verifies the Checkout invoice instead of a later successful renewal", async () => {
  const session = { ...checkout, mode: "subscription", invoice: "in_checkout", subscription: "sub_initial", payment_intent: null };
  const valid = fixture(); assert.equal(await valid.eligible(session), true);
  assert.deepEqual(valid.calls, ["in_checkout", "payments:in_checkout", "pi_initial"]);
  const refunded = fixture({ charge: { amount_refunded: 4999 } });
  assert.equal(await refunded.eligible(session), false);
  assert(!refunded.calls.includes("in_later_renewal"));
  assert.equal(await fixture({ subStatus: "canceled" }).eligible(session), false);
  assert.equal(await fixture().eligible({ ...session, invoice: null }), false);
});
await check("unsupported payment evidence, setup sessions and missing payment intents are held", async () => {
  assert.equal(await fixture().eligible({ ...checkout, mode: "setup" }), false);
  assert.equal(await fixture().eligible({ ...checkout, payment_intent: null }), false);
  const session = { ...checkout, mode: "subscription", invoice: "in_checkout", subscription: "sub_initial" };
  const unsupported = { payment: { type: "payment_record" }, amount_paid: 4999, currency: "usd" };
  assert.equal(await fixture({ evidence: [unsupported] }).eligible(session), false);
  assert.equal(await fixture({ evidence: [] }).eligible(session), false);
});
await check("a Stripe verification outage propagates for a later retry", async () => {
  await assert.rejects(() => fixture({ fail: true }).eligible(), /Stripe unavailable/);
});
console.log(`${passed} payment recovery checks passed`);
