// Dynamic robots.txt for motusgridia.com.
// Next.js App Router convention: `app/robots.ts` is served at /robots.txt.
//
// Spec:
//   /site-ia.md § Route map
//   /site/CLAUDE.md — AI-crawler policy is enforced at the Cloudflare layer
//   via "AI Crawl Control" (session-2 addendum), NOT here. robots.txt is a
//   polite request; Cloudflare Bot Management is the actual enforcement
//   boundary. Keeping this file permissive avoids duplicating policy in
//   two places where they could drift.
//
// What we disallow:
//   - `/api/*` — the subscribe endpoint is POST-only and has no indexable
//     content. Crawlers that GET it get a 405.
//   - (Nothing else.) There's no admin / preview / staging surface yet.
//
// Sitemap + host hints: the sitemap URL points Google at the dynamic route
// emitted by `app/sitemap.ts`; `host` disambiguates canonical hostname for
// crawlers that support the directive.

import type { MetadataRoute } from "next";

const SITE_URL = "https://motusgridia.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
