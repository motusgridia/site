// MotusGridia — Neutral Zone Militia scene.
//
// Slug: neutral-zone-militia. Canon: fiction-c1.
//
// Visual metaphor: a dark hideout hex at the centre of the plate,
// ringed by eight cyber-wolf motes on a tight patrol orbit. The
// hideout emits a heat-sensor "ping" every few seconds — an expanding
// flat ring that the wolves react to. Three assassin motes creep at
// the outer radius on independent orbits; when one gets close enough
// that the hideout's ping would catch them, the nearest wolves surge
// briefly (the pack reacting) and the assassin mote flares, then
// retreats. The scene reads as a perimeter under hunting pressure.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Wolf = {
  baseAngle: number;
  orbitRadius: number;
};

type Assassin = {
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
  /** Slow vertical bob to read as stalking, not orbit. */
  bobSpeed: number;
};

export function NeutralZoneMilitia({
  canon,
}: {
  canon: CodexCanon;
}) {
  const hideoutRef = useRef<THREE.Mesh>(null);
  const pingRef = useRef<THREE.Mesh>(null);
  const wolvesRef = useRef<THREE.Group>(null);
  const assassinsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  const wolves = useMemo<Wolf[]>(() => {
    const arr: Wolf[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      arr.push({
        baseAngle: (i / count) * Math.PI * 2,
        orbitRadius: 1.35 + (i % 2) * 0.15,
      });
    }
    return arr;
  }, []);

  const assassins = useMemo<Assassin[]>(
    () => [
      {
        orbitRadius: 2.7,
        orbitSpeed: 0.18,
        phase: 0,
        bobSpeed: 2.3,
      },
      {
        orbitRadius: 2.9,
        orbitSpeed: -0.14,
        phase: 2.4,
        bobSpeed: 1.9,
      },
      {
        orbitRadius: 2.5,
        orbitSpeed: 0.22,
        phase: 4.7,
        bobSpeed: 2.7,
      },
    ],
    [],
  );

  /** Seconds between sensor pings. */
  const pingPeriod = 5;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Hideout — dim cold pulse. Menacing, not inviting.
    const hideout = hideoutRef.current;
    if (hideout) {
      const mat = hideout.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const pulse = (Math.sin(t * 0.6) + 1) / 2;
        mat.emissiveIntensity = 0.25 + pulse * 0.2;
      }
    }

    // Sensor ping — expands outward each period, then resets. Scale
    // the flat ring; fade emissive as it expands. Ring's local Y
    // becomes world Z after the π/2 X-rotation, so scale X + Y to
    // expand uniformly in the floor plane.
    const ping = pingRef.current;
    if (ping) {
      const phase = (t % pingPeriod) / pingPeriod;
      const radius = 0.3 + phase * 2.6;
      ping.scale.x = radius;
      ping.scale.y = radius;
      const mat = ping.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat && "opacity" in mat) {
        // Pulse sharply at the start of each ping, fade out.
        const intensity = Math.max(0, 1 - phase) * 0.9;
        mat.emissiveIntensity = intensity;
        mat.opacity = Math.max(0.05, 0.55 - phase * 0.5);
      }
    }

    // Wolves — orbit tight around the hideout. A wolf near the
    // current assassin position surges brighter (reacting to scent).
    // Compute assassin positions first so we can match.
    const assassinPositions: { x: number; z: number }[] = [];
    const ag = assassinsRef.current;
    if (ag) {
      ag.children.forEach((child, i) => {
        const a = assassins[i];
        if (!a) return;
        const angle = t * a.orbitSpeed + a.phase;
        const x = Math.cos(angle) * a.orbitRadius;
        const z = Math.sin(angle) * a.orbitRadius;
        child.position.x = x;
        child.position.z = z;
        child.position.y = 0.35 + Math.sin(t * a.bobSpeed + i) * 0.06;
        assassinPositions.push({ x, z });

        // Assassin flares when close to the ping leading edge — the
        // moment the heat-sensor pulse catches their signature.
        const phase = (t % pingPeriod) / pingPeriod;
        const pingRadius = 0.3 + phase * 2.6;
        const dist = Math.hypot(x, z);
        const caught = Math.abs(dist - pingRadius) < 0.35 && phase < 0.6;
        const mat = (child as THREE.Mesh).material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = caught ? 1.1 : 0.35;
        }
      });
    }

    const wg = wolvesRef.current;
    if (wg) {
      wg.children.forEach((child, i) => {
        const w = wolves[i];
        if (!w) return;
        const angle = w.baseAngle + t * 0.65;
        const x = Math.cos(angle) * w.orbitRadius;
        const z = Math.sin(angle) * w.orbitRadius;
        child.position.x = x;
        child.position.z = z;
        child.position.y = 0.18 + Math.sin(t * 3 + i) * 0.04;
        // Face the hideout — the nose always points inward.
        child.rotation.y = -angle + Math.PI / 2;
        const mat = (child as THREE.Mesh).material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Surge toward the closest assassin. If none are close,
          // stay on a low patrol baseline.
          let minDist = Infinity;
          assassinPositions.forEach((ap) => {
            const dx = ap.x - x;
            const dz = ap.z - z;
            const d = Math.hypot(dx, dz);
            if (d < minDist) minDist = d;
          });
          const surge = minDist < 1.2 ? (1.2 - minDist) / 1.2 : 0;
          mat.emissiveIntensity = 0.3 + surge * 0.9;
        }
      });
    }
  });

  return (
    <group>
      {/* Base terrain plate — dark. */}
      <HexPrism
        position={[0, -0.18, 0]}
        radius={3.4}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.06}
      />

      {/* Hideout hex — centre, dim. */}
      <mesh
        ref={hideoutRef}
        position={[0, 0.35, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.6, 0.6, 0.7, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.25}
          metalness={0.55}
          roughness={0.5}
        />
      </mesh>

      {/* Heat-sensor ping — a flat ring that expands on each sweep.
          Transparent so it reads as a pulse, not a wall. Flat into
          the XZ floor plane via −π/2 X-rotation. */}
      <mesh
        ref={pingRef}
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <ringGeometry args={[0.95, 1.0, 32, 1]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.9}
          transparent
          opacity={0.55}
          side={2}
        />
      </mesh>

      {/* Wolves — tight patrol orbit, facing inward. */}
      <group ref={wolvesRef}>
        {wolves.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry
              args={[0.13, 0.16, 0.3, 6, 1, false]}
            />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.3}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* Assassins — outer radius, flare when detected. */}
      <group ref={assassinsRef}>
        {assassins.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry
              args={[0.16, 0.12, 0.38, 6, 1, false]}
            />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.35}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
