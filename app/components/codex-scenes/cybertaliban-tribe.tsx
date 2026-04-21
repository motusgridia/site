// MotusGridia — Cybertaliban Tribe scene.
//
// Slug: cybertaliban-tribe. Canon: fiction-c1.
//
// Visual metaphor: a forested standoff. Central patriarch hex (dark,
// slow pulse — patient, deliberate). Around him, eight warrior motes
// positioned in a loose ring staying mostly still, pulsing on a slow
// breath; they are watching, not moving yet. Beyond the ring, four
// tree-silhouette hexes (taller, thin, dark) frame the scene as
// forest. When the patriarch breathes out (pulse peak) the eight
// warriors synchronise briefly, then fall out of sync again. Reads
// as patient discipline held under the surface.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Warrior = {
  position: readonly [number, number, number];
  phase: number;
};

type Tree = {
  position: readonly [number, number, number];
  phase: number;
};

export function CybertalibanTribe({ canon }: { canon: CodexCanon }) {
  const patriarchRef = useRef<THREE.Mesh>(null);
  const warriorsRef = useRef<THREE.Group>(null);
  const treesRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Eight warriors in a loose ring. Irregular radii for a less
  // manicured, more hunted read.
  const warriors = useMemo<Warrior[]>(() => {
    const arr: Warrior[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 1.4 + ((i * 7) % 5) * 0.08;
      arr.push({
        position: [
          Math.cos(angle) * radius,
          0.15,
          Math.sin(angle) * radius,
        ] as const,
        phase: i * 0.55,
      });
    }
    return arr;
  }, []);

  // Four tall tree silhouettes framing the scene.
  const trees = useMemo<Tree[]>(() => {
    return [
      { position: [-2.6, 0.9, -0.8] as const, phase: 0 },
      { position: [-2.4, 0.9, 1.1] as const, phase: 0.7 },
      { position: [2.5, 0.9, -1.0] as const, phase: 1.4 },
      { position: [2.6, 0.9, 0.9] as const, phase: 2.1 },
    ];
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Patriarch — slow, heavy breath. Base emission low (the dark
    // wrap) with a deep pulse on top.
    const p = patriarchRef.current;
    if (p) {
      const pulse = (Math.sin(t * 0.4) + 1) / 2;
      const mat = p.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.3 + pulse * 0.5;
      }
    }

    // Warriors — mostly out of sync, breathing on their own phases.
    // At each patriarch-peak moment (sin(t*0.4) near 1), the warriors
    // briefly synchronise — a coordinated intake. Otherwise they
    // drift.
    const patriarchPeak = Math.max(
      0,
      Math.sin(t * 0.4),
    );
    const wg = warriorsRef.current;
    if (wg) {
      wg.children.forEach((child, i) => {
        const w = warriors[i];
        if (!w) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const drift = (Math.sin(t * 0.6 - w.phase) + 1) / 2;
          // Synced component spikes at patriarch peak.
          const synced = Math.pow(patriarchPeak, 8);
          mat.emissiveIntensity = 0.2 + drift * 0.3 + synced * 0.6;
        }
      });
    }

    // Trees — very slow, nearly still. The forest does not move
    // much. Small breath to keep them alive.
    const tg = treesRef.current;
    if (tg) {
      tg.children.forEach((child, i) => {
        const tr = trees[i];
        if (!tr) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * 0.25 - tr.phase) + 1) / 2;
          mat.emissiveIntensity = 0.1 + pulse * 0.12;
        }
      });
    }
  });

  return (
    <group>
      {/* Patriarch — centre, dark, heavy. */}
      <mesh
        ref={patriarchRef}
        position={[0, 0.6, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.5, 0.55, 0.9, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.55}
        />
      </mesh>

      {/* Warriors — loose ring, silent and ready. */}
      <group ref={warriorsRef}>
        {warriors.map((w, i) => (
          <HexPrism
            key={i}
            position={w.position}
            radius={0.18}
            depth={0.18}
            emissive={emissive}
            emissiveIntensity={0.2}
          />
        ))}
      </group>

      {/* Trees — tall thin hexes framing the scene. */}
      <group ref={treesRef}>
        {trees.map((tr, i) => (
          <HexPrism
            key={i}
            position={tr.position}
            radius={0.16}
            depth={1.8}
            emissive={emissive}
            emissiveIntensity={0.12}
          />
        ))}
      </group>

      {/* Base platter. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={3.4}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
