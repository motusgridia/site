// MotusGridia — Plasma Crystal Swords scene.
//
// Slug: plasma-crystal-swords. Canon: fiction-c1.
//
// Visual metaphor: a single blade standing upright on the plate.
// A hex hilt at the base, a tall translucent crystal blade rising
// out of it, an inner plasma channel pulsing from hilt to tip on a
// breathing curve. A few spark motes drift away from the edge as
// the plasma peaks. A smaller stand hex beside it holds a second
// docked (cool, dim) blade — the weapon when idle, for contrast.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function PlasmaCrystalSwords({
  canon,
}: {
  canon: CodexCanon;
}) {
  const bladeRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const hiltRef = useRef<THREE.Mesh>(null);
  const dockedBladeRef = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.Group>(null);

  const emissive = canonColour(canon);

  /** Number of drifting spark motes. */
  const sparkCount = 6;

  // Spark definitions — each has a start phase and a starting
  // height offset along the blade.
  const sparks = useMemo(
    () =>
      Array.from({ length: sparkCount }, (_, i) => ({
        phase: (i / sparkCount) * 6,
        startY: 0.4 + (i / sparkCount) * 1.0,
        side: i % 2 === 0 ? -1 : 1, // left or right of blade
      })),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Plasma breath — blade glows stronger as the plasma "rises",
    // subtler on cooldown.
    const breath = 0.5 + Math.sin(t * 0.9) * 0.4; // 0.1 - 0.9
    const surge = Math.pow(Math.max(0, Math.sin(t * 0.4)), 2); // 0 - 1

    const blade = bladeRef.current;
    if (blade) {
      const mat = blade.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.3 + breath * 0.4;
      }
    }

    // Core — scales vertically with the plasma level. Thin column
    // that reads as the channel through the crystal.
    const core = coreRef.current;
    if (core) {
      core.scale.y = 0.75 + surge * 0.25;
      const mat = core.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 1.1 + surge * 1.6;
      }
    }

    // Hilt — bright, steady, with small surge linked to the core.
    const hilt = hiltRef.current;
    if (hilt) {
      const mat = hilt.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.7 + surge * 0.4;
      }
    }

    // Docked blade — permanently dim (the off-state).
    const docked = dockedBladeRef.current;
    if (docked) {
      const mat = docked.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.15 + Math.sin(t * 0.3) * 0.05;
      }
    }

    // Sparks — rise along the blade, drift outward, fade out.
    const sg = sparksRef.current;
    if (sg) {
      sg.children.forEach((child, i) => {
        const s = sparks[i];
        if (!s) return;
        const period = 2.2;
        const phase = ((t + s.phase) % period) / period;
        // Lifecycle: 0-0.3 rise fast, 0.3-1.0 drift outward + fade.
        let x: number;
        let y: number;
        let intensity: number;
        if (phase < 0.3) {
          y = s.startY + (phase / 0.3) * 0.6;
          x = -1.0 + s.side * 0.1 * (phase / 0.3);
          intensity = 0.8 + surge * 1.2;
        } else {
          const rest = (phase - 0.3) / 0.7;
          y = s.startY + 0.6 + rest * 0.4;
          x = -1.0 + s.side * (0.1 + rest * 0.4);
          intensity = Math.max(0, (0.8 + surge * 1.2) * (1 - rest));
        }
        child.position.x = x;
        child.position.y = y;
        child.position.z = 0;
        const mat = (child as THREE.Mesh).material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = intensity;
        }
        // Also hide when fully faded.
        child.visible = intensity > 0.05;
      });
    }
  });

  return (
    <group>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2.4}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Live blade composition — at x=-1.0. */}
      {/* Hilt. */}
      <mesh
        ref={hiltRef}
        position={[-1.0, 0.2, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.7}
          metalness={0.65}
          roughness={0.25}
        />
      </mesh>

      {/* Crystal blade — tall, thin, slightly translucent. */}
      <mesh
        ref={bladeRef}
        position={[-1.0, 1.1, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.09, 0.06, 1.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.3}
          roughness={0.15}
          transparent
          opacity={0.72}
        />
      </mesh>

      {/* Plasma core — inside the blade, scales with the surge. */}
      <mesh
        ref={coreRef}
        position={[-1.0, 1.1, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.03, 0.02, 1.35, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.3}
        />
      </mesh>

      {/* Sparks — drift off the live blade. */}
      <group ref={sparksRef}>
        {sparks.map((_, i) => (
          <mesh key={`spark-${i}`} frustumCulled={false}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* Docked blade — at x=+1.0, cool and dim. */}
      <mesh
        position={[1.0, 0.2, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>
      <mesh
        ref={dockedBladeRef}
        position={[1.0, 1.1, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.09, 0.06, 1.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.15}
          metalness={0.35}
          roughness={0.25}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* Stand plate under the docked blade. */}
      <mesh
        position={[1.0, -0.02, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.08, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.2}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
