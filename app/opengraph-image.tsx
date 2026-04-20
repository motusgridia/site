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

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Alt text is consumed by layout.tsx's metadata; duplicated here as a
// self-documenting constant per the spec reference above.
export const alt =
  "MotusGridia — cyan honeycomb on indigo, wordmark MOTVSGRIDIA centred";

// Tokens — inlined because next/og cannot read :root CSS variables.
const BG_DEEP = "#07090D";
const BG_PANEL = "#0B1030";
const INK_PRIMARY = "#E8ECF5";
const ACCENT_CYAN = "#22E5FF";
const LINE_SOFT = "#1A2240";

const WORDMARK = "MOTVSGRIDIA"; // Latin V per /landing-copy-v0.1.md § 1.

// ---------------------------------------------------------------------------
// Fetch Fraunces from Google Fonts.
// CSS2 API returns a stylesheet with a woff2 src; we parse it out and fetch
// the font binary. next/og accepts woff2 in Next.js 15+.
// ---------------------------------------------------------------------------

async function loadFraunces(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      // 144 opsz + 600 wght matches the display-1 token in globals.css.
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@144,600&display=swap",
      {
        headers: {
          // Chrome UA ensures woff2 delivery. Older UAs trigger woff/ttf
          // fallbacks; we want the smallest and newest.
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      },
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();

    const match = css.match(
      /src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s+format\(['"]?woff2['"]?\)/,
    );
    const fontUrl = match?.[1];
    if (!fontUrl) return null;

    const fontRes = await fetch(fontUrl);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
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
            color: BG_PANEL === BG_DEEP ? INK_PRIMARY : "#7E89A8",
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
  const rows: JSX.Element[] = [];
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
