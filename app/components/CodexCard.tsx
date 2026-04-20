// Card used in the /codex index grid + the "Related" rails on entry pages.
// Spec: /site-ia.md § Codex index, § Codex entry
//       /site/CLAUDE.md § Component rules (hex DNA, soft 4-8px corners,
//                                           inner glow on hover)
//
// Server component. No interactivity — each card is a single clickable
// anchor around the full content box, with hover-glow handled purely in CSS.

import Link from "next/link";
import type { ContentIndex } from "@/lib/schemas/content";
import { CanonBadge, CodexTypeBadge } from "@/app/components/CodexBadges";

type CodexIndexEntry = ContentIndex["codex"][number];

export function CodexCard({ entry }: { entry: CodexIndexEntry }) {
  return (
    <Link
      href={`/codex/${entry.slug}`}
      className="group relative block border border-line-soft bg-bg-panel p-6 transition-[box-shadow,border-color] duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:border-accent-cyan focus-visible:border-accent-cyan focus-visible:shadow-[inset_0_0_24px_var(--glow-cyan)] hover:shadow-[inset_0_0_24px_var(--glow-cyan)]"
    >
      {/* Top row — type + canon chips. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <CodexTypeBadge type={entry.type} />
        <CanonBadge canon={entry.canon} />
      </div>

      {/* Title. */}
      <h3 className="mb-3 text-h2 font-display leading-tight tracking-[-0.02em] text-ink-primary transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] group-hover:text-accent-cyan">
        {entry.title}
      </h3>

      {/* Summary. */}
      <p className="mb-5 text-body-sm leading-[1.55] text-ink-mute">
        {entry.summary}
      </p>

      {/* Tag row — max 3, extras folded into "+N". */}
      {entry.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {entry.tags.slice(0, 3).map((tag) => (
            <li
              key={tag}
              className="mono border border-line-soft bg-bg-deep px-2 py-1 text-[0.625rem] text-ink-mute"
            >
              {tag}
            </li>
          ))}
          {entry.tags.length > 3 ? (
            <li className="mono px-2 py-1 text-[0.625rem] text-ink-mute">
              +{entry.tags.length - 3}
            </li>
          ) : null}
        </ul>
      ) : null}
    </Link>
  );
}
