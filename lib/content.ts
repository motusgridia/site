// Server-only helpers for reading pre-built content and raw MDX.
// Spec references:
//   /site-ia.md                         — route map, frontmatter contracts
//   /content-build-script.md            — content-index.json shape
//   /site/CLAUDE.md § Content conventions
//
// Usage:
//   const idx = await getContentIndex();
//   const { frontmatter, body } = await getCodexEntry("honeycomb-architecture");
//
// Every getter is async for parity with streaming APIs, and so we can swap to a
// CDN-edge JSON fetch later without touching callers.
//
// This module is a server-only boundary. It reads from /site/public and from
// /site/content — both of which exist on disk at build time and at request
// time on Vercel. Client bundles must NEVER import this file; Next.js marks it
// unusable with the `server-only` sentinel below.

import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";

import type { ContentIndex } from "./schemas/content.js";
import {
  CodexFrontmatter,
  LogFrontmatter,
  ManifestoFrontmatter,
} from "./schemas/content.js";
import type {
  CodexFrontmatter as CodexFrontmatterT,
  LogFrontmatter as LogFrontmatterT,
  ManifestoFrontmatter as ManifestoFrontmatterT,
} from "./schemas/content.js";

// ---------------------------------------------------------------------------
// Paths — resolved relative to `process.cwd()` which on Vercel is the site
// root (the folder containing package.json). Locally `pnpm dev` also runs
// from the site root, so this works both places.
// ---------------------------------------------------------------------------

const SITE_ROOT = process.cwd();
const PUBLIC_DIR = join(SITE_ROOT, "public");
const CONTENT_ROOT = join(SITE_ROOT, "content");
const CONTENT_INDEX_PATH = join(PUBLIC_DIR, "content-index.json");

// ---------------------------------------------------------------------------
// Content index — cached across requests per Node module lifetime.
// Edge routes (OG images) would fall through to file-system fetch each time
// which is still fine; the content-index.json is ~50kb.
// ---------------------------------------------------------------------------

let contentIndexCache: ContentIndex | null = null;

export async function getContentIndex(): Promise<ContentIndex> {
  if (contentIndexCache) return contentIndexCache;
  try {
    const raw = await readFile(CONTENT_INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw) as ContentIndex;
    contentIndexCache = parsed;
    return parsed;
  } catch (err) {
    // If the index is missing, the build step was skipped. Return an empty
    // shell so /manifesto, /codex, /logs still render an empty-state page
    // rather than crashing. A missing index is still a build regression —
    // the smoke test in /scripts/post-deploy-smoke.ts guards against it.
    console.error(
      "[content] content-index.json unreadable — did `pnpm build:content` run?",
      err,
    );
    return {
      generated_at: new Date().toISOString(),
      counts: {
        manifesto: 0,
        codex: 0,
        logs: 0,
        by_codex_type: {
          concept: 0,
          infrastructure: 0,
          technology: 0,
          faction: 0,
          character: 0,
          place: 0,
          event: 0,
        },
        by_canon: { grounded: 0, "fiction-c1": 0, "fiction-c2": 0 },
      },
      manifesto: [],
      codex: [],
      logs: [],
      graph: { codex_in: {}, codex_out: {}, tag_to_codex: {} },
      search_index: { codex: [], manifesto: [], logs: [] },
    };
  }
}

// ---------------------------------------------------------------------------
// Entry readers — read raw MDX + frontmatter for a single entry.
// The /build-content-index.ts script validates frontmatter; we re-validate
// here so a stale content-index.json paired with a rewritten MDX file still
// gives a Zod-typed frontmatter at render time.
// ---------------------------------------------------------------------------

export type Entry<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  body: string;
};

async function loadEntry<TFrontmatter>(
  kind: "manifesto" | "codex" | "logs",
  slug: string,
  schema: { parse: (input: unknown) => TFrontmatter },
): Promise<Entry<TFrontmatter> | null> {
  const file = join(CONTENT_ROOT, kind, `${slug}.mdx`);
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  const frontmatter = schema.parse(data);
  return { slug, frontmatter, body: content };
}

export function getCodexEntry(
  slug: string,
): Promise<Entry<CodexFrontmatterT> | null> {
  return loadEntry("codex", slug, CodexFrontmatter);
}

export function getManifestoEntry(
  slug: string,
): Promise<Entry<ManifestoFrontmatterT> | null> {
  return loadEntry("manifesto", slug, ManifestoFrontmatter);
}

export function getLogEntry(
  slug: string,
): Promise<Entry<LogFrontmatterT> | null> {
  return loadEntry("logs", slug, LogFrontmatter);
}

// ---------------------------------------------------------------------------
// Cross-link lookups
// ---------------------------------------------------------------------------

/**
 * Slugs of codex entries that link INTO `slug` (reverse edges).
 * Ordered alphabetically for deterministic render output.
 */
export async function getBackLinks(slug: string): Promise<string[]> {
  const idx = await getContentIndex();
  return idx.graph.codex_in[slug] ?? [];
}

/**
 * Resolve a codex slug to its content-index record. Returns null if the slug
 * doesn't exist (e.g. a stub reference in MDX that hasn't been written yet).
 * UIs should render broken refs as plain text — matches the build script's
 * "warn, don't fail" policy.
 */
export async function getCodexIndexEntry(slug: string) {
  const idx = await getContentIndex();
  return idx.codex.find((e) => e.slug === slug) ?? null;
}

export async function getManifestoIndexEntry(slug: string) {
  const idx = await getContentIndex();
  return idx.manifesto.find((e) => e.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Static params helpers — consumed by `generateStaticParams` in dynamic routes.
// ---------------------------------------------------------------------------

export async function getAllCodexSlugs(): Promise<Array<{ slug: string }>> {
  const idx = await getContentIndex();
  return idx.codex.map((e) => ({ slug: e.slug }));
}

export async function getAllManifestoSlugs(): Promise<Array<{ slug: string }>> {
  const idx = await getContentIndex();
  return idx.manifesto.map((e) => ({ slug: e.slug }));
}

export async function getAllLogParams(): Promise<
  Array<{ year: string; slug: string }>
> {
  const idx = await getContentIndex();
  return idx.logs.map((e) => ({
    year: String(new Date(e.date).getUTCFullYear()),
    slug: e.slug,
  }));
}

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

/** Human-readable label for a codex type, used in UI chips. */
export const CODEX_TYPE_LABEL: Record<string, string> = {
  concept: "Concept",
  infrastructure: "Infrastructure",
  technology: "Technology",
  faction: "Faction",
  character: "Character",
  place: "Place",
  event: "Event",
};

/** Human-readable label for a canon flag. Amber for fiction. */
export const CANON_LABEL: Record<string, string> = {
  grounded: "Grounded",
  "fiction-c1": "Fiction · C1",
  "fiction-c2": "Fiction · C2",
};

/**
 * Canon → accent colour. Matches the amber fiction-flag convention in
 * /site/CLAUDE.md § Anti-patterns (fiction uses amber, grounded is cyan).
 */
export const CANON_ACCENT: Record<string, string> = {
  grounded: "cyan",
  "fiction-c1": "amber",
  "fiction-c2": "amber",
};
