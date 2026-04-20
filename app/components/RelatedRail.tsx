// Right-rail widget on entry pages — "Related codex entries" + "Referenced by".
// Spec: /site-ia.md § Codex entry (Connections panel), § Manifesto entry
//       /site/CLAUDE.md § Component rules (hex DNA, thin lines, mono labels)
//
// Server component. Reads the content-index once at render and resolves each
// slug into a title + type chip. Broken refs (slug not in index) render as
// plain mono text per the build script's "warn, don't fail" policy.

import Link from "next/link";

import { getContentIndex } from "@/lib/content";
import { CodexTypeBadge } from "@/app/components/CodexBadges";

type Props = {
  /** Outgoing related_codex slugs (forward edges). */
  related?: readonly string[];
  /** Reverse-edge slugs (codex entries that link INTO this one). */
  backlinks?: readonly string[];
  /** Optional manifesto backlinks (rendered as plain links, not chips). */
  manifestoRefs?: readonly string[];
};

export async function RelatedRail({
  related = [],
  backlinks = [],
  manifestoRefs = [],
}: Props) {
  const idx = await getContentIndex();

  // Deduplicate and resolve to index entries in one pass.
  const relatedEntries = related
    .map((slug) => idx.codex.find((c) => c.slug === slug))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const backlinkEntries = backlinks
    .filter((s) => !related.includes(s)) // avoid duplicating
    .map((slug) => idx.codex.find((c) => c.slug === slug))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const manifestoEntries = manifestoRefs
    .map((slug) => idx.manifesto.find((m) => m.slug === slug))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  // Render nothing if there's genuinely no related content — keeps the
  // layout tight on stub entries.
  if (
    relatedEntries.length === 0 &&
    backlinkEntries.length === 0 &&
    manifestoEntries.length === 0
  ) {
    return null;
  }

  return (
    <aside
      aria-label="Connections"
      className="flex flex-col gap-10 border-l border-line-soft pl-6 text-body-sm"
    >
      {relatedEntries.length > 0 ? (
        <section aria-labelledby="connections-related">
          <h2
            id="connections-related"
            className="mono mb-4 text-accent-cyan"
          >
            Related
          </h2>
          <ul className="flex flex-col gap-4">
            {relatedEntries.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/codex/${e.slug}`}
                  className="flex flex-col gap-1"
                >
                  <span className="text-body-sm text-ink-primary transition-colors hover:text-accent-cyan">
                    {e.title}
                  </span>
                  <CodexTypeBadge type={e.type} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {backlinkEntries.length > 0 ? (
        <section aria-labelledby="connections-backlinks">
          <h2
            id="connections-backlinks"
            className="mono mb-4 text-accent-cyan"
          >
            Referenced by
          </h2>
          <ul className="flex flex-col gap-4">
            {backlinkEntries.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/codex/${e.slug}`}
                  className="flex flex-col gap-1"
                >
                  <span className="text-body-sm text-ink-primary transition-colors hover:text-accent-cyan">
                    {e.title}
                  </span>
                  <CodexTypeBadge type={e.type} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {manifestoEntries.length > 0 ? (
        <section aria-labelledby="connections-manifesto">
          <h2
            id="connections-manifesto"
            className="mono mb-4 text-accent-cyan"
          >
            In the manifesto
          </h2>
          <ul className="flex flex-col gap-3">
            {manifestoEntries.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/manifesto/${e.slug}`}
                  className="text-body-sm text-ink-primary transition-colors hover:text-accent-cyan"
                >
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
