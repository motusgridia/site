// MotusGridia — Vargas Model scene.
//
// Slug: vargas-model. Canon: grounded.
//
// Visual metaphor: a central elevated mediator hex flanked by a left
// cluster and a right cluster. The two sides pulse on opposite phases
// — when the left is hot, the right is cool, and vice versa. A small
// mote travels from each side through the mediator to the other,
// representing the referee function. The mediator pulses steadily
// regardless of either side, so the scene reads as a calm centre
// between two alternating flares rather than a three-way fight.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type SideHex = {
  position: readonly [number, number, number];
  scale: number;
};

export function VargasModel({ canon }: { canon: CodexCanon }) {
  const mediatorRef = useRef<THREE.Mesh>(null);
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const leftMoteRef = useRef<THREE.Mesh>(null);
  const rightMoteRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Left cluster — three hexes stacked around x=-2. A loose grouping
  // so it reads as a crowd of opinions rather than a single block.
  const leftCluster = useMemo<SideHex[]>(
    () => [
      { position: [-2.1, 0.1, 0.3], scale: 0.32 },
      { position: [-2.5, 0.15, -0.5], scale: 0.26 },
      { position: [-1.7, 0.05, -0.9], scale: 0.22 },
      { position: [-2.6, 0.1, 0.9], scale: 0.22 },
    ],
    [],
  );

  // Right cluster — mirrored layout so the left/right read as peers.
  const rightCluster = useMemo<SideHex[]>(
    () => [
      { position: [2.1, 0.1, 0.3], scale: 0.32 },
      { position: [2.5, 0.15, -0.5], scale: 0.26 },
      { position: [1.7, 0.05, -0.9], scale: 0.22 },
      { position: [2.6, 0.1, 0.9], scale: 0.22 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Mediator pulses on its own steady rhythm — the referee doesn't
    // take sides, doesn't wait for a side to flare before reacting.
    const mediator = mediatorRef.current;
    if (mediator) {
      const pulse = (Math.sin(t * 0.6) + 1) / 2;
      const mat = mediator.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.9 + pulse * 0.4;
      }
    }

    // Left and right pulse on OPPOSITE phases — ideological flares
    // alternating, not agreeing. sin(t*0.8) vs -sin(t*0.8).
    const leftPulse = (Math.sin(t * 0.8) + 1) / 2;
    const rightPulse = (Math.sin(t * 0.8 + Math.PI) + 1) / 2;

    const left = leftRef.current;
    if (left) {
      left.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.2 + leftPulse * 0.55;
        }
      });
    }
    const right = rightRef.current;
    if (right) {
      right.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.2 + rightPulse * 0.55;
        }
      });
    }

    // Motes travel through the mediator — left → centre → right, and
    // right → centre → left, on opposite halves of the cycle so they
    // don't visually collide. 2.4-second travel for each leg.
    const cycle = (t * 0.4) % 1;
    const leftMote = leftMoteRef.current;
    if (leftMote) {
      // Travels left → right over the first half of the cycle.
      const half = Math.min(cycle / 0.5, 1);
      leftMote.position.x = -2 + half * 4;
      leftMote.position.y = 0.6 + Math.sin(half * Math.PI) * 0.4;
      const mat = leftMote.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = cycle < 0.5 ? 0.9 : 0;
      }
    }
    const rightMote = rightMoteRef.current;
    if (rightMote) {
      // Right → left, second half of the cycle.
      const half = Math.max(0, Math.min((cycle - 0.5) / 0.5, 1));
      rightMote.position.x = 2 - half * 4;
      rightMote.position.y = 0.6 + Math.sin(half * Math.PI) * 0.4;
      const mat = rightMote.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = cycle >= 0.5 ? 0.9 : 0;
      }
    }
  });

  return (
    <group>
      {/* Mediator — elevated, central, pulsing steadily. */}
      <mesh
        ref={mediatorRef}
        position={[0, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.85, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.1}
          metalness={0.35}
          roughness={0.4}
        />
      </mesh>

      {/* Left cluster — four hexes clustered around x=-2. */}
      <group ref={leftRef}>
        {leftCluster.map((h, i) => (
          <HexPrism
            key={i}
            position={h.position}
            scale={h.scale}
            emissive={emissive}
            emissiveIntensity={0.25}
          />
        ))}
      </group>

      {/* Right cluster — mirrored around x=+2. */}
      <group ref={rightRef}>
        {rightCluster.map((h, i) => (
          <HexPrism
            key={i}
            position={h.position}
            scale={h.scale}
            emissive={emissive}
            emissiveIntensity={0.25}
          />
        ))}
      </group>

      {/* Left → right mote. Travels through mediator on first half of
          cycle, carrying a side's argument across to the other side. */}
      <mesh ref={leftMoteRef} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.9}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Right → left mote. Second half. */}
      <mesh ref={rightMoteRef} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.9}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

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
