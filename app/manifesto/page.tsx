// /manifesto — overview of the blueprint, chapter by chapter.
// Spec: /site-ia.md § Manifesto
//       /landing-copy-v0.1.md — tile text reused here for the H1 eyebrow
//
// This is the landing page for the long-form essays. Each manifesto entry
// is a self-contained chapter with a section number ("1.1", "4.3", etc.)
// from /grid-master-content.md. Rendered as an ordered reading list, left
// rail on wide screens. Fiction-canon logs are intentionally NOT listed
// here — manifesto is blueprint / grounded-only.

import type { Metadata } from "next";
import Link from "next/link";

import { getContentIndex } from "@/lib/content";
import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "The blueprint, chapter by chapter. The manifesto entries that define the Grid Network — Optionism, Basic Law, the movement frame, the search, and the vision.",
  alternates: { canonical: "/manifesto" },
  openGraph: {
    title: "Manifesto · Motus Gridia",
    description:
      "The blueprint, chapter by chapter. The manifesto entries that define the Grid Network.",
    url: "/manifesto",
  },
};

export default async function ManifestoIndexPage() {
  const idx = await getContentIndex();
  const entries = idx.manifesto.slice().sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <PageHeader
          eyebrow={<>Manifesto · {entries.length} entries</>}
          title="The blueprint, chapter by chapter."
          deck="A designated area of land where a community lives, upheld by advanced sustainable technologies to provide humans with a high standard of self-sufficient living. Read it in order, or by section."
        />

        {entries.length === 0 ? (
          <div className="mt-16 border border-line-soft bg-bg-panel p-10 text-center">
            <p className="mono text-ink-mute">
              No manifesto entries yet — check back soon.
            </p>
          </div>
        ) : (
          <ol className="mt-16 flex flex-col gap-0 divide-y divide-line-soft border-y border-line-soft">
            {entries.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/manifesto/${m.slug}`}
                  className="group flex flex-col gap-2 py-8 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:bg-bg-panel/40 sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <div className="mono-l shrink-0 text-accent-cyan sm:w-20">
                    § {m.section}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] group-hover:text-accent-cyan">
                      {m.title}
                    </h2>
                    <p className="mt-2 max-w-[60ch] text-body-sm leading-[1.55] text-ink-mute">
                      {m.summary}
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mono shrink-0 text-ink-mute/40 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] group-hover:text-accent-cyan sm:w-8 sm:text-right"
                  >
                    →
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Footer />
    </>
  );
}
