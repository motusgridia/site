// MotusGridia — Ghost Hunters scene.
//
// Slug: ghost-hunters. Canon: fiction-c1.
//
// Visual metaphor: the plate is split into two zones. A cold cluster
// of six old-architecture hexes sits to the north (positive z).
// A warmer bacterium front sits to the south (negative z). A frontline
// ring of front-edge motes sweeps slowly northward over the course of
// a long cycle, retreats a little, then advances further — the
// bacterium pathogen evolving toward the cold. Two Ghost Hunter motes
// patrol along the advancing frontline; their emissive spikes when
// the front creeps past them (the moment a new sensor reports a hit).
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type OldBuilding = {
  position: readonly [number, number, number];
  height: number;
};

type FrontHex = {
  /** Offset from the advancing front z-line. */
  offsetX: number;
  /** Base z — small jitter around the front line. */
  baseZ: number;
  phase: number;
};

type Hunter = {
  /** X position. Hunters move with the front along Z. */
  x: number;
  phase: number;
};

export function GhostHunters({
  canon,
}: {
  canon: CodexCanon;
}) {
  const oldRef = useRef<THREE.Group>(null);
  const frontRef = useRef<THREE.Group>(null);
  const huntersRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Six old-architecture hexes in the north (+Z). Tall thin silhouettes
  // — the cold ruins the Hunters live in.
  const oldBuildings = useMemo<OldBuilding[]>(
    () => [
      { position: [-1.6, 0.55, 1.8] as const, height: 1.3 },
      { position: [-0.6, 0.7, 2.2] as const, height: 1.6 },
      { position: [0.4, 0.5, 2.0] as const, height: 1.1 },
      { position: [1.4, 0.65, 1.6] as const, height: 1.4 },
      { position: [-1.2, 0.45, 2.6] as const, height: 1.0 },
      { position: [0.9, 0.6, 2.5] as const, height: 1.25 },
    ],
    [],
  );

  // Bacterium front — five hexes along the advancing z-line.
  const frontHexes = useMemo<FrontHex[]>(
    () => [
      { offsetX: -1.8, baseZ: 0, phase: 0 },
      { offsetX: -0.9, baseZ: 0.12, phase: 1.0 },
      { offsetX: 0, baseZ: -0.1, phase: 2.0 },
      { offsetX: 0.9, baseZ: 0.14, phase: 3.0 },
      { offsetX: 1.8, baseZ: -0.04, phase: 4.0 },
    ],
    [],
  );

  // Two ghost-hunter motes patrolling the front.
  const hunters = useMemo<Hunter[]>(
    () => [
      { x: -1.1, phase: 0 },
      { x: 1.3, phase: 2.5 },
    ],
    [],
  );

  /** Full advance-retreat-advance cycle duration. */
  const frontPeriod = 18;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Old buildings — steady cold pulse. Nothing urgent.
    const og = oldRef.current;
    if (og) {
      og.children.forEach((child, i) => {
        const b = oldBuildings[i];
        if (!b) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * 0.5 + i) + 1) / 2;
          mat.emissiveIntensity = 0.15 + pulse * 0.1;
        }
      });
    }

    // Bacterium front — advances along Z. The front sits on a saw
    // curve: 0-0.6 advance from z=-2 toward z=+0.5, 0.6-0.7 hold,
    // 0.7-0.9 partial retreat back to z=-0.5, 0.9-1 advance again.
    // Net effect: the front creeps slowly northward, step by step.
    const phase = (t % frontPeriod) / frontPeriod;
    let frontZ: number;
    if (phase < 0.6) {
      frontZ = -2 + (phase / 0.6) * 2.5; // -2 to +0.5
    } else if (phase < 0.7) {
      frontZ = 0.5;
    } else if (phase < 0.9) {
      frontZ = 0.5 - ((phase - 0.7) / 0.2) * 1; // 0.5 to -0.5
    } else {
      frontZ = -0.5 + ((phase - 0.9) / 0.1) * 1; // -0.5 to +0.5
    }

    const fg = frontRef.current;
    if (fg) {
      fg.children.forEach((child, i) => {
        const f = frontHexes[i];
        if (!f) return;
        child.position.x = f.offsetX;
        child.position.z = frontZ + f.baseZ;
        child.position.y = 0.25;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * 2 + f.phase) + 1) / 2;
          // Front glows hotter when advancing (phase < 0.6).
          const advancing = phase < 0.6 ? 0.3 : 0;
          mat.emissiveIntensity = 0.5 + pulse * 0.35 + advancing;
        }
      });
    }

    // Hunters — hold their X, track the front in Z but stay 0.4
    // ahead of it (on the cold side).
    const hg = huntersRef.current;
    if (hg) {
      hg.children.forEach((child, i) => {
        const h = hunters[i];
        if (!h) return;
        child.position.x = h.x + Math.sin(t * 0.6 + h.phase) * 0.3;
        child.position.z = frontZ + 0.45;
        child.position.y = 0.38 + Math.sin(t * 2 + i) * 0.04;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Spike bright during front advance — they're taking
          // readings and reporting. Dim during retreat/hold.
          const alert = phase < 0.6 ? 0.8 : 0.3;
          const pulse = (Math.sin(t * 3 + h.phase) + 1) / 2;
          mat.emissiveIntensity = alert + pulse * 0.3;
        }
      });
    }
  });

  return (
    <group>
      {/* Base terrain plate. */}
      <HexPrism
        position={[0, -0.15, 0]}
        radius={3.6}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.06}
      />

      {/* Old architecture — north cluster, tall thin silhouettes. */}
      <group ref={oldRef}>
        {oldBuildings.map((b, i) => (
          <mesh
            key={i}
            position={[b.position[0], b.position[1], b.position[2]]}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry
              args={[0.2, 0.2, b.height, 6, 1, false]}
            />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.15}
              metalness={0.3}
              roughness={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Bacterium front — five warm hexes moving in Z. */}
      <group ref={frontRef}>
        {frontHexes.map((_, i) => (
          <HexPrism
            key={i}
            position={[0, 0.25, 0]}
            radius={0.32}
            depth={0.35}
            emissive={emissive}
            emissiveIntensity={0.5}
          />
        ))}
      </group>

      {/* Ghost hunters — two motes following the front at a lead. */}
      <group ref={huntersRef}>
        {hunters.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry
              args={[0.14, 0.1, 0.5, 6, 1, false]}
            />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.8}
              metalness={0.55}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
