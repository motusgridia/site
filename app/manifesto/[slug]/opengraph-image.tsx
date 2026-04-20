// Dynamic per-entry Open Graph image for /manifesto/[slug].
// Spec: /landing-copy-v0.1.md § 7.3 (original OG card)
//       /site/CLAUDE.md § Component rules (hex DNA, no stock, no faces)
//
// Mirrors the codex per-entry OG route, with three tweaks:
//   - Eyebrow reads `MANIFESTO · § {section}` instead of `CODEX · TYPE · CANON`
//   - Cyan accent only (manifesto is grounded-only by contract — fiction is
//     a log or codex flag, never a manifesto section)
//   - Deck line underneath the title shows the frontmatter summary (trimmed
//     to 120 chars to fit the card safely)
//
// Any future edits must preserve the Wget UA + /format\(['"]?truetype['"]?\)/
// regex pair. See site-handoff § 4h for the post-mortem.

import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

import { getManifestoEntry } from "@/lib/content";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Motus Gridia manifesto entry — cyan honeycomb lattice on deep indigo with title wordmark centred";

// Render on-demand, NOT at build time. See the twin comment in
// `app/codex/[slug]/opengraph-image.tsx` for the full post-mortem — TL;DR:
// the sibling `page.tsx`'s `generateStaticParams()` would otherwise make
// Next.js pre-render one PNG per manifesto slug at build time, each calling
// `loadFraunces()` with an unbounded Google Fonts fetch, which hung Vercel's
// build for 75+ min. Empty array means "no build-time pre-render for this
// file" — the PNG renders on first crawler hit and is cached by Vercel's
// edge for all subsequent requests.
export async function generateStaticParams() {
  return [];
}

// Tokens (inlined — next/og can't read :root CSS variables).
const BG_DEEP = "#07090D";
const INK_PRIMARY = "#E8ECF5";
const INK_MUTE = "#7E89A8";
const ACCENT_CYAN = "#22E5FF";
const LINE_SOFT = "#1A2240";

async function loadFraunces(): Promise<ArrayBuffer | null> {
  // 4-second total budget across the CSS fetch + TTF fetch pair — defense in
  // depth against Google Fonts stalling a Node-runtime OG route. If either
  // leg is slow, abort and fall back to the system serif; better a slightly
  // off-brand OG than an indefinitely open socket on a social crawler hit.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@144,600&display=swap",
      { headers: { "User-Agent": "Wget/1.21" }, signal: ctrl.signal },
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

export default async function ManifestoOg({
  params,
}: {
  // Next.js 15: dynamic-segment params are Promise-wrapped on all route
  // handlers, including opengraph-image.tsx.
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getManifestoEntry(slug);

  const title = entry?.frontmatter.title ?? "Motus Gridia";
  const section = entry?.frontmatter.section ?? "";
  const summary = entry?.frontmatter.summary ?? "";
  // Trim the summary to a reasonable single-line deck. The card is 1120px
  // wide minus side padding, so ~110 chars of body copy fit comfortably.
  const deckRaw = summary.length > 120 ? `${summary.slice(0, 117)}…` : summary;

  // Scale title down if long.
  const titleFontSize =
    title.length > 36 ? 64 : title.length > 24 ? 84 : 108;

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
            strokeColor: ACCENT_CYAN,
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
            <radialGradient id="manifesto-glow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={ACCENT_CYAN} stopOpacity="0.14" />
              <stop offset="60%" stopColor={ACCENT_CYAN} stopOpacity="0.02" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#manifesto-glow)" />
        </svg>

        {/* Top eyebrow — MANIFESTO · § SECTION */}
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
          <span>MANIFESTO</span>
          {section ? (
            <>
              <span>·</span>
              <span style={{ color: ACCENT_CYAN }}>§ {section}</span>
            </>
          ) : null}
        </div>

        {/* Centre wordmark + deck */}
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

          {deckRaw ? (
            <div
              style={{
                marginTop: 28,
                fontSize: 24,
                lineHeight: 1.4,
                color: INK_MUTE,
                maxWidth: 900,
                fontFamily: frauncesData ? "Fraunces" : "serif",
                fontStyle: "italic",
              }}
            >
              {deckRaw}
            </div>
          ) : null}
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
// Honeycomb helper — same geometry as /site/app/opengraph-image.tsx and the
// codex per-entry OG. Kept inline per route rather than extracted to a
// shared module because Next.js' per-route bundling for opengraph-image.tsx
// already treats each route as its own bundle; a shared import wouldn't
// meaningfully reduce runtime cost, and inlining keeps the OG route self-
// contained + easier to debug in isolation.
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
