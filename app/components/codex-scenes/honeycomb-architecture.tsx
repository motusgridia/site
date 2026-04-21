// MotusGridia — Honeycomb Architecture scene.
//
// Slug: honeycomb-architecture. Canon: grounded.
//
// Visual metaphor: the defining geometry of the whole project. A
// seven-cell honeycomb — one centre plus six neighbours — sits in
// the foreground. Behind it, a second ring of twelve cells at
// fainter intensity: the rest of the network you can feel the
// presence of but aren't looking at yet.
//
// Motion beats:
//   · Each inner cell breathes on its own phase so the comb never
//     pulses in lockstep — a Grid is a lattice of independent cells
//     that coordinate, not a single organism.
//   · An 11-second "join" cycle promotes one outer-ring cell at a
//     time up to inner-ring intensity, then drops it back. Reads as
//     a Grid being admitted to the network.
//   · The whole cluster drifts in slow Y-rotation so every cell
//     face catches the camera at some point.
//
// Replaces the inline HoneycombCluster scene — this is the single
// concept that defines the visual identity, so the hero earns a
// dedicated module.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

// Axial-to-world for pointy-top hex grid, flat radius = 1.
const SQRT3 = Math.sqrt(3);

function axial(q: number, r: number, spacing = 1): readonly [number, number, number] {
  const x = spacing * SQRT3 * (q + r / 2);
  const z = spacing * 1.5 * r;
  return [x, 0, z] as const;
}

// Inner ring — six neighbours of the centre.
const INNER_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

// Outer ring — twelve cells two steps from centre. Hand-enumerated
// axial coords for a clean ring (distance-2 cells in a hex lattice).
const OUTER_COORDS: ReadonlyArray<readonly [number, number]> = [
  [2, 0],
  [2, -1],
  [2, -2],
  [1, -2],
  [0, -2],
  [-1, -1],
  [-2, 0],
  [-2, 1],
  [-2, 2],
  [-1, 2],
  [0, 2],
  [1, 1],
];

export function HoneycombArchitecture({ canon }: { canon: CodexCanon }) {
  const groupRef = useRef<THREE.Group>(null);
  const centreRef = useRef<THREE.Mesh>(null);
  const innerRefs = useRef<Array<THREE.Mesh | null>>([]);
  const outerRefs = useRef<Array<THREE.Mesh | null>>([]);
  const emissive = canonColour(canon);

  // Stable per-cell phase offsets — deterministic so the breathing
  // pattern doesn't re-randomise on hydration.
  const innerPhases = useMemo(
    () => INNER_DIRS.map((_, i) => i * 1.047),
    [],
  );
  const outerPhases = useMemo(
    () => OUTER_COORDS.map((_, i) => i * 0.523),
    [],
  );

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (g) g.rotation.y += delta * 0.08;

    const t = state.clock.elapsedTime;

    // Centre — steady strong glow with a slow quiet swell.
    const centre = centreRef.current;
    if (centre) {
      const mat = centre.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.55 + Math.sin(t * 0.6) * 0.08;
      }
    }

    // Inner ring — each cell breathes on its own phase. 0.22-0.42
    // range so the six cells together read as the foundational
    // lattice, alive but not busy.
    for (let i = 0; i < innerRefs.current.length; i++) {
      const m = innerRefs.current[i];
      if (!m) continue;
      const mat = m.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      const phase = innerPhases[i] ?? 0;
      mat.emissiveIntensity = 0.28 + (Math.sin(t * 0.9 + phase) + 1) * 0.08;
    }

    // Outer ring + join cycle. Each 11s cycle one outer cell
    // promotes to inner intensity then releases. 12 cells × ~11s
    // = every cell gets the spotlight once every ~2:12.
    const joinPeriod = 11;
    const joinPhase = (t % joinPeriod) / joinPeriod;
    const highlightIndex = Math.floor(
      (t / joinPeriod) % OUTER_COORDS.length,
    );
    // Smooth rise-and-fall shape: 0 at phase 0, peak at 0.5, 0 at 1.
    const highlight = Math.sin(joinPhase * Math.PI);

    for (let i = 0; i < outerRefs.current.length; i++) {
      const m = outerRefs.current[i];
      if (!m) continue;
      const mat = m.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      const phase = outerPhases[i] ?? 0;
      const base = 0.08 + (Math.sin(t * 0.5 + phase) + 1) * 0.02;
      const joinBoost = i === highlightIndex ? highlight * 0.42 : 0;
      mat.emissiveIntensity = base + joinBoost;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Centre cell — the reference Grid. */}
      <mesh
        ref={centreRef}
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.92, 0.92, 0.22, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.55}
          metalness={0.35}
          roughness={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner ring — six neighbours. */}
      {INNER_DIRS.map((dir, i) => {
        const [q, r] = dir;
        const pos = axial(q, r, 1);
        return (
          <mesh
            key={`inner-${i}`}
            ref={(m) => {
              innerRefs.current[i] = m;
            }}
            position={[pos[0], pos[1], pos[2]]}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.92, 0.92, 0.22, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.3}
              metalness={0.35}
              roughness={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Outer ring — twelve distance-2 cells at fainter intensity.
          Slightly lower Y so the inner ring reads as foreground. */}
      {OUTER_COORDS.map((coord, i) => {
        const [q, r] = coord;
        const pos = axial(q, r, 1);
        return (
          <mesh
            key={`outer-${i}`}
            ref={(m) => {
              outerRefs.current[i] = m;
            }}
            position={[pos[0], -0.2, pos[2]]}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.88, 0.88, 0.18, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.1}
              metalness={0.3}
              roughness={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Faint floor hex under everything — gives the scene a
          horizon so the rotating cluster doesn't feel suspended. */}
      <HexPrism
        position={[0, -0.45, 0]}
        radius={4.2}
        depth={0.05}
        emissive={emissive}
        emissiveIntensity={0.04}
      />
    </group>
  );
}
