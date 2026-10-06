import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

// Shared layout for generated social share cards (Open Graph / Twitter).
export function ogCard({ kicker, lines, footer }: { kicker: string; lines: [string, string]; footer: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111111",
          color: "#F3F4F6",
          padding: 72,
          border: "16px solid #CCFF00",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>
          PWM<span style={{ color: "#CCFF00" }}>_</span>DEV
          <span style={{ marginLeft: 24, color: "#8A8A8A", fontSize: 28, alignSelf: "center", letterSpacing: 3 }}>
            {kicker}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 88, fontWeight: 900, lineHeight: 0.95, letterSpacing: -4 }}>
          <span>{lines[0]}</span>
          <span style={{ color: "#CCFF00" }}>{lines[1]}</span>
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#8A8A8A", letterSpacing: 3 }}>
          {footer}
        </div>
      </div>
    ),
    ogSize,
  );
}
