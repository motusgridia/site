// /contact — how to reach the project.
// Spec: /site-ia.md § /contact/ — "Single form. Goes to hello@motusgridia.com
//       once Cloudflare Email Routing is live (Task 5)."
//       /email-setup-playbook.md § aliases (hello, press, invest, legal)
//       /site/CLAUDE.md § Anti-patterns (no drop shadows, mono caps, hex DNA)
//
// v0.2 renders the minimal channel list rather than a form:
//   - Cloudflare Email Routing hasn't shipped yet (SESSION-HANDOFF Task 5)
//   - Resend isn't wired for a second audience / inbound route
//   - A mailto: link degrades gracefully when either of those lands
//
// When email routing goes live + Resend contact-form wiring is ready, replace
// the "Channels" section with a client-island form that POSTs to
// /api/contact (new route, mirror /api/subscribe's Turnstile + Resend pattern).
// Spec'd but not yet implemented — the UI copy below ("mailto for now") will
// become "press send" at that point.

import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Motus Gridia — press, partnerships, investment, or just a question. Email hello@motusgridia.com or open an issue on the GitHub repo.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact · Motus Gridia",
    description:
      "Email hello@motusgridia.com. Or open an issue on the GitHub repo — the whole site is built in public.",
    url: "/contact",
  },
};

// ---------------------------------------------------------------------------
// Channel data — kept inline so a future form swap can delete the array
// without hunting through a module.
// ---------------------------------------------------------------------------

type Channel = {
  mono: string; // Mono-cap eyebrow label (always uppercase)
  name: string; // Display name
  href: string;
  description: string;
};

const CHANNELS: Channel[] = [
  {
    mono: "EMAIL · GENERAL",
    name: "hello@motusgridia.com",
    href: "mailto:hello@motusgridia.com",
    description:
      "Questions, corrections, interesting threads you want to pull on. Humans read it.",
  },
  {
    mono: "EMAIL · PRESS",
    name: "press@motusgridia.com",
    href: "mailto:press@motusgridia.com",
    description:
      "Press enquiries, interview requests, syndication. Brief replies are the norm.",
  },
  {
    mono: "EMAIL · INVEST / PARTNERS",
    name: "invest@motusgridia.com",
    href: "mailto:invest@motusgridia.com",
    description:
      "Collaborators, investors, people who can move the blueprint toward the first Grid.",
  },
  {
    mono: "GITHUB",
    name: "motusgridia/site",
    href: "https://github.com/motusgridia/site/issues",
    description:
      "Bugs, content corrections, typos. Open an issue — every fix ships as a visible commit.",
  },
];

// ---------------------------------------------------------------------------
// JSON-LD — ContactPage schema. Tells Google this URL is the canonical contact
// surface for the Motus Gridia organisation.
// ---------------------------------------------------------------------------

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact · Motus Gridia",
  url: "https://motusgridia.com/contact",
  about: {
    "@type": "Organization",
    name: "Motus Gridia",
    url: "https://motusgridia.com/",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "hello@motusgridia.com",
        availableLanguage: ["en-GB"],
      },
      {
        "@type": "ContactPoint",
        contactType: "press",
        email: "press@motusgridia.com",
        availableLanguage: ["en-GB"],
      },
      {
        "@type": "ContactPoint",
        contactType: "investor relations",
        email: "invest@motusgridia.com",
        availableLanguage: ["en-GB"],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <PageHeader
          eyebrow="Contact"
          title="Get in touch."
          deck="The project is small and the inbox is real. Pick the channel that fits — general notes, press, investment, or a GitHub issue for content corrections."
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* --- Main column: channels --- */}
          <div className="max-w-[60ch]">
            <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
              {CHANNELS.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      c.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="group flex flex-col gap-2 py-8 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)]"
                  >
                    <span className="mono text-accent-cyan">{c.mono}</span>
                    <span className="font-display text-h2 leading-tight tracking-[-0.02em] text-ink-primary transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] group-hover:text-accent-cyan">
                      {c.name}
                    </span>
                    <span className="text-body-sm leading-[1.55] text-ink-mute">
                      {c.description}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-12 text-body-sm leading-[1.55] text-ink-mute">
              <strong className="font-semibold text-ink-primary">
                Heads up —
              </strong>{" "}
              the mailto addresses route through Cloudflare Email Routing,
              which goes live once the domain is active. If a bounce comes
              back, try GitHub in the meantime. A proper form lands with
              v0.3.
            </p>
          </div>

          {/* --- Sidebar: everything else --- */}
          <aside className="flex flex-col gap-8 border-l border-line-soft pl-6 text-body-sm">
            <section>
              <h2 className="mono mb-4 text-accent-cyan">Newsletter</h2>
              <p className="leading-[1.55] text-ink-primary">
                Want the logs emailed as they land?
              </p>
              <Link
                href="/#newsletter-heading"
                className="mono-l mt-4 inline-block border border-accent-cyan px-4 py-2 text-accent-cyan transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:bg-accent-cyan hover:text-bg-deep"
              >
                Join the wall →
              </Link>
            </section>

            <section>
              <h2 className="mono mb-4 text-accent-cyan">Founder</h2>
              <p className="leading-[1.55] text-ink-primary">
                Shaan Khan — London.
              </p>
              <p className="mt-2 leading-[1.55] text-ink-mute">
                Designer, writer, builder. For anything that needs to reach
                him directly, the general address above lands in his inbox.
              </p>
            </section>

            <section>
              <h2 className="mono mb-4 text-accent-cyan">Response times</h2>
              <ul className="flex flex-col gap-2 text-ink-mute">
                <li>
                  <strong className="text-ink-primary">General —</strong> a
                  few days, usually.
                </li>
                <li>
                  <strong className="text-ink-primary">Press —</strong>{" "}
                  within 24h if time-sensitive.
                </li>
                <li>
                  <strong className="text-ink-primary">GitHub —</strong>{" "}
                  issues are triaged weekly.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mono mb-4 text-accent-cyan">Legal</h2>
              <p className="leading-[1.55] text-ink-mute">
                IP, trademark, or concept-protection enquiries go to{" "}
                <a
                  href="mailto:legal@motusgridia.com"
                  className="text-accent-cyan"
                >
                  legal@motusgridia.com
                </a>
                .
              </p>
            </section>
          </aside>
        </div>
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
