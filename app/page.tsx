// MotusGridia — root landing page.
//
// Spec: /landing-copy-v0.1.md (every visible string is verbatim from there)
//       /landing-page-playbook.md
//       /site/CLAUDE.md (design tokens, anti-patterns, component rules)
//
// Status: v0.1.2 — R3F honeycomb hero live above the static gradient.
//
// What this file IS today:
//   The full v0.1 landing structure rendered statically — the
//   `prefers-reduced-motion` / sub-640px fallback variant per
//   /landing-copy-v0.1.md § 8. All copy strings present, all sections
//   present, hex DNA throughout.
//
// What v0.1.1 adds over v0.0 (already wired below):
//   - Newsletter form is a hybrid: `<SubscribeForm>` renders the exact v0.0
//     disabled DOM when NEXT_PUBLIC_TURNSTILE_SITE_KEY is absent, and
//     automatically upgrades to the live Resend-backed client island when
//     the env var lands. Server never crashes; no redeploy needed to
//     activate. See app/components/SubscribeForm.tsx.
//   - Footer socials use stroke-only SVGs via SOCIAL_ICON_BY_INITIAL,
//     inheriting the hex-frame's `currentColor` cascade. Initial letters
//     remain a graceful fallback for any new platform whose icon isn't
//     yet registered.
//   - Dynamic favicon / apple-touch-icon / og-image ship via
//     app/icon.tsx, app/apple-icon.tsx, app/opengraph-image.tsx — no
//     static .png assets in /public/.
//
// What v0.1.2 adds over v0.1.1 (wired below):
//   - R3F honeycomb canvas overlays `.hero-static` as a client island. The
//     scene is chunked behind `next/dynamic({ ssr: false })` inside
//     `HeroCanvas.tsx`, so the three.js code path never touches the server
//     renderer AND never ships on the initial bundle. The `.hero-static`
//     radial gradient remains the SSR + reduced-motion + <640px fallback.
//     See app/components/HeroCanvas.tsx + app/components/HoneycombScene.tsx.
//
// What this file ISN'T (yet — handed off to follow-up sessions):
//   - GSAP ScrollTrigger entrances.
//   - Framer Motion staggered letter reveal on the one-liner.
//   - Lenis smooth scroll.
//
// Server component by default per /site/CLAUDE.md § Build conventions.
// The only client JS on this page is the SubscribeForm + HeroCanvas islands.
//
// Styling rule (CLAUDE.md): No inline styles — Tailwind utilities only,
// auto-generated from the @theme tokens in globals.css. Arbitrary values
// (e.g. `text-[0.625rem]`) are used sparingly for one-off geometry.

import type { Metadata } from "next";
import Link from "next/link";

import HeroCanvas from "@/app/components/HeroCanvas";
import { SubscribeForm } from "@/app/components/SubscribeForm";
import { SOCIAL_ICON_BY_INITIAL } from "@/app/components/SocialIcons";

// Per-route metadata override is omitted — the root metadata in
// app/layout.tsx already targets the home route.
export const metadata: Metadata = {};

// ---------------------------------------------------------------------------
// Static data — all strings verbatim from /landing-copy-v0.1.md.
// Centralised here so a future session swapping copy only edits one block.
// ---------------------------------------------------------------------------

const WORDMARK = "MOTVSGRIDIA"; // § 1 — Latin V is intentional, not a typo.
const ONE_LINER =
  "A Grid is a designated area of land where a community of people live, upheld by advanced sustainable technologies to provide humans with a high standard of self-sufficient living."; // § 2 — verbatim from Master Section 1.1
const TEASER_PARAGRAPH_1 =
  "A simple societal system for the near-future that most people can get behind — and, in the process, a peaceful path through the disaster already unfolding. Not a policy paper. Not a startup. A blueprint you can point to when the current model finally gives out."; // § 3
const TEASER_PARAGRAPH_2 =
  "One day the first Grid gets built — on this planet or another — and everyone stands in awe of it and wants to live inside one. The desire runs so strong that the first becomes the second, the second becomes the tenth, and a network of Grids ends up covering a planet. A society fixated on growing the Grid Network of connection, unity and harmony."; // § 3

