// MotusGridia — Northern Dominion scene.
//
// Slug: northern-dominion. Canon: fiction-c1.
//
// Visual metaphor: a ring of six clan hexes at irregular heights —
// hegemony without symmetry — surrounding a central buried
// laboratory hex that sits lower than the floor line. Around the lab
// a swarm of twenty subject motes orbits; most are dim (failed
// experiments), a small handful are bright (the 1.5% success rate).
// The clan ring pulses on its own rhythms; the lab pulses on a
// slower, colder beat. Reads as a bloc that outwardly looks
// independent but is coordinated by a hidden industrial project.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Clan = {
  position: readonly [number, number, number];
  phase: number;
};

type Subject = {
  angle: number;
  radius: number;
  /** 1 = bright success, 0 = dim failure. Deterministic. */
  success: number;
  speed: number;
};

export function NorthernDominion({ canon }: { canon: CodexCanon }) {
  const labRef = useRef<THREE.Mesh>(null);
  const clansRef = useRef<THREE.Group>(null);
  const subjectsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Six clans at irregular heights — hegemony without symmetry.
  const clans = useMemo<Clan[]>(() => {
    const arr: Clan[] = [];
    const radius = 2.3;
    // Deterministic height pattern driven by sin — no jitter, stable
    // across renders.
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const height = 0.3 + ((Math.sin(i * 1.7) + 1) / 2) * 0.9;
      arr.push({
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        ] as const,
        phase: i * 0.6,
      });
    }
    return arr;
  }, []);

  // Twenty subjects orbit the lab. Exactly one in fifty of the total
  // (the "1.5%-ish") is marked success=1; the rest are failures.
  // Indices 3 and 11 for visual spacing.
  const subjects = useMemo<Subject[]>(() => {
    const arr: Subject[] = [];
    for (let i = 0; i < 20; i++) {
      // Alternate orbit radii and speeds for visual interest.
      const radius = 0.75 + (i % 3) * 0.12;
      const speed = 0.5 + (i % 4) * 0.12;
      const success = i === 3 || i === 11 ? 1 : 0;
      arr.push({
        angle: (i / 20) * Math.PI * 2,
        radius,
        success,
        speed,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Lab pulse — slow, cold. The industrial project, always running.
    const lab = labRef.current;
    if (lab) {
      const pulse = (Math.sin(t * 0.3) + 1) / 2;
      const mat = lab.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.25 + pulse * 0.2;
      }
    }

    // Clan pulse — per-clan phase, irregular, each clan running its
    // own schedule.
    const cg = clansRef.current;
    if (cg) {
      cg.children.forEach((child, i) => {
        const clan = clans[i];
        if (!clan) return;
        const pulse = (Math.sin(t * 0.6 - clan.phase) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.25 + pulse * 0.5;
        }
      });
    }

    // Subjects orbit the lab. Failures stay dim; successes pulse
    // bright — the 1.5% that lived.
    const sg = subjectsRef.current;
    if (sg) {
      sg.children.forEach((child, i) => {
        const s = subjects[i];
        if (!s) return;
        const angle = s.angle + t * s.speed;
        child.position.x = Math.cos(angle) * s.radius;
        child.position.z = Math.sin(angle) * s.radius;
        child.position.y = -0.05 + Math.sin(t * 0.8 + i) * 0.04;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          if (s.success === 1) {
            const pulse = (Math.sin(t * 1.5 + i) + 1) / 2;
            mat.emissiveIntensity = 0.7 + pulse * 0.6;
          } else {
            mat.emissiveIntensity = 0.1;
          }
        }
      });
    }
  });

  return (
    <group>
      {/* Lab — buried, central, low. Sits below the floor of the
          clan ring to read as hidden infrastructure. */}
      <mesh
        ref={labRef}
        position={[0, -0.25, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.35, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Clan ring — six hexes at irregular heights. */}
      <group ref={clansRef}>
        {clans.map((c, i) => (
          <HexPrism
            key={i}
            position={c.position}
            scale={0.32}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Subjects — twenty motes orbiting the lab. Most dim. Two
          bright (successes). */}
      <group ref={subjectsRef}>
        {subjects.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.06, 0.06, 0.06, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.2}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Base platter — tighter than usual; the dominion's geography
          is concentrated in the north, not spread wide. */}
      <HexPrism
        position={[0, -0.4, 0]}
        radius={3.2}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
