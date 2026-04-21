// MotusGridia — Asteroid Mining scene.
//
// Slug: asteroid-mining. Canon: grounded.
//
// Visual metaphor: a rough-hex asteroid floating high up with a ring
// of small mining drones orbiting it. A spaceport hex sits at the
// base, and a faint vertical beam connects the two — the supply
// line. The asteroid slowly rotates on two axes so the geometry
// reads as irregular rather than as another tidy prism.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function AsteroidMining({ canon }: { canon: CodexCanon }) {
  const asteroidRef = useRef<THREE.Group>(null);
  const dronesRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Five drones at slightly different radii and heights so the ring
  // reads as 3D, not 2D.
  const drones = useMemo(() => {
    const arr: Array<{
      angle: number;
      radius: number;
      yOffset: number;
    }> = [];
    for (let i = 0; i < 5; i++) {
      arr.push({
        angle: (i / 5) * Math.PI * 2,
        radius: 1.3 + (i % 2) * 0.3,
        yOffset: (i % 3) * 0.2 - 0.2,
      });
    }
    return arr;
  }, []);

  // Chunks on the asteroid — small hex shards at irregular positions
  // to break the perfect prism silhouette.
  const chunks = useMemo(() => {
    const arr: Array<{
      position: readonly [number, number, number];
      scale: number;
    }> = [];
    const placements: Array<readonly [number, number, number, number]> = [
      [0.55, 0.2, 0.25, 0.3],
      [-0.4, 0.35, 0.45, 0.25],
      [0.35, -0.18, -0.4, 0.28],
      [-0.5, -0.25, -0.15, 0.22],
      [0.15, 0.45, -0.4, 0.2],
    ];
    for (const [x, y, z, s] of placements) {
      arr.push({ position: [x, y, z] as const, scale: s });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const ast = asteroidRef.current;
    if (ast) {
      // Asteroid tumbles slowly on two axes.
      ast.rotation.y += delta * 0.18;
      ast.rotation.x = Math.sin(t * 0.2) * 0.12;
    }
    const drns = dronesRef.current;
    if (drns) {
      // Drones orbit at a moderate rate. Per-drone angular offset
      // gives staggered positioning; all share the same angular speed
      // so the ring stays a ring.
      drns.rotation.y += delta * 0.4;
      drns.children.forEach((child, i) => {
        const drone = drones[i];
        if (!drone) return;
        const pulse = (Math.sin(t * 2.4 + i * 0.7) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.4 + pulse * 0.6;
        }
      });
    }
    const beam = beamRef.current;
    if (beam) {
      // Beam brightness cycles slowly — payload arriving.
      const cycle = (Math.sin(t * 0.5) + 1) / 2;
      const mat = beam.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.15 + cycle * 0.35;
      }
    }
  });

  return (
    <group>
      {/* Asteroid — a main hex body with chunks grafted onto it to
          break the silhouette. Rotates on two axes. */}
      <group ref={asteroidRef} position={[0, 2, 0]}>
        <HexPrism
          radius={0.75}
          depth={0.6}
          color="#0f0608"
          emissive={emissive}
          emissiveIntensity={0.4}
        />
        {chunks.map((c, i) => (
          <HexPrism
            key={i}
            position={c.position}
            scale={c.scale}
            color="#120609"
            emissive={emissive}
            emissiveIntensity={0.35}
          />
        ))}
      </group>

      {/* Drones — five small hex cells orbiting the asteroid at
          varying radii and heights. Angular positions come from the
          drones array; the parent group rotation does the actual
          orbiting. */}
      <group ref={dronesRef} position={[0, 2, 0]}>
        {drones.map((d, i) => (
          <HexPrism
            key={i}
            position={[
              Math.cos(d.angle) * d.radius,
              d.yOffset,
              Math.sin(d.angle) * d.radius,
            ]}
            scale={0.14}
            emissive={emissive}
            emissiveIntensity={0.55}
          />
        ))}
      </group>

      {/* Supply beam — a vertical box between asteroid and spaceport.
          Not a real material transfer; reads as the logistics line. */}
      <mesh ref={beamRef} position={[0, 1, 0]} frustumCulled={false}>
        <boxGeometry args={[0.08, 2, 0.08]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.2}
          transparent
          opacity={0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Spaceport — wide flat hex at the base. The Hub side of the
          line. */}
      <HexPrism
        position={[0, 0, 0]}
        radius={1.4}
        depth={0.28}
        color="#0b1030"
        emissive={emissive}
        emissiveIntensity={0.3}
      />

      {/* Base platter */}
      <HexPrism
        position={[0, -0.25, 0]}
        radius={2.2}
        depth={0.12}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
