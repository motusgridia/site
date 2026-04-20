// Next.js 15 config for motusgridia.com.
// Spec: /site/CLAUDE.md § Build conventions; /stack-recommendation.md.
//
// Kept minimal on purpose — every additional flag/plugin gets a one-line
// rationale so future sessions don't add cargo-cult config.

import type { NextConfig } from "next";

const config: NextConfig = {
  // React strict mode — surfaces double-invoked effects in dev so we catch
  // R3F / GSAP cleanup bugs before they ship.
  reactStrictMode: true,

  // We treat type-checking and linting as build gates. Both run in CI before
  // `next build` is invoked; we deliberately do NOT skip them at build time.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Power the Vercel CDN headers for the OG image and content-index.json.
  // Adjust once we add a CDN-edge worker for the content index.
  poweredByHeader: false,

  // Images. /public/og.png + future codex hero images live on-domain only —
  // no third-party image hosts yet. Add `remotePatterns` here when needed.
  images: {
    formats: ["image/avif", "image/webp"],
    // 1200x630 OG plus 800/1200/1600 hex hero sizes.
    deviceSizes: [640, 828, 1200, 1600, 2048],
    imageSizes: [64, 128, 256, 384, 512, 768, 1024],
  },

  // Tree-shake heavy R3F-adjacent packages. `optimizePackageImports` rewrites
  // bare imports into per-module imports at build time so unused code is
  // dropped. Critical for keeping non-canvas routes under the 100kb gzipped
  // first-load JS budget called out in /site/CLAUDE.md.
  //
  // List is restricted to packages explicitly named in
  // /stack-recommendation.md § TL;DR. Do not add packages here without
  // updating the stack rec first.
  experimental: {
    optimizePackageImports: [
      "@react-three/drei",
      "@react-three/postprocessing",
      "framer-motion",
    ],
  },

  // Three.js ships ESM in newer versions; transpilePackages is a safety net
  // for the GSAP / Lenis transitive deps that occasionally ship CJS.
  transpilePackages: ["three"],

  // Tailwind v4 reads tokens from app/globals.css @theme block — no PostCSS
  // config or tailwind.config.ts required. See note at top of globals.css.

  // MDX. Content rendering ships with the codex/manifesto/logs route work in
  // a follow-up session — we'll plug in @next/mdx (or fumadocs-mdx, per
  // /stack-recommendation.md) at that point. The build-time content index at
  // /scripts/build-content-index.ts is independent of the runtime MDX
  // pipeline and continues to work today.

  // Compiler options. Fail loud on accidental console.log in production.
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

export default config;
