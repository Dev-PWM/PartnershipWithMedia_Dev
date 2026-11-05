import "server-only";
import type Stripe from "stripe";

// These checks apply to historical recovery. A Checkout's paid flag stays paid after a refund. For a subscription,
// inspect its original Checkout invoice, never latest_invoice (a later renewal cannot prove the initial sale).
export async function recoveryPaymentEligible(stripe: Stripe, session: Stripe.Checkout.Session): Promise<boolean> {
  const options = { timeout: 10_000, maxNetworkRetries: 1 };
  async function chargeEligible(charge: Stripe.Charge | string | null | undefined): Promise<boolean> {
    if (!charge) return false;
    if (typeof charge === "string") charge = await stripe.charges.retrieve(charge, {}, options);
    if (!charge.paid || !charge.captured || charge.refunded || charge.disputed || charge.amount_refunded > 0) return false;
    // A pending refund may not yet be reflected in amount_refunded. Failed/cancelled refunds don't void the sale.
    for await (const refund of stripe.refunds.list({ charge: charge.id, limit: 100 }, options)) {
      if (!["failed", "canceled"].includes(refund.status ?? "")) return false;
    }
    return true;
  }
  async function intentEligible(intent: Stripe.PaymentIntent | string | null | undefined): Promise<boolean> {
    if (!intent) return false;
    if (typeof intent === "string") intent = await stripe.paymentIntents.retrieve(intent, { expand: ["latest_charge"] }, options);
    return intent.status === "succeeded" && chargeEligible(intent.latest_charge);
  }
  if (session.mode === "payment") return intentEligible(session.payment_intent);
  if (session.mode !== "subscription" || !session.invoice || !session.subscription) return false;
  const sub = typeof session.subscription === "string" ? await stripe.subscriptions.retrieve(session.subscription, {}, options) : session.subscription;
  if (sub.status !== "active") return false;
  const invoice = typeof session.invoice === "string" ? await stripe.invoices.retrieve(session.invoice, {}, options) : session.invoice;
  const invoiceSub = invoice.parent?.subscription_details?.subscription;
  if (invoice.status !== "paid" || (typeof invoiceSub === "string" ? invoiceSub : invoiceSub?.id) !== sub.id) return false;
  let paid = 0;
  for await (const payment of stripe.invoicePayments.list({ invoice: invoice.id, status: "paid", limit: 100 }, options)) {
    const evidence = payment.payment;
    const eligible = evidence.type === "payment_intent" ? await intentEligible(evidence.payment_intent)
      : evidence.type === "charge" ? await chargeEligible(evidence.charge) : false;
    if (!eligible || payment.currency !== session.currency) return false;
    paid += payment.amount_paid ?? 0;
  }
  return paid > 0 && paid >= (session.amount_total ?? Infinity);
}
