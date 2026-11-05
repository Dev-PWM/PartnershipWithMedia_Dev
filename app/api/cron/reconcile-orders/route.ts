import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { recoveryPaymentEligible } from "@/lib/reconcile-payment";
import { reconcileOrders } from "@/lib/reconcile";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // A full timestamp makes the rollout boundary unambiguous. Date-only values mean midnight UTC, not local time.
  const raw = process.env.RECONCILE_FROM?.trim();
  const from = raw ? new Date(raw) : null;
  if (!from || !/^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(raw!) || !Number.isFinite(from.getTime()) || from.toISOString().slice(0, 10) !== raw!.slice(0, 10) || from.getTime() > Date.now()) {
    console.error("Reconcile orders: RECONCILE_FROM must be a past ISO date or UTC timestamp.");
    return NextResponse.json({ error: "Reconciliation cutoff is not configured." }, { status: 503 });
  }
  const now = Date.now();
  const deadline = now + 180_000; // Leave time for the in-flight Stripe/DB/email requests and releasing the lease.
  try {
    const result = await reconcileOrders({
      from, now, deadline, livemode: !/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? ""),
      eligible: (session) => recoveryPaymentEligible(getStripe(), session),
      sessions: (cursor, through) => getStripe().checkout.sessions.list({
        created: { gte: Math.floor(from.getTime() / 1000), lte: through },
        status: "complete", limit: 50,
        ...(cursor ? { starting_after: cursor } : {}),
        expand: ["data.payment_intent.latest_charge", "data.subscription"],
      }, { timeout: 10_000, maxNetworkRetries: 1 }),
    });
    console.info("Reconcile orders finished", result);
    return NextResponse.json({ ok: result.failed === 0, ...result }, { status: result.failed ? 503 : 200 });
  } catch (err) {
    console.error("Reconcile orders failed", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json({ error: "Reconcile failed" }, { status: 503 });
  }
}
