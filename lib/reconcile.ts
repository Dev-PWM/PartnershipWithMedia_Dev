import "server-only";
import type Stripe from "stripe";
import { fulfill } from "@/lib/fulfillment";
import { checkpointReconcile, claimReconcile, clearSaleReview, orderFlowLive, OrdersUnavailable, reviewSale, saleState } from "@/lib/orders";
import { isOffer } from "@/lib/stripe";

// Sweep all completed sessions since order records went live, rather than a rolling window: a bank payment can
// clear weeks after Checkout, and an outage can last longer than seven days. A stored cursor resumes bounded runs;
// completing the sweep resets it so previously unpaid sessions are checked again. No history silently ages out.
export type ReconcileResult = {
  checked: number; repaired: number; failed: number; review: number; scanned: number; more: boolean; skipped: string | null;
};
export async function reconcileOrders(opts: {
  sessions: (cursor: string | null, through: number) => AsyncIterable<Stripe.Checkout.Session>;
  from: Date;
  livemode: boolean;
  eligible: (session: Stripe.Checkout.Session) => Promise<boolean>;
  now?: number;
  maxSessions?: number;
  deadline?: number;
}): Promise<ReconcileResult> {
  if (!orderFlowLive()) throw new OrdersUnavailable("Order storage or agreement signing is not configured.");
  const result: ReconcileResult = { checked: 0, repaired: 0, failed: 0, review: 0, scanned: 0, more: false, skipped: null };
  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  if (!Number.isFinite(opts.from.getTime()) || opts.from.getTime() > now * 1000) throw new Error("Invalid reconciliation cutoff.");
  const scope = `${opts.livemode ? "live" : "test"}:${opts.from.toISOString()}`;
  const claim = await claimReconcile(scope, now - 2 * 3600);
  if (claim.result === "busy") return { ...result, skipped: "already running" };
  let cursor = claim.cursor;
  try {
    for await (const session of opts.sessions(cursor, claim.through)) {
      result.scanned++;
      if (session.created >= opts.from.getTime() / 1000 && session.created <= claim.through &&
          session.status === "complete" && session.payment_status === "paid" && session.livemode === opts.livemode &&
          isOffer(session.metadata?.offer)) {
        result.checked++;
        try {
          const state = await saleState(session.id);
          if (state?.complete) {
            // A webhook retry may have finished a previously failed recovery between daily runs.
            await clearSaleReview(session.id);
          } else if (!["cancelled", "refunded"].includes(state?.status ?? "")) {
            if (await opts.eligible(session)) {
              await fulfill(session);
              await clearSaleReview(session.id);
              result.repaired++;
            } else {
              await reviewSale(session.id, "Payment is refunded/disputed, inactive, or its payment evidence needs checking in Stripe.");
              result.review++;
              console.error("Reconcile: payment requires manual review (refunded/disputed/inactive).", session.id);
            }
          }
        } catch (err) {
          result.failed++;
          // Persist an obligation even if the failure happened before an order/receipt existed. If this write fails,
          // abort before advancing the cursor. The next sweep retries it, and the operator can inspect it meanwhile.
          await reviewSale(session.id, "Retry required: sale lookup, payment verification or fulfillment did not finish.");
          console.error("Reconcile: sale unfinished.", session.id, err instanceof Error ? err.message : "unknown error");
        }
      }
      cursor = session.id;
      if (!await checkpointReconcile(scope, claim.token, cursor, false)) throw new OrdersUnavailable("Reconcile lease lost.");
      if (result.scanned >= (opts.maxSessions ?? 50) || Date.now() >= (opts.deadline ?? Infinity)) {
        result.more = true;
        break;
      }
    }
    // End of history: start a fresh sweep next run to revisit sessions whose bank payments were still clearing.
    if (!result.more) cursor = null;
    return result;
  } finally {
    if (!await checkpointReconcile(scope, claim.token, cursor, true)) throw new OrdersUnavailable("Reconcile lease lost.");
  }
}
