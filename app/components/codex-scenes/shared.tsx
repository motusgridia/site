// MotusGridia — Shared primitives for codex 3D hero scenes.
//
// Spec: /site/CLAUDE.md § Component rules (hex DNA).
// Spec: /site/lib/content.ts § CANON_ACCENT mirror.
//
// Every scene file under `codex-scenes/` imports from this module. Keeping
// the hex-prism primitive + the canon → colour resolver co-located here
// means:
//   - a scene file stays readable (30–80 lines of actual scene logic, not
//     200 lines of boilerplate),
//   - the bundler deduplicates the primitive across chunks,
//   - adding a new scene is mechanical (new file, one import, one case).

"use client";

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type CodexHeroProps = {
  slug: string;
  canon: "grounded" | "fiction-c1" | "fiction-c2";
};

export type CodexCanon = CodexHeroProps["canon"];

// ---------------------------------------------------------------------------
// Canon → colour resolvers. Mirrors `CANON_ACCENT` in /site/lib/content.ts.
// Grounded = cyan, fiction = amber. `canonFill` returns a counter-light so
// grounded scenes get a cyan key + amber fill and fiction scenes get the
// inverse; either way both palette tones are present in the shot.
// ---------------------------------------------------------------------------

export function canonColour(canon: CodexCanon): string {
  switch (canon) {
    case "grounded":
      return "#22e5ff";
    case "fiction-c1":
      return "#ffb347";
    case "fiction-c2":
      return "#ff9a1f";
  }
}

export function canonFill(canon: CodexCanon): string {
  return canon === "grounded" ? "#ffb347" : "#22e5ff";
}

// ---------------------------------------------------------------------------
// HexPrism — the single primitive every scene uses for cell geometry.
//
// `cylinderGeometry` with radialSegments=6 produces an exact hexagonal
// prism. A π/6 Y-rotation makes it pointy-top (matching the Explorer and
// every CSS hex utility on the site). Double-sided material avoids
// backface pops when the camera crosses the cap plane.
// ---------------------------------------------------------------------------

export type HexPrismProps = {
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  radius?: number;
  depth?: number;
  color?: string;
  emissive: string;
  emissiveIntensity?: number;
  scale?: number;
};

export function HexPrism({
  position = [0, 0, 0],
  rotation = [0, Math.PI / 6, 0],
  radius = 1,
  depth = 0.22,
  color = "#0b1030",
  emissive,
  emissiveIntensity = 0.3,
  scale = 1,
}: HexPrismProps) {
  return (
    <mesh
      position={[position[0], position[1], position[2]]}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scale}
      frustumCulled={false}
    >
      <cylinderGeometry args={[radius, radius, depth, 6, 1, false]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={0.35}
        roughness={0.45}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
