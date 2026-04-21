// MotusGridia — The Saviour scene.
//
// Slug: the-saviour. Canon: fiction-c2.
//
// Visual metaphor: a central Saviour hex with three trainee hexes
// clustered behind him. A bacterium-style wave propagates outward
// from an off-centre origin, lighting up ambient "village" cells as
// it passes — but the Saviour's cell and the trainees stay unmoved.
// The Hive's signal slides past them. Reads as immunity, not dodge.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type VillageCell = {
  position: readonly [number, number, number];
  /** distance from wave origin (off-centre, to the left) */
  distance: number;
};

export function TheSaviour({ canon }: { canon: CodexCanon }) {
  const saviourRef = useRef<THREE.Mesh>(null);
  const traineesRef = useRef<THREE.Group>(null);
  const villageRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Wave origin is offset to the left — the Hive strike came from
  // the bacterium-zone edge, not from under the village itself.
  const origin = useMemo<readonly [number, number]>(
    () => [-2.8, 0] as const,
    [],
  );

  // 12 village hexes placed around the scene at irregular but
  // deterministic positions. Distance from the wave origin is
  // precomputed so the per-frame check is cheap.
  const village = useMemo<VillageCell[]>(() => {
    const positions: Array<readonly [number, number]> = [
      [-1.4, 0.5],
      [-1.8, -0.8],
      [-0.6, 1.3],
      [-0.5, -1.4],
      [0.3, 0.9],
      [0.8, -1.1],
      [1.5, 0.4],
      [1.9, -0.9],
      [-2.2, 1.4],
      [2.4, 1.2],
      [-1.1, 2.1],
      [1.3, 2.0],
    ];
    return positions.map(([x, z]) => {
      const dx = x - origin[0];
      const dz = z - origin[1];
      const distance = Math.sqrt(dx * dx + dz * dz);
      return {
        position: [x, 0.05, z] as const,
        distance,
      };
    });
  }, [origin]);

  // Three trainees behind the Saviour (small cluster on +Z relative
  // to the hero position, offset slightly so they don't overlap).
  const trainees = useMemo<
    Array<readonly [number, number, number]>
  >(
    () => [
      [0.6, 0.05, 0.9],
      [-0.6, 0.05, 1.0],
      [0, 0.05, 1.5],
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Saviour pulses steadily on his own rhythm — unaffected by the
    // wave, unaffected by anything.
    const saviour = saviourRef.current;
    if (saviour) {
      const pulse = (Math.sin(t * 0.7) + 1) / 2;
      const mat = saviour.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 1 + pulse * 0.3;
      }
    }

    // Trainees pulse in sync with the Saviour but dimmer — the
    // immunity is partial and carried.
    const tr = traineesRef.current;
    if (tr) {
      const pulse = (Math.sin(t * 0.7) + 1) / 2;
      tr.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.35 + pulse * 0.3;
        }
      });
    }

    // Village cells get hit by the wave — narrow "arrived" window
    // raises their emissive briefly then they dim.
    const waveRadius = (t * 1.0) % 5.0;
    const vg = villageRef.current;
    if (vg) {
      vg.children.forEach((child, i) => {
        const cell = village[i];
        if (!cell) return;
        const delta = Math.abs(waveRadius - cell.distance);
        const hit = Math.max(0, 1 - delta * 2);
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.15 + hit * 1.1;
        }
      });
    }
  });

  return (
    <group>
      {/* Saviour — central, elevated, unaffected. */}
      <mesh
        ref={saviourRef}
        position={[0, 0.5, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.85, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.1}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>

      {/* Trainees — three behind the Saviour, partially immune. */}
      <group ref={traineesRef}>
        {trainees.map((pos, i) => (
          <HexPrism
            key={i}
            position={pos}
            scale={0.22}
            emissive={emissive}
            emissiveIntensity={0.4}
          />
        ))}
      </group>

      {/* Village cells — the Hive's signal passes through these. */}
      <group ref={villageRef}>
        {village.map((v, i) => (
          <HexPrism
            key={i}
            position={v.position}
            scale={0.2}
            emissive={emissive}
            emissiveIntensity={0.2}
          />
        ))}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.15, 0]}
        radius={3.6}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
