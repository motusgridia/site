// Root layout for motusgridia.com.
// Wires next/font (Fraunces variable + Geist Mono) into the CSS variables that
// /site/app/globals.css already references — `--font-fraunces`, `--font-geist-mono`.
//
// Copy strings (title, description, OG, Twitter) are pulled VERBATIM from
// /landing-copy-v0.1.md § 7 "SEO Meta". Per /site/CLAUDE.md, copy decisions
// require explicit user confirmation — this file makes none.
//
// Server component by default (no "use client"). Per /site/CLAUDE.md §
// "Build conventions": server components by default.

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Geist_Mono } from "next/font/google";

import "./globals.css";

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
//
// Fraunces is the display + body face. Per /site/CLAUDE.md § Typography we use
// `opsz 144` for displays and `opsz 14` for body. globals.css drives this with
// `font-variation-settings: "opsz" 14` on body and `"opsz" 144` on h1–h6, so
// the `opsz` axis MUST be loaded here. Default Google subset is the variable
// build with `wght` axis, so axes: ["opsz"] opts-in to the optical-size axis.
//
// SOFT and WONK axes are intentionally NOT loaded — they're playful and don't
// match the Latin-classical / cyberpunk register.

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
});

// Geist Mono — UI labels, chips, breadcrumbs, button labels. Always uppercase
// (the `.mono` and `.mono-l` utility classes in globals.css enforce this).
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

// ---------------------------------------------------------------------------
// Metadata — strings from /landing-copy-v0.1.md § 7 (verbatim)
// ---------------------------------------------------------------------------

const SITE_URL = "https://motusgridia.com";
const SITE_NAME = "Motus Gridia";
const TITLE = "Motus Gridia — A blueprint for a society worth waking up in.";
const DESCRIPTION =
  "A blueprint for a society worth waking up in. The Grid Network — a movement, a codex, a diary in real time. Join the wall before the first Grid is built.";
const OG_DESCRIPTION =
  "The Grid Network. A movement, a codex, a diary in real time. Join the wall before the first Grid is built.";
const TWITTER_DESCRIPTION =
  "The Grid Network. A movement, a codex, a diary in real time. Join the wall.";
// The og:image alt text lives with the image — see `export const alt` in
// app/opengraph-image.tsx. Keeping it there (not duplicated here) keeps the
// alt string colocated with the image it describes, per Next.js 15 guidance.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    // Per-route titles get suffixed with the site name. Keeps SERPs consistent.
    template: "%s · Motus Gridia",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: "Shaan Khan",
  publisher: SITE_NAME,
  // Disable browser auto-detection of phone/email/address — the layout doesn't
  // expose any and the auto-linking strips our typography.
  formatDetection: { email: false, telephone: false, address: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: OG_DESCRIPTION,
    url: SITE_URL,
    locale: "en_GB",
    // `images` intentionally omitted — Next.js 15 App Router auto-injects
    // the og:image tag from `app/opengraph-image.tsx`. Declaring `images`
    // here would override the file-based route. The `alt` text still lives
    // with the image: see `export const alt` in opengraph-image.tsx.
  },
  twitter: {
    card: "summary_large_image",
    site: "@motusgridia",
    creator: "@motusgridia",
    title: TITLE,
    description: TWITTER_DESCRIPTION,
    // `images` intentionally omitted — same reasoning as openGraph.images;
    // opengraph-image.tsx is auto-wired as the twitter:image too.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  // `icons` intentionally omitted — the file-based convention at
  // `app/icon.tsx` (favicon) + `app/apple-icon.tsx` (apple-touch-icon)
  // auto-injects the correct <link rel="icon"> / <link rel="apple-touch-icon">
  // with hashed URLs for cache-busting. Declaring `icons` here would hard-
  // code stale static paths and break the dynamic routes.
};

// Viewport is split out per Next.js 15 App Router convention.
export const viewport: Viewport = {
  themeColor: "#07090D",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// ---------------------------------------------------------------------------
// JSON-LD — Organization schema (verbatim from /landing-copy-v0.1.md § 7.6)
// ---------------------------------------------------------------------------

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "MotusGridia",
  url: `${SITE_URL}/`,
  // `logo` intentionally omitted until a stable, hash-free logo URL exists.
  // The dynamic `app/icon.tsx` + `app/apple-icon.tsx` routes emit hashed
  // URLs (e.g. /apple-icon-abc123.png) which aren't safe to hard-code in
  // JSON-LD — the hash rolls every time the file changes. When a stable
  // /public/logo.png ships with the brand-asset task, restore this field.
  description:
    "A blueprint for a society worth waking up in. The Grid Network — a movement, a codex, a diary in real time.",
  founder: {
    "@type": "Person",
    name: "Shaan Khan",
  },
  sameAs: [
    "https://bsky.app/profile/motusgridia.bsky.social",
    "https://motusgridia.substack.com",
    "https://youtube.com/@motusgridia",
    "https://reddit.com/user/motusgridia",
    "https://instagram.com/motusgridia",
    "https://tiktok.com/@motusgridia",
    "https://github.com/motusgridia",
  ],
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-GB"
      // Wire the two next/font CSS variables onto the root element so every
      // `var(--font-fraunces)` / `var(--font-geist-mono)` reference in
      // globals.css resolves.
      className={`${fraunces.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        // Default tonal mode — base palette. Override per-page via:
        //   <body data-tonal-mode="fiction-c1"> (etc.)
        // See /site/CLAUDE.md § Locked design tokens.
        data-tonal-mode="grounded"
      >
        {/* Skip-to-content — first focusable element on every page.
            Class defined in globals.css. /site/CLAUDE.md § Component rules #8. */}
        <a href="#main" className="skip-to-content">
          Skip to content
        </a>

        {/* Page-wide scanline overlay at 2% opacity. Auto-disabled in
            prefers-reduced-motion via globals.css. */}
        <div aria-hidden="true" className="scanlines" />

        <main id="main">{children}</main>

        {/* Organization JSON-LD. Verbatim from landing-copy-v0.1.md § 7.6. */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </body>
    </html>
  );
}
