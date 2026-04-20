// /manifesto/[slug] — single manifesto essay.
// Spec: /site-ia.md § Manifesto entry
//       /site/CLAUDE.md § Content conventions (MDX + frontmatter)
//
// Wide measure (prose ~68ch) + right-rail "Related codex entries" on desktop,
// stacks on mobile. Each page gets its own JSON-LD Article node so the
// manifesto entries index as long-form essays, not generic webpages.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAllManifestoSlugs,
  getContentIndex,
  getManifestoEntry,
} from "@/lib/content";
import { renderMdx } from "@/lib/mdx";
import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";
import { ProseShell } from "@/app/components/ProseShell";
import { RelatedRail } from "@/app/components/RelatedRail";

// ---------------------------------------------------------------------------
// Static params — pre-render every published manifesto entry at build time.
// Future drafts (`draft: true` in frontmatter) are omitted by the content
// index, so they'll 404 until published.
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return getAllManifestoSlugs();
}

// ---------------------------------------------------------------------------
// Per-entry metadata. Title pattern inherited from layout.tsx's template
// ("%s · Motus Gridia") — `title` below is the prefix Next.js substitutes.
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getManifestoEntry(slug);
  if (!entry) return {};
  return {
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    alternates: { canonical: `/manifesto/${slug}` },
    openGraph: {
      type: "article",
      title: `${entry.frontmatter.title} · Manifesto · Motus Gridia`,
      description: entry.frontmatter.summary,
      url: `/manifesto/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.frontmatter.title} · Manifesto · Motus Gridia`,
      description: entry.frontmatter.summary,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ManifestoEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getManifestoEntry(slug);
  if (!entry) notFound();

  const idx = await getContentIndex();
  // Prev/next navigation ordered by the `order` field in frontmatter.
  const ordered = idx.manifesto.slice().sort((a, b) => a.order - b.order);
  const position = ordered.findIndex((m) => m.slug === slug);
  const prev = position > 0 ? ordered[position - 1] : null;
  const next = position >= 0 && position < ordered.length - 1
    ? ordered[position + 1]
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    url: `https://motusgridia.com/manifesto/${slug}`,
    author: { "@type": "Person", name: "Shaan Khan" },
    publisher: {
      "@type": "Organization",
      name: "Motus Gridia",
      url: "https://motusgridia.com/",
    },
    isPartOf: {
      "@type": "CreativeWorkSeries",
      name: "Motus Gridia — Manifesto",
      url: "https://motusgridia.com/manifesto",
    },
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10">
          <ol className="mono flex items-center gap-2 text-ink-mute">
            <li>
              <Link
                href="/manifesto"
                className="hover:text-accent-cyan"
              >
                Manifesto
              </Link>
            </li>
            <li aria-hidden="true" className="text-ink-mute/40">
              /
            </li>
            <li>
              <span className="text-ink-primary">§ {entry.frontmatter.section}</span>
            </li>
          </ol>
        </nav>

        <PageHeader
          eyebrow={<>Manifesto · § {entry.frontmatter.section}</>}
          title={entry.frontmatter.title}
          deck={entry.frontmatter.summary}
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          {/* Prose column */}
          <ProseShell>{await renderMdx(entry.body)}</ProseShell>

          {/* Right rail — related codex entries */}
          <RelatedRail related={entry.frontmatter.related_codex} />
        </div>

        {/* Prev/next — tight mono row under the body */}
        <nav
          aria-label="Manifesto navigation"
          className="mt-24 border-t border-line-soft pt-8"
        >
          <ul className="flex flex-col justify-between gap-6 text-body-sm sm:flex-row">
            <li className="flex-1">
              {prev ? (
                <Link
                  href={`/manifesto/${prev.slug}`}
                  className="group flex flex-col gap-1"
                >
                  <span className="mono text-ink-mute">
                    ← Previous · § {prev.section}
                  </span>
                  <span className="text-ink-primary transition-colors group-hover:text-accent-cyan">
                    {prev.title}
                  </span>
                </Link>
              ) : null}
            </li>
            <li className="flex-1 sm:text-right">
              {next ? (
                <Link
                  href={`/manifesto/${next.slug}`}
                  className="group flex flex-col gap-1 sm:items-end"
                >
                  <span className="mono text-ink-mute">
                    Next · § {next.section} →
                  </span>
                  <span className="text-ink-primary transition-colors group-hover:text-accent-cyan">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </li>
          </ul>
        </nav>
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
