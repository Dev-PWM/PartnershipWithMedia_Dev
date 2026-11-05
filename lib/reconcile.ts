import "server-only";
import type Stripe from "stripe";
import { fulfill } from "@/lib/fulfillment";
import { findOrder, orderFlowLive, orderIdentity } from "@/lib/orders";
import { isOffer } from "@/lib/stripe";

// Catches paid sales whose webhook never succeeded. Stripe stops retrying a failed event after about three days, so
// a database outage longer than that would leave a buyer charged with no order, signing link or email. This looks at
// recent paid Checkout sessions for this site's offers and, for any with no order record, runs the same sale path as
// the webhook. Sessions with an order are skipped, so it never repeats work or emails.

// Stripe retries for three days. Look back a little further, but never before RECONCILE_FROM: sales before order
// records existed have no order, and re-running them would email buyers a second time.
const LOOKBACK_SECONDS = 7 * 86_400;
// Leave the last two hours alone; Stripe's own retries for a fresh event are still in flight then.
const SETTLE_SECONDS = 2 * 3600;

export type ReconcileResult = { checked: number; repaired: number; skipped: string | null };

export async function reconcileOrders(opts: {
  sessions: AsyncIterable<Stripe.Checkout.Session>;
  from: Date | null;
  now?: number;
}): Promise<ReconcileResult> {
  if (!orderFlowLive()) return { checked: 0, repaired: 0, skipped: "orders off" };
  if (!opts.from || Number.isNaN(opts.from.getTime())) return { checked: 0, repaired: 0, skipped: "RECONCILE_FROM not set" };

  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  const earliest = Math.max(Math.floor(opts.from.getTime() / 1000), now - LOOKBACK_SECONDS);
  const latest = now - SETTLE_SECONDS;
  let checked = 0;
  let repaired = 0;

  for await (const session of opts.sessions) {
    if (session.created < earliest || session.created > latest) continue;
    // Same filters as the webhook: this site's offers only, and only sessions that actually took payment.
    if (!isOffer(session.metadata?.offer) || session.payment_status === "unpaid") continue;
    checked++;
    const { token } = orderIdentity(session.id);
    if (await findOrder(token)) continue;
    await fulfill(session);
    repaired++;
  }
  return { checked, repaired, skipped: null };
}
