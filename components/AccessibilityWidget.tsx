"use client";

import Script from "next/script";

// accessiBe accessibility widget. Same as the vendor snippet (load app.js async, then
// call acsbJS.init()), but via next/script so it loads once for the whole site.
// onLoad rather than onReady so init() isn't called again on every remount.
declare global {
  interface Window {
    acsbJS?: { init: (config?: Record<string, unknown>) => void };
  }
}

export default function AccessibilityWidget() {
  return (
    <Script
      id="acsb-widget"
      src="https://acsbapp.com/apps/app/dist/js/app.js"
      strategy="afterInteractive"
      onLoad={() => window.acsbJS?.init()}
    />
  );
}
