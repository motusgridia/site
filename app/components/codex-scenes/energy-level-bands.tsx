// MotusGridia — Energy-Level Bands scene.
//
// Slug: energy-level-bands. Canon: fiction-c1.
//
// Visual metaphor: a central wearer hex. A vertical energy column
// rises beside it, scaling up and down on an organic breath-and-burst
// curve — resting state, spike, cooldown. An AR-overlay panel floats
// above the wearer showing the same level in a thin horizontal strip.
// A small band hex orbits the wearer's wrist (shoulder-height) — the
// physical reader. A second band, larger and slower, orbits
// opposite-direction above — the composite parasite-and-chip wearer
// reference, showing what a dual-band signature looks like.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function EnergyLevelBands({
  canon,
}: {
  canon: CodexCanon;
}) {
  const wearerRef = useRef<THREE.Mesh>(null);
  const columnRef = useRef<THREE.Mesh>(null);
  const overlayRef = useRef<THREE.Mesh>(null);
  const bandsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  /** Natural column height when the wearer is at peak energy. */
  const columnMaxHeight = 1.6;

  const bands = useMemo(
    () => [
      { radius: 0.85, height: 0.18, speed: 1.1 },
      { radius: 1.1, height: 0.95, speed: -0.6 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Energy level curve — rest/spike/cooldown shape. A steady base
    // with an occasional burst.
    const rest = 0.35;
    const burst =
      Math.max(0, Math.sin(t * 0.5)) *
      Math.max(0, Math.sin(t * 1.3));
    const level = rest + burst * 0.6; // 0.35 to ~0.95

    // Wearer — brightness tracks the level.
    const wearer = wearerRef.current;
    if (wearer) {
      const mat = wearer.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + level * 0.8;
      }
    }

    // Column — scale.y tracks the level. Position.y lifts so the
    // bottom stays on the plate.
    const column = columnRef.current;
    if (column) {
      column.scale.y = 0.15 + level * 0.85;
      column.position.y = (columnMaxHeight * column.scale.y) / 2;
      const mat = column.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.5 + level * 0.7;
      }
    }

    // Overlay panel — tracks level via X-scale (horizontal meter).
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.scale.x = 0.35 + level * 0.65;
      const mat = overlay.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.45 + level * 0.6;
      }
    }

    // Bands — orbit the wearer. Slower outer band is the composite
    // parasite+chip band.
    const bg = bandsRef.current;
    if (bg) {
      bg.children.forEach((child, i) => {
        const b = bands[i];
        if (!b) return;
        const angle = t * b.speed + i * 1.7;
        child.position.x = Math.cos(angle) * b.radius;
        child.position.z = Math.sin(angle) * b.radius;
        child.position.y = b.height + Math.sin(t * 2 + i) * 0.03;
        child.rotation.y = -angle + Math.PI / 2;
        const mat = (child as THREE.Mesh).material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.6 + level * 0.5;
        }
      });
    }
  });

  return (
    <group>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2.6}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Wearer — central hex. */}
      <mesh
        ref={wearerRef}
        position={[0, 0.3, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.35, 0.35, 0.55, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.35}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Energy column — vertical meter beside the wearer. */}
      <mesh
        ref={columnRef}
        position={[0.85, 0.1, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry
          args={[0.14, 0.14, columnMaxHeight, 6, 1, false]}
        />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>

      {/* AR overlay panel — thin flat strip above the wearer.
          World-aligned so the horizontal scale reads as a meter
          regardless of camera angle around the scene. */}
      <mesh
        ref={overlayRef}
        position={[0, 1.1, 0]}
        frustumCulled={false}
      >
        <boxGeometry args={[1.0, 0.08, 0.14]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.45}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      {/* Bands — two hexes orbiting the wearer, different rhythms. */}
      <group ref={bandsRef}>
        {bands.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry
              args={[0.11, 0.11, 0.1, 6, 1, false]}
            />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.6}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
