// MotusGridia — Codex hero canvas gate.
//
// Spec: /site/CLAUDE.md § Build conventions —
//       "Lazy-load every R3F scene. Use `next/dynamic` with
//        `{ ssr: false, loading: () => <StaticHexFallback /> }`."
// Spec: /site/CLAUDE.md § Component rules #7 — reduced motion is
//       first-class.
//
// Same contract as ExplorerCanvas / HeroCanvas: gate on
// `prefers-reduced-motion` + viewport width, lazy-import the R3F scene
// with `ssr: false`, fall back to a CSS-only HexBanner otherwise.
//
// Unlike the hero and explorer gates, this one ALWAYS renders something:
// when motion isn't allowed we show the HexBanner so the codex sub-page
// keeps its above-the-fold visual weight. That's what was happening
// pre-3D anyway (the sub-page composition already composed a HexBanner
// when frontmatter had no hero_image).

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { HexBanner } from "./HexBanner";

// next/dynamic with ssr:false keeps the three.js / R3F chunk off the
// server renderer. `loading: () => null` is fine here because the outer
// wrapper element renders the static banner underneath while the chunk
// is in flight, and the canvas fades over the top once mounted.
const CodexHeroScene = dynamic(() => import("./CodexHeroScene"), {
  ssr: false,
  loading: () => null,
});

// ---------------------------------------------------------------------------
// Motion gate — identical contract to HeroCanvas / ExplorerCanvas.
// ---------------------------------------------------------------------------

function useMotionAllowed(): boolean {
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

type Canon = "grounded" | "fiction-c1" | "fiction-c2";

type Props = {
  slug: string;
  canon: Canon;
  /** Caption rendered in the static fallback banner. */
  caption?: string;
  className?: string;
};

// HexBanner accepts a "cyan" | "amber" tone. Map both fiction canons to
// amber and grounded to cyan, matching CANON_ACCENT.
function canonToneForBanner(canon: Canon): "cyan" | "amber" {
  return canon === "grounded" ? "cyan" : "amber";
}

export default function CodexHeroCanvas({
  slug,
  canon,
  caption,
  className = "",
}: Props) {
  const motionAllowed = useMotionAllowed();

  // Aspect-ratio container — 4:1 matches HexBanner so swapping between
  // the static and 3D variants doesn't shift layout. overflow-hidden
  // keeps the absolute-positioned canvas clipped to the banner box.
  // aspect-[4/1] is Tailwind's arbitrary-value aspect utility; we stay in
  // utility-land per /site/CLAUDE.md "no inline styles".
  return (
    <div
      className={`relative aspect-[4/1] overflow-hidden border border-line-soft bg-bg-panel ${className}`}
    >
      {/* Always-on static layer — visible underneath the canvas during
          the initial hydration + lazy-load window, and the sole layer
          for motion-disabled / small-screen visitors. */}
      <HexBanner
        tone={canonToneForBanner(canon)}
        caption={caption}
        className="absolute inset-0 border-0"
      />

      {motionAllowed ? <CodexHeroScene slug={slug} canon={canon} /> : null}
    </div>
  );
}
