// Dynamic Open Graph image for motusgridia.com.
// Next.js App Router convention: `app/opengraph-image.tsx` is served at
// /opengraph-image and automatically wired as og:image + twitter:image in
// the metadata emitted by app/layout.tsx.
//
// Spec:
//   /landing-copy-v0.1.md § 7.3 — Open Graph
//     og:image = /og.png          — "black bg, cyan hex, MOTVSGRIDIA wordmark"
//     og:image:alt               — "MotusGridia — cyan honeycomb on indigo,
//                                    wordmark MOTVSGRIDIA centred"
//   /visual-identity.md § Colour palette — locked tokens (inlined below;
//     next/og runs outside the Tailwind/CSS-variable runtime).
//   /site/CLAUDE.md § Anti-patterns — no pure black, no pure white, no
//     stock photography, no AI-generated faces. This image is pure
//     typography + geometry.
//
// Render: 1200×630 PNG.
//   - Deep-indigo background
//   - Faint cyan honeycomb lattice (8px stroke, 0.06 alpha)
//   - Two decorative hex glyphs flanking the wordmark
//   - MOTVSGRIDIA wordmark, Fraunces 600 w/ opsz 144, tracking -0.03em,
//     pulled live from Google Fonts (cache-TTL'd by the CDN)
//   - Single accent hairline under the wordmark
//
// The image regenerates on each deploy. No static .png asset is committed.

import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Alt text is consumed by layout.tsx's metadata; duplicated here as a
// self-documenting constant per the spec reference above.
export const alt =
  "MotusGridia — cyan honeycomb on indigo, wordmark MOTVSGRIDIA centred";

// Tokens — inlined because next/og cannot read :root CSS variables.
// Only tokens actually used in this route are declared; BG_PANEL is not
// inlined because the OG image background is BG_DEEP only.
const BG_DEEP = "#07090D";
const INK_PRIMARY = "#E8ECF5";
const INK_MUTE = "#7E89A8";
const ACCENT_CYAN = "#22E5FF";
const LINE_SOFT = "#1A2240";

const WORDMARK = "MOTVSGRIDIA"; // Latin V per /landing-copy-v0.1.md § 1.

// ---------------------------------------------------------------------------
// Fetch Fraunces from Google Fonts.
// Satori (the renderer inside next/og) only accepts *uncompressed* OpenType —
// raw TTF/OTF bytes. It rejects both WOFF and WOFF2 with `Unsupported OpenType
// signature wOF2` (or `wOFF`), which in the edge runtime silently returns a
// 200 with an empty body (observed against Next.js 15 / next/og bundled with
// `@vercel/og` — the previous comment here claimed woff2 was accepted; it
// isn't).
//
// Trick: Google Fonts serves the font format based on UA sniffing. Modern
// Chrome → woff2. IE11 → woff (still compressed, still rejected). The known
// minimal UAs that force Google Fonts to serve uncompressed TTF are
// empty-UA, wget, or Android 2.x. We use `Wget/1.21` — distinctive in logs,
// not dependent on empty-UA handling quirks in fetch(), and tested against
// the CSS2 endpoint to return `format('truetype')` with a direct `.ttf` URL.
// ---------------------------------------------------------------------------

