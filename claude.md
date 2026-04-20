# claude.md — MotusGridia site build standards

This file is the design + engineering constitution for the MotusGridia website (`motusgridia.com`). Read it at the start of every session in this repo. Every rule below is a hard constraint unless the user explicitly overrides it in chat.

Source-of-truth documents (canonical references — read when in doubt):

- `../visual-identity.md` — full visual system + Claude Design seed brief
- `../site-ia.md` — information architecture, content types, route map
- `../stack-recommendation.md` — locked stack + rationale
- `../grid-master-content.md` — source of truth for all written content
- `../landing-page-playbook.md` — v0.1 spec
- `../content/manifesto/`, `../content/codex/`, `../content/logs/` — written content (MDX)
- `../trademark-brief.md`, `../patent-brief.md` — IP briefs (informational only)
- `../email-setup-playbook.md`, `../brand-protection.md` — ops playbooks (informational)

---

## Brand register (one paragraph)

Latin-classical meets cyberpunk. "Motus" + "Gridia" reads like an old-empire word for *the moving grid*. The visual identity sits between a Roman senate seal and a Cyberpunk 2077 corp logo. Energy of a manifesto / movement-in-formation, not a SaaS product. Built-in-public — should feel like peeking inside a working laboratory of a society, never finished marketing polish.

---

## Locked design tokens (CSS variables — wire once, use everywhere)

| Token | Value | Use |
|---|---|---|
| `--bg-deep` | `#07090D` | Page base — near-black with hint of indigo |
| `--bg-panel` | `#0B1030` | Panels, cards, codex backgrounds |
| `--ink-primary` | `#E8ECF5` | Body text, off-white |
| `--ink-mute` | `#7E89A8` | Secondary text, captions |
| `--accent-cyan` | `#22E5FF` | Primary accent — links, focus, activated states |
| `--accent-magenta` | `#FF2FA3` | Secondary accent — highlights, codex type indicators |
| `--accent-amber` | `#FFB347` | Warnings, fiction-canon flags |
| `--line-soft` | `#1A2240` | Hairline rules, subtle borders |
| `--glow-cyan` | `rgba(34,229,255,0.18)` | Cyan glow |
| `--glow-magenta` | `rgba(255,47,163,0.18)` | Magenta glow |

Per-section tonal modes (override on `<body data-tonal-mode="…">`) — see `../visual-identity.md` § "Tonal modes".

---

## Typography (locked)

- **Display + body:** Fraunces variable. `opsz 144` for displays, `opsz 14` for body. Weight 600 for displays, 400 for body. Tracking `-0.03em` on `display-1`, `-0.025em` on `display-2`.
- **UI / mono labels:** Geist Mono. Always uppercase. Tracking `0.08em` for `mono-l`, `0.1em` for `mono`.
- **Optional accent:** Editorial New or Migra for kill-shot hero moments only — never for body.
- **No sans-serif anywhere.** Body is always Fraunces serif.
- All UI labels (chips, dates, breadcrumbs, nav, button labels) are mono uppercase.

Type scale (rem) — see `../visual-identity.md` § Typography.

---

## Anti-patterns — DO NOT DO

**Logo:**
- Generic hex tech logo (every blockchain startup vibe)
- Gradient mesh blob marks
- Lowercase friendly tech-startup wordmarks (`motusgridia` lowercase — never)
- Anything that looks like Web3

**Colour:**
- Pure white (`#FFFFFF`) — use `--ink-primary` (`#E8ECF5`) instead
- Pure black (`#000000`) — use `--bg-deep` (`#07090D`) instead
- Grey-on-grey low-contrast text
- Magenta as a large fill — magenta is rare salt, accent only
- Glow alpha above `0.25` — keep glows subtle (`0.15`–`0.25`)

**Type:**
- Any sans-serif body
- Title-case mono labels (mono = always uppercase)
- Loose tracking on display headings (use the negative tracking values above)

**Motion:**
- Spring easing on UI — all motion uses cubic-bezier with technical curves
- Bouncing of any kind
- Animation that ignores `prefers-reduced-motion`
- Glitch transitions outside the hero / major section transitions

**Imagery:**
- Stock photography of any kind
- Vector "tech illustrations"
- AI-generated faces (uncanny valley undermines the brand)
- Drop shadows (use cyan or magenta inner glows instead)

---

## Component rules (apply to every UI component)

