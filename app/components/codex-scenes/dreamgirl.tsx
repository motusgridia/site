// MotusGridia — Dreamgirl scene.
//
// Slug: dreamgirl. Canon: fiction-c1.
//
// Visual metaphor: a central still hex that does not emit on its own.
// Four peripheral "source" hexes fire pulses toward her on staggered
// phases; she reflects each one back with identical brightness and
// duration but one beat later. The reflection is perfect and late —
// the mirror is not the one generating anything, it just sends what
// it received back out cleanly. No rotation. Dreamgirl does not move.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Source = {
  position: readonly [number, number, number];
  phase: number;
  /** radial direction unit vector — points outward away from centre. */
  dir: readonly [number, number];
};

export function Dreamgirl({ canon }: { canon: CodexCanon }) {
  const centreRef = useRef<THREE.Mesh>(null);
  const sourcesRef = useRef<THREE.Group>(null);
  const motesRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Four source hexes at the cardinals — two on +X/-X, two on +Z/-Z —
  // each firing at a different phase so reflections don't stack.
  const sources = useMemo<Source[]>(() => {
    const arr: Source[] = [];
    const radius = 2.3;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      arr.push({
        position: [
          Math.cos(angle) * radius,
          0.1,
          Math.sin(angle) * radius,
        ] as const,
        phase: i * 0.75,
        dir: [Math.cos(angle), Math.sin(angle)] as const,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Centre pulse tracks the COMBINED incoming pulse delayed by
    // ~0.6 seconds — reads as the mirror returning what just arrived.
    const centre = centreRef.current;
    if (centre) {
      let incoming = 0;
      for (const s of sources) {
        // Source pulse is a narrow sinusoid gated to its phase.
        const p = Math.max(0, Math.sin(t * 0.9 - s.phase));
        incoming += p;
      }
      // Delayed reflection — same shape, shifted by 0.6.
      let delayed = 0;
      for (const s of sources) {
        const p = Math.max(0, Math.sin(t * 0.9 - s.phase - 0.6));
        delayed += p;
      }
      const mat = centre.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        // Dreamgirl's own emissive contribution is zero — all her
        // brightness is the delayed sum of what the sources sent.
        mat.emissiveIntensity = 0.15 + delayed * 0.35;
      }
      // Keep the incoming variable referenced so tree-shake doesn't
      // drop it (tsc noUncheckedIndexedAccess is happy either way).
      void incoming;
    }

    // Source pulses — each fires on its own phase.
    const sg = sourcesRef.current;
    if (sg) {
      sg.children.forEach((child, i) => {
        const s = sources[i];
        if (!s) return;
        const p = Math.max(0, Math.sin(t * 0.9 - s.phase));
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.25 + p * 0.7;
        }
      });
    }

    // One mote per source travels in from the source to the centre,
    // hits the centre, then travels back out. 2-second round trip.
    const motes = motesRef.current;
    if (motes) {
      motes.children.forEach((child, i) => {
        const s = sources[i];
        if (!s) return;
        // Cycle runs 0 → 1 → 0 triangular — in then out.
        const cycle = ((t * 0.5 - s.phase / 2) % 2) / 2; // 0..1
        const leg = cycle < 0.5 ? cycle * 2 : 1 - (cycle - 0.5) * 2;
        // Position along the radial line from source to centre.
        const x = s.position[0] * (1 - leg);
        const z = s.position[2] * (1 - leg);
        child.position.set(x, 0.4, z);
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Inbound motes dim, reflected motes bright — the return is
          // the stronger read.
          mat.emissiveIntensity = cycle < 0.5 ? 0.35 : 0.8;
        }
      });
    }
  });

  return (
    <group>
      {/* Dreamgirl — central hex, does not emit on its own. Her
          brightness is what the sources are sending her. */}
      <mesh
        ref={centreRef}
        position={[0, 0.3, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.55, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.2}
          metalness={0.45}
          roughness={0.3}
        />
      </mesh>

      {/* Source hexes — four cardinals firing on offset phases. */}
      <group ref={sourcesRef}>
        {sources.map((s, i) => (
          <HexPrism
            key={i}
            position={s.position}
            scale={0.28}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Motes — one per source, travelling in-and-back. */}
      <group ref={motesRef}>
        {sources.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.1, 0.1, 0.1, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.5}
              metalness={0.35}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.15, 0]}
        radius={3.2}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
