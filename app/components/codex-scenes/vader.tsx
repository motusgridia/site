// MotusGridia — Vader scene.
//
// Slug: vader. Canon: fiction-c1.
//
// Visual metaphor: a central body hex with three containment rings
// orbiting it at different radii, heights, and speeds. Each ring has
// six satellite hex cells evenly spaced. The body pulses hot and
// bright — raw power. The rings read as the suit's layers: they
// rotate around the body containing what's inside. The innermost ring
// rotates slowly and tightly; outer rings rotate faster and tilted.
// No body without rings, no rings without body.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type RingConfig = {
  radius: number;
  height: number;
  /** radians/sec */
  speed: number;
  /** radians — tilt around X axis */
  tilt: number;
  satellites: number;
  scale: number;
};

export function Vader({ canon }: { canon: CodexCanon }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Group>(null);
  const midRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  const rings = useMemo<RingConfig[]>(
    () => [
      { radius: 1.1, height: 0.8, speed: 0.2, tilt: 0, satellites: 6, scale: 0.22 },
      { radius: 1.7, height: 1.0, speed: 0.45, tilt: 0.25, satellites: 6, scale: 0.2 },
      { radius: 2.4, height: 0.6, speed: -0.3, tilt: -0.2, satellites: 6, scale: 0.18 },
    ],
    [],
  );

  // Satellite positions per ring — precomputed angles and base positions.
  const satellitesByRing = useMemo(() => {
    return rings.map((ring) => {
      const arr: Array<readonly [number, number, number]> = [];
      for (let i = 0; i < ring.satellites; i++) {
        const angle = (i / ring.satellites) * Math.PI * 2;
        arr.push([
          Math.cos(angle) * ring.radius,
          ring.height,
          Math.sin(angle) * ring.radius,
        ] as const);
      }
      return arr;
    });
  }, [rings]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Body pulses fast and bright — raw power barely contained.
    const body = bodyRef.current;
    if (body) {
      const pulse = (Math.sin(t * 1.4) + 1) / 2;
      const mat = body.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 1.5 + pulse * 0.8;
      }
    }

    // Each ring rotates independently. Tilts set once on mount.
    const groups = [innerRef.current, midRef.current, outerRef.current];
    groups.forEach((group, idx) => {
      if (!group) return;
      const ring = rings[idx];
      if (!ring) return;
      group.rotation.y = t * ring.speed;
      group.rotation.x = ring.tilt;
      // Satellites pulse on a per-ring rhythm — the containment is
      // active, not static.
      const pulse = (Math.sin(t * 0.8 + idx * 1.0) + 1) / 2;
      group.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.25 + pulse * 0.45;
        }
      });
    });
  });

  const refs = [innerRef, midRef, outerRef] as const;

  return (
    <group>
      {/* Body — tall central hex, hot, bright. The person inside. */}
      <mesh
        ref={bodyRef}
        position={[0, 0.9, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 1.7, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.8}
          metalness={0.5}
          roughness={0.25}
        />
      </mesh>

      {/* Three containment rings — each a rotating group of six
          satellites at a fixed radius and height. */}
      {rings.map((ring, idx) => {
        const ringRef = refs[idx];
        const sats = satellitesByRing[idx];
        if (!ringRef || !sats) return null;
        return (
          <group key={idx} ref={ringRef}>
            {sats.map((pos, i) => (
              <HexPrism
                key={i}
                position={pos}
                scale={ring.scale}
                emissive={emissive}
                emissiveIntensity={0.4}
              />
            ))}
          </group>
        );
      })}

      {/* Base platter */}
      <HexPrism
        position={[0, -0.15, 0]}
        radius={3.4}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