type Tile = { title: string; subLabel: string; href: string };
const TILES: Tile[] = [
  // § 4 — exact strings, ordered Manifesto / Codex / Logs.
  //
  // v0.2: the "Soon." tail has been dropped from each subLabel now that every
  // section is populated. Tiles are wrapped in <Link> so the tile itself is
  // the click target — matches /site/CLAUDE.md § Component rules (hex DNA
  // carries meaning; a tile is a portal into a Grid, not decoration).
  {
    title: "MANIFESTO",
    subLabel: "The blueprint, chapter by chapter.",
    href: "/manifesto",
  },
  {
    title: "CODEX",
    subLabel: "Every concept, faction, place, technology — indexed.",
    href: "/codex",
  },
  {
    title: "LOGS",
    subLabel: "The build, written as it happens.",
    href: "/logs",
  },
];

type Social = {
  platform: string;
  handle: string;
  href: string;
  initial: string;
};
const SOCIALS: Social[] = [
  // § 6.1 — order from the spec table. Bluesky handle stays as
  // @motusgridia.bsky.social until the .com TXT-record verification clears,
  // then swap (URL unchanged). See spec note.
  {
    platform: "Bluesky",
    handle: "@motusgridia.bsky.social",
    href: "https://bsky.app/profile/motusgridia.bsky.social",
    initial: "BS",
  },
  {
    platform: "Substack",
    handle: "motusgridia.substack.com",
    href: "https://motusgridia.substack.com",
    initial: "SU",
  },
  {
    platform: "YouTube",
    handle: "@motusgridia",
    href: "https://youtube.com/@motusgridia",
    initial: "YT",
  },
  {
    platform: "Reddit",
    handle: "u/motusgridia",
    href: "https://reddit.com/user/motusgridia",
    initial: "RD",
  },
  {
    platform: "Instagram",
    handle: "@motusgridia",
    href: "https://instagram.com/motusgridia",
    initial: "IG",
  },
  {
    platform: "TikTok",
    handle: "@motusgridia",
    href: "https://tiktok.com/@motusgridia",
    initial: "TT",
  },
  {
    platform: "GitHub",
    handle: "motusgridia",
    href: "https://github.com/motusgridia",
    initial: "GH",
  },
];

