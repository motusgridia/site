// MotusGridia — Alien Queen scene.
//
// Slug: alien-queen. Canon: fiction-c1.
//
// The Queen does not move. The Hive reports up to her from a seat that
// the On-Grid has never confirmed. Visual metaphor: a heavy hex throne
// at centre frame, absolutely still, with a ring of 12 smaller hexes
// orbiting far out at a crawling speed. Everything the Hive does on
// earth is a decision this seat agreed to — so the orbit cells glow
// softly, in sync with the throne, as if they are waiting on it.
//
// This is the first scene shipped under the `codex-scenes/` sibling-
// module pattern. The dispatcher in CodexHeroScene.tsx imports
// { Throne } directly from this file. Future scenes follow the same
// shape: one file per concept, `"use client"`, import primitives from
// ./shared, export a single component named for the scene.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function Throne({ canon }: { canon: CodexCanon }) {
  const orbitRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // 12-cell outer ring. Deterministic positions; no jitter. The Queen's
  // environment is orderly — the chaos happens far below her seat.
  const orbiters = useMemo(() => {
    const positions: Array<readonly [number, number, number]> = [];
    const ringRadius = 3.6;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      positions.push([
        Math.cos(angle) * ringRadius,
        0,
        Math.sin(angle) * ringRadius,
      ] as const);
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    const g = orbitRef.current;
    if (!g) return;
    // Very slow orbit — barely above still. The seat is the point; the
    // orbit is respectful.
    g.rotation.y += delta * 0.04;
    // Synced breath on the whole ring. Pulse drives emissive intensity
    // through the material ref each frame so the cells inhale together.
    const pulse = (Math.sin(state.clock.elapsedTime * 0.45) + 1) / 2;
    g.traverse((obj) => {
      // Each orbiter is a HexPrism mesh; grab its material and modulate.
      const maybeMesh = obj as THREE.Mesh;
      const mat = maybeMesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.18 + pulse * 0.22;
      }
    });
  });

  return (
    <group>
      {/* Throne — a tall, wide, dense hex prism. Dark metal body, hot
          amber glow in the seat's face. No rotation. */}
      <HexPrism
        position={[0, 0.4, 0]}
        radius={1.3}
        depth={1.2}
        color="#1a0606"
        emissive={emissive}
        emissiveIntensity={1.1}
      />

      {/* Throne cap — a smaller hex sitting above the main block, tinted
          brighter. Reads as the head-of-seat. */}
      <HexPrism
        position={[0, 1.3, 0]}
        radius={0.7}
        depth={0.3}
        color="#280a0a"
        emissive={emissive}
        emissiveIntensity={1.6}
      />

      {/* Throne base platter — wide, dim, dark. The floor her seat sits
          on. */}
      <HexPrism
        position={[0, -0.4, 0]}
        radius={2.4}
        depth={0.14}
        emissive={emissive}
        emissiveIntensity={0.12}
      />

      {/* Outer orbit ring — 12 small hex cells rotating together at a
          crawl, synchronised pulse driven by the parent group's frame
          loop. */}
      <group ref={orbitRef}>
        {orbiters.map((pos, i) => (
          <HexPrism
            key={i}
            position={pos}
            scale={0.42}
            emissive={emissive}
            emissiveIntensity={0.22}
          />
        ))}
      </group>
    </group>
  );
}
