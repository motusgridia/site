// /codex — searchable, filterable index of every codex entry.
// Spec: /site-ia.md § Codex index
//       /site/CLAUDE.md § Content conventions, § Component rules
//
// The client-side Fuse.js search + chip filters live inside <CodexSearch>;
// this server component only hydrates it with the pre-built index. The
// result: one network round-trip, one JSON payload, the search never hits
// the network again.

import type { Metadata } from "next";
import { Suspense } from "react";

import { getContentIndex } from "@/lib/content";
import { CodexSearch } from "@/app/components/CodexSearch";
import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";

export const metadata: Metadata = {
  title: "Codex",
  description:
    "Every concept, faction, place, technology — indexed. The game-style database of the Grid Network: Honeycomb Architecture, Basic Law, Optionism, the Cyber Vikings, Illum, and more.",
  alternates: { canonical: "/codex" },
  openGraph: {
    title: "Codex · Motus Gridia",
    description:
      "Every concept, faction, place, technology — indexed. The game-style database of the Grid Network.",
    url: "/codex",
  },
};

export default async function CodexIndexPage() {
  const idx = await getContentIndex();

  // Merge frontmatter + search body into a single record per entry so the
  // client can both render cards and fuzzy-search bodies without a second
  // pass.
  const searchEntries = idx.codex.map((c) => {
    const searchRow = idx.search_index.codex.find((s) => s.slug === c.slug);
    return {
      slug: c.slug,
      title: c.title,
      type: c.type,
      canon: c.canon,
      tags: c.tags,
      summary: c.summary,
      body: searchRow?.body ?? "",
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Codex · Motus Gridia",
    url: "https://motusgridia.com/codex",
    description:
      "Every concept, faction, place, technology — indexed. The game-style database of the Grid Network.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: idx.codex.length,
      itemListElement: idx.codex.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://motusgridia.com/codex/${c.slug}`,
        name: c.title,
      })),
    },
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <PageHeader
          eyebrow={<>Codex · {idx.codex.length} entries</>}
          title="Every concept, faction, place, technology — indexed."
          deck="A game-style database of the Grid Network. Search it, filter it, follow the cross-links. Grounded entries describe the blueprint; fiction entries live in the C1 and C2 timelines."
        />

        <div className="mt-16">
          {idx.codex.length === 0 ? (
            <div className="border border-line-soft bg-bg-panel p-10 text-center">
              <p className="mono text-ink-mute">
                Codex is building — check back soon.
              </p>
            </div>
          ) : (
            // CodexSearch reads useSearchParams() at the top level. Next.js
            // 15 requires any client component that calls useSearchParams()
            // to render inside a Suspense boundary during static generation
            // — otherwise `next build` fails with the CSR-bailout error.
            // See: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
            <Suspense
              fallback={
                <div className="border border-line-soft bg-bg-panel p-10 text-center">
                  <p className="mono text-ink-mute">Loading codex…</p>
                </div>
              }
            >
              <CodexSearch
                entries={searchEntries}
                typeCounts={idx.counts.by_codex_type}
              />
            </Suspense>
          )}
        </div>
      </div>

      <Footer />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
