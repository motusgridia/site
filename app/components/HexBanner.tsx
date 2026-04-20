// Decorative hex lattice banner — used as a hero background on content pages
// when an entry doesn't have a `hero_image` or a `hero_3d` asset yet.
// Spec: /site/CLAUDE.md § Component rules (hex DNA, 1px lines, layered depth)
//
// Pure CSS / SVG. No client JS. Respects prefers-reduced-motion automatically
// because the animation is kept in globals.css under the @media query.
//
// The lattice mirrors the structure used inside opengraph-image.tsx — same
// pointy-top hex, same geometry — so the brand reads consistent between
// social-card previews and in-site banners.

type Props = {
  /** Accent colour for the lattice strokes. */
  tone?: "cyan" | "amber";
  /** Optional caption rendered bottom-right as mono label. */
  caption?: string;
  className?: string;
};

export function HexBanner({
  tone = "cyan",
  caption,
  className = "",
}: Props) {
  const stroke = tone === "amber" ? "var(--accent-amber)" : "var(--accent-cyan)";

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden border border-line-soft bg-bg-panel ${className}`}
      style={{ aspectRatio: "4 / 1" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern
            id="hex-banner-lattice"
            width="60"
            height="52"
            patternUnits="userSpaceOnUse"
            patternTransform="translate(-30 -26)"
          >
            {/* Pointy-top hex, matched to opengraph-image.tsx geometry. */}
            <path
              d="M30 1 L58.98 14.5 L58.98 37.5 L30 51 L1.02 37.5 L1.02 14.5 Z"
              fill="none"
              stroke={stroke}
              strokeOpacity="0.22"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="hex-banner-glow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
            <stop offset="60%" stopColor={stroke} stopOpacity="0.04" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="300" fill="url(#hex-banner-lattice)" />
        <rect width="1200" height="300" fill="url(#hex-banner-glow)" />
      </svg>

      {caption ? (
        <span className="mono pointer-events-none absolute bottom-3 right-4 text-ink-mute">
          {caption}
        </span>
      ) : null}
    </div>
  );
}
