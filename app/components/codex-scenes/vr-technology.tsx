// MotusGridia — VR Technology scene.
//
// Slug: vr-technology. Canon: grounded.
//
// Visual metaphor: a translucent hex chamber sits at centre, and
// inside it a small cluster of hex mini-objects rotates faster than
// the chamber itself. The chamber is the hardware; the cluster is
// the world the user is currently inside. Outer chamber gently
// pulses as if rendering; inner cluster rotates on a different axis
// to read as "alive."
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function VrTechnology({ canon }: { canon: CodexCanon }) {
  const chamberRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const chamber = chamberRef.current;
    if (chamber) {
      // Chamber rotates slowly — the headset has shape, not motion.
      chamber.rotation.y += delta * 0.08;
      const mat = chamber.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        // Render pulse — bright when the chamber is "painting" the
        // next frame of the sim.
        mat.emissiveIntensity = 0.4 + ((Math.sin(t * 1.1) + 1) / 2) * 0.4;
      }
    }
    const inner = innerRef.current;
    if (inner) {
      // Inner world rotates faster and on a different axis so the
      // contents clearly read as unrelated to the chamber's pose.
      inner.rotation.y += delta * 0.35;
      inner.rotation.x = Math.sin(t * 0.4) * 0.2;
    }
  });

  return (
    <group>
      {/* Outer chamber — translucent hex prism. The hardware shell
          of the VR rig. Transparent material so the inner world
          reads through it without obstruction. */}
      <mesh
        ref={chamberRef}
        position={[0, 0.9, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1.35, 1.35, 1.6, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.2}
          roughness={0.3}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner world — a small cluster of hex objects representing
          whatever simulation the user is currently inside. Rotates
          independently of the chamber. */}
      <group ref={innerRef} position={[0, 0.9, 0]}>
        <HexPrism
          radius={0.25}
          depth={0.35}
          emissive={emissive}
          emissiveIntensity={1.1}
        />
        <HexPrism
          position={[0.55, 0.2, 0]}
          scale={0.18}
          emissive={emissive}
          emissiveIntensity={0.7}
        />
        <HexPrism
          position={[-0.5, -0.1, 0.3]}
          scale={0.22}
          emissive={emissive}
          emissiveIntensity={0.7}
        />
        <HexPrism
          position={[0.1, -0.35, -0.5]}
          scale={0.15}
          emissive={emissive}
          emissiveIntensity={0.8}
        />
        <HexPrism
          position={[-0.4, 0.4, -0.4]}
          scale={0.16}
          emissive={emissive}
          emissiveIntensity={0.7}
        />
      </group>

      {/* Base platter — the pod the chamber sits in. */}
      <HexPrism
        position={[0, -0.05, 0]}
        radius={1.8}
        depth={0.22}
        color="#0b1030"
        emissive={emissive}
        emissiveIntensity={0.15}
      />
    </group>
  );
}
