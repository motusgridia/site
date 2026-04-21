// MotusGridia — Flight in the Grid World scene.
//
// Slug: flight. Canon: fiction-c1.
//
// Visual metaphor: a small landing hex pad at scene centre. Three
// aircraft (represented as horizontally-oriented long-axis hex
// prisms) at varying altitudes cruising on independent slow arcs
// around the scene. Aircraft pulse on a gentle calm rhythm — the
// network's slower-by-design aviation. A letter-of-reasoning mote
// drifts up from the base toward each aircraft periodically, queued
// from a stack of dim waiting motes at the pad edge. Reads as a
// system that operates, just not at high frequency.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Aircraft = {
  /** Orbit radius around the pad. */
  radius: number;
  /** Orbit speed in rad/s. */
  speed: number;
  /** Altitude. */
  y: number;
  /** Starting angle offset. */
  phase: number;
  /** Orbit direction, +1 or -1. */
  direction: number;
};

export function Flight({ canon }: { canon: CodexCanon }) {
  const padRef = useRef<THREE.Mesh>(null);
  const aircraftRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Three aircraft on gentle independent orbits at different
  // altitudes — no synchronisation, no traffic pattern.
  const aircraft = useMemo<Aircraft[]>(() => {
    return [
      {
        radius: 2.1,
        speed: 0.22,
        y: 1.1,
        phase: 0,
        direction: 1,
      },
      {
        radius: 2.6,
        speed: 0.17,
        y: 1.6,
        phase: 1.5,
        direction: -1,
      },
      {
        radius: 1.7,
        speed: 0.28,
        y: 0.8,
        phase: 3,
        direction: 1,
      },
    ];
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Landing pad — gentle calm pulse.
    const pad = padRef.current;
    if (pad) {
      const pulse = (Math.sin(t * 0.5) + 1) / 2;
      const mat = pad.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.3 + pulse * 0.2;
      }
    }

    // Aircraft — cruise on their orbits. Each aircraft oriented
    // tangentially to its path so it reads as moving, not hovering.
    const ag = aircraftRef.current;
    if (ag) {
      ag.children.forEach((child, i) => {
        const a = aircraft[i];
        if (!a) return;
        const angle = a.phase + t * a.speed * a.direction;
        child.position.x = Math.cos(angle) * a.radius;
        child.position.z = Math.sin(angle) * a.radius;
        child.position.y = a.y + Math.sin(t * 0.4 + i) * 0.05;
        // Rotate to face the direction of travel.
        child.rotation.y =
          -angle + (a.direction > 0 ? Math.PI / 2 : -Math.PI / 2);
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * 0.7 + i) + 1) / 2;
          mat.emissiveIntensity = 0.55 + pulse * 0.3;
        }
      });
    }
  });

  return (
    <group>
      {/* Landing pad — low, central. */}
      <mesh
        ref={padRef}
        position={[0, 0.05, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.65, 0.75, 0.12, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      {/* Aircraft — three at varying altitudes. Long-axis prisms
          oriented tangentially. */}
      <group ref={aircraftRef}>
        {aircraft.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.08, 0.12, 0.55, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.6}
              metalness={0.5}
              roughness={0.35}
            />
          </mesh>
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
