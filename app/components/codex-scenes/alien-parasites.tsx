// MotusGridia — Alien Parasites scene.
//
// Slug: alien-parasites. Canon: fiction-c1.
//
// Visual metaphor: a central host hex. Inside it — represented by
// a thin branching lattice of thin bars that extend outward and
// upward from the host — the parasite's nervous-system branching.
// The branching brightens/dims on an emotion-control cycle: steady
// baseline, brief spike when the host under-controls, steady
// again. A small red "pupil" mote above the host flares briefly
// at spike peaks — the bloodlust-eye tell. A background "rejected
// host" hex off to the side stays dim — the 98.5 % that don't
// survive the graft, represented as a single quiet symbol.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function AlienParasites({
  canon,
}: {
  canon: CodexCanon;
}) {
  const hostRef = useRef<THREE.Mesh>(null);
  const pupilRef = useRef<THREE.Mesh>(null);
  const branchRefs = useRef<(THREE.Mesh | null)[]>([]);
  const failedHostRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Eight branches radiating out of the host body at varying
  // angles and heights — the parasite's lattice. Each has its
  // own phase so the branching doesn't pulse in unison.
  const branches = useMemo(() => {
    const out: {
      angle: number;
      yOffset: number;
      length: number;
      phase: number;
    }[] = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      out.push({
        angle: (i / n) * Math.PI * 2,
        yOffset: 0.2 + (i % 3) * 0.15,
        length: 0.55 + (i % 4) * 0.08,
        phase: (i / n) * 2.0,
      });
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Emotion-control cycle. 12s full period.
    // 0.00-0.50 calm baseline (low intensity).
    // 0.50-0.62 spike (intensity ramps up dangerously).
    // 0.62-0.72 recover (host pulls it back — intensity drops).
    // 0.72-1.00 baseline again.
    const period = 12;
    const phase = (t % period) / period;
    let intensity: number;
    if (phase < 0.5) {
      intensity = 0.35 + Math.sin(t * 0.8) * 0.08;
    } else if (phase < 0.62) {
      intensity = 0.4 + ((phase - 0.5) / 0.12) * 1.2;
    } else if (phase < 0.72) {
      intensity = 1.6 - ((phase - 0.62) / 0.1) * 1.2;
    } else {
      intensity = 0.35 + Math.sin(t * 0.8) * 0.08;
    }

    // Host hex — brightness follows the intensity curve.
    const host = hostRef.current;
    if (host) {
      const mat = host.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = intensity * 0.7;
      }
    }

    // Branches — each brightens with intensity and a local phase
    // offset. At spike peak they all fire close together.
    branches.forEach((br, i) => {
      const mesh = branchRefs.current[i];
      if (!mesh) return;
      const local = Math.sin(t * 1.2 + br.phase) * 0.15 + 1;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = intensity * local * 0.65;
      }
    });

    // Pupil mote — flares during the spike window.
    const pupil = pupilRef.current;
    if (pupil) {
      const flareWindow = phase > 0.5 && phase < 0.7;
      const flareAmount = flareWindow
        ? Math.sin(((phase - 0.5) / 0.2) * Math.PI)
        : 0;
      const mat = pupil.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.3 + flareAmount * 2.0;
      }
    }

    // Failed-host hex — steady dim, slow drift.
    const failed = failedHostRef.current;
    if (failed) {
      const mat = failed.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.18 + Math.sin(t * 0.35) * 0.04;
      }
    }
  });

  return (
    <group>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2.8}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Host — central hex, taller than usual (a standing figure). */}
      <mesh
        ref={hostRef}
        position={[-0.6, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.4, 0.4, 1.1, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.45}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Parasite branches — thin boxes radiating from host upper body. */}
      {branches.map((br, i) => {
        const dx = Math.cos(br.angle) * br.length * 0.5;
        const dz = Math.sin(br.angle) * br.length * 0.5;
        return (
          <mesh
            key={`branch-${i}`}
            ref={(el) => {
              branchRefs.current[i] = el;
            }}
            position={[-0.6 + dx, 0.4 + br.yOffset, dz]}
            rotation={[0, -br.angle, 0]}
            frustumCulled={false}
          >
            <boxGeometry args={[br.length, 0.03, 0.03]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.6}
            />
          </mesh>
        );
      })}

      {/* Pupil — small mote at head height, flares during spikes. */}
      <mesh
        ref={pupilRef}
        position={[-0.6, 1.25, 0.32]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Failed-host hex — small dim silhouette off to the side. */}
      <mesh
        ref={failedHostRef}
        position={[1.6, 0.35, 0.2]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.28, 0.28, 0.7, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.18}
          metalness={0.45}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}
