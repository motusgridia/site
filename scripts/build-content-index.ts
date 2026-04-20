// Build script — generates /site/public/content-index.json from /content/*.mdx.
// Spec: /content-build-script.md § 4
//
// Pipeline:
//   1. Read every *.mdx under /content/{manifesto,codex,logs}/
//   2. Parse YAML frontmatter with gray-matter
//   3. Validate with the Zod schemas in /site/lib/schemas/content.ts
//   4. Drop drafts (draft: true) — logged, not indexed
//   5. Build cross-link graph (codex_in / codex_out / tag_to_codex)
//   6. Build Fuse search index with plain-text body excerpts
//   7. Write /site/public/content-index.json
//
// Validation policy (§ 7):
//   - Schema violation   → BUILD FAILS with a readable Zod error
//   - Broken cross-link  → WARN, continue (UI renders slug as plain text)
//   - Duplicate slug     → BUILD FAILS
//   - Draft              → SKIP with info log

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";
import matter from "gray-matter";
import {
  CodexFrontmatter,
  ManifestoFrontmatter,
  LogFrontmatter,
} from "../lib/schemas/content.js";
import type {
  Canon,
  CodexType,
  ContentIndex,
  FuseSearchEntry,
} from "../lib/schemas/content.js";

// ---------------------------------------------------------------------------
// Paths — resolve relative to this script file, not process.cwd()
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE_ROOT = join(__dirname, "..");
// Content lives inside the site repo (moved from /grid/content/ so Vercel
// can find it inside the build sandbox — the git repo boundary is /site/,
// not /grid/, so ../content/ is outside the checkout at deploy time).
const CONTENT_ROOT = join(SITE_ROOT, "content");
const PUBLIC_DIR = join(SITE_ROOT, "public");
const OUT = join(PUBLIC_DIR, "content-index.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Entry<TFrontmatter> = {
  slug: string;
  frontmatter: TFrontmatter;
  body: string;
  file: string;
};

// Any Zod schema with .parse — used as a constraint in loadEntries.
type ParserOf<T> = { parse: (input: unknown) => T };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadEntries<T>(
  dir: string,
  schema: ParserOf<T>,
  collection: string,
): Promise<Array<Entry<T>>> {
  const files = await fg("*.mdx", { cwd: dir, absolute: true });
  const entries: Array<Entry<T>> = [];
  const seen = new Set<string>();

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const { data, content } = matter(raw);
    const slug = basename(file).replace(/\.mdx$/, "");

    if (seen.has(slug)) {
      throw new Error(
        `[content-index] duplicate slug "${slug}" in ${collection}`,
      );
    }
    seen.add(slug);

    let parsed: T;
    try {
      parsed = schema.parse(data);
    } catch (err) {
      const relative = file.replace(SITE_ROOT + "/", "");
      console.error(
        `[content-index] schema violation in ${relative}:\n${formatZodError(err)}`,
      );
      throw err;
    }

    entries.push({ slug, frontmatter: parsed, body: content, file });
  }

  return entries;
}

function formatZodError(err: unknown): string {
  if (err && typeof err === "object" && "issues" in err) {
    const issues = (err as { issues: Array<{ path: Array<string | number>; message: string }> }).issues;
    return issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
  }
  return String(err);
}

