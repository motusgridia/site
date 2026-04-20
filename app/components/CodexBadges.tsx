// Small chip components for codex type + canon flags.
// Used in card grid, entry headers, and search results.
//
// Spec: /site/CLAUDE.md § Component rules (mono uppercase, hex DNA)
//       /site-ia.md § Codex frontmatter (six codex types, three canon flags)
//
// Stroke-only icon on the type badge carries the Hex DNA rule without the
// heaviness of a full hex-frame. Canon badge uses a single dot — cyan for
// grounded, amber for fiction — the amber flag is the "fiction is
// imagination, keep it clearly marked" signal from the visual-identity doc.

import type { ReactNode } from "react";

import { CANON_LABEL, CODEX_TYPE_LABEL } from "@/lib/content";

type CodexType =
  | "concept"
  | "infrastructure"
  | "technology"
  | "faction"
  | "character"
  | "place"
  | "event";

type Canon = "grounded" | "fiction-c1" | "fiction-c2";

// ---------------------------------------------------------------------------
// Per-type hex-based glyph. 2px stroke, no fill, currentColor to inherit
// cyan-on-hover from parent.
// ---------------------------------------------------------------------------

function HexOutline({ children }: { children?: ReactNode }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M12 1.5 L21.5 7 L21.5 17 L12 22.5 L2.5 17 L2.5 7 Z" />
      {children}
    </svg>
  );
}

function TypeGlyph({ type }: { type: CodexType }) {
  switch (type) {
    case "concept":
      return (
        <HexOutline>
          <circle cx="12" cy="12" r="3" />
        </HexOutline>
      );
    case "infrastructure":
      return (
        <HexOutline>
          <path d="M8 10 L12 12 L16 10 M8 14 L12 16 L16 14" />
        </HexOutline>
      );
    case "technology":
      return (
        <HexOutline>
          <path d="M9 9 L15 15 M15 9 L9 15" />
        </HexOutline>
      );
    case "faction":
      return (
        <HexOutline>
          <path d="M12 8 L12 16 M8 12 L16 12" />
        </HexOutline>
      );
    case "character":
      return (
        <HexOutline>
          <circle cx="12" cy="10.5" r="2" />
          <path d="M8 16 Q12 13 16 16" />
        </HexOutline>
      );
    case "place":
      return (
        <HexOutline>
          <circle cx="12" cy="12" r="1.25" fill="currentColor" />
          <circle cx="12" cy="12" r="4" />
        </HexOutline>
      );
    case "event":
      return (
        <HexOutline>
          <path d="M10 9 L14 15 M10 15 L14 9 M8.5 12 L15.5 12" />
        </HexOutline>
      );
  }
}

// ---------------------------------------------------------------------------
// Public badges
// ---------------------------------------------------------------------------

export function CodexTypeBadge({ type }: { type: CodexType }) {
  return (
    <span
      className="mono inline-flex items-center gap-1.5 text-ink-mute"
      aria-label={`Codex type: ${CODEX_TYPE_LABEL[type]}`}
    >
      <TypeGlyph type={type} />
      {CODEX_TYPE_LABEL[type]}
    </span>
  );
}

export function CanonBadge({ canon }: { canon: Canon }) {
  const isFiction = canon !== "grounded";
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 ${
        isFiction ? "text-accent-amber" : "text-accent-cyan"
      }`}
      aria-label={`Canon: ${CANON_LABEL[canon]}`}
      title={CANON_LABEL[canon]}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isFiction ? "bg-accent-amber" : "bg-accent-cyan"
        }`}
      />
      {CANON_LABEL[canon]}
    </span>
  );
}
