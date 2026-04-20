// /logs/[year]/[slug] — single diary-log entry.
// Spec: /site-ia.md § Log entry
//
// Mono date above the title, ProseShell body, right rail of "What this
// introduced" (forward) + "Related manifesto sections" (forward). Schema.org
// `BlogPosting` so Google surfaces the post as editorial content.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getAllLogParams,
  getContentIndex,
  getLogEntry,
} from "@/lib/content";
import { renderMdx } from "@/lib/mdx";
import { CanonBadge } from "@/app/components/CodexBadges";
import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";
import { ProseShell } from "@/app/components/ProseShell";
import { RelatedRail } from "@/app/components/RelatedRail";

export async function generateStaticParams() {
  return getAllLogParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getLogEntry(slug);
  if (!entry) return {};
  const y = entry.frontmatter.date.getUTCFullYear();
  return {
    title: entry.frontmatter.title,
    description: entry.frontmatter.excerpt,
    alternates: { canonical: `/logs/${y}/${slug}` },
    openGraph: {
      type: "article",
      title: `${entry.frontmatter.title} · Logs · Motus Gridia`,
      description: entry.frontmatter.excerpt,
      url: `/logs/${y}/${slug}`,
      publishedTime: entry.frontmatter.date.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.frontmatter.title} · Logs · Motus Gridia`,
      description: entry.frontmatter.excerpt,
    },
  };
}

export default async function LogEntryPage({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}) {
  const { year, slug } = await params;
  const entry = await getLogEntry(slug);
  if (!entry) notFound();

  // Verify the URL year matches the entry's actual year. Mismatches 404 so we
  // don't duplicate indexable URLs for the same content.
  const actualYear = String(entry.frontmatter.date.getUTCFullYear());
  if (actualYear !== year) notFound();

  const { frontmatter } = entry;

  // Prev/next — adjacent logs in the reverse-chrono sequence.
  const idx = await getContentIndex();
  const position = idx.logs.findIndex((l) => l.slug === slug);
  const prev = position > 0 ? idx.logs[position - 1] : null; // newer
  const next =
    position >= 0 && position < idx.logs.length - 1
      ? idx.logs[position + 1]
      : null; // older

  const formatted = frontmatter.date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: frontmatter.title,
    description: frontmatter.excerpt,
    url: `https://motusgridia.com/logs/${year}/${slug}`,
    datePublished: frontmatter.date.toISOString(),
    author: { "@type": "Person", name: "Shaan Khan" },
    publisher: {
      "@type": "Organization",
      name: "Motus Gridia",
      url: "https://motusgridia.com/",
    },
    inLanguage: "en-GB",
    isPartOf: {
      "@type": "Blog",
      name: "Motus Gridia — Logs",
      url: "https://motusgridia.com/logs",
    },
  };

  return (
    <>
      <div data-tonal-mode={frontmatter.canon} className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <nav aria-label="Breadcrumb" className="mb-10">
          <ol className="mono flex items-center gap-2 text-ink-mute">
            <li>
              <Link href="/logs" className="hover:text-accent-cyan">
                Logs
              </Link>
            </li>
            <li aria-hidden="true" className="text-ink-mute/40">
              /
            </li>
            <li>
              <span className="text-ink-primary">{year}</span>
            </li>
          </ol>
        </nav>

        <PageHeader
          eyebrow={
            <time dateTime={frontmatter.date.toISOString()}>{formatted}</time>
          }
          title={frontmatter.title}
          deck={frontmatter.excerpt}
          meta={
            <>
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
            manifestoRefs={frontmatter.related_manifesto}
          />
        </div>

        <nav
          aria-label="Log navigation"
          className="mt-24 border-t border-line-soft pt-8"
        >
          <ul className="flex flex-col justify-between gap-6 text-body-sm sm:flex-row">
            <li className="flex-1">
              {prev ? (
                <Link
                  href={`/logs/${new Date(prev.date).getUTCFullYear()}/${prev.slug}`}
                  className="group flex flex-col gap-1"
                >
                  <span className="mono text-ink-mute">← Newer</span>
                  <span className="text-ink-primary transition-colors group-hover:text-accent-cyan">
                    {prev.title}
                  </span>
                </Link>
              ) : null}
            </li>
            <li className="flex-1 sm:text-right">
              {next ? (
                <Link
                  href={`/logs/${new Date(next.date).getUTCFullYear()}/${next.slug}`}
                  className="group flex flex-col gap-1 sm:items-end"
                >
                  <span className="mono text-ink-mute">Older →</span>
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
