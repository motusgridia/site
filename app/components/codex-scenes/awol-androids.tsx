// MotusGridia — AWOL Androids scene.
//
// Slug: awol-androids. Canon: fiction-c1.
//
// Visual metaphor: no centre. Three distinct tribal-host clusters at
// different positions around the plate (upper-left, lower-right, far
// background), each with its own cluster centre and two embedded
// android motes. The android motes pulse on a different rhythm from
// the tribe cells around them — visibly out of sync, visibly of a
// different species. No mote is at the scene centre. The centre is
// empty. The AWOL diaspora has no capital.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type TribeCell = {
  position: readonly [number, number, number];
  phase: number;
  speed: number;
};

type AndroidMote = {
  /** Host cluster index 0..2. */
  cluster: number;
  /** Offset within the cluster footprint. */
  offset: readonly [number, number];
  phase: number;
};

// Three host cluster centres.
const HOST_CENTRES: readonly [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
] = [
  [-1.7, -0.9], // upper-left cluster
  [1.6, 0.8], // lower-right cluster
  [0.1, 1.6], // far-background cluster
];

export function AwolAndroids({ canon }: { canon: CodexCanon }) {
  const tribesRef = useRef<THREE.Group>(null);
  const androidsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Three tribe cells per host (nine total). Each tribe cell pulses
  // on its host's rhythm.
  const tribeCells = useMemo<TribeCell[]>(() => {
    const arr: TribeCell[] = [];
    HOST_CENTRES.forEach((c, hostIdx) => {
      // Three cells in a small triangle around the host centre.
      const triangle: Array<readonly [number, number]> = [
        [0, 0],
        [0.4, 0.1],
        [-0.1, 0.4],
      ];
      triangle.forEach((dx, i) => {
        arr.push({
          position: [
            c[0] + (dx[0] ?? 0),
            0.12,
            c[1] + (dx[1] ?? 0),
          ] as const,
          phase: hostIdx * 1.5 + i * 0.2,
          speed: 0.7 + hostIdx * 0.15,
        });
      });
    });
    return arr;
  }, []);

  // Two android motes per host. Pulse on a different rhythm from
  // their host tribe cells.
  const androids = useMemo<AndroidMote[]>(() => {
    const arr: AndroidMote[] = [];
    HOST_CENTRES.forEach((_, hostIdx) => {
      const offsets: Array<readonly [number, number]> = [
        [0.2, -0.15],
        [-0.2, 0.25],
      ];
      offsets.forEach((o, i) => {
        arr.push({
          cluster: hostIdx,
          offset: o,
          phase: hostIdx * 0.4 + i * 2.3,
        });
      });
    });
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Tribes — each cell pulses on its host rhythm.
    const tg = tribesRef.current;
    if (tg) {
      tg.children.forEach((child, i) => {
        const c = tribeCells[i];
        if (!c) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * c.speed - c.phase) + 1) / 2;
          mat.emissiveIntensity = 0.2 + pulse * 0.35;
        }
      });
    }

    // Androids — fast, irregular, visibly out of sync with any
    // tribe. Different species of pulse.
    const ag = androidsRef.current;
    if (ag) {
      ag.children.forEach((child, i) => {
        const a = androids[i];
        if (!a) return;
        const host = HOST_CENTRES[a.cluster];
        if (!host) return;
        child.position.x = host[0] + a.offset[0];
        child.position.z = host[1] + a.offset[1];
        child.position.y = 0.35 + Math.sin(t * 1.8 + i) * 0.05;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Square-wave-ish pulse to read as "not breathing" — a
          // different rhythm from the analog pulse of the tribes.
          const raw = Math.sin(t * 1.4 - a.phase);
          const digital = raw > 0 ? 1 : 0.2;
          mat.emissiveIntensity = 0.5 + digital * 0.7;
        }
      });
    }
  });

  return (
    <group>
      {/* Tribe cells — three clusters of three. */}
      <group ref={tribesRef}>
        {tribeCells.map((c, i) => (
          <HexPrism
            key={i}
            position={c.position}
            radius={0.26}
            depth={0.18}
            emissive={emissive}
            emissiveIntensity={0.2}
          />
        ))}
      </group>

      {/* Android motes — two per cluster, pulsing on a digital
          rhythm. */}
      <group ref={androidsRef}>
        {androids.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.08, 0.08, 0.08, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.5}
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
        ))}
      </group>

      {/* Base platter — wider than usual; the diaspora spreads. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={3.6}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.06}
      />
    </group>
  );
}
