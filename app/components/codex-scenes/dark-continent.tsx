// MotusGridia — Dark Continent scene.
//
// Slug: dark-continent. Canon: fiction-c1.
//
// Visual metaphor: two planetary-scale anchors — Earth on the left,
// alien homeworld on the right — each with a central coercive-power
// node (dark, low base emission) ringed by its own defensive fleet.
// Between them, a mid-lane of rebel motes crossing back and forth:
// human rebels moving rightward, alien rebels moving leftward, all
// converging in the neutral middle zone where neither central power
// can reach. The two centres pulse on a slow menacing rhythm; the
// rebels pulse faster and brighter, visibly out-of-sync with either
// of the two powers.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Mote = {
  /** Start side: -1 = earth, +1 = alien. */
  side: number;
  /** Vertical offset in the neutral corridor. */
  yOffset: number;
  /** Cycle offset so not all motes sync. */
  phase: number;
};

export function DarkContinent({ canon }: { canon: CodexCanon }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const alienRef = useRef<THREE.Mesh>(null);
  const fleetEarthRef = useRef<THREE.Group>(null);
  const fleetAlienRef = useRef<THREE.Group>(null);
  const motesRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  const earthX = -2.2;
  const alienX = 2.2;

  // Fleet positions (4 per side) orbiting each central power.
  const fleetCount = 4;

  // Eight rebel motes in the mid-corridor — four from each side,
  // crossing in opposite directions.
  const motes = useMemo<Mote[]>(() => {
    const arr: Mote[] = [];
    for (let i = 0; i < 8; i++) {
      arr.push({
        side: i % 2 === 0 ? -1 : 1,
        yOffset: 0.1 + (i / 8) * 0.5,
        phase: (i / 8) * 2 * Math.PI,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Earth centre — slow menacing pulse.
    const earth = earthRef.current;
    if (earth) {
      const pulse = (Math.sin(t * 0.35) + 1) / 2;
      const mat = earth.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.25 + pulse * 0.3;
      }
    }

    // Alien centre — slow, offset rhythm so the two powers don't
    // breathe together.
    const alien = alienRef.current;
    if (alien) {
      const pulse = (Math.sin(t * 0.32 + Math.PI) + 1) / 2;
      const mat = alien.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.25 + pulse * 0.3;
      }
    }

    // Earth fleet — orbits earth at radius 0.8.
    const fe = fleetEarthRef.current;
    if (fe) {
      fe.children.forEach((child, i) => {
        const angle = (i / fleetCount) * Math.PI * 2 + t * 0.3;
        child.position.x = earthX + Math.cos(angle) * 0.8;
        child.position.z = Math.sin(angle) * 0.6;
        child.position.y = 0.4;
      });
    }

    // Alien fleet — orbits alien at radius 0.8 the other direction.
    const fa = fleetAlienRef.current;
    if (fa) {
      fa.children.forEach((child, i) => {
        const angle = (i / fleetCount) * Math.PI * 2 - t * 0.3;
        child.position.x = alienX + Math.cos(angle) * 0.8;
        child.position.z = Math.sin(angle) * 0.6;
        child.position.y = 0.4;
      });
    }

    // Rebel motes — travel from their start side across the mid-
    // corridor, loop back, and repeat. Out-of-sync with both
    // centres.
    const mg = motesRef.current;
    if (mg) {
      mg.children.forEach((child, i) => {
        const m = motes[i];
        if (!m) return;
        // 0 → 1 traverse, 1 → 2 return, modulo 2.
        const cycle = (t * 0.25 + m.phase) % 2;
        const progress = cycle < 1 ? cycle : 2 - cycle;
        // Start at the mote's home side, end at the opposite.
        const startX = m.side * 1.6;
        const endX = m.side * -1.6;
        child.position.x = startX + (endX - startX) * progress;
        child.position.y = m.yOffset;
        // Z zig-zag so motes don't clump on a line.
        child.position.z =
          Math.sin(progress * Math.PI * 2 + m.phase) * 0.3;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * 2 + i) + 1) / 2;
          // Rebels pulse fast and bright — visibly different from
          // the slow coercive centres.
          mat.emissiveIntensity = 0.85 + pulse * 0.5;
        }
      });
    }
  });

  return (
    <group>
      {/* Earth centre — dark, coercive. */}
      <mesh
        ref={earthRef}
        position={[earthX, 0.5, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.55, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.55}
        />
      </mesh>

      {/* Alien centre — dark, coercive. */}
      <mesh
        ref={alienRef}
        position={[alienX, 0.5, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.55, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.55}
        />
      </mesh>

      {/* Earth fleet. */}
      <group ref={fleetEarthRef}>
        {Array.from({ length: fleetCount }).map((_, i) => (
          <HexPrism
            key={i}
            position={[earthX + 0.8, 0.4, 0]}
            radius={0.14}
            depth={0.12}
            emissive={emissive}
            emissiveIntensity={0.5}
          />
        ))}
      </group>

      {/* Alien fleet. */}
      <group ref={fleetAlienRef}>
        {Array.from({ length: fleetCount }).map((_, i) => (
          <HexPrism
            key={i}
            position={[alienX + 0.8, 0.4, 0]}
            radius={0.14}
            depth={0.12}
            emissive={emissive}
            emissiveIntensity={0.5}
          />
        ))}
      </group>

      {/* Rebel motes — in the mid-corridor. */}
      <group ref={motesRef}>
        {motes.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.09, 0.09, 0.09, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={1}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Wide base platter — this scene spans a larger X extent. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={3.8}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
