// Client-side fuzzy search + filter strip for /codex.
// Spec: /site-ia.md § Codex index (search by title/summary/tags + type + canon)
//       /stack-recommendation.md — Fuse.js (client-side fuzzy)
//
// Takes the pre-built Fuse search index as a prop so the heavy JSON is only
// shipped to browsers that render this route. No network round-trip.
//
// URL is the source of truth — query, type, and canon filters are synced to
// the URL search params so results are shareable.

"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { CanonBadge, CodexTypeBadge } from "@/app/components/CodexBadges";

// ---------------------------------------------------------------------------
// Types — kept in sync with /lib/schemas/content.ts
// ---------------------------------------------------------------------------

type CodexType =
  | "concept"
  | "infrastructure"
  | "technology"
  | "faction"
  | "character"
  | "place"
  | "event";
type Canon = "grounded" | "fiction-c1" | "fiction-c2";

type SearchEntry = {
  slug: string;
  title: string;
  type: CodexType;
  canon: Canon;
  tags: string[];
  summary: string;
  body: string;
};

type Props = {
  entries: SearchEntry[];
  typeCounts: Record<CodexType, number>;
};

// ---------------------------------------------------------------------------
// Chip lists
// ---------------------------------------------------------------------------

const TYPES: Array<{ value: CodexType; label: string }> = [
  { value: "concept", label: "Concepts" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "technology", label: "Technology" },
  { value: "faction", label: "Factions" },
  { value: "character", label: "Characters" },
  { value: "place", label: "Places" },
  { value: "event", label: "Events" },
];

