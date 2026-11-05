import { NextResponse } from "next/server";
import { reconcileOrders } from "@/lib/reconcile";
import { getStripe } from "@/lib/stripe";

// GET, once a day from Vercel Cron (vercel.json). Repairs paid sales whose webhook never recorded an order.
// Needs CRON_SECRET (sent by Vercel as a bearer token) and RECONCILE_FROM (an ISO date: the day order records went
// live). Without RECONCILE_FROM it does nothing, so it can't re-send old sales.

export const runtime = "nodejs";

async function* recentSessions(createdGte: number) {
  for await (const session of getStripe().checkout.sessions.list({ created: { gte: createdGte }, status: "complete", limit: 100 })) {
    yield session;
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const fromEnv = process.env.RECONCILE_FROM?.trim();
  const from = fromEnv ? new Date(fromEnv) : null;
  const gte = Math.floor((Date.now() - 7 * 86_400_000) / 1000);
  try {
    const result = await reconcileOrders({ sessions: recentSessions(gte), from });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Reconcile orders failed", err);
    return NextResponse.json({ error: "Reconcile failed" }, { status: 503 });
  }
}
