import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // A buyer's order page carries its private link in the address: never send it on as a referrer, never cache it,
    // never index it.
    return [
      {
        source: "/orders/:token*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async redirects() {
    // Keep links to the retired concept pages useful after the portfolio update.
    return [
      { source: "/work/tableside-dual-sided-platform", destination: "/work/masaflow", permanent: true },
      { source: "/work/fieldbook-native-business-app", destination: "/work/pawtrackr", permanent: true },
      { source: "/work/counterkit-pos-kiosk", destination: "/#work", permanent: true },
    ];
  },
};

export default nextConfig;
