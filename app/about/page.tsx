// /about — who's building this, why, what to expect.
// Spec: /site-ia.md § About
//
// Short, warm, built-in-public register. No author photo (per /site/CLAUDE.md
// § Anti-patterns — no stock photo, no AI-generated face). Text-only with a
// hex-framed pull quote and a rail linking to the manifesto opener.

import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";

export const metadata: Metadata = {
  title: "About",
  description:
    "Motus Gridia is a blueprint for a near-future society — and a movement, a codex, and a diary being written in real time by Shaan Khan.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · Motus Gridia",
    description:
      "Motus Gridia is a blueprint for a near-future society — built in public.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <PageHeader
          eyebrow="About"
          title="A blueprint, a movement, and a diary."
          deck="Motus Gridia is a near-future societal blueprint — a honeycomb of self-governing communities called Grids, bound by a minimum shared law and connected by technology that does the quiet work of keeping everyone free to stay, leave, or try something new."
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="max-w-[68ch] font-body text-body-lg leading-[1.7] text-ink-primary">
            <p className="mb-6">
              It started as a private note. It became a vision document, then
              a codex, then a diary, then a site. The project is built in
              public: every concept lives as an MDX file in a git repository
              anyone can read, the logs are published as they&rsquo;re
              written, and every piece of the system links back to every
              other.
            </p>

            <p className="mb-6">
              There is no company yet. There is no first Grid yet. There is a
              blueprint, a growing codex, and a founder named Shaan Khan.
              That is the work.
            </p>

            <h2 className="mt-16 mb-5 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary">
              What you&rsquo;ll find here
            </h2>

            <ul className="mb-6 flex list-none flex-col gap-2 pl-0">
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                <strong className="font-semibold">
                  <Link href="/manifesto">Manifesto</Link>
                </strong>{" "}
                — the blueprint, chapter by chapter.
              </li>
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                <strong className="font-semibold">
                  <Link href="/codex">Codex</Link>
                </strong>{" "}
                — every concept, faction, place and technology, indexed.
              </li>
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                <strong className="font-semibold">
                  <Link href="/logs">Logs</Link>
                </strong>{" "}
                — the build, written as it happens.
              </li>
            </ul>

            <p className="mb-6">
              The <em>codex</em> is the game-style database. The{" "}
              <em>manifesto</em> is the long-form argument. The{" "}
              <em>logs</em> are the dispatches. Everything links to
              everything else.
            </p>

            <h2 className="mt-16 mb-5 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary">
              Two canons
            </h2>

            <p className="mb-6">
              Most of what you&rsquo;ll read is <em>grounded</em> — the
              practical blueprint, the arguments, the working ideas. A
              smaller set is <em>fiction</em> — two speculative timelines
              (C1 and C2) where the blueprint meets its edge cases. Fiction
              entries carry an amber flag so you always know which register
              you&rsquo;re in.
            </p>

            <blockquote className="my-8 border-l-2 border-accent-cyan pl-6 text-body-lg italic leading-[1.7] text-ink-primary/90">
              One day the first Grid gets built — on this planet or another
              — and everyone stands in awe of it and wants to live inside
              one. The desire runs so strong that the first becomes the
              second, the second becomes the tenth, and a network of Grids
              ends up covering a planet.
            </blockquote>

            <h2 className="mt-16 mb-5 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary">
              Why now
            </h2>

            <p className="mb-6">
              Because the current model is visibly tired. Because
              protesting without offering anything is impotent. Because
              tradition only advances by &ldquo;alien leaps.&rdquo; Because
              the question <em>what kind of society do you actually want to
              wake up in?</em> deserves a real answer, in public, written
              down, and argued about.
            </p>

            <p>
              If any of that lands,{" "}
              <Link href="/#newsletter-heading">join the wall</Link>. One
              email, whenever there&rsquo;s something worth reading.
            </p>
          </article>

          <aside className="flex flex-col gap-8 border-l border-line-soft pl-6 text-body-sm">
            <section>
              <h2 className="mono mb-4 text-accent-cyan">Founder</h2>
              <p className="text-body-sm leading-[1.55] text-ink-primary">
                Shaan Khan — London. Designer, writer, builder. All concepts
                © the author.
              </p>
            </section>
            <section>
              <h2 className="mono mb-4 text-accent-cyan">Start here</h2>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/manifesto/one-line"
                    className="text-ink-primary hover:text-accent-cyan"
                  >
                    One-line definition →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/manifesto/vision"
                    className="text-ink-primary hover:text-accent-cyan"
                  >
                    Vision statement →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/manifesto/optionism"
                    className="text-ink-primary hover:text-accent-cyan"
                  >
                    Optionism →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/codex/honeycomb-architecture"
                    className="text-ink-primary hover:text-accent-cyan"
                  >
                    Honeycomb Architecture →
                  </Link>
                </li>
              </ul>
            </section>
            <section>
              <h2 className="mono mb-4 text-accent-cyan">Get in touch</h2>
              <p className="text-body-sm leading-[1.55] text-ink-mute">
                Questions, press, partnerships,{" "}
                <Link href="/contact" className="text-accent-cyan">
                  contact page
                </Link>
                .
              </p>
            </section>
          </aside>
        </div>
      </div>

      <Footer />
    </>
  );
}
