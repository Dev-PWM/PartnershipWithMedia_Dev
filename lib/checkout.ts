import { getStripe, type Offer } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

// A client's own website, as a bare hostname ("nicksprocessservices.dev"). It rides on the
// session as metadata so the purchase email says which site the package is for. Anything
// that isn't a plain hostname is dropped rather than stored.
const HOSTNAME = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export function cleanClientSite(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const host = value.trim().toLowerCase().replace(/^www\./, "");
  return HOSTNAME.test(host) ? host : undefined;
}

export class CheckoutError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// Creates a Stripe Checkout session for one offer and returns its URL. Shared by the site's
// buy buttons (POST /api/checkout) and the buy links client sites point at (GET /buy/[offer]).
export async function startCheckout(offer: Offer, clientSite?: string): Promise<string> {
  const stripe = getStripe();
  const { data: prices } = await stripe.prices.list({ lookup_keys: [offer], active: true, limit: 1 });
  const price = prices[0];
  if (!price) {
    console.error("Checkout: no active price with lookup key", offer);
    throw new CheckoutError("That option isn't available yet.", 400);
  }
  // The price decides the flow: a recurring price starts a subscription.
  const subscribing = price.type === "recurring";
  const metadata = { offer, ...(clientSite && { client_site: clientSite }) };

  const session = await stripe.checkout.sessions.create({
    mode: subscribing ? "subscription" : "payment",
    line_items: [{ price: price.id, quantity: 1 }],
    metadata,
    // Copied onto the subscription, so its renewal and cancellation events
    // still say which plan they belong to.
    ...(subscribing && { subscription_data: { metadata } }),
    success_url: `${siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}${subscribing ? "&plan=subscription" : ""}`,
    cancel_url: `${siteUrl}/#contact`,
    // Stripe Tax only collects in jurisdictions with an active registration.
    // Flip STRIPE_AUTOMATIC_TAX=true once registrations exist (Dashboard → Tax).
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
    // Tags this flow in the Dashboard; the suffix is a fixed random label.
    integration_identifier: "pwm-site-checkout-qkzvmtra",
  });
  if (!session.url) throw new CheckoutError("Couldn't start checkout. Please try again.", 502);
  return session.url;
}
