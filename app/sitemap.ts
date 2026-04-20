// Dynamic sitemap.xml for motusgridia.com.
// Next.js App Router convention: `app/sitemap.ts` is served at /sitemap.xml
// and referenced by app/robots.ts.
//
// Spec:
//   /site-ia.md § Route map — v0.1 has exactly one public route (`/`).
//   /landing-copy-v0.1.md § 7.4 — canonical URL + locale.
//
// How it grows: when `/manifesto`, `/codex/[slug]`, `/logs/[slug]` land in
// v0.2, extend the ROUTES array below OR switch to reading the
// `content-index.json` produced by scripts/build-content-index.ts. The
// build script already emits `{ slug, kind, updated }` per entry so the
// MDX tree can be mapped 1:1 into sitemap entries with `lastModified`
// pulled from the frontmatter.

import type { MetadataRoute } from "next";

const SITE_URL = "https://motusgridia.com";

// `lastModified` is captured at build time. When the app is rebuilt (every
// deploy), this re-evaluates and Google re-crawls. For per-page accuracy,
// read the MDX frontmatter `updated` field once the content routes ship.
const BUILD_TIME = new Date();

type Route = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const ROUTES: Route[] = [
  // Home is the only route in v0.1. Weekly because the landing copy is
  // stable — the wall builds, the wordmark doesn't. Priority 1.0 because
  // it's the apex of the site. When the next routes land, bump home down
  // to 0.9 and give /manifesto 1.0.
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: BUILD_TIME,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
