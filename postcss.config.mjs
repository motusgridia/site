// PostCSS config for Tailwind v4.
// Tailwind v4 runs as a PostCSS plugin (`@tailwindcss/postcss`) — no
// `tailwind.config.ts` needed; tokens are declared via `@theme { ... }` inside
// `app/globals.css` per /site/claude.md § Locked design tokens.
//
// The `.mjs` extension makes this an ES module; Next.js 15 picks it up
// automatically at build time.

export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