const LEGAL_LINE = "© 2026 Motus Gridia. All concepts © Shaan Khan."; // § 6.2
const BUILT_IN_PUBLIC_LABEL = "Built in public →"; // § 6.3
const BUILT_IN_PUBLIC_HREF = "https://github.com/motusgridia/site"; // § 6.3

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  // Read the Turnstile sitekey at render time. When the env var is absent
  // (preview deploys, local dev before .env.local is populated, or the
  // production build before Resend/Turnstile are provisioned), the form
  // renders its disabled fallback and the page still pre-renders cleanly.
  // `NEXT_PUBLIC_` prefix is mandatory: the string must be inlined into the
  // client bundle so LiveForm can pass it to window.turnstile.render().
  const turnstileSitekey = process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"];

  return (
    <>
      {/* HERO ----------------------------------------------------------- */}
      {/* v0.2 adds the persistent nav (see app/layout.tsx), which sits sticky
          at the top with ~56px height (py-4 + content + border). Subtract
          that from 100dvh so the wordmark still centres cleanly underneath.
          Using `calc(100dvh-3.5rem)` instead of a CSS custom property keeps
          this self-contained — no additional token churn in globals.css. */}
      <section
        aria-labelledby="wordmark"
        className="hero-static relative flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center overflow-hidden px-6 py-24"
      >
        {/* HeroCanvas is a client island that self-gates on
            `prefers-reduced-motion` and a <640px viewport. When either gate
            trips, it renders nothing and the `.hero-static` gradient above
            is the full visual. When motion is allowed, it overlays a
            rotating R3F honeycomb lattice (bloom + chromatic aberration)
            on top of the gradient. pointer-events-none inside the Canvas
            style keeps the wordmark and decorative glyphs interactive. */}
        <HeroCanvas />

        {/* Hex glyphs left/right per § 1 — small, cyan, 0.6 alpha, ~20% of
            wordmark height. aria-hidden because they're decorative.
            Positioned above the canvas via z-[1] so they read as accent
            punctuation flanking the wordmark even when the R3F lattice is
            rotating behind them. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center gap-[14vw]"
        >
          <span className="text-[3rem] leading-none text-accent-cyan/60">⬡</span>
          <span className="text-[3rem] leading-none text-accent-cyan/60">⬡</span>
        </div>

        <h1
          id="wordmark"
          // aria-label spelled out so screen readers say "Motus Gridia",
          // not "MOTVSGRIDIA" letter-by-letter. SEO crawlers see both via
          // the heading text + the layout.tsx metadata title.
          aria-label="Motus Gridia"
          className="relative z-10 text-center"
        >
          {WORDMARK}
        </h1>
      </section>

      {/* ONE-LINER ------------------------------------------------------ */}
      <section aria-labelledby="one-liner" className="px-6 py-24 sm:py-32">
        <h2
          id="one-liner"
          className="mx-auto max-w-[28ch] text-balance text-center"
        >
          {ONE_LINER}
        </h2>
      </section>

      {/* MANIFESTO TEASER ---------------------------------------------- */}
      <section aria-labelledby="teaser-heading" className="px-6 py-16">
        <h2 id="teaser-heading" className="sr-only">
          The blueprint
        </h2>
        <div
          // body-lg per § 3, ~65ch measured column.
          className="mx-auto flex max-w-[65ch] flex-col gap-6 text-body-lg leading-[1.7]"
        >
          <p>{TEASER_PARAGRAPH_1}</p>
          <p>{TEASER_PARAGRAPH_2}</p>
        </div>
      </section>

      {/* HEX TILES ----------------------------------------------------- */}
      <section aria-labelledby="whats-coming" className="px-6 py-24">
        <h2 id="whats-coming" className="sr-only">
          What&rsquo;s coming
        </h2>
        <ul
          // Row on desktop, stack on mobile per § 4.
          className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6"
        >
          {TILES.map((tile) => (
            <li key={tile.title}>
              <Link href={tile.href} className="group block">
                <article className="hex-tile transition-[filter] duration-[var(--duration-fast)] ease-[var(--ease-technical)] group-hover:[filter:drop-shadow(0_0_16px_var(--glow-cyan))]">
                  <div className="flex flex-col items-center gap-3">
                    <span className="mono-l text-accent-cyan">
                      {tile.title}
                    </span>
                    <span className="max-w-[20ch] text-balance text-body-sm text-ink-mute transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] group-hover:text-ink-primary">
                      {tile.subLabel}
                    </span>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* NEWSLETTER FORM ----------------------------------------------- */}
      <section aria-labelledby="newsletter-heading" className="px-6 py-24">
        <h2 id="newsletter-heading" className="sr-only">
          Join the wall
        </h2>
        {/*
          SubscribeForm is a server-rendered shell that hydrates into a
          client island only when the Turnstile sitekey is set. When it
          is, it wires Cloudflare Turnstile + /api/subscribe + Resend.
          When it isn't, it renders the exact v0.0 disabled form DOM —
          same visual result, zero added client JS. See
          app/components/SubscribeForm.tsx for the full contract.
        */}
        <SubscribeForm sitekey={turnstileSitekey} />
      </section>

      {/* FOOTER -------------------------------------------------------- */}
      <footer
        aria-labelledby="footer-heading"
        className="mt-16 border-t border-line-soft px-6 pb-16 pt-24"
      >
        <h2 id="footer-heading" className="sr-only">
          Site footer
        </h2>

        {/* 6.1 — socials row. Stroke-only SVGs inherit the hex-frame's
            `currentColor` cascade (ink-mute → accent-cyan on hover), so
            no per-icon colour handling is needed. The initial letters
            remain as a crawler-visible aria-label fallback and also as
            a render fallback for any platform whose icon isn't in the
            registry yet (shouldn't happen today — registry covers all
            seven — but cheap insurance). */}
        <ul
          className="mb-12 flex flex-wrap items-center justify-center gap-4"
          aria-label="Social links"
        >
          {SOCIALS.map((s) => {
            const Icon = SOCIAL_ICON_BY_INITIAL[s.initial];
            return (
              <li key={s.platform}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={`${s.platform} (${s.handle})`}
                  title={s.handle}
                  className="hex-frame"
                >
                  {Icon ? (
                    <Icon
                      aria-hidden="true"
                      className="h-[1.125rem] w-[1.125rem]"
                    />
                  ) : (
                    <span aria-hidden="true" className="mono text-[0.625rem]">
                      {s.initial}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        {/* 6.2 — legal line, centred, mono caption, ink-mute */}
        <p className="mono mb-8 text-center text-ink-mute">{LEGAL_LINE}</p>

        {/* 6.3 — built-in-public link, centred on mobile, right-aligned on
            wider screens, mono 0.75rem, ink-mute → accent-cyan on hover
            (the cyan + glow is inherited from the global `a:hover` rule). */}
        <div className="flex justify-center sm:justify-end">
          <a
            href={BUILT_IN_PUBLIC_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-ink-mute"
          >
            {BUILT_IN_PUBLIC_LABEL}
          </a>
        </div>
      </footer>
    </>
  );
}
