// Dynamic Apple touch-icon for motusgridia.com.
// Next.js App Router convention: `app/apple-icon.tsx` is served at
// /apple-icon-*.png and registered as <link rel="apple-touch-icon">.
//
// Spec:
//   /visual-identity.md § Logo — Secondary mark (hex alone) on dark ground.
//   /site/CLAUDE.md § Locked design tokens — colours must come from tokens.
//
// Render: 180×180 PNG. A 2px cyan hex, no fill, on deep-indigo bg, with a
// subtle inner cyan glow (simulated via a second concentric hex at lower
// opacity). Per CLAUDE.md § Component rules #4, glow ≠ shadow.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BG_DEEP = "#07090D";
const ACCENT_CYAN = "#22E5FF";
const GLOW_CYAN = "rgba(34, 229, 255, 0.25)";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG_DEEP,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinejoin="miter"
        >
          {/* Outer glow hex — thicker stroke at low opacity. */}
          <path
            d="M12 1 L22.39 6.5 L22.39 17.5 L12 23 L1.61 17.5 L1.61 6.5 Z"
            stroke={GLOW_CYAN}
            strokeWidth={3}
          />
          {/* Primary hex — 1.5px at full cyan. */}
          <path
            d="M12 1 L22.39 6.5 L22.39 17.5 L12 23 L1.61 17.5 L1.61 6.5 Z"
            stroke={ACCENT_CYAN}
            strokeWidth={1.5}
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
