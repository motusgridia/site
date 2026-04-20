// Site-wide footer — used on every content route.
// The landing page keeps its bespoke footer (larger social row, no column
// layout); this one is the densified version intended to sit below prose.
//
// Spec: /site-ia.md § Footer
//       /site/CLAUDE.md § Component rules (mono uppercase, hex DNA, 1px lines)
//
// Data is pulled from the content-index so the "latest logs" / "codex
// categories" columns stay synced with the MDX content.

import Link from "next/link";
import { getContentIndex } from "@/lib/content";
import { SOCIAL_ICON_BY_INITIAL } from "@/app/components/SocialIcons";

const LEGAL_LINE = "© 2026 Motus Gridia. All concepts © Shaan Khan.";
const BUILT_IN_PUBLIC_LABEL = "Built in public →";
const BUILT_IN_PUBLIC_HREF = "https://github.com/motusgridia/site";

// Same SOCIALS block shape as /app/page.tsx. Kept in sync manually; if the
// list shifts we'll centralise into lib/socials.ts in a follow-up.
const SOCIALS: Array<{
  platform: string;
  handle: string;
  href: string;
  initial: string;
}> = [
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

const CODEX_TYPE_LABEL: Record<string, string> = {
  concept: "Concepts",
  infrastructure: "Infrastructure",
  technology: "Technology",
  faction: "Factions",
  character: "Characters",
  place: "Places",
  event: "Events",
};

export async function Footer() {
  const idx = await getContentIndex();

  const manifestoLinks = idx.manifesto.slice(0, 6);
  const typeGroups = Object.entries(idx.counts.by_codex_type).filter(
    ([, n]) => n > 0,
  );
  const latestLogs = idx.logs.slice(0, 4);

  return (
    <footer
      aria-labelledby="site-footer-heading"
      className="mt-32 border-t border-line-soft px-6 pb-16 pt-16"
    >
      <h2 id="site-footer-heading" className="sr-only">
        Site footer
      </h2>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* --- Manifesto column ----------------------------------------- */}
        <section aria-labelledby="footer-manifesto">
          <h3
            id="footer-manifesto"
            className="mono mb-4 text-accent-cyan"
          >
            Manifesto
          </h3>
          <ul className="flex flex-col gap-2">
            {manifestoLinks.length > 0 ? (
              manifestoLinks.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={`/manifesto/${m.slug}`}
                    className="text-body-sm text-ink-mute hover:text-accent-cyan"
                  >
                    {m.title}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-body-sm text-ink-mute">Soon.</li>
            )}
          </ul>
        </section>

        {/* --- Codex column --------------------------------------------- */}
        <section aria-labelledby="footer-codex">
          <h3 id="footer-codex" className="mono mb-4 text-accent-cyan">
            Codex
          </h3>
          <ul className="flex flex-col gap-2">
            {typeGroups.length > 0 ? (
              typeGroups.map(([type, n]) => (
                <li key={type}>
                  <Link
                    href={`/codex?type=${type}`}
                    className="text-body-sm text-ink-mute hover:text-accent-cyan"
                  >
                    {CODEX_TYPE_LABEL[type] ?? type}{" "}
                    <span className="mono text-[0.7em] text-ink-mute/60">
                      {n}
                    </span>
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-body-sm text-ink-mute">Soon.</li>
            )}
          </ul>
        </section>

        {/* --- Latest logs column --------------------------------------- */}
        <section aria-labelledby="footer-logs">
          <h3 id="footer-logs" className="mono mb-4 text-accent-cyan">
            Latest logs
          </h3>
          <ul className="flex flex-col gap-2">
            {latestLogs.length > 0 ? (
              latestLogs.map((l) => {
                const year = new Date(l.date).getUTCFullYear();
                return (
                  <li key={l.slug}>
                    <Link
                      href={`/logs/${year}/${l.slug}`}
                      className="text-body-sm text-ink-mute hover:text-accent-cyan"
                    >
                      {l.title}
                    </Link>
                  </li>
                );
              })
            ) : (
              <li className="text-body-sm text-ink-mute">Soon.</li>
            )}
          </ul>
        </section>

        {/* --- About / Contact column ----------------------------------- */}
        <section aria-labelledby="footer-site">
          <h3 id="footer-site" className="mono mb-4 text-accent-cyan">
            Site
          </h3>
          <ul className="flex flex-col gap-2">
            <li>
              <Link
                href="/about"
                className="text-body-sm text-ink-mute hover:text-accent-cyan"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-body-sm text-ink-mute hover:text-accent-cyan"
              >
                Contact
              </Link>
            </li>
            <li>
              <a
                href={BUILT_IN_PUBLIC_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm text-ink-mute hover:text-accent-cyan"
              >
                {BUILT_IN_PUBLIC_LABEL}
              </a>
            </li>
          </ul>
        </section>
      </div>

      {/* Socials row ---------------------------------------------------- */}
      <ul
        className="mx-auto mt-16 flex max-w-7xl flex-wrap items-center justify-center gap-3 border-t border-line-soft pt-8"
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
                  <Icon aria-hidden="true" className="h-4 w-4" />
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

      <p className="mono mt-8 text-center text-ink-mute">{LEGAL_LINE}</p>
    </footer>
  );
}
