// Zod schemas for MotusGridia content.
// Spec: /content-build-script.md § 2
// Every MDX file in /content/{manifesto,codex,logs}/*.mdx is validated against
// one of these at build time by /site/scripts/build-content-index.ts.
// Schema violations fail the Next.js build.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const Canon = z.enum(["grounded", "fiction-c1", "fiction-c2"]);
export type Canon = z.infer<typeof Canon>;

export const CodexType = z.enum([
  "concept",
  "infrastructure",
  "technology",
  "faction",
  "character",
  "place",
  "event",
]);
export type CodexType = z.infer<typeof CodexType>;

// A slug is lowercase, kebab-case, ASCII only. Used for filenames and URLs.
export const Slug = z.string().regex(/^[a-z0-9-]+$/, {
  message: "slug must be lowercase kebab-case (a-z, 0-9, -)",
});
export type Slug = z.infer<typeof Slug>;

// ---------------------------------------------------------------------------
// Codex frontmatter
// ---------------------------------------------------------------------------

export const CodexFrontmatter = z.object({
  title: z.string().min(1).max(120),
  type: CodexType,
  canon: Canon,
  tags: z.array(z.string().min(1)).min(1).max(12),
  related_codex: z.array(Slug).default([]),
  // Slug of first log that mentions this entry. Optional — set once the log lands.
  first_seen_log: z.string().nullable().optional(),
  summary: z.string().min(40).max(240),
  hero_image: z.string().startsWith("/").optional().nullable(),
  hero_3d: z
    .string()
    .startsWith("/")
    .endsWith(".glb")
    .optional()
    .nullable(),
  // Overrides per-entry accent palette. See visual-identity.md § Tonal modes.
  tonal_mode: z.string().optional().nullable(),
  draft: z.boolean().default(false),
});

export type CodexFrontmatter = z.infer<typeof CodexFrontmatter>;

// ---------------------------------------------------------------------------
// Manifesto frontmatter
// ---------------------------------------------------------------------------

// Section reference — points into the master content doc.
// Accepts a single section ("1.1", "2.13", "4.3") OR a composite for essays
// that merge multiple master-doc sections ("1.4 + 4.3", "1.4+4.3").
const ManifestoSection = z.string().regex(
  /^\d+(\.\d+)*(\s*\+\s*\d+(\.\d+)*)*$/,
  {
    message:
      'section must be a section number (e.g. "1.1", "2.13") or a composite ("1.4 + 4.3")',
  },
);

export const ManifestoFrontmatter = z.object({
  title: z.string().min(1).max(120),
  slug: Slug,
  section: ManifestoSection,
  summary: z.string().min(40).max(200),
  related_codex: z.array(Slug).default([]),
  // Display order in /manifesto nav
  order: z.number().int().positive(),
  draft: z.boolean().default(false),
  // Optional — which codex scene to render as this manifesto's 3D hero.
  // Manifesto entries are grounded-canon prose about Grid concepts; each
  // has a codex counterpart whose scene most cleanly illustrates the
  // idea. Omit for a prose-only page.
  hero_scene_slug: Slug.optional(),
});

export type ManifestoFrontmatter = z.infer<typeof ManifestoFrontmatter>;

// ---------------------------------------------------------------------------
// Logs frontmatter
// ---------------------------------------------------------------------------

export const LogFrontmatter = z.object({
  title: z.string().min(1).max(140),
  // ISO 8601 date — z.coerce.date() accepts strings from YAML
  date: z.coerce.date(),
  // Most logs are grounded. Fiction logs get a fiction-c* canon so the tonal
  // mode on the page picks up the right accent palette.
  canon: Canon.default("grounded"),
  tags: z.array(z.string().min(1)).max(12).default([]),
  related_codex: z.array(Slug).default([]),
  related_manifesto: z.array(Slug).default([]),
  excerpt: z.string().min(40).max(240),
  cover_image: z.string().startsWith("/").optional().nullable(),
  // Optional — which codex scene to render as the log's 3D hero. Same
  // contract as ManifestoFrontmatter.hero_scene_slug. Omit for a
  // prose-only entry.
  hero_scene_slug: Slug.optional(),
  draft: z.boolean().default(false),
});

export type LogFrontmatter = z.infer<typeof LogFrontmatter>;

// ---------------------------------------------------------------------------
// Output — /public/content-index.json
// ---------------------------------------------------------------------------
//
// Consumed by:
//   - client search (Fuse.js over the search_index.* arrays)
//   - related-codex widget (server component reads graph.codex_{in,out})
//   - sitemap + RSS (deferred to v0.2/v0.3)

export type FuseSearchEntry = {
  slug: string;
  title: string;
  type?: CodexType;
  canon?: Canon;
  tags?: string[];
  // Plain text, first 1200 chars.
  body: string;
};

export type ContentIndex = {
  generated_at: string; // ISO 8601
  counts: {
    manifesto: number;
    codex: number;
    logs: number;
    by_codex_type: Record<CodexType, number>;
    by_canon: Record<Canon, number>;
  };
  manifesto: Array<{
    slug: string;
    title: string;
    section: string;
    summary: string;
    related_codex: string[];
    order: number;
  }>;
  codex: Array<{
    slug: string;
    title: string;
    type: CodexType;
    canon: Canon;
    tags: string[];
    related_codex: string[];
    first_seen_log: string | null;
    summary: string;
    hero_image: string | null;
    hero_3d: string | null;
    tonal_mode: string | null;
  }>;
  logs: Array<{
    slug: string;
    title: string;
    date: string; // ISO
    canon: Canon;
    tags: string[];
    related_codex: string[];
    related_manifesto: string[];
    excerpt: string;
    cover_image: string | null;
  }>;
  graph: {
    // slug → slugs that link TO this codex entry (reverse edges)
    codex_in: Record<string, string[]>;
    // slug → slugs this entry links OUT to (forward edges)
    codex_out: Record<string, string[]>;
    // tag → codex slugs carrying that tag
    tag_to_codex: Record<string, string[]>;
  };
  search_index: {
    codex: FuseSearchEntry[];
    manifesto: FuseSearchEntry[];
    logs: FuseSearchEntry[];
  };
};
