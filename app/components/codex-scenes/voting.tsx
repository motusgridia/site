// MotusGridia — Voting scene.
//
// Slug: voting. Canon: grounded.
//
// Visual metaphor: a ring of twelve voter hexes at mid-radius, each
// pulsing on its own rhythm. A central proposal hex sits below the
// ring, pulsing according to the cumulative weighted vote. When a
// voter fires (pulse peak) a thin arc briefly connects them to the
// centre — a vote cast. As more voters fire in overlapping windows,
// the centre grows brighter. Reads as continuous distributed
// consensus, not a ballot box.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Voter = {
  position: readonly [number, number, number];
  phase: number;
  speed: number;
  /** Credit weight — high-credit voters contribute more. */
  weight: number;
};

export function Voting({ canon }: { canon: CodexCanon }) {
  const proposalRef = useRef<THREE.Mesh>(null);
  const votersRef = useRef<THREE.Group>(null);
  const arcRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Twelve voters, mixed weights for the Credit-weighting visual.
  const voters = useMemo<Voter[]>(() => {
    const arr: Voter[] = [];
    const radius = 2.2;
    const weights = [1, 0.6, 1.4, 0.5, 1, 0.7, 1.2, 0.8, 1, 1.1, 0.6, 1.3];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      arr.push({
        position: [
          Math.cos(angle) * radius,
          0.2,
          Math.sin(angle) * radius,
        ] as const,
        phase: i * 0.35,
        speed: 0.5 + (i % 4) * 0.15,
        weight: weights[i] ?? 1,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Accumulate weighted vote — sum of each voter's positive-lobe
    // pulse × their weight. Normalise by the sum of weights so the
    // centre intensity is bounded.
    let voteSum = 0;
    let weightSum = 0;
    voters.forEach((v) => {
      const pulse = Math.max(0, Math.sin(t * v.speed - v.phase));
      voteSum += pulse * v.weight;
      weightSum += v.weight;
    });
    const normalised = voteSum / weightSum;

    // Central proposal — brightness tracks current consensus.
    const prop = proposalRef.current;
    if (prop) {
      const mat = prop.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + normalised * 1.3;
      }
    }

    // Voters — each pulses on its own rhythm. Brighter at pulse peak.
    // Bigger-weighted voters carry slightly higher base emission so
    // Credit-weighting is visually readable.
    const vg = votersRef.current;
    if (vg) {
      vg.children.forEach((child, i) => {
        const v = voters[i];
        if (!v) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const vote = Math.max(0, Math.sin(t * v.speed - v.phase));
          const weighted = vote * v.weight;
          mat.emissiveIntensity = 0.2 + weighted * 0.8;
        }
        // Scale bigger voters a touch taller to read weight.
        mesh.scale.y = 0.7 + v.weight * 0.3;
      });
    }

    // Transfer arc — rotates to highlight the loudest current voter.
    const arc = arcRef.current;
    if (arc) {
      let loudestIdx = 0;
      let loudestVal = -1;
      voters.forEach((v, i) => {
        const pulse = Math.max(0, Math.sin(t * v.speed - v.phase));
        const val = pulse * v.weight;
        if (val > loudestVal) {
          loudestVal = val;
          loudestIdx = i;
        }
      });
      const target = voters[loudestIdx];
      if (target) {
        const midX = target.position[0] / 2;
        const midZ = target.position[2] / 2;
        arc.position.x = midX;
        arc.position.y = 0.3;
        arc.position.z = midZ;
        const length = Math.hypot(
          target.position[0],
          target.position[2],
        );
        arc.scale.x = length;
        arc.rotation.y = -Math.atan2(
          target.position[2],
          target.position[0],
        );
        const mat = arc.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.4 + loudestVal * 1.2;
        }
      }
    }
  });

  return (
    <group>
      {/* Central proposal hex. */}
      <mesh
        ref={proposalRef}
        position={[0, 0.3, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>

      {/* Voter hexes — twelve around the ring. */}
      <group ref={votersRef}>
        {voters.map((v, i) => (
          <HexPrism
            key={i}
            position={v.position}
            radius={0.2}
            depth={0.32}
            emissive={emissive}
            emissiveIntensity={0.2}
          />
        ))}
      </group>

      {/* Loudest-vote arc — connects the current leading voter to
          the centre. */}
      <mesh
        ref={arcRef}
        position={[0, 0.3, 0]}
        rotation={[0, 0, 0]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 0.02, 0.02]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Base platter. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={3.2}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
