// /codex/[slug] — single codex entry.
// Spec: /site-ia.md § Codex entry
//       /site/CLAUDE.md § Content conventions, § Component rules
//       Standing directive (session 6) — "every concept illustrated
//       visually, solar-system-style 3d model UX".
//
// Layout:
//   [3D hero scene — CodexHeroCanvas, per-slug variant w/ HexBanner
//    fallback for motion-disabled, small-screen, and SSR]
//   [eyebrow: type · canon chips]
//   [h1 title]
//   [summary deck]
//   [prose column ---- right rail: Related + Referenced-by + manifesto refs]
//   [edit-on-github link]
//
// Per-entry JSON-LD emits `CreativeWork` for grounded entries and
// `Article` with isFiction=true for fiction canons. The
// `dateCreated` / `dateModified` fields are left off until we wire
// git log lookups in v0.3.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAllCodexSlugs,
  getBackLinks,
  getCodexEntry,
  getContentIndex,
  CODEX_TYPE_LABEL,
} from "@/lib/content";
import { renderMdx } from "@/lib/mdx";
import { CanonBadge, CodexTypeBadge } from "@/app/components/CodexBadges";
import CodexHeroCanvas from "@/app/components/CodexHeroCanvas";
import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";
import { ProseShell } from "@/app/components/ProseShell";
import { RelatedRail } from "@/app/components/RelatedRail";

// ---------------------------------------------------------------------------
// Static params — pre-render every published codex entry at build time.
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return getAllCodexSlugs();
}

// ---------------------------------------------------------------------------
// Per-entry metadata. Every codex page gets its own dynamic OG image via the
// co-located `opengraph-image.tsx` route — Next.js auto-injects it as the
// og:image without a manual `openGraph.images` entry.
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getCodexEntry(slug);
  if (!entry) return {};
  return {
    title: entry.frontmatter.title,
    description: entry.frontmatter.summary,
    alternates: { canonical: `/codex/${slug}` },
    openGraph: {
      type: "article",
      title: `${entry.frontmatter.title} · Codex · Motus Gridia`,
      description: entry.frontmatter.summary,
      url: `/codex/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.frontmatter.title} · Codex · Motus Gridia`,
      description: entry.frontmatter.summary,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CodexEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getCodexEntry(slug);
  if (!entry) notFound();

  const { frontmatter } = entry;
  const backlinks = await getBackLinks(slug);

  // Gather manifesto backlinks — manifesto entries that declared this codex
  // slug in their own `related_codex`. The index doesn't store this as a
  // reverse edge, so we compute it inline.
  const idx = await getContentIndex();
  const manifestoRefs = idx.manifesto
    .filter((m) => m.related_codex.includes(slug))
    .map((m) => m.slug);

  // Tonal mode — per-entry override wrapping the prose + connections.
  const tonalMode = frontmatter.tonal_mode ?? frontmatter.canon;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: frontmatter.title,
    headline: frontmatter.title,
    description: frontmatter.summary,
    url: `https://motusgridia.com/codex/${slug}`,
    genre: CODEX_TYPE_LABEL[frontmatter.type] ?? frontmatter.type,
    keywords: frontmatter.tags.join(", "),
    inLanguage: "en-GB",
    isPartOf: {
      "@type": "Collection",
      name: "Motus Gridia — Codex",
      url: "https://motusgridia.com/codex",
    },
    author: { "@type": "Person", name: "Shaan Khan" },
    ...(frontmatter.canon !== "grounded"
      ? { additionalType: "https://schema.org/Fiction" }
      : {}),
  };

  const editUrl = `https://github.com/motusgridia/site/edit/main/site/content/codex/${slug}.mdx`;

  return (
    <>
      <div data-tonal-mode={tonalMode} className="mx-auto max-w-7xl px-6 pt-10 sm:pt-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="mono flex items-center gap-2 text-ink-mute">
            <li>
              <Link href="/codex" className="hover:text-accent-cyan">
                Codex
              </Link>
            </li>
            <li aria-hidden="true" className="text-ink-mute/40">
              /
            </li>
            <li>
              <Link
                href={`/codex?type=${frontmatter.type}`}
                className="hover:text-accent-cyan"
              >
                {CODEX_TYPE_LABEL[frontmatter.type] ?? frontmatter.type}
              </Link>
            </li>
          </ol>
        </nav>

        {/* Hero — 3D scene dispatched by slug, with a static HexBanner
            underneath as the motion-disabled / SSR fallback. We used to
            render next/image here off `frontmatter.hero_image`, but none
            of those hero.webp files exist on disk yet and the 3D scene
            illustrates each concept more directly per the Session 6
            standing directive ("every concept illustrated visually"). */}
        <CodexHeroCanvas
          slug={slug}
          canon={frontmatter.canon}
          caption={`${CODEX_TYPE_LABEL[frontmatter.type] ?? frontmatter.type} · ${frontmatter.tags[0] ?? ""}`}
          className="mb-10"
        />

        <PageHeader
          title={frontmatter.title}
          deck={frontmatter.summary}
          meta={
            <>
              <CodexTypeBadge type={frontmatter.type} />
              <CanonBadge canon={frontmatter.canon} />
              {frontmatter.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {frontmatter.tags.map((t) => (
                    <li
                      key={t}
                      className="mono border border-line-soft bg-bg-panel px-2 py-1 text-[0.625rem] text-ink-mute"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          }
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ProseShell>{await renderMdx(entry.body)}</ProseShell>

          <RelatedRail
            related={frontmatter.related_codex}
            backlinks={backlinks}
            manifestoRefs={manifestoRefs}
          />
        </div>

        {/* Edit on GitHub + build-in-public affordance */}
        <div className="mt-24 flex flex-col items-start gap-4 border-t border-line-soft pt-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="mono text-ink-mute">
            Built in public — every entry is an MDX file you can read on GitHub.
          </span>
          <a
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-l border border-accent-cyan px-4 py-2 text-accent-cyan transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:bg-accent-cyan hover:text-bg-deep"
          >
            Edit on GitHub →
          </a>
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
