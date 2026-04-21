// MotusGridia — Optionism scene.
//
// Slug: optionism. Canon: grounded.
//
// Visual metaphor: a central individual hex at the middle of the
// scene, with five distinct community clusters arranged around it at
// different heights and orientations. Each cluster pulses with its
// own phase, reading as "different communities, different rhythms,
// all available." The individual hex rotates gently — considering,
// not committing.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Cluster = {
  centre: readonly [number, number, number];
  satellites: Array<readonly [number, number, number]>;
  phase: number;
};

export function Optionism({ canon }: { canon: CodexCanon }) {
  const individualRef = useRef<THREE.Mesh>(null);
  const clustersRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Five community clusters around the individual. Each cluster has
  // a centre hex and two or three satellites representing members of
  // that community. Positions chosen to spread around the circle and
  // give different heights so the composition reads as 3D.
  const clusters = useMemo<Cluster[]>(() => {
    const arr: Cluster[] = [];
    const bases: Array<readonly [number, number, number]> = [
      [2.2, 0.3, 0],
      [0.9, 0.6, 2.2],
      [-1.7, 0.2, 1.6],
      [-2, 0.5, -1.2],
      [1, 0.1, -2.3],
    ];
    for (let i = 0; i < bases.length; i++) {
      const base = bases[i];
      if (!base) continue;
      const satellites: Array<readonly [number, number, number]> = [];
      // Two or three satellites per cluster, offset around the
      // centre on fixed angles.
      const n = 2 + (i % 2);
      for (let s = 0; s < n; s++) {
        const a = (s / n) * Math.PI * 2 + i * 0.7;
        satellites.push([
          base[0] + Math.cos(a) * 0.5,
          base[1] + (s % 2) * 0.15,
          base[2] + Math.sin(a) * 0.5,
        ] as const);
      }
      arr.push({ centre: base, satellites, phase: i * 1.1 });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const indiv = individualRef.current;
    if (indiv) {
      indiv.rotation.y += 0.008;
      // Individual hex pulses at a neutral rate — "looking, not
      // committed." Not tied to any cluster's phase.
      const mat = indiv.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity =
          0.6 + ((Math.sin(t * 0.7) + 1) / 2) * 0.3;
      }
    }
    const cg = clustersRef.current;
    if (cg) {
      cg.children.forEach((child, i) => {
        const cluster = clusters[i];
        if (!cluster) return;
        const pulse = (Math.sin(t * 0.9 + cluster.phase) + 1) / 2;
        child.traverse((obj) => {
          const maybeMesh = obj as THREE.Mesh;
          const mat = maybeMesh.material as
            | THREE.MeshStandardMaterial
            | undefined;
          if (mat && "emissiveIntensity" in mat) {
            mat.emissiveIntensity = 0.2 + pulse * 0.6;
          }
        });
      });
    }
  });

  return (
    <group>
      {/* Individual hex — centre, elevated slightly, rotates on its
          own. */}
      <mesh
        ref={individualRef}
        position={[0, 0.4, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.7}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* Community clusters — five groups around the individual,
          each with a centre + 2-3 satellites. */}
      <group ref={clustersRef}>
        {clusters.map((cluster, i) => (
          <group key={i}>
            <HexPrism
              position={cluster.centre}
              scale={0.36}
              emissive={emissive}
              emissiveIntensity={0.3}
            />
            {cluster.satellites.map((pos, j) => (
              <HexPrism
                key={j}
                position={pos}
                scale={0.18}
                emissive={emissive}
                emissiveIntensity={0.25}
              />
            ))}
          </group>
        ))}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={3.2}
        depth={0.12}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
