// Shared header block for content pages.
// Spec: /site-ia.md § Section chrome
//       /site/CLAUDE.md § Component rules (mono uppercase, 1px lines, hex DNA)
//
// Usage:
//   <PageHeader
//     eyebrow="Codex · Concept"
//     title="Honeycomb Architecture"
//     deck="The geometry beneath the civilisation."
//   />
//
// Kept deliberately light — the heavy work (badges, hero, OG image) lives in
// each route's own composition around this primitive.

import type { ReactNode } from "react";

type Props = {
  eyebrow?: ReactNode;
  title: string;
  deck?: ReactNode;
  /** Optional extras rendered below the deck (chip rows, metadata, etc.) */
  meta?: ReactNode;
};

export function PageHeader({ eyebrow, title, deck, meta }: Props) {
  return (
    <header className="border-b border-line-soft pb-10">
      {eyebrow ? (
        <div className="mono-l mb-6 text-accent-cyan">{eyebrow}</div>
      ) : null}

      <h1 className="text-balance text-display-2 leading-[1.05] tracking-[var(--tracking-display-2)] text-ink-primary sm:text-display-1 sm:leading-[1.02] sm:tracking-[var(--tracking-display-1)]">
        {title}
      </h1>

      {deck ? (
        <p className="mt-6 max-w-[60ch] text-balance text-body-lg leading-[1.55] text-ink-mute">
          {deck}
        </p>
      ) : null}

      {meta ? <div className="mt-6 flex flex-wrap gap-4">{meta}</div> : null}
    </header>
  );
}
