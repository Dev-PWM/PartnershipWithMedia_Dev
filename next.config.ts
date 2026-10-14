import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
