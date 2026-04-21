// MotusGridia — Alien Empire scene.
//
// Slug: alien-empire. Canon: fiction-c1.
//
// Visual metaphor: a rigid lattice of tall hex pillars arranged in a
// strict grid. No jitter, no breath, no pulse variety. The empire is
// industrial and rigid; its scene is too. A taller central monolith
// marks the seat the network has inferred exists but never confirmed.
// Slow rotation reads as "the thing is moving, just not for us."
//
// Lands under the codex-scenes/ sibling pattern. Imports primitives
// from ./shared.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function AlienEmpire({ canon }: { canon: CodexCanon }) {
  const groupRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // 5x5 lattice of pillar positions with the centre cell carved out
  // for the monolith. Rigid spacing, no jitter — the empire does not
  // freelance. Pillar heights step down toward the perimeter so the
  // composition reads as a central authority with rings of deference.
  const pillars = useMemo(() => {
    const arr: Array<{
      position: readonly [number, number, number];
      height: number;
    }> = [];
    const spacing = 1.1;
    const size = 5;
    const half = (size - 1) / 2;
    for (let col = 0; col < size; col++) {
      for (let row = 0; row < size; row++) {
        // Skip the centre — the monolith goes there.
        if (col === half && row === half) continue;
        // Distance from centre in grid units. Centre height 1.8,
        // perimeter 0.7. Strict falloff, no randomness.
        const dx = col - half;
        const dz = row - half;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const height = Math.max(0.7, 1.8 - dist * 0.35);
        arr.push({
          position: [dx * spacing, height / 2 - 0.2, dz * spacing] as const,
          height,
        });
      }
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    // Industrial crawl — slower than the Throne's 0.04. The empire
    // moves, but the scene it occupies does not react to the camera.
    g.rotation.y += delta * 0.025;
  });

  return (
    <group ref={groupRef}>
      {/* Central monolith — tall, wide, hotter glow. The inferred
          seat. Not the Queen's throne scene, which lives on its own
          page; this is the empire-scale symbol. */}
      <HexPrism
        position={[0, 1.25, 0]}
        radius={0.55}
        depth={2.5}
        color="#1a0606"
        emissive={emissive}
        emissiveIntensity={1.4}
      />

      {/* Pillar lattice — 24 tall hex prisms in strict 5x5 with the
          centre cell excluded. No emissive variation per pillar; the
          empire is uniform by design. */}
      {pillars.map((p, i) => (
        <HexPrism
          key={i}
          position={p.position}
          radius={0.22}
          depth={p.height}
          color="#0a0406"
          emissive={emissive}
          emissiveIntensity={0.35}
        />
      ))}

      {/* Base platter — darker than most scenes, wide, reads as
          industrial floor. The empire sits on manufactured ground,
          not earth. */}
      <HexPrism
        position={[0, -0.25, 0]}
        radius={3.2}
        depth={0.12}
        color="#080308"
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
