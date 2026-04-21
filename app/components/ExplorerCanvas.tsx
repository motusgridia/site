// MotusGridia — Explorer canvas gate.
//
// Spec: /site/CLAUDE.md § Build conventions —
//       "Lazy-load every R3F scene. Use `next/dynamic` with
//        `{ ssr: false, loading: () => <StaticHexFallback /> }`."
// Spec: /site/CLAUDE.md § Component rules #7 —
//       "Reduced motion is a first-class state. Every animated component
//        must declare its static fallback."
//
// Mirrors the HeroCanvas pattern: gate the R3F scene behind
// `prefers-reduced-motion` + viewport width, import dynamically with
// `ssr: false`, and fall back to the parent's static list view when motion
// isn't allowed. The parent /explore page renders a CSS-only hex-tile
// grid of the same entries underneath, so keyboard / SR / mobile / reduced-
// motion users always have a navigable surface.

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { ExplorerEntry } from "./ExplorerScene";

// next/dynamic with ssr:false keeps the three.js / R3F chunk off the
// server renderer — three pokes at `document` at module-eval time, which
// would crash SSR. `loading: () => null` leaves the parent container empty
// while the chunk is in flight; the page's static hex-tile list view is
// already visible below, so there's no layout jump.
const ExplorerScene = dynamic(() => import("./ExplorerScene"), {
  ssr: false,
  loading: () => null,
});

// ---------------------------------------------------------------------------
// Media-query gate — identical contract to HeroCanvas#useMotionAllowed.
// ---------------------------------------------------------------------------

function useMotionAllowed(): boolean {
  // Start `false` so SSR and initial client render match. The real value
  // is computed after hydration inside useEffect and applied via setState,
  // which triggers a second render — by which point the chunk can start
  // downloading if the gates pass.
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const smallScreen = window.matchMedia("(max-width: 639px)");

    const update = () => {
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

type Props = {
  entries: ReadonlyArray<ExplorerEntry>;
};

export default function ExplorerCanvas({ entries }: Props) {
  const motionAllowed = useMotionAllowed();

  if (!motionAllowed) return null;

  return <ExplorerScene entries={entries} />;
}
