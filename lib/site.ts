// Canonical site URL for metadata, sitemap and structured data.
// Set NEXT_PUBLIC_SITE_URL once a custom domain is attached; on Vercel it
// falls back to the project's production domain automatically.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

// Stripe's no-code customer portal login link (Dashboard → Settings → Billing →
// Customer portal), where subscribers cancel or update their card. Test and
// live mode have different links. Unset, the site tells subscribers to email instead.
export const billingPortalUrl = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL?.trim() || undefined;

export const siteName = "PWM_DEV";
// The title is the strongest on-page search signal: lead with the phrase people type,
// keep the brand last, and stay under ~60 characters so Google doesn't cut it off.
export const siteTitle = "Web Design & App Development in Los Angeles | PWM_DEV";
// Shown under the title in search results; keep it under ~155 characters.
export const siteDescription =
  "Los Angeles web design and app development for small businesses: custom websites, web apps, and iPhone and Mac apps. Work directly with your developer.";
