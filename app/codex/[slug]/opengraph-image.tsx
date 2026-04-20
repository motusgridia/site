// Dynamic per-entry Open Graph image for /codex/[slug].
// Spec: /landing-copy-v0.1.md § 7.3 (original OG card)
//       /site/CLAUDE.md § Component rules (hex DNA, no stock, no faces)
//
// Mirrors the pattern proven in /site/app/opengraph-image.tsx:
//   - Wget/1.21 UA forces Google Fonts to serve uncompressed TTF
//   - Satori refuses WOFF/WOFF2 and silently emits 200 + empty body if fed
//     a compressed font, so we never pass one
//   - Honeycomb lattice + central wordmark layout, but with the ENTRY TITLE
//     as the wordmark and the type/canon as an eyebrow
//
// Any future edits must preserve the Wget UA + /format\(['"]?truetype['"]?\)/
// regex pair. See site-handoff § 4h for the post-mortem.

import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

import { getCodexEntry } from "@/lib/content";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Motus Gridia codex entry — cyan honeycomb lattice on deep indigo with title wordmark centred";

// Tokens (inlined — next/og can't read :root CSS variables).
const BG_DEEP = "#07090D";
const INK_PRIMARY = "#E8ECF5";
const INK_MUTE = "#7E89A8";
const ACCENT_CYAN = "#22E5FF";
const ACCENT_AMBER = "#FFB347";
const LINE_SOFT = "#1A2240";

async function loadFraunces(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@144,600&display=swap",
      { headers: { "User-Agent": "Wget/1.21" } },
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(
      /src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s+format\(['"]?truetype['"]?\)/,
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

export default async function CodexOg({
  params,
}: {
  // Next.js 15 breaking change: dynamic-segment params are always async, and
  // this applies to opengraph-image.tsx routes as well as page.tsx. Await
  // before accessing fields.
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getCodexEntry(slug);
  const title = entry?.frontmatter.title ?? "Motus Gridia";
  const type = entry?.frontmatter.type ?? "concept";
  const canon = entry?.frontmatter.canon ?? "grounded";
  const isFiction = canon !== "grounded";

  const accent = isFiction ? ACCENT_AMBER : ACCENT_CYAN;
  const canonLabel =
    canon === "grounded"
      ? "GROUNDED"
      : canon === "fiction-c1"
        ? "FICTION · C1"
        : "FICTION · C2";
  const typeLabel = type.toUpperCase();

  // Scale title down if it's long — keeps the wordmark readable.
  const titleFontSize =
    title.length > 28 ? 72 : title.length > 18 ? 92 : 116;

  const frauncesData = await loadFraunces();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG_DEEP,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: INK_PRIMARY,
          fontFamily: frauncesData ? "Fraunces" : "serif",
        }}
      >
        {/* Honeycomb lattice */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", inset: 0, opacity: 0.08 }}
        >
          {buildHoneycomb({
            width: 1200,
            height: 630,
            hexRadius: 42,
            strokeColor: accent,
            strokeWidth: 1.5,
          })}
        </svg>

        {/* Radial vignette */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <radialGradient id="codex-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.14" />
              <stop offset="60%" stopColor={accent} stopOpacity="0.02" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#codex-glow)" />
        </svg>

        {/* Top chip row — CODEX · TYPE · CANON */}
        <div
          style={{
            position: "absolute",
            top: 72,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 22,
            letterSpacing: "0.24em",
            fontFamily: "monospace",
            color: INK_MUTE,
            textTransform: "uppercase",
            gap: 32,
          }}
        >
          <span>CODEX</span>
          <span>·</span>
          <span>{typeLabel}</span>
          <span>·</span>
          <span style={{ color: accent }}>{canonLabel}</span>
        </div>

        {/* Centre wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 80px",
            position: "relative",
            zIndex: 1,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: titleFontSize,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              color: INK_PRIMARY,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
        </div>

        {/* Accent hairline */}
        <div
          style={{
            position: "absolute",
            bottom: 160,
            left: 280,
            right: 280,
            height: 1,
            background: LINE_SOFT,
          }}
        />

        {/* Footer — motusgridia.com */}
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
// Honeycomb helper — same geometry as /site/app/opengraph-image.tsx
// ---------------------------------------------------------------------------

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
  const dx = hexRadius * Math.sqrt(3);
  const dy = hexRadius * 1.5;

  let key = 0;
  for (let y = -hexRadius; y < height + hexRadius; y += dy) {
    const row = Math.round((y + hexRadius) / dy);
    const xOffset = row % 2 === 0 ? 0 : dx / 2;
    for (let x = -hexRadius + xOffset; x < width + hexRadius; x += dx) {
      const r = hexRadius;
      const d = [
        `M ${x} ${y - r}`,
        `L ${x + (r * Math.sqrt(3)) / 2} ${y - r / 2}`,
        `L ${x + (r * Math.sqrt(3)) / 2} ${y + r / 2}`,
        `L ${x} ${y + r}`,
        `L ${x - (r * Math.sqrt(3)) / 2} ${y + r / 2}`,
        `L ${x - (r * Math.sqrt(3)) / 2} ${y - r / 2}`,
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
