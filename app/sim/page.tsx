// /sim — The Sim: public call for game-dev collaborators.
//
// Spec: strategic brief from the author (session 6) defining The Sim as a 3D
//       MMO simulation of the Grid, shipped as one software product with two
//       modes: a grounded simulation for stress-testing the blueprint, and a
//       video-game mode with fictional story elements. Primary page goal is
//       recruiting game developers — everything on the page funnels toward
//       getting the right people in touch.
//
// Writing rules (locked by the author, sessions 6–7):
//   - Non-fiction page — em dashes sparingly. Prefer full stops and punchier
//     sentences. (Fiction codex entries get the unrestricted dash budget;
//     this page is a strategic brief, not fiction.)
//   - No dramatic / overly poetic language. Clear, direct, to the point.
//   - Explain what is core concept vs what is status-right-now explicitly.
//
// Server component. No client JS on this page (the CTAs are plain anchors).

import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/app/components/Footer";
import { PageHeader } from "@/app/components/PageHeader";

export const metadata: Metadata = {
  title: "The Sim",
  description:
    "A 3D MMO simulation of the Grid. One software product, two modes: grounded simulation and video-game. Looking for game developers.",
  alternates: { canonical: "/sim" },
  openGraph: {
    title: "The Sim · Motus Gridia",
    description:
      "A 3D MMO simulation of the Grid. Looking for game developers.",
    url: "/sim",
  },
};

export default function SimPage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
        <PageHeader
          eyebrow="Project"
          title="The Sim"
          deck="A 3D MMO simulation of the Grid. One software product, two modes. Users pick which mode they want to enter."
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="max-w-[68ch] font-body text-body-lg leading-[1.7] text-ink-primary">
            <p className="mb-6">
              The Sim is a 3D online world where the Grid runs as a working
              MMO simulation. The underlying system is the same in both
              modes. What changes is the framing and what the user is there
              to do.
            </p>

            <h2 className="mt-16 mb-5 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary">
              Grounded Sim
            </h2>
            <p className="mb-6">
              The grounded mode runs the Grid as designed. Infrastructure,
              governance, production, day-to-day life. No plot. No arc.
              The system runs and the user interacts with it.
            </p>
            <p className="mb-6">
              The point of the grounded sim is to put the blueprint under
              pressure. If the design has flaws, they show up when a large
              number of real people use it. The sim is how those flaws get
              found before a real Grid gets built.
            </p>

            <h2 className="mt-16 mb-5 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary">
              Video Game
            </h2>
            <p className="mb-6">
              The video-game mode runs on the same underlying system, with
              narrative layers on top. Characters, factions, events from
              the Grid fictional canon. Players can follow scripted stories
              or emergent ones, inside a society that runs on real Grid
              rules.
            </p>
            <p className="mb-6">
              This mode exists so the Grid concept stays active in culture
              and keeps motivating people to push for a real one.
            </p>

            <h2 className="mt-16 mb-5 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary">
              Why both under one product
            </h2>
            <p className="mb-6">
              Building the sim and the game separately would duplicate the
              hardest part twice: the simulation of a working Grid. Building
              them as one product with two entry points means one engine,
              one world, one economy, and two audiences. The grounded side
              keeps the game honest. The game side keeps the grounded side
              funded and relevant.
            </p>

            <h2 className="mt-16 mb-5 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary">
              Current status
            </h2>
            <p className="mb-6">
              Pre-production. The software does not exist yet. The design
              is in active development. This page is the first public call
              for collaborators.
            </p>

            <h2 className="mt-16 mb-5 text-h1 font-display leading-tight tracking-[-0.02em] text-ink-primary">
              Developers wanted
            </h2>
            <p className="mb-6">
              We are looking for game developers who can help build The Sim.
              Experience that is most useful:
            </p>
            <ul className="mb-6 flex list-none flex-col gap-2 pl-0">
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                MMO infrastructure, netcode, server architecture
              </li>
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                Simulation engines, economic and social models
              </li>
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                Procedural generation, world-building tools
              </li>
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                Narrative engines, scripting systems
              </li>
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                3D art, environment design, character design
              </li>
              <li className="relative pl-6 text-body-lg leading-[1.7] text-ink-primary before:absolute before:left-0 before:top-[0.9em] before:block before:h-px before:w-3 before:bg-accent-cyan/60">
                Playtesting, balancing, accessibility
              </li>
            </ul>
            <p className="mb-10">
              If you can help with any of the above, get in touch. Open an
              issue on the GitHub org with a short note on what you can
              contribute, or use the contact page.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/motusgridia"
                target="_blank"
                rel="noopener noreferrer"
                className="mono-l inline-block border border-accent-cyan/60 px-8 py-4 text-accent-cyan transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:border-accent-cyan hover:bg-accent-cyan/10"
              >
                GitHub →
              </a>
              <Link
                href="/contact"
                className="mono-l inline-block border border-accent-cyan/60 px-8 py-4 text-accent-cyan transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:border-accent-cyan hover:bg-accent-cyan/10"
              >
                Contact →
              </Link>
            </div>
          </article>

          <aside className="flex flex-col gap-8 border-l border-line-soft pl-6 text-body-sm">
            <section>
              <h2 className="mono mb-4 text-accent-cyan">Status</h2>
              <p className="text-body-sm leading-[1.55] text-ink-primary">
                Pre-production. Recruiting collaborators.
              </p>
            </section>
            <section>
              <h2 className="mono mb-4 text-accent-cyan">One product</h2>
              <p className="text-body-sm leading-[1.55] text-ink-primary">
                Grounded sim and video-game mode share the same engine,
                world, and economy.
              </p>
            </section>
            <section>
              <h2 className="mono mb-4 text-accent-cyan">Who we need</h2>
              <ul className="flex flex-col gap-2">
                <li className="text-ink-primary">Game developers</li>
                <li className="text-ink-primary">Simulation engineers</li>
                <li className="text-ink-primary">3D artists</li>
                <li className="text-ink-primary">Narrative designers</li>
                <li className="text-ink-primary">World builders</li>
              </ul>
            </section>
            <section>
              <h2 className="mono mb-4 text-accent-cyan">Context</h2>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/manifesto"
                    className="text-ink-primary hover:text-accent-cyan"
                  >
                    The blueprint →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/codex"
                    className="text-ink-primary hover:text-accent-cyan"
                  >
                    Codex →
                  </Link>
                </li>
                <li>
                  <Link
                    href="/logs"
                    className="text-ink-primary hover:text-accent-cyan"
                  >
                    Logs →
                  </Link>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>

      <Footer />
    </>
  );
}
