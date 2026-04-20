// /logs — reverse-chronological feed of diary entries.
// Spec: /site-ia.md § Logs
//
// Empty-state friendly: renders a placeholder card explaining what's coming
// when the content-index has no published log entries. When logs land, they
// appear here as a reverse-chrono list with mono date + title + excerpt.

import type { Metadata } from "next";
import Link from "next/link";

import { getContentIndex } from "@/lib/content";
import { CanonBadge } from "@/app/components/CodexBadges";
import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";

export const metadata: Metadata = {
  title: "Logs",
  description:
    "The build, written as it happens. Diary-log posts from inside MotusGridia — notes on construction, discoveries, and the occasional dispatch from the fiction side of the codex.",
  alternates: { canonical: "/logs" },
  openGraph: {
    title: "Logs · Motus Gridia",
    description: "The build, written as it happens.",
    url: "/logs",
  },
};

// ---------------------------------------------------------------------------
// Date formatting — lowercase ISO month-day for maximum density. Year is
// visible via the slug path (`/logs/2026/...`) so we don't repeat it in the
// list item.
// ---------------------------------------------------------------------------

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[d.getUTCMonth()] ?? "";
  const yr = d.getUTCFullYear();
  return `${day} ${mon} ${yr}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LogsIndexPage() {
  const idx = await getContentIndex();
  const logs = idx.logs; // already reverse-chrono sorted by the build script.

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <PageHeader
          eyebrow={<>Logs · {logs.length === 0 ? "Soon" : `${logs.length} entries`}</>}
          title="The build, written as it happens."
          deck="Diary entries from inside MotusGridia — the thinking, the discoveries, the broken bits. Written in real time. The grounded entries document the project; fiction-flagged entries dispatch from the C1 or C2 timelines."
        />

        <div className="mt-16">
          {logs.length === 0 ? (
            <div className="border border-line-soft bg-bg-panel p-12 text-center">
              <p className="mono mb-3 text-accent-cyan">No logs yet</p>
              <p className="mx-auto max-w-[48ch] text-body-lg leading-[1.6] text-ink-mute">
                The first log lands when the site does. Subscribe on the home
                page and you&rsquo;ll get an email the moment it&rsquo;s up.
              </p>
              <div className="mt-6">
                <Link
                  href="/#newsletter-heading"
                  className="mono-l border border-accent-cyan px-4 py-2 text-accent-cyan transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:bg-accent-cyan hover:text-bg-deep"
                >
                  Join the wall →
                </Link>
              </div>
            </div>
          ) : (
            <ol className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
              {logs.map((l) => {
                const year = new Date(l.date).getUTCFullYear();
                return (
                  <li key={l.slug}>
                    <Link
                      href={`/logs/${year}/${l.slug}`}
                      className="group flex flex-col gap-2 py-8 sm:flex-row sm:items-baseline sm:gap-8"
                    >
                      <time
                        dateTime={l.date}
                        className="mono shrink-0 text-ink-mute sm:w-36"
                      >
                        {formatDate(l.date)}
                      </time>
                      <div className="flex-1">
                        <h2 className="text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] group-hover:text-accent-cyan">
                          {l.title}
                        </h2>
                        <p className="mt-2 max-w-[60ch] text-body-sm leading-[1.55] text-ink-mute">
                          {l.excerpt}
                        </p>
                      </div>
                      <div className="shrink-0 self-start sm:self-center">
                        <CanonBadge canon={l.canon} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
