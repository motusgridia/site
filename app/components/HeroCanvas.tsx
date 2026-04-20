// MotusGridia — Hero canvas gate.
//
// Spec: /site/CLAUDE.md § Build conventions —
//       "Lazy-load every R3F scene. Use `next/dynamic` with
//        `{ ssr: false, loading: () => <StaticHexFallback /> }`."
// Spec: /site/CLAUDE.md § Component rules #7 —
//       "Reduced motion is a first-class state. Every animated component
//        must declare its static fallback."
// Spec: /landing-page-playbook.md § Definition of done —
//       "Mobile responsive (hero degrades to static gradient under 640px)".
//
// This component is the only entry point into the R3F scene. It:
//
//   1. Ships zero three.js / R3F JS on the initial bundle — the scene is
//      imported via `next/dynamic` with `ssr: false`, so the chunk only
//      downloads on the client after the media-query gate passes.
//
//   2. Gates on two conditions, both treated as "motion-disabled":
//        (a) `prefers-reduced-motion: reduce`
//        (b) viewport width < 640px (below our `sm` Tailwind breakpoint)
//      If either is true, the component renders nothing and the parent
//      hero section falls back to its `.hero-static` radial-gradient bg.
//      That's the exact v0.0 look — indistinguishable to the user.
//
//   3. Re-evaluates the gates reactively: if a user rotates their phone
//      across the 640px boundary or flips a system setting, the scene
//      mounts/unmounts accordingly without a full page reload.
//
// The initial `motionAllowed` state is `false` so the server-rendered HTML
// and the first client render agree (both show nothing) — no hydration
// mismatch. `useEffect` then upgrades to the live value.

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// next/dynamic with ssr:false guarantees the R3F code path never reaches
// the server renderer — critical because three.js pokes at `document` and
// `window` at module-eval time, which would crash SSR.
// `loading: () => null` means there's nothing rendered while the chunk is
// in flight; the section's `.hero-static` gradient stays visible, which is
// the desired static fallback anyway. No need for a separate
// <StaticHexFallback /> DOM — the parent section already is the fallback.
const HoneycombScene = dynamic(() => import("./HoneycombScene"), {
  ssr: false,
  loading: () => null,
});

// ---------------------------------------------------------------------------
// Media-query gate.
// ---------------------------------------------------------------------------

function useMotionAllowed(): boolean {
  // Start `false` so SSR and initial client render match. The real value
  // is computed after hydration inside useEffect and applied via setState,
  // which triggers a second render. By that time the chunk can start
  // downloading if the gates pass.
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    // Guard for environments where window isn't available (should be
    // impossible inside "use client" + useEffect, but cheap insurance).
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const smallScreen = window.matchMedia("(max-width: 639px)");

    const update = () => {
      // Motion is allowed IFF reduced-motion is off AND viewport is ≥640px.
      setMotionAllowed(!reducedMotion.matches && !smallScreen.matches);
    };

    update();

    reducedMotion.addEventListener("change", update);
    smallScreen.addEventListener("change", update);

    return () => {
      reducedMotion.removeEventListener("change", update);
      smallScreen.removeEventListener("change", update);
    };
  }, []);

  return motionAllowed;
}

// ---------------------------------------------------------------------------
// Component.
// ---------------------------------------------------------------------------

export default function HeroCanvas() {
  const motionAllowed = useMotionAllowed();

  // Not yet hydrated, or gates failed → render nothing. The parent hero
  // section's `.hero-static` gradient is the static fallback.
  if (!motionAllowed) return null;

  return <HoneycombScene />;
}
