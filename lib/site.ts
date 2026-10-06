// Canonical site URL for metadata, sitemap and structured data.
// Set NEXT_PUBLIC_SITE_URL once a custom domain is attached; on Vercel it
// falls back to the project's production domain automatically.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const siteName = "PWM_DEV";
export const siteTitle = "PWM_DEV | Partnership With Media";
export const siteDescription =
  "Independent developer in Los Angeles. I rescue underperforming websites, architect web applications, and build native iOS and macOS apps. Direct partnership, zero middlemen.";