async function loadFraunces(): Promise<ArrayBuffer | null> {
  // 4-second total budget across the CSS fetch + TTF fetch pair. Next.js
  // pre-renders file-based metadata routes at build time — including this
  // one, even with `runtime = "edge"` (the edge runtime applies to request-
  // time regeneration, not build-time pre-render). Without a timeout, a slow
  // Google Fonts response would stall `next build` indefinitely, which is
  // how every v0.2 deploy between 2026-04-20 14:30Z and fdbde5d rolled back
  // to the pre-v0.2 baseline without a visible error. See SESSION-HANDOFF.md
  // § "Session 5d correction — the FOURTH build blocker was the root OG
  // route" for the post-mortem. Budget matches the sibling per-slug routes
  // in /codex/[slug]/opengraph-image.tsx.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const cssRes = await fetch(
      // 144 opsz + 600 wght matches the display-1 token in globals.css.
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@144,600&display=swap",
      {
        headers: {
          // Wget UA forces Google Fonts to serve truetype. Do NOT change this
          // to a modern browser UA — the resulting woff2/woff response breaks
          // Satori (see comment above).
          "User-Agent": "Wget/1.21",
        },
        signal: ctrl.signal,
      },
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();

    const match = css.match(
      /src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s+format\(['"]?truetype['"]?\)/,
    );
    const fontUrl = match?.[1];
    if (!fontUrl) return null;

    const fontRes = await fetch(fontUrl, { signal: ctrl.signal });
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export default async function OpengraphImage() {
  const frauncesData = await loadFraunces();

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
          position: "relative",
          color: INK_PRIMARY,
          fontFamily: frauncesData ? "Fraunces" : "serif",
        }}
      >
        {/* Honeycomb lattice — a static SVG laid full-bleed at low opacity.
            Using a single <svg> absolutely positioned over the bg to keep the
            flex tree simple (next/og prefers flex over grid). */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
          }}
        >
          {buildHoneycomb({
            width: 1200,
            height: 630,
            hexRadius: 42,
            strokeColor: ACCENT_CYAN,
            strokeWidth: 1.5,
          })}
        </svg>

        {/* Vignette — subtle cyan radial centered on the wordmark. Faked with
            an SVG radial gradient because next/og does not parse
            `background-image: radial-gradient(...)` in every build. */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor={ACCENT_CYAN}
                stopOpacity="0.14"
              />
              <stop
                offset="60%"
                stopColor={ACCENT_CYAN}
                stopOpacity="0.02"
              />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#glow)" />
        </svg>

        {/* Wordmark row — two decorative hexes flanking the text. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 64,
            position: "relative",
            zIndex: 1,
          }}
        >
          <HexGlyph size={56} stroke={ACCENT_CYAN} />
          <div
            style={{
              fontSize: 148,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: INK_PRIMARY,
            }}
          >
            {WORDMARK}
          </div>
          <HexGlyph size={56} stroke={ACCENT_CYAN} />
        </div>

        {/* Hairline under the wordmark — line-soft, 1px. */}
        <div
          style={{
            position: "absolute",
            bottom: 160,
            left: 280,
            right: 280,
            height: 1,
            background: LINE_SOFT,
            zIndex: 1,
          }}
        />

        {/* Mono footer label — the site origin, so shared cards identify. */}
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 18,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: INK_MUTE,
            fontFamily: "monospace",
            zIndex: 1,
          }}
        >
          motusgridia.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: frauncesData
        ? [
            {
              name: "Fraunces",
              data: frauncesData,
              style: "normal",
              weight: 600,
            },
          ]
        : [],
    },
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function HexGlyph({ size: s, stroke }: { size: number; stroke: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 1 L22.39 6.5 L22.39 17.5 L12 23 L1.61 17.5 L1.61 6.5 Z"
        stroke={stroke}
        strokeOpacity={0.7}
        strokeWidth={1.5}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/**
 * Emits a tiled honeycomb lattice as JSX <path> elements covering a box.
 * Pointy-top hexes. Each hex is drawn as a single M-L path for minimum SVG
 * weight. The "colour" of the lattice is driven by the SVG wrapper's opacity.
 */
function buildHoneycomb({
  width,
  height,
  hexRadius,
  strokeColor,
  strokeWidth,
}: {
  width: number;
  height: number;
  hexRadius: number;
  strokeColor: string;
  strokeWidth: number;
}) {
  const rows: ReactElement[] = [];
  // Geometry for pointy-top hex on a flat-offset grid:
  //   dx between columns = r * sqrt(3)  ≈ r * 1.732
  //   dy between rows    = r * 1.5
  const dx = hexRadius * Math.sqrt(3);
  const dy = hexRadius * 1.5;

  let key = 0;
  for (let y = -hexRadius; y < height + hexRadius; y += dy) {
    const row = Math.round((y + hexRadius) / dy);
    const xOffset = row % 2 === 0 ? 0 : dx / 2;
    for (let x = -hexRadius + xOffset; x < width + hexRadius; x += dx) {
      const cx = x;
      const cy = y;
      const r = hexRadius;
      // Pointy-top vertices clockwise from top.
      const d = [
        `M ${cx} ${cy - r}`,
        `L ${cx + (r * Math.sqrt(3)) / 2} ${cy - r / 2}`,
        `L ${cx + (r * Math.sqrt(3)) / 2} ${cy + r / 2}`,
        `L ${cx} ${cy + r}`,
        `L ${cx - (r * Math.sqrt(3)) / 2} ${cy + r / 2}`,
        `L ${cx - (r * Math.sqrt(3)) / 2} ${cy - r / 2}`,
        "Z",
      ].join(" ");
      rows.push(
        <path
          key={key++}
          d={d}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
        />,
      );
    }
  }
  return rows;
}
