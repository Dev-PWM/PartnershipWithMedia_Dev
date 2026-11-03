import { NextResponse } from "next/server";
import { isOffer } from "@/lib/stripe";
import { CheckoutError, cleanClientSite, startCheckout } from "@/lib/checkout";

export async function POST(request: Request) {
  let body: { offer?: string; site?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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
