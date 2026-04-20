// Primary site navigation.
// Spec: /site-ia.md — "MOTUSGRIDIA [wordmark] — Manifesto · Codex · Logs · About"
//       /site/CLAUDE.md § Component rules (hex DNA, mono labels, 1px lines)
//
// Rendered inside the root layout so every route gets the same nav shell.
// Server component — no interactivity. If we later want an open/close mobile
// drawer we can hydrate a small client island; for v0.2 the nav is a single
// horizontal row that collapses to a tighter mono label row on narrow screens.

import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

// Order locked by site-ia.md. Lore / Join / Events / Invest are deferred to
// v0.3+, so they aren't linked. When they ship, add them here.
const ITEMS: NavItem[] = [
  { href: "/manifesto", label: "Manifesto" },
  { href: "/codex", label: "Codex" },
  { href: "/logs", label: "Logs" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-line-soft bg-bg-deep/90 backdrop-blur supports-[backdrop-filter]:bg-bg-deep/70"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        {/* Wordmark — always "Motus Gridia" in mono caps, small and
            understated. The big wordmark belongs to the landing hero, not
            the persistent nav. */}
        <Link
          href="/"
          className="mono-l text-ink-primary hover:text-accent-cyan"
          aria-label="Motus Gridia — home"
        >
          Motus Gridia
        </Link>

        {/* Desktop nav — horizontal row, centred interpuncts between items
            implemented with CSS `::before` so we don't emit stray dots in
            the DOM for screen readers. */}
        <ul className="flex items-center gap-5 sm:gap-7">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="mono text-ink-mute transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:text-accent-cyan"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
