// MotusGridia — Modularity scene.
//
// Slug: modularity. Canon: grounded.
//
// Visual metaphor: a stack of hex modules that continuously shuffles —
// modules slide out, float briefly, and re-seat at new heights. The
// total mass is preserved but the arrangement keeps changing, the way
// a Grid dwelling treats its rooms as editable. Reads as construction
// in progress without actually building anything.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Module = {
  baseHeight: number;
  phase: number;
  xOffset: number;
  zOffset: number;
};

export function Modularity({ canon }: { canon: CodexCanon }) {
  const groupRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Seven modules, deterministic offsets so hydration is clean.
  // baseHeight + a per-module oscillation produces the "slide in / slide
  // out" reconfiguration motion. xOffset and zOffset give each module
  // its own column so they don't clash.
  const modules = useMemo<Module[]>(() => {
    const arr: Module[] = [];
    // Columns laid out as a small 2x2 + centre pillar — a minimal
    // dwelling footprint. Each module is pinned to one column and
    // moves only in Y.
    const columns: Array<readonly [number, number]> = [
      [0, 0],
      [1.1, 0],
      [-1.1, 0],
      [0, 1.1],
      [0, -1.1],
      [0.95, 0.95],
      [-0.95, -0.95],
    ];
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (!col) continue;
      arr.push({
        baseHeight: 0.1 + (i % 3) * 0.28,
        phase: (i / columns.length) * Math.PI * 2,
        xOffset: col[0],
        zOffset: col[1],
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = groupRef.current;
    if (!g) return;
    // Slow rotation on the whole footprint. Feels like browsing the
    // layout, not a cyclone.
    g.rotation.y = Math.sin(t * 0.15) * 0.2;

    g.children.forEach((child, i) => {
      const mod = modules[i];
      if (!mod) return;
      // Each module's Y position drifts up and down on its own phase.
      // Amplitude is small — rooms reconfigure, they do not levitate
      // dramatically.
      const drift = Math.sin(t * 0.45 + mod.phase) * 0.45;
      child.position.y = mod.baseHeight + drift;
      // Emissive intensity pulses with position — the module is
      // hottest when it is most out of place, as if the seat is
      // communicating with the floor it's reseating into.
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.2 + Math.abs(drift) * 0.9;
      }
    });
  });

  return (
    <group>
      {/* Base platter — the slab the settlement sits on. */}
      <HexPrism
        position={[0, -0.3, 0]}
        radius={2.2}
        depth={0.12}
        emissive={emissive}
        emissiveIntensity={0.1}
      />

      {/* Modules — the editable pieces. Each sits in its own column
          and drifts in Y. React keys are stable per index so Three
          reuses the meshes rather than recreating them per frame. */}
      <group ref={groupRef}>
        {modules.map((mod, i) => (
          <mesh
            key={i}
            position={[mod.xOffset, mod.baseHeight, mod.zOffset]}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.45, 0.45, 0.35, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.3}
              metalness={0.35}
              roughness={0.45}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
