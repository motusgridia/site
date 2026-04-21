// /explore — 3D Codex Explorer.
//
// Spec: Standing directive (session 6) —
//       "make the site feel as much like a 3d space as possible. every
//        concept illustrated visually, solar-system-style 3d model UX".
// Spec: /site/CLAUDE.md § Build conventions (server components by default),
//       § Component rules (hex DNA), § Writing rules (punchy, direct).
//
// Composition:
//   1. PageHeader — eyebrow + title + deck.
//   2. Canvas section (80vh) holding the R3F Explorer scene. Gated by
//      ExplorerCanvas — motion-disabled users see nothing here.
//   3. Fallback / secondary list — CSS-only hex-tile grid of every codex
//      entry, grouped by type. Always rendered so keyboard, screen-reader,
//      reduced-motion, and sub-640px mobile users have a navigable surface.
//   4. Footer.
//
// The scene is advisory — the list below is the authoritative navigation.
// That keeps the page accessible at every level while the 3D is the
// spectacle.

import type { Metadata } from "next";
import Link from "next/link";

import { getContentIndex, CANON_LABEL, CODEX_TYPE_LABEL } from "@/lib/content";
import ExplorerCanvas from "@/app/components/ExplorerCanvas";
import type { ExplorerEntry } from "@/app/components/ExplorerScene";
import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "The Grid Network, mapped. A 3D honeycomb of every concept, faction, place, and technology in the codex. Click a cell to open its entry.",
  alternates: { canonical: "/explore" },
  openGraph: {
    title: "Explore · Motus Gridia",
    description:
      "A 3D honeycomb of every codex entry. Click a cell to open its entry.",
    url: "/explore",
  },
};

// Codex type display order for the fallback grid. Mirrors the order used
// in /codex so users see the same taxonomy on both pages.
const TYPE_ORDER: ReadonlyArray<
  "concept"
  | "infrastructure"
  | "technology"
  | "faction"
  | "character"
  | "place"
  | "event"
> = [
  "concept",
  "infrastructure",
  "technology",
  "faction",
  "character",
  "place",
  "event",
];