const CANONS: Array<{ value: Canon; label: string }> = [
  { value: "grounded", label: "Grounded" },
  { value: "fiction-c1", label: "Fiction · C1" },
  { value: "fiction-c2", label: "Fiction · C2" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CodexSearch({ entries, typeCounts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputId = useId();

  const initialQuery = searchParams.get("q") ?? "";
  const initialType = (searchParams.get("type") ?? "") as CodexType | "";
  const initialCanon = (searchParams.get("canon") ?? "") as Canon | "";

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<CodexType | "">(initialType);
  const [canon, setCanon] = useState<Canon | "">(initialCanon);

  // Sync state → URL (debounced through requestAnimationFrame — avoid
  // scheduling a router push on every keystroke).
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (type) params.set("type", type);
      if (canon) params.set("canon", canon);
      const qs = params.toString();
      router.replace(qs ? `/codex?${qs}` : "/codex", { scroll: false });
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [query, type, canon, router]);

  // Build the Fuse instance once per entry-set change. `threshold` is
  // loose enough to catch typos ("honecomb"), tight enough to reject
  // "engineering" matching "environmental". `title` is weighted highest
  // so a title match always wins over a body match.
  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: [
          { name: "title", weight: 0.55 },
          { name: "summary", weight: 0.2 },
          { name: "tags", weight: 0.15 },
          { name: "body", weight: 0.1 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
      }),
    [entries],
  );

  const results = useMemo(() => {
    const filtered = entries.filter((e) => {
      if (type && e.type !== type) return false;
      if (canon && e.canon !== canon) return false;
      return true;
    });
    if (!query.trim()) return filtered;
    const hits = fuse.search(query).map((r) => r.item);
    return hits.filter((e) => {
      if (type && e.type !== type) return false;
      if (canon && e.canon !== canon) return false;
      return true;
    });
  }, [entries, fuse, query, type, canon]);

  const clear = useCallback(() => {
    setQuery("");
    setType("");
    setCanon("");
  }, []);

  return (
    <div className="flex flex-col gap-10">
      {/* Search + filters row --------------------------------------------- */}
      <div className="flex flex-col gap-6">
        <label htmlFor={searchInputId} className="sr-only">
          Search the codex
        </label>
        <input
          id={searchInputId}
          type="search"
          inputMode="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the codex — titles, summaries, tags…"
          className="w-full border border-line-soft bg-bg-panel px-4 py-3 font-body text-body-lg tracking-[0.01em] text-ink-primary placeholder:text-ink-mute focus-visible:border-accent-cyan focus-visible:outline-none"
        />

        {/* Type chips */}
        <div className="flex flex-col gap-3">
          <span className="mono text-ink-mute">Type</span>
          <div className="flex flex-wrap gap-2">
            <ChipButton
              active={!type}
              onClick={() => setType("")}
              label="All"
              count={Object.values(typeCounts).reduce((a, b) => a + b, 0)}
            />
            {TYPES.filter((t) => typeCounts[t.value] > 0).map((t) => (
              <ChipButton
                key={t.value}
                active={type === t.value}
                onClick={() => setType(t.value)}
                label={t.label}
                count={typeCounts[t.value]}
              />
            ))}
          </div>
        </div>

        {/* Canon chips */}
        <div className="flex flex-col gap-3">
          <span className="mono text-ink-mute">Canon</span>
          <div className="flex flex-wrap gap-2">
            <ChipButton
              active={!canon}
              onClick={() => setCanon("")}
              label="All"
            />
            {CANONS.map((c) => (
              <ChipButton
                key={c.value}
                active={canon === c.value}
                onClick={() => setCanon(c.value)}
                label={c.label}
              />
            ))}
          </div>
        </div>

        {(query || type || canon) && (
          <button
            type="button"
            onClick={clear}
            className="mono-l self-start border border-line-soft bg-bg-deep px-3 py-1.5 text-ink-mute hover:text-accent-cyan"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      <div
        className="mono text-ink-mute"
        role="status"
        aria-live="polite"
      >
        {results.length === 0
          ? "Nothing matches — try a broader query."
          : `${results.length} ${results.length === 1 ? "entry" : "entries"}`}
      </div>

      {/* Result grid */}
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((e) => (
          <li key={e.slug}>
            <Link
              href={`/codex/${e.slug}`}
              className="group flex h-full flex-col border border-line-soft bg-bg-panel p-6 transition-[box-shadow,border-color] duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:border-accent-cyan focus-visible:border-accent-cyan focus-visible:shadow-[inset_0_0_24px_var(--glow-cyan)] hover:shadow-[inset_0_0_24px_var(--glow-cyan)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <CodexTypeBadge type={e.type} />
                <CanonBadge canon={e.canon} />
              </div>
              <h3 className="mb-3 text-h2 font-display leading-tight tracking-[-0.02em] text-ink-primary transition-colors duration-[var(--duration-fast)] ease-[var(--ease-technical)] group-hover:text-accent-cyan">
                {e.title}
              </h3>
              <p className="mb-5 text-body-sm leading-[1.55] text-ink-mute">
                {e.summary}
              </p>
              {e.tags.length > 0 ? (
                <ul className="mt-auto flex flex-wrap gap-2">
                  {e.tags.slice(0, 3).map((tag) => (
                    <li
                      key={tag}
                      className="mono border border-line-soft bg-bg-deep px-2 py-1 text-[0.625rem] text-ink-mute"
                    >
                      {tag}
                    </li>
                  ))}
                  {e.tags.length > 3 ? (
                    <li className="mono px-2 py-1 text-[0.625rem] text-ink-mute">
                      +{e.tags.length - 3}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chip — button variant. Active state uses cyan fill + dark ink; inactive
// uses panel bg + mute ink. Matches the codex type chip aesthetic.
// ---------------------------------------------------------------------------

function ChipButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`mono-l border px-3 py-1.5 transition-[background-color,color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-technical)] ${
        active
          ? "border-accent-cyan bg-accent-cyan text-bg-deep"
          : "border-line-soft bg-bg-deep text-ink-mute hover:border-accent-cyan hover:text-accent-cyan"
      }`}
    >
      {label}
      {typeof count === "number" ? (
        <span
          className={`ml-2 text-[0.7em] ${
            active ? "text-bg-deep/80" : "text-ink-mute/70"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
