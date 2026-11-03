import { NextResponse } from "next/server";
import { isOffer } from "@/lib/stripe";
import { CheckoutError, cleanClientSite, startCheckout } from "@/lib/checkout";
import { GuardError, clientIp, guardResponse, rateLimit, readGuardedJson } from "@/lib/request-guard";

export async function POST(request: Request) {
  let body: { offer?: unknown; site?: unknown };
  try {
    body = await readGuardedJson(request, 2048);
    // Each checkout is two calls to the live Stripe account; a flood could exhaust its rate limit for real buyers.
    rateLimit(`checkout:${clientIp(request)}`, 10, 60_000);
  } catch (err) {
    if (err instanceof GuardError) return guardResponse(err);
    throw err;
  }

  if (!isOffer(body.offer)) {
    return NextResponse.json({ error: "That option isn't available." }, { status: 400 });
  }

  try {
    return NextResponse.json({ url: await startCheckout(body.offer, cleanClientSite(body.site)) });
  } catch (err) {
    if (err instanceof CheckoutError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Checkout: Stripe error", err);
    return NextResponse.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }
}
