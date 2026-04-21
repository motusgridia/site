// MotusGridia — Advanced Materials scene.
//
// Slug: advanced-materials. Canon: fiction-c1.
//
// Visual metaphor: a central time-crystal cell that never dims — the
// pulse is there but its trough never reaches zero, reading as a
// lattice in a ground state that does not need time to pass. Around
// it, six Tesla-tower nodes at the mid-ring carry energy between
// themselves on a traveling arc — one lit pair at a time, rotating
// around the ring. Below the crystal, a reclaimed-material feed tile
// pulses on a different rhythm — the plasma programme, reprocessing
// the twentieth century's leftover stock.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Node = {
  position: readonly [number, number, number];
  angle: number;
};

export function AdvancedMaterials({ canon }: { canon: CodexCanon }) {
  const crystalRef = useRef<THREE.Mesh>(null);
  const plasmaRef = useRef<THREE.Mesh>(null);
  const nodesRef = useRef<THREE.Group>(null);
  const arcRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Six Tesla-tower nodes at the mid-ring.
  const nodes = useMemo<Node[]>(() => {
    const arr: Node[] = [];
    const radius = 1.9;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      arr.push({
        position: [
          Math.cos(angle) * radius,
          0.4,
          Math.sin(angle) * radius,
        ] as const,
        angle,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Crystal — pulse never reaches zero. A lattice in motion, holding
    // charge without discharge. Emissive floor is intentionally high.
    const crystal = crystalRef.current;
    if (crystal) {
      const pulse = (Math.sin(t * 0.8) + 1) / 2;
      const mat = crystal.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.9 + pulse * 0.4;
      }
    }

    // Plasma feed — different rhythm, slower and hotter. The old fuel
    // being reprocessed.
    const plasma = plasmaRef.current;
    if (plasma) {
      const pulse = (Math.sin(t * 0.45) + 1) / 2;
      const mat = plasma.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + pulse * 0.5;
      }
    }

    // Tesla nodes — the active pair rotates around the ring. At any
    // given moment one pair is bright (the transfer is "between" them),
    // the rest idle on a baseline.
    const ng = nodesRef.current;
    if (ng) {
      const active = Math.floor(t * 0.9) % 6;
      ng.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const isActive = i === active || (i + 1) % 6 === active;
          if (isActive) {
            const pulse = (Math.sin(t * 3 + i) + 1) / 2;
            mat.emissiveIntensity = 0.8 + pulse * 0.6;
          } else {
            mat.emissiveIntensity = 0.25;
          }
        }
      });
    }

    // Transfer arc — a thin box-geometry that sits between the active
    // pair at any moment. Rotates around the crystal as the active
    // pair rotates.
    const arc = arcRef.current;
    if (arc) {
      const active = Math.floor(t * 0.9) % 6;
      const a = nodes[active];
      const b = nodes[(active + 1) % 6];
      if (a && b) {
        const midX = (a.position[0] + b.position[0]) / 2;
        const midZ = (a.position[2] + b.position[2]) / 2;
        arc.position.x = midX;
        arc.position.z = midZ;
        arc.position.y = 0.4;
        const dx = b.position[0] - a.position[0];
        const dz = b.position[2] - a.position[2];
        const length = Math.hypot(dx, dz);
        arc.scale.x = length;
        arc.rotation.y = -Math.atan2(dz, dx);
        const mat = arc.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * 5) + 1) / 2;
          mat.emissiveIntensity = 0.9 + pulse * 0.6;
        }
      }
    }
  });

  return (
    <group>
      {/* Time crystal — central hex, always lit. The lattice in a
          ground state of motion. */}
      <mesh
        ref={crystalRef}
        position={[0, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.9, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.0}
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>

      {/* Tesla-tower nodes — six at the mid-ring. */}
      <group ref={nodesRef}>
        {nodes.map((n, i) => (
          <HexPrism
            key={i}
            position={n.position}
            radius={0.22}
            depth={0.6}
            emissive={emissive}
            emissiveIntensity={0.25}
          />
        ))}
      </group>

      {/* Transfer arc — moves between the active pair. */}
      <mesh
        ref={arcRef}
        position={[0, 0.4, 0]}
        rotation={[0, 0, 0]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 0.02, 0.02]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.0}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Plasma feed — recessed below the crystal. The reprocessing
          line carrying leftover twentieth-century fuel back into the
          system as plasma. */}
      <mesh
        ref={plasmaRef}
        position={[0, -0.1, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.7, 0.7, 0.15, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.55}
        />
      </mesh>

      {/* Base platter. */}
      <HexPrism
        position={[0, -0.4, 0]}
        radius={3.4}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
