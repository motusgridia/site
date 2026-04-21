// MotusGridia — Grid Law Teams scene.
//
// Slug: grid-law-teams. Canon: grounded.
//
// Visual metaphor: a single "case" hex at the centre of the floor,
// ringed by twelve "juror" hexes elevated at varying heights. Higher
// jurors carry more Credit in the domain; lower jurors sit in the
// back row and observe. The case pulses on its own; jurors brighten
// in a staggered cascade when their turn to vote arrives. A
// reputation-weighted tribunal read without any gavel imagery.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Juror = {
  position: readonly [number, number, number];
  credit: number; // 0-1, drives base height and emissive
  phase: number;
};

export function GridLawTeams({ canon }: { canon: CodexCanon }) {
  const caseRef = useRef<THREE.Mesh>(null);
  const jurorsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Twelve jurors on a ring. Credit (base height) varies so some sit
  // higher than others — the network ranks by track record. All at
  // the same radius so the tribunal reads as a circle rather than a
  // crowd.
  const jurors = useMemo<Juror[]>(() => {
    const arr: Juror[] = [];
    const radius = 2.2;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      // Credit is a deterministic pattern — roughly sinusoidal so
      // the ring has visible elevation variety without jitter.
      const credit = 0.35 + ((Math.sin(i * 1.4) + 1) / 2) * 0.55;
      arr.push({
        position: [
          Math.cos(angle) * radius,
          0.2 + credit * 1.1,
          Math.sin(angle) * radius,
        ] as const,
        credit,
        phase: i * 0.52,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const c = caseRef.current;
    if (c) {
      // Case pulses steadily — the case is the focal point, not the
      // speaker of the moment.
      const pulse = (Math.sin(t * 0.8) + 1) / 2;
      const mat = c.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.7 + pulse * 0.5;
      }
    }
    const jg = jurorsRef.current;
    if (jg) {
      jg.children.forEach((child, i) => {
        const j = jurors[i];
        if (!j) return;
        // Each juror's pulse comes on at their phase — reads as a
        // cascade of votes going around the ring.
        const pulse = (Math.sin(t * 0.6 - j.phase) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Higher-credit jurors pulse brighter at peak — their vote
          // carries more weight.
          mat.emissiveIntensity = 0.15 + pulse * (0.35 + j.credit * 0.5);
        }
      });
    }
  });

  return (
    <group>
      {/* Case hex — centre, at floor level. Bright. The subject. */}
      <mesh
        ref={caseRef}
        position={[0, 0.1, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.6, 0.6, 0.28, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* Jurors — twelve hex cells on a ring at varying heights. */}
      <group ref={jurorsRef}>
        {jurors.map((j, i) => (
          <HexPrism
            key={i}
            position={j.position}
            scale={0.24}
            emissive={emissive}
            emissiveIntensity={0.25}
          />
        ))}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.15, 0]}
        radius={3}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
