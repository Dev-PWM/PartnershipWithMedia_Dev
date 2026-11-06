import type { Metadata, Viewport } from "next";
// Self-hosted variable fonts: no build-time fetch from Google Fonts.
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import { siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: `%s | ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  // Google ignores this tag (Bing gives it little weight); the title, description and
  // headings are what rank. Kept as a record of the phrases the copy targets.
  keywords: [
    "web design Los Angeles",
    "Los Angeles web developer",
    "small business website design",
    "custom website development",
    "website redesign",
    "web application development",
    "app developer Los Angeles",
    "iPhone app development",
    "restaurant ordering and POS system",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: siteTitle, description: siteDescription },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-bgdark text-textlight font-sans antialiased selection:bg-accent selection:text-black">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-black focus:px-6 focus:py-3 focus:font-black focus:uppercase focus:tracking-widest focus:text-xs"
        >
          Skip to content
        </a>
        {children}
        <AccessibilityWidget />
      </body>
    </html>
  );
}
