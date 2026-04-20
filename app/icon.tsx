// Dynamic favicon for motusgridia.com.
// Next.js App Router convention: `app/icon.tsx` is served at /icon-*.png
// and registered as the <link rel="icon"> for every route.
//
// Spec:
//   /visual-identity.md § Logo — "Secondary mark: the hex alone, when space
//     is tight (favicon, social avatars, watermark)."
//   /site/CLAUDE.md § Locked design tokens — all colours must come from the
//     token set (--bg-deep, --accent-cyan).
//
// Render: 32×32 PNG. A single pointy-top hexagon, 1.5px cyan stroke, no
// fill, on the deep-indigo background. The stroke uses currentColor so the
// JSX remains token-legible; the token value is inlined because next/og runs
// outside the Tailwind/CSS-variable runtime.

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Tokens (inlined — next/og cannot read :root CSS variables).
const BG_DEEP = "#07090D";
const ACCENT_CYAN = "#22E5FF";

export default function Icon() {
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
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={ACCENT_CYAN}
          strokeWidth={1.5}
          strokeLinejoin="miter"
        >
          {/* Pointy-top hexagon matching the clip-path geometry in
              globals.css (.hex-clip). */}
          <path d="M12 1 L22.39 6.5 L22.39 17.5 L12 23 L1.61 17.5 L1.61 6.5 Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
