// Dynamic sitemap.xml for motusgridia.com.
// Next.js App Router convention: `app/sitemap.ts` is served at /sitemap.xml
// and referenced by app/robots.ts.
//
// Spec:
//   /site-ia.md § Route map — v0.2 has the full tree of static + content routes.
//   /landing-copy-v0.1.md § 7.4 — canonical URL + locale.
//
// How this works:
//   - Static routes are listed in STATIC_ROUTES with hand-tuned changeFreq +
//     priority values.
//   - Content routes (codex entries, manifesto sections, logs) are expanded
//     from the pre-built /public/content-index.json. When the build script
//     emits a new entry, it lands here automatically.
//   - `lastModified` on content pages uses the content-index's global
//     `generated_at` timestamp. Once per-entry `updated` fields ship in the
//     build script (v0.3), swap to that for per-page granularity.

import type { MetadataRoute } from "next";

import { getContentIndex } from "@/lib/content";

const SITE_URL = "https://motusgridia.com";

// `lastModified` for static routes is captured at build time. Every deploy
// rebuilds; Google re-crawls.
const BUILD_TIME = new Date();

type StaticRoute = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

// ---------------------------------------------------------------------------
// Static routes — the pillars of the IA, ordered by importance.
// Priority guide (Google doesn't use this directly anymore, but crawl budget
// hints + internal consistency are still valuable signals):
//   1.0 — apex: /
//   0.9 — canonical spines: /manifesto, /codex, /logs
//   0.7 — utility routes: /about, /contact
// ---------------------------------------------------------------------------

const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/manifesto", changeFrequency: "weekly", priority: 0.9 },
  { path: "/codex", changeFrequency: "weekly", priority: 0.9 },
  { path: "/logs", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const idx = await getContentIndex();
  const contentLastModified = new Date(idx.generated_at);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: BUILD_TIME,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Manifesto entries — high priority because they're the doctrinal spine.
  const manifestoEntries: MetadataRoute.Sitemap = idx.manifesto.map((m) => ({
    url: `${SITE_URL}/manifesto/${m.slug}`,
    lastModified: contentLastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Codex entries — the bulk of the site; mid-high priority.
  const codexEntries: MetadataRoute.Sitemap = idx.codex.map((c) => ({
    url: `${SITE_URL}/codex/${c.slug}`,
    lastModified: contentLastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Log entries — reverse-chrono; the freshest drive crawl cadence, so we
  // use the log's own date as lastModified.
  const logEntries: MetadataRoute.Sitemap = idx.logs.map((l) => {
    const year = new Date(l.date).getUTCFullYear();
    return {
      url: `${SITE_URL}/logs/${year}/${l.slug}`,
      lastModified: new Date(l.date),
      changeFrequency: "monthly",
      priority: 0.6,
    };
  });

  return [
    ...staticEntries,
    ...manifestoEntries,
    ...codexEntries,
    ...logEntries,
  ];
}
