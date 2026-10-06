import { ogCard, ogSize } from "@/lib/og";

export const alt = "PWM_DEV: I build and fix digital platforms";
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return ogCard({
    kicker: "LOS ANGELES",
    lines: ["I BUILD & FIX", "DIGITAL PLATFORMS."],
    footer: "WEB RESCUES / WEB APPS / NATIVE iOS & macOS",
  });
}
