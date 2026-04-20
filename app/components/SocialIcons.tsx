// Stroke-only SVG icons for the footer social row.
// Replaces the `BS` / `SU` / `YT` initials placeholder from v0.0.
//
// Design rules (enforced):
//   - `fill="none"` everywhere. Strokes only.
//   - `stroke="currentColor"` so the parent hex-frame's hover colour cascade
//     (`--ink-mute` → `--accent-cyan`) flows through with zero extra CSS.
//   - `strokeLinecap="round"` + `strokeLinejoin="round"` — softens tiny
//     terminals at 24×24 render size without breaking the sharp-corner UI
//     rule (applies only to line ends, not the box itself).
//   - 1.75px base stroke at a 24 viewBox — reads crisp at the 18–20px render
//     size inside a hex-frame on retina, stays within Component rules §2
//     "Lines are thin. 1px, often dashed… sometimes glowing for active."
//   - No brand fills. Per each platform's trademark usage guidance, stroke-
//     only monochrome renderings are the safest approach for third-party
//     linking; the platform name appears in `aria-label` on the anchor so
//     screen readers still announce correctly.
//
// Icon geometry is a pared-back silhouette of each platform's mark, not a
// pixel-accurate reproduction. Anyone familiar with the platform recognises
// the shape; anyone unfamiliar sees a tidy hex-framed glyph.
//
// Sizing: callers pass a `className` that controls the box. The SVGs use
// 100% width + height + preserveAspectRatio so the hex-frame's inner mask
// crops them naturally.

import type { SVGProps } from "react";

// ---------------------------------------------------------------------------
// Shared props + wrapper
// ---------------------------------------------------------------------------

type IconProps = Omit<SVGProps<SVGSVGElement>, "children" | "viewBox">;

const baseProps: SVGProps<SVGSVGElement> = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: false,
};

// ---------------------------------------------------------------------------
// Bluesky — pared-back butterfly
// Two overlapping kite shapes sharing a central axis.
// ---------------------------------------------------------------------------

export function BlueskyIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 10.5c-1.8-2.8-4.5-5.5-7-5.5-1.5 0-2.5 1-2.5 2.5 0 1.7.5 4.5 1.3 6.5 0.5 1.3 1.5 2 3 2 0.9 0 1.8-0.2 2.7-0.7" />
      <path d="M12 10.5c1.8-2.8 4.5-5.5 7-5.5 1.5 0 2.5 1 2.5 2.5 0 1.7-0.5 4.5-1.3 6.5-0.5 1.3-1.5 2-3 2-0.9 0-1.8-0.2-2.7-0.7" />
      <path d="M12 10.5V19" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Substack — stacked horizontal bars inside a square-ish frame
// ---------------------------------------------------------------------------

export function SubstackIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 5h14" />
      <path d="M5 10h14" />
      <path d="M5 15v5l7-3.5L19 20v-5" />
      <path d="M5 15h14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// YouTube — rounded rectangle with play triangle
// ---------------------------------------------------------------------------

export function YouTubeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10.5 9.5v5l4-2.5z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Reddit — circle with antenna + dot eyes + arc mouth (Snoo head silhouette)
// ---------------------------------------------------------------------------

export function RedditIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="13" r="7" />
      <circle cx="18" cy="6" r="1.5" />
      <path d="M12 6V8" />
      <circle cx="9" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12.5" r="0.75" fill="currentColor" stroke="none" />
      <path d="M9 16c1 0.7 2 1 3 1s2-0.3 3-1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Instagram — rounded square with circle lens + corner dot
// ---------------------------------------------------------------------------

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TikTok — stylised "music-note on a hook" — two curves + staff
// ---------------------------------------------------------------------------

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M14 3v11a4 4 0 1 1-4-4" />
      <path d="M14 3c0.3 2.3 1.9 4.2 4 4.7" />
      <path d="M14 3c0.2 1.1 0.8 2.1 1.7 2.8" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// GitHub — simplified Octocat silhouette (head + forked tail)
// ---------------------------------------------------------------------------

export function GitHubIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3c-4.97 0-9 4.03-9 9 0 3.97 2.58 7.34 6.16 8.53.45.08.62-.2.62-.43v-1.5c-2.5.55-3.03-1.2-3.03-1.2-.4-1.03-1-1.3-1-1.3-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.37 2.1.97 2.6.75.08-.58.32-.97.57-1.2-2-.22-4.1-1-4.1-4.45 0-.98.35-1.78.93-2.4-.1-.23-.4-1.15.09-2.4 0 0 .76-.24 2.5.92a8.6 8.6 0 0 1 4.56 0c1.74-1.16 2.5-.92 2.5-.92.5 1.25.2 2.17.1 2.4.58.62.92 1.42.92 2.4 0 3.46-2.1 4.22-4.1 4.44.33.28.62.82.62 1.66v2.46c0 .23.17.51.63.42A9 9 0 0 0 21 12c0-4.97-4.03-9-9-9z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Registry — keyed by the `initial` string used in /site/app/page.tsx so the
// page can swap from placeholder initials to icons with a single dict lookup.
// ---------------------------------------------------------------------------

export const SOCIAL_ICON_BY_INITIAL: Record<
  string,
  (props: IconProps) => JSX.Element
> = {
  BS: BlueskyIcon,
  SU: SubstackIcon,
  YT: YouTubeIcon,
  RD: RedditIcon,
  IG: InstagramIcon,
  TT: TikTokIcon,
  GH: GitHubIcon,
};
