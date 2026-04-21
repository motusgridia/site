// MotusGridia — Blueprint Trade scene.
//
// Slug: blueprint-trade. Canon: grounded.
//
// Visual metaphor: a central "source" hex (the blueprint) emits smaller
// hex cells outward along three fixed lanes. The emitted cells travel
// outward at constant speed, fade as they pass a threshold, and a new
// one spawns in their place. Reads as distribution — one recipe,
// many downloads, forever.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Distribution = {
  phase: number;
  angle: number;
  speed: number;
};

export function BlueprintTrade({ canon }: { canon: CodexCanon }) {
  const ringRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Twelve distribution particles in three lanes of four, each at a
  // different starting offset. Keeping everything deterministic so
  // the scene hydrates identically on every load.
  const distributions = useMemo<Distribution[]>(() => {
    const arr: Distribution[] = [];
    const lanes = 3;
    const perLane = 4;
    for (let lane = 0; lane < lanes; lane++) {
      for (let i = 0; i < perLane; i++) {
        arr.push({
          // Start offset per-particle so the lane stays full.
          phase: (i / perLane) * 3.4,
          // Lane angles evenly distributed. Offset by a small phase
          // per lane so lanes don't fire in unison.
          angle: (lane / lanes) * Math.PI * 2 + lane * 0.14,
          // All lanes same speed — distribution does not discriminate.
          speed: 0.9,
        });
      }
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = ringRef.current;
    if (!g) return;
    // Whole constellation rotates slowly — the trade catalogue moves
    // over time even when no single download is fetching.
    g.rotation.y += 0.005;

    g.children.forEach((child, i) => {
      const d = distributions[i];
      if (!d) return;
      // Each particle travels 0 → 3.4 radius, then loops. Modulo on
      // elapsed time gives the travel progress; phase offset staggers
      // the lane so it always looks populated.
      const travel = ((t * d.speed + d.phase) % 3.4);
      const r = 0.6 + travel;
      child.position.x = Math.cos(d.angle) * r;
      child.position.z = Math.sin(d.angle) * r;
      // Fade out as the particle approaches the rim — emissive drops
      // linearly, scale shrinks slightly, re-spawns invisible and
      // comes back online near the source.
      const rim = travel / 3.4; // 0 near source, 1 at rim
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.8 * (1 - rim);
      }
      child.scale.setScalar(0.2 * (1 - rim * 0.5));
    });
  });

  return (
    <group>
      {/* Source hex — the blueprint itself. Bright, still, centred. */}
      <HexPrism
        position={[0, 0, 0]}
        radius={0.75}
        depth={0.38}
        color="#0b1030"
        emissive={emissive}
        emissiveIntensity={1.2}
      />
      {/* Inner halo — a slightly larger dim hex behind the source so
          the blueprint reads as a "stamped" object, not a floating
          pip. */}
      <HexPrism
        position={[0, -0.08, 0]}
        radius={1.2}
        depth={0.12}
        emissive={emissive}
        emissiveIntensity={0.22}
      />

      {/* Distribution particles — 12 small hexes travelling outward
          along three lanes. They fade before they hit the rim, so
          the composition stays calm at the edges. */}
      <group ref={ringRef}>
        {distributions.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[1, 1, 0.25, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.4}
              metalness={0.35}
              roughness={0.45}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
