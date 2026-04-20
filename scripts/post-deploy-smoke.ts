// Post-deploy smoke test for motusgridia.com.
//
// Catches the class of bugs where endpoints return 200 with a broken body —
// the most expensive example being the OG-empty-body regression from session
// 4h: Satori (inside next/og) silently returned 200 + content-length: 0 when
// the Fraunces fetch served woff2, because ImageResponse's error handling
// wraps render failures into empty PNG responses rather than 5xx. A basic
// `curl -I` check would have missed it; this script downloads bodies and
// asserts on their actual content.
//
// Every check validates *both* the response status *and* a content invariant
// specific to the endpoint (PNG magic bytes, XML parseability, expected
// substrings, redirect destination, etc.) — so a 200-with-garbage fails fast.
//
// Usage:
//   pnpm tsx scripts/post-deploy-smoke.ts                        # against prod
//   pnpm tsx scripts/post-deploy-smoke.ts http://localhost:3000  # against local dev
//
// Exit code:
//   0 — every check passed, safe to consider the deploy verified
//   1 — one or more checks failed, deploy has a regression
//
// Deliberately zero-dependency: uses Node 20+ built-in `fetch`, no pnpm
// install needed to run in a clean environment (e.g. a fresh CI runner or
// a machine without `node_modules/`).

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckResult = { ok: boolean; detail?: string };
type Check = {
  name: string;
  run: (base: string) => Promise<CheckResult>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Append a cache-bust query string so Vercel's edge cache doesn't serve us
 * a stale (possibly broken) response from a prior deploy. Every check uses
 * this — it's cheap and it's the whole point of a post-deploy verification.
 */
const bust = () => `?_smoke=${Date.now().toString(36)}`;

/**
 * PNG magic header bytes: 89 50 4E 47 0D 0A 1A 0A.
 * Confirms the response body is actually a PNG, not 0 bytes or an HTML
 * error page that happens to claim content-type: image/png.
 */
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function hasPngMagic(buf: Uint8Array): boolean {
  if (buf.length < PNG_MAGIC.length) return false;
  return PNG_MAGIC.every((b, i) => buf[i] === b);
}

/**
 * Read PNG width/height from the IHDR chunk.
 * IHDR always starts at byte offset 16 (8 magic + 4 length + 4 "IHDR"),
 * width is at offset 16, height at offset 20, both big-endian u32.
 *
 * Implemented with direct byte reads rather than DataView to avoid
 * ArrayBufferLike / SharedArrayBuffer type friction under strict TS —
 * DataView's constructor signature has wobbled between lib versions.
 */
function readPngDims(buf: Uint8Array): [number, number] | null {
  if (!hasPngMagic(buf) || buf.length < 24) return null;
  const u32be = (o: number): number =>
    // Each indexed access is `number | undefined` under noUncheckedIndexedAccess;
    // `!` is safe because of the length guard above, and the `>>> 0` coerces
    // any accidental negative intermediate into an unsigned result.
    (((buf[o]! << 24) |
      (buf[o + 1]! << 16) |
      (buf[o + 2]! << 8) |
      buf[o + 3]!) >>>
      0);
  return [u32be(16), u32be(20)];
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

/**
 * Home page renders HTML containing the wordmark + hero copy. Protects
 * against regressions that break SSR or swap the body for a loading shell.
 */
async function checkHome(base: string): Promise<CheckResult> {
  const res = await fetch(`${base}/${bust()}`);
  if (res.status !== 200) return { ok: false, detail: `status ${res.status}` };
  const html = await res.text();
  if (!html.includes("MOTVSGRIDIA"))
    return { ok: false, detail: "wordmark MOTVSGRIDIA not found in HTML" };
  if (!html.includes('property="og:image"'))
    return { ok: false, detail: "og:image meta tag missing" };
  if (!html.includes('rel="canonical"'))
    return { ok: false, detail: "canonical link missing" };
  return { ok: true, detail: `${html.length} bytes` };
}

/**
 * Dynamic PNG endpoint check. `expectedDims` guards against someone
 * accidentally swapping the route's `export const size` and shipping a
 * wrong-aspect-ratio social card (which would still render, but would look
 * broken on Bluesky/Twitter previews).
 */
function pngCheck(
  path: string,
  expectedDims: [number, number],
  minBytes: number,
): Check["run"] {
  return async (base) => {
    const res = await fetch(`${base}${path}${bust()}`);
    if (res.status !== 200)
      return { ok: false, detail: `status ${res.status}` };
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/png"))
      return { ok: false, detail: `content-type ${ct}` };
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length < minBytes)
      return {
        ok: false,
        detail: `body only ${buf.length} bytes (expected ≥${minBytes}) — likely the Satori empty-render failure mode`,
      };
    if (!hasPngMagic(buf))
      return { ok: false, detail: "missing PNG magic bytes" };
    const dims = readPngDims(buf);
    if (!dims) return { ok: false, detail: "could not read IHDR" };
    if (dims[0] !== expectedDims[0] || dims[1] !== expectedDims[1])
      return {
        ok: false,
        detail: `dims ${dims[0]}×${dims[1]} (expected ${expectedDims[0]}×${expectedDims[1]})`,
      };
    return { ok: true, detail: `${buf.length} bytes, ${dims[0]}×${dims[1]}` };
  };
}

async function checkRobots(base: string): Promise<CheckResult> {
  const res = await fetch(`${base}/robots.txt${bust()}`);
  if (res.status !== 200) return { ok: false, detail: `status ${res.status}` };
  const body = await res.text();
  if (!/^User-Agent:\s*\*/m.test(body))
    return { ok: false, detail: "missing User-Agent: * directive" };
  if (!/^Disallow:\s*\/api\//m.test(body))
    return { ok: false, detail: "/api/ not disallowed — PII leak risk" };
  if (!body.includes("Sitemap:"))
    return { ok: false, detail: "Sitemap: line missing" };
  return { ok: true };
}

async function checkSitemap(base: string): Promise<CheckResult> {
  const res = await fetch(`${base}/sitemap.xml${bust()}`);
  if (res.status !== 200) return { ok: false, detail: `status ${res.status}` };
  const body = await res.text();
  if (!body.startsWith("<?xml"))
    return { ok: false, detail: "not an XML document" };
  if (!body.includes("<urlset"))
    return { ok: false, detail: "missing <urlset> element" };
  // Must include the apex home URL. Catches regressions where the sitemap
  // points at the preview deployment or the www subdomain instead.
  if (!body.includes("<loc>https://motusgridia.com/</loc>"))
    return { ok: false, detail: "apex home URL missing from sitemap" };
  return { ok: true };
}

/**
 * The /api/subscribe route MUST degrade gracefully when RESEND_* env vars
 * are missing — returning 503, not crashing the edge function. This guards
 * against a regression where the route starts throwing 500s on cold-start.
 *
 * Once RESEND_* is wired, the expected status changes to 400 (for an empty
 * body) or 200 (for a valid body). Update this check when that lands.
 */
async function checkSubscribeDegraded(base: string): Promise<CheckResult> {
  const res = await fetch(`${base}/api/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  if (res.status === 503) return { ok: true, detail: "503 as expected" };
  if (res.status === 400 || res.status === 200)
    return {
      ok: true,
      detail: `${res.status} — RESEND_* appears wired now; update this check`,
    };
  return {
    ok: false,
    detail: `unexpected status ${res.status} (expected 503 pre-Resend, 400/200 post-Resend)`,
  };
}

/**
 * www.motusgridia.com must 308-redirect to the apex. Catches the class
 * of regression where the redirect flips direction (apex → www) or where
 * someone accidentally sets it to 307/302 (non-permanent → search engines
 * can keep both URLs indexed).
 *
 * Only runs against the production host — skipped for localhost since
 * there's no www-equivalent there.
 */
async function checkWwwRedirect(base: string): Promise<CheckResult> {
  if (!base.includes("motusgridia.com"))
    return { ok: true, detail: "skipped (local)" };
  const res = await fetch("https://www.motusgridia.com/", {
    redirect: "manual",
  });
  if (res.status !== 308)
    return { ok: false, detail: `status ${res.status} (expected 308)` };
  const loc = res.headers.get("location") ?? "";
  if (!loc.startsWith("https://motusgridia.com"))
    return { ok: false, detail: `redirect target ${loc}` };
  return { ok: true, detail: `308 → ${loc}` };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const CHECKS: Check[] = [
  { name: "GET /              (HTML + wordmark + meta)", run: checkHome },
  {
    name: "GET /opengraph-image (1200×630 PNG, real body)",
    // 40KB min — a healthy render is ~150KB; a 0-byte empty body is the
    // thing we're specifically guarding against.
    run: pngCheck("/opengraph-image", [1200, 630], 40_000),
  },
  {
    name: "GET /icon            (32×32 PNG)",
    run: pngCheck("/icon", [32, 32], 200),
  },
  {
    name: "GET /apple-icon      (180×180 PNG)",
    run: pngCheck("/apple-icon", [180, 180], 500),
  },
  { name: "GET /robots.txt      (valid directives)", run: checkRobots },
  { name: "GET /sitemap.xml     (apex URL indexed)", run: checkSitemap },
  {
    name: "POST /api/subscribe  (graceful 503 pre-Resend)",
    run: checkSubscribeDegraded,
  },
  {
    name: "GET www → apex       (308 permanent redirect)",
    run: checkWwwRedirect,
  },
];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function main() {
  const base = (process.argv[2] ?? "https://motusgridia.com").replace(/\/$/, "");
  console.log(`Post-deploy smoke test — ${base}\n`);

  const results = await Promise.all(
    CHECKS.map(async (c) => {
      try {
        const r = await c.run(base);
        return { name: c.name, ...r };
      } catch (err) {
        return {
          name: c.name,
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  for (const r of results) {
    const mark = r.ok ? "\u001b[32m✓\u001b[0m" : "\u001b[31m✗\u001b[0m";
    const detail = r.detail ? `  — ${r.detail}` : "";
    console.log(`  ${mark}  ${r.name}${detail}`);
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${passed}/${total} checks passed`);

  if (passed < total) process.exit(1);
}

main().catch((err) => {
  console.error("smoke test crashed:", err);
  process.exit(2);
});
