import type { Metadata } from "next";
// Self-hosted variable fonts: no build-time fetch from Google Fonts.
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partnership With Media",
  description:
    "PWM_DEV builds and fixes digital platforms: website rescues, web apps, and native iOS/macOS tools. Direct partnership, zero fluff.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-bgdark text-textlight font-sans antialiased selection:bg-accent selection:text-black">
        {children}
      </body>
    </html>
  );
}