1. **Hex DNA.** Every container, divider, image crop, avatar frame is hex-derived. Never decorative — hex carries meaning (every Grid is a hex).
2. **Lines are thin.** 1px, often dashed for blueprints, sometimes glowing for active states.
3. **Corners.** Sharp on UI elements. Soft (4–8px) on cards.
4. **No drop shadows.** Use cyan or magenta inner-glow instead.
5. **Layered depth.** Backgrounds get 1–3 layers: base colour + noise/grain + subtle radial glow + (optionally) a hex pattern at 3% opacity.
6. **Motion budget.** Page-wide scanline overlay at 2% opacity (off in reduced-motion). Chromatic aberration on hover (~1px RGB split, off in reduced-motion). No animation longer than 600ms except the hero entrance.
7. **Reduced motion is a first-class state.** Every animated component must declare its static fallback. In reduced-motion the page becomes static, scanlines off, all transitions become opacity-only fades.
8. **Accessibility floor.** All interactive elements have a visible focus state (cyan glow, 2px). Keyboard nav works on every route. ARIA labels on every icon button. Body text meets WCAG AA contrast.
9. **Codex iconography.** Six codex types each get a custom hex-grid icon (Concepts, Infrastructure, Technology, Factions, Characters, Places, Events). 2px stroke, no fill, glow on active. All generated from a single base hex template.

---

## Build conventions

- **Stack:** Next.js 15 App Router + TypeScript strict + Tailwind v4 + R3F + Drei + `@react-three/postprocessing` + GSAP + Lenis + MDX (Contentlayer or `fumadocs-mdx`) + Resend + Cloudflare Turnstile + Vercel.
- **TypeScript strict:** `"strict": true` plus `"noUncheckedIndexedAccess": true`.
- **Server components by default.** Use client components only for R3F scenes, forms, and motion-driven components.
- **Lazy-load every R3F scene.** Use `next/dynamic` with `{ ssr: false, loading: () => <StaticHexFallback /> }`.
- **File naming.** Routes kebab-case (`/codex/[slug]`). Components PascalCase. Hooks `useCamelCase`. Server actions `verbCamelCase`.
- **No inline styles.** Use Tailwind utilities or CSS variables. Only use `style={{ … }}` for values that must be computed at runtime by Motion / GSAP.
- **Tokens are CSS variables in `app/globals.css` AND Tailwind theme tokens in `tailwind.config.ts`.** Wire once.
- **JS budgets.** First-load JS budget excluding `three.js`: under 100kb gzipped. The R3F canvas does not block FCP.
- **Lighthouse floor.** 95+ Performance, 100 SEO / Accessibility / Best-Practices.
- **Imports.** Use the `@/` alias for `src/`. Never `../../../`.

---

## Content conventions (MDX)

- All content lives in `../content/{manifesto,codex,logs}/*.mdx`.
- YAML frontmatter required on every entry. Schemas live in `lib/schemas/*.ts` (Zod).
- Codex frontmatter spec: see `../site-ia.md` § "Codex frontmatter (every entry)".
- Manifesto frontmatter: see `../site-ia.md` § "Manifesto".
- Logs frontmatter: see `../site-ia.md` § "Logs".
- A `scripts/build-content-index.ts` step generates `/public/content-index.json` at build time. See `../content-build-script.md` for the spec.
- Every entry validated against its Zod schema during build — fails CI on schema violation.
- Cross-links between entries use the slug, e.g. `[Honeycomb Architecture](/codex/honeycomb-architecture)`.

---

## What requires explicit user confirmation (never silent)

- Choosing copy that isn't already in `../content/` or `../grid-master-content.md`
- Adding any third-party JS that isn't in `../stack-recommendation.md`
- Changing any locked design token
- Adding new colour values outside the token set
- Setting up analytics or tracking pixels
- Anything that sends data to a third party
- Anything that publishes — `vercel deploy --prod`, `git push origin main`, social posts, email blasts

---

## What to never do

- Build with a sans-serif body font (Inter, system-ui, Geist Sans, etc.) — Fraunces × Geist Mono only
- Add stock photography or AI-generated faces
- Use Web3 visual cues (gradient blobs, lowercase wordmarks, bouncy SaaS-y motion)
- Render animation without a `prefers-reduced-motion` static fallback
- Ship without Lighthouse 95+ Performance / 100 A11y
- Commit secrets — env vars only, `.env.local` in `.gitignore`
- Modify `claude.md`, `../visual-identity.md`, or any locked design token without an explicit user instruction in chat