export default async function ExplorePage() {
  const idx = await getContentIndex();

  // Narrow the content-index entry shape to what ExplorerScene consumes.
  // Keeping the type loose on the scene side means we don't drag server
  // schema imports into the client bundle.
  //
  // relatedSlugs feeds Explorer M2's cross-link edges. The scene walks
  // every entry's relatedSlugs, collapses A→B and B→A into one edge, and
  // renders a dashed line between the cells — dim by default, bright when
  // either endpoint is hovered. The data already lives in
  // `/public/content-index.json` under `graph.codex_out`, but we pull it
  // off the codex[].related_codex field here because it's already in the
  // per-entry record the page has in hand.
  const sceneEntries: ReadonlyArray<ExplorerEntry> = idx.codex.map((c) => ({
    slug: c.slug,
    title: c.title,
    type: CODEX_TYPE_LABEL[c.type] ?? c.type,
    canon: c.canon,
    summary: c.summary,
    relatedSlugs: c.related_codex,
  }));

  // Group entries by type for the fallback grid.
  const byType = new Map<string, typeof idx.codex>();
  for (const type of TYPE_ORDER) byType.set(type, []);
  for (const entry of idx.codex) {
    const bucket = byType.get(entry.type);
    if (bucket) bucket.push(entry);
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <PageHeader
          eyebrow={<>Explore · {idx.codex.length} cells</>}
          title="The Grid Network, mapped."
          deck="Every codex entry is a hex cell. Lines between cells are cross-references. Hover a cell to light up its neighbourhood. Drag to orbit, scroll to zoom, click to open. Cyan is grounded blueprint, amber is fiction canon."
        />
      </div>

      {/* 3D scene — sits edge-to-edge below the header. 80vh tall so the
          scene dominates the viewport without swallowing the whole page.
          Position relative so the absolute-positioned Canvas inside
          ExplorerScene fills the container. min-h clamps the shortest
          useful size on very small laptop screens. */}
      <section
        className="relative mt-12 h-[80vh] min-h-[32rem] w-full overflow-hidden border-y border-line-soft bg-bg-deep"
        aria-label="3D codex explorer"
      >
        {/* Static radial-gradient fallback — matches the hero's .hero-static
            pattern so motion-disabled users still see a visually coherent
            backdrop instead of flat bg-deep. */}
        <div
          aria-hidden="true"
          className="hero-static pointer-events-none absolute inset-0"
        />

        {idx.codex.length > 0 ? (
          <ExplorerCanvas entries={sceneEntries} />
        ) : null}

        {/* Legend — pinned bottom-left, mono caps. Readable regardless of
            whether the 3D scene renders. Glow via Tailwind arbitrary
            shadow utility so we stay in utility-land per /site/CLAUDE.md
            "no inline styles". */}
        <div className="pointer-events-none absolute bottom-6 left-6 flex flex-col gap-2 text-ink-mute">
          <div className="mono flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 bg-accent-cyan shadow-[0_0_8px_var(--glow-cyan)]"
            />
            Grounded
          </div>
          <div className="mono flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 bg-accent-amber shadow-[0_0_8px_rgba(255,179,71,0.4)]"
            />
            Fiction
          </div>
        </div>
      </section>

      {/* Fallback / secondary list — always rendered. Keyboard + SR +
          reduced-motion + sub-640px users navigate from here. */}
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <header className="mb-12 border-b border-line-soft pb-6">
          <div className="mono-l mb-3 text-accent-cyan">List view</div>
          <h2 className="text-display-3 font-display leading-tight tracking-[var(--tracking-display-2)] text-ink-primary">
            Every cell, as text.
          </h2>
          <p className="mt-3 max-w-[60ch] text-body leading-[1.55] text-ink-mute">
            The same {idx.codex.length} codex entries, grouped by type. Useful
            if you want a linear read of the index or if your browser has
            reduced motion on.
          </p>
        </header>

        <div className="flex flex-col gap-16">
          {TYPE_ORDER.map((type) => {
            const bucket = byType.get(type) ?? [];
            if (bucket.length === 0) return null;
            return (
              <section key={type} aria-labelledby={`type-${type}`}>
                <h3
                  id={`type-${type}`}
                  className="mono-l mb-6 flex items-baseline gap-3 text-accent-cyan"
                >
                  {/* Defensive fallback: CODEX_TYPE_LABEL is typed as
                      Record<string, string> so index access returns
                      `string | undefined` under noUncheckedIndexedAccess.
                      If a new CodexType is added without updating the
                      label map, fall back to the raw key rather than
                      rendering an empty label. */}
                  <span>{CODEX_TYPE_LABEL[type] ?? type}</span>
                  <span className="text-ink-mute">
                    · {bucket.length}
                  </span>
                </h3>

                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {bucket.map((entry) => {
                    // Static class strings — Tailwind's JIT can't interpolate
                    // `text-${token}` at build time, so we branch on the full
                    // utility name. Cyan for grounded, amber for fiction-*.
                    const canonClass =
                      entry.canon === "grounded"
                        ? "text-accent-cyan"
                        : "text-accent-amber";
                    return (
                      <li key={entry.slug}>
                        <Link
                          href={`/codex/${entry.slug}`}
                          className="group block h-full border border-line-soft bg-bg-panel p-5 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:border-accent-cyan"
                        >
                          <div className={`mono mb-2 ${canonClass}`}>
                            {CANON_LABEL[entry.canon] ?? entry.canon}
                          </div>
                          <div className="text-h3 font-display leading-tight text-ink-primary transition-colors group-hover:text-accent-cyan">
                            {entry.title}
                          </div>
                          <p className="mt-3 text-body-sm leading-[1.55] text-ink-mute">
                            {entry.summary}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <Footer />
    </>
  );
}
