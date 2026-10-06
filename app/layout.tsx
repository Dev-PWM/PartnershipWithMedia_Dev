import type { Metadata, Viewport } from "next";
// Self-hosted variable fonts: no build-time fetch from Google Fonts.
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import { siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: `%s | ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "web developer Los Angeles",
    "website rescue",
    "Next.js developer",
    "web application development",
    "iOS app developer",
    "macOS app developer",
    "SwiftUI",
    "POS system development",
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
      </body>
    </html>
  );
}
