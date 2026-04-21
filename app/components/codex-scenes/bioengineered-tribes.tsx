// MotusGridia — Bioengineered Animal Tribes scene.
//
// Slug: bioengineered-tribes. Canon: fiction-c1.
//
// Visual metaphor: three scattered pack-clusters, each with one
// larger elder-beast hex and three smaller pack-member hexes around
// it. Packs pulse on different rhythms from each other — no central
// coordinator, no shared breath. Each pack's members orbit their
// elder on a slow circular path, as if hunting or patrolling. The
// pattern is animate — not mechanical, not human — which is exactly
// the point. These are peoples with their own pulse, refusing to
// sync with the civilisations next door.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Pack = {
  /** Elder position (pack centre). */
  centre: readonly [number, number];
  /** Pack-wide pulse rhythm. */
  rhythm: number;
  /** Orbit direction, +1 or -1. */
  direction: number;
};

export function BioengineeredTribes({
  canon,
}: {
  canon: CodexCanon;
}) {
  const eldersRef = useRef<THREE.Group>(null);
  const membersRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Three packs.
  const packs = useMemo<Pack[]>(() => {
    return [
      { centre: [-1.6, -1.0], rhythm: 0.65, direction: 1 },
      { centre: [1.7, 0.7], rhythm: 0.5, direction: -1 },
      { centre: [-0.2, 1.8], rhythm: 0.8, direction: 1 },
    ];
  }, []);

  // Three pack members per pack. Assigned to the corresponding pack
  // by index (i / 3).
  const memberCount = packs.length * 3;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Elders — slow pulse, each pack on its own rhythm. Elders stay
    // in place.
    const eg = eldersRef.current;
    if (eg) {
      eg.children.forEach((child, i) => {
        const pack = packs[i];
        if (!pack) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * pack.rhythm) + 1) / 2;
          mat.emissiveIntensity = 0.35 + pulse * 0.4;
        }
      });
    }

    // Pack members — orbit their elder on a tight radius. Pulse in
    // loose agreement with their elder but with per-member offset.
    const mg = membersRef.current;
    if (mg) {
      mg.children.forEach((child, i) => {
        const packIdx = Math.floor(i / 3);
        const pack = packs[packIdx];
        if (!pack) return;
        const memberInPack = i % 3;
        const baseAngle = (memberInPack / 3) * Math.PI * 2;
        const orbit = baseAngle + t * 0.4 * pack.direction;
        const radius = 0.55;
        child.position.x = pack.centre[0] + Math.cos(orbit) * radius;
        child.position.z = pack.centre[1] + Math.sin(orbit) * radius;
        child.position.y = 0.2 + Math.sin(t * 1.2 + i) * 0.04;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse =
            (Math.sin(t * pack.rhythm + memberInPack * 0.7) + 1) / 2;
          mat.emissiveIntensity = 0.3 + pulse * 0.35;
        }
      });
    }
  });

  return (
    <group>
      {/* Elder beasts — one per pack, slightly taller than the pack
          members for hierarchy. */}
      <group ref={eldersRef}>
        {packs.map((p, i) => (
          <HexPrism
            key={i}
            position={[p.centre[0], 0.35, p.centre[1]]}
            radius={0.36}
            depth={0.55}
            emissive={emissive}
            emissiveIntensity={0.35}
          />
        ))}
      </group>

      {/* Pack members — three per elder, orbiting tightly. */}
      <group ref={membersRef}>
        {Array.from({ length: memberCount }).map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.14, 0.14, 0.2, 6, 1, false]} />
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

      {/* Base platter. */}
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