function excerptBody(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/, "") // strip frontmatter if leaked
    .replace(/```[\s\S]*?```/g, "") // strip code fences
    .replace(/<[^>]+>/g, " ") // strip jsx / html
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // image → alt text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // link → link text
    .replace(/[#*_>`~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

type CodexEntry = Entry<ReturnType<typeof CodexFrontmatter.parse>>;

function buildGraph(codex: CodexEntry[]) {
  const codex_out: Record<string, string[]> = {};
  const codex_in: Record<string, string[]> = {};
  const tag_to_codex: Record<string, string[]> = {};

  for (const entry of codex) {
    codex_out[entry.slug] = [...entry.frontmatter.related_codex];
    for (const target of entry.frontmatter.related_codex) {
      (codex_in[target] ??= []).push(entry.slug);
    }
    for (const tag of entry.frontmatter.tags) {
      (tag_to_codex[tag] ??= []).push(entry.slug);
    }
  }

  // Deterministic ordering for a stable content-index.json across runs.
  for (const bucket of [codex_out, codex_in, tag_to_codex]) {
    for (const key of Object.keys(bucket)) {
      bucket[key]!.sort();
    }
  }

  return { codex_out, codex_in, tag_to_codex };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const start = Date.now();

  const [manifestoRaw, codexRaw, logsRaw] = await Promise.all([
    loadEntries(join(CONTENT_ROOT, "manifesto"), ManifestoFrontmatter, "manifesto"),
    loadEntries(join(CONTENT_ROOT, "codex"), CodexFrontmatter, "codex"),
    loadEntries(join(CONTENT_ROOT, "logs"), LogFrontmatter, "logs"),
  ]);

  const droppedDrafts: string[] = [];
  const keepPublished = <T extends { frontmatter: { draft: boolean } }>(
    entries: T[],
    collection: string,
  ): T[] =>
    entries.filter((e) => {
      if (e.frontmatter.draft) {
        droppedDrafts.push(`${collection}/${(e as unknown as { slug: string }).slug}`);
        return false;
      }
      return true;
    });

  const published = {
    manifesto: keepPublished(manifestoRaw, "manifesto"),
    codex: keepPublished(codexRaw, "codex"),
    logs: keepPublished(logsRaw, "logs"),
  };

  for (const skipped of droppedDrafts) {
    console.info(`[content-index] skipped (draft): ${skipped}`);
  }

  // Broken cross-link detection — warn, don't fail.
  const codexSlugs = new Set(published.codex.map((c) => c.slug));
  const manifestoSlugs = new Set(published.manifesto.map((m) => m.slug));
  const brokenLinks: Array<{ from: string; to: string; kind: string }> = [];

  for (const c of published.codex) {
    for (const ref of c.frontmatter.related_codex) {
      if (!codexSlugs.has(ref)) {
        brokenLinks.push({ from: `codex/${c.slug}`, to: ref, kind: "codex" });
      }
    }
  }
  for (const m of published.manifesto) {
    for (const ref of m.frontmatter.related_codex) {
      if (!codexSlugs.has(ref)) {
        brokenLinks.push({
          from: `manifesto/${m.slug}`,
          to: ref,
          kind: "codex",
        });
      }
    }
  }
  for (const l of published.logs) {
    for (const ref of l.frontmatter.related_codex) {
      if (!codexSlugs.has(ref)) {
        brokenLinks.push({ from: `logs/${l.slug}`, to: ref, kind: "codex" });
      }
    }
    for (const ref of l.frontmatter.related_manifesto) {
      if (!manifestoSlugs.has(ref)) {
        brokenLinks.push({
          from: `logs/${l.slug}`,
          to: ref,
          kind: "manifesto",
        });
      }
    }
  }

  for (const link of brokenLinks) {
    console.warn(
      `[content-index] broken ${link.kind} link: ${link.from} → ${link.to}`,
    );
  }

  const graph = buildGraph(published.codex);

  // Build by_codex_type / by_canon counts with every enum key present (zeros allowed).
  const by_codex_type: Record<CodexType, number> = {
    concept: 0,
    infrastructure: 0,
    technology: 0,
    faction: 0,
    character: 0,
    place: 0,
    event: 0,
  };
  const by_canon: Record<Canon, number> = {
    grounded: 0,
    "fiction-c1": 0,
    "fiction-c2": 0,
  };
  for (const c of published.codex) {
    by_codex_type[c.frontmatter.type]++;
    by_canon[c.frontmatter.canon]++;
  }

  const codexSearch: FuseSearchEntry[] = published.codex.map((e) => ({
    slug: e.slug,
    title: e.frontmatter.title,
    type: e.frontmatter.type,
    canon: e.frontmatter.canon,
    tags: e.frontmatter.tags,
    body: excerptBody(e.body),
  }));

  const manifestoSearch: FuseSearchEntry[] = published.manifesto.map((e) => ({
    slug: e.slug,
    title: e.frontmatter.title,
    body: excerptBody(e.body),
  }));

  const logsSearch: FuseSearchEntry[] = published.logs.map((e) => ({
    slug: e.slug,
    title: e.frontmatter.title,
    canon: e.frontmatter.canon,
    tags: e.frontmatter.tags,
    body: excerptBody(e.body),
  }));

  const index: ContentIndex = {
    generated_at: new Date().toISOString(),
    counts: {
      manifesto: published.manifesto.length,
      codex: published.codex.length,
      logs: published.logs.length,
      by_codex_type,
      by_canon,
    },
    manifesto: published.manifesto
      .slice()
      .sort((a, b) => a.frontmatter.order - b.frontmatter.order)
      .map((e) => ({
        slug: e.slug,
        title: e.frontmatter.title,
        section: e.frontmatter.section,
        summary: e.frontmatter.summary,
        related_codex: e.frontmatter.related_codex,
        order: e.frontmatter.order,
      })),
    codex: published.codex
      .slice()
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((e) => ({
        slug: e.slug,
        title: e.frontmatter.title,
        type: e.frontmatter.type,
        canon: e.frontmatter.canon,
        tags: e.frontmatter.tags,
        related_codex: e.frontmatter.related_codex,
        first_seen_log: e.frontmatter.first_seen_log ?? null,
        summary: e.frontmatter.summary,
        hero_image: e.frontmatter.hero_image ?? null,
        hero_3d: e.frontmatter.hero_3d ?? null,
        tonal_mode: e.frontmatter.tonal_mode ?? null,
      })),
    logs: published.logs
      .slice()
      .sort(
        (a, b) =>
          b.frontmatter.date.getTime() - a.frontmatter.date.getTime(),
      )
      .map((e) => ({
        slug: e.slug,
        title: e.frontmatter.title,
        date: e.frontmatter.date.toISOString(),
        canon: e.frontmatter.canon,
        tags: e.frontmatter.tags,
        related_codex: e.frontmatter.related_codex,
        related_manifesto: e.frontmatter.related_manifesto,
        excerpt: e.frontmatter.excerpt,
        cover_image: e.frontmatter.cover_image ?? null,
      })),
    graph,
    search_index: {
      codex: codexSearch,
      manifesto: manifestoSearch,
      logs: logsSearch,
    },
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUT, JSON.stringify(index, null, 2), "utf8");

  const duration = Date.now() - start;
  console.log(
    `[content-index] wrote ${OUT.replace(SITE_ROOT + "/", "")}`,
  );
  console.log(
    `[content-index]   ${index.counts.manifesto} manifesto, ${index.counts.codex} codex, ${index.counts.logs} logs — ${duration}ms`,
  );
  if (brokenLinks.length > 0) {
    console.warn(
      `[content-index]   ${brokenLinks.length} broken cross-link(s) — UI will render as plain text`,
    );
  }
}

main().catch((err) => {
  console.error("[content-index] build failed.");
  if (!(err && typeof err === "object" && "issues" in err)) {
    console.error(err);
  }
  process.exit(1);
});
