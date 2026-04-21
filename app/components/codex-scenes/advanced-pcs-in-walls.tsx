// MotusGridia — Advanced PCs in Walls scene.
//
// Slug: advanced-pcs-in-walls. Canon: fiction-c1.
//
// Visual metaphor: the home floor sits flat, surrounded by six wall-
// panel hexes. Each wall is a compute cell running its own busy/idle
// cycle — emissive pulses on an independent rhythm for each wall,
// standing for the PC inside it doing work. A wireless hub mote sits
// above each wall, blinking when it answers a request. Three small
// appliance motes drift inside the room and gravitate toward whichever
// wall is closest — when one parks near a wall, that wall's hub flares
// brighter (a device is charging).
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Wall = {
  position: readonly [number, number, number];
  hubPosition: readonly [number, number, number];
  /** Each wall runs compute on its own rhythm. */
  workPhase: number;
  workSpeed: number;
};

type Appliance = {
  orbitRadius: number;
  orbitSpeed: number;
  phase: number;
  /** Slightly above the floor — devices drifting between walls. */
  y: number;
};

export function AdvancedPcsInWalls({
  canon,
}: {
  canon: CodexCanon;
}) {
  const wallsRef = useRef<THREE.Group>(null);
  const hubsRef = useRef<THREE.Group>(null);
  const appliancesRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  const walls = useMemo<Wall[]>(() => {
    const arr: Wall[] = [];
    const radius = 1.65;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      arr.push({
        position: [x, 0.35, z] as const,
        hubPosition: [x * 0.82, 0.72, z * 0.82] as const,
        workPhase: i * 0.9,
        workSpeed: 1.2 + (i % 3) * 0.35,
      });
    }
    return arr;
  }, []);

  const appliances = useMemo<Appliance[]>(
    () => [
      { orbitRadius: 0.9, orbitSpeed: 0.32, phase: 0, y: 0.28 },
      { orbitRadius: 1.1, orbitSpeed: -0.24, phase: 2.0, y: 0.42 },
      { orbitRadius: 0.75, orbitSpeed: 0.4, phase: 4.1, y: 0.18 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Walls — each cycles on its own compute rhythm. A wall with work
    // in progress glows brighter. Between bursts it settles to the
    // idle floor.
    const wg = wallsRef.current;
    if (wg) {
      wg.children.forEach((child, i) => {
        const w = walls[i];
        if (!w) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse =
            (Math.sin(t * w.workSpeed + w.workPhase) + 1) / 2;
          // Keep the floor high — the compute cell is always on.
          mat.emissiveIntensity = 0.4 + pulse * 0.6;
        }
      });
    }

    // Appliances — orbit inside the room, bob a little. Track their
    // current XZ for the hub proximity lookup below.
    const appliancePositions: { x: number; z: number }[] = [];
    const ag = appliancesRef.current;
    if (ag) {
      ag.children.forEach((child, i) => {
        const a = appliances[i];
        if (!a) return;
        const angle = t * a.orbitSpeed + a.phase;
        const x = Math.cos(angle) * a.orbitRadius;
        const z = Math.sin(angle) * a.orbitRadius;
        child.position.x = x;
        child.position.z = z;
        child.position.y = a.y + Math.sin(t * 2 + i) * 0.04;
        appliancePositions.push({ x, z });
      });
    }

    // Hubs — each wall's hub answers when an appliance is closest to
    // it. Compute the nearest-wall assignment per appliance once, then
    // push a brightness delta into the matched hubs.
    const hg = hubsRef.current;
    if (hg) {
      // Start each hub at its base cycle.
      hg.children.forEach((child, i) => {
        const w = walls[i];
        if (!w) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse =
            (Math.sin(t * 2.2 + w.workPhase) + 1) / 2;
          mat.emissiveIntensity = 0.45 + pulse * 0.3;
        }
      });

      // For each appliance, find the nearest wall and boost that hub.
      appliancePositions.forEach((ap) => {
        let bestIdx = 0;
        let bestDist = Infinity;
        walls.forEach((w, i) => {
          const dx = w.position[0] - ap.x;
          const dz = w.position[2] - ap.z;
          const d = dx * dx + dz * dz;
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        });
        const hubMesh = hg.children[bestIdx] as
          | THREE.Mesh
          | undefined;
        if (!hubMesh) return;
        const mat = hubMesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Nearer → brighter. Clamp so a single appliance still reads.
          const proximity = 1 / (1 + bestDist * 2);
          mat.emissiveIntensity += proximity * 0.9;
        }
      });
    }
  });

  return (
    <group>
      {/* Floor — the home's footprint. Wide and thin. */}
      <HexPrism
        position={[0, -0.15, 0]}
        radius={2.3}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.12}
      />

      {/* Wall panels — six hexes around the periphery, each a compute
          cell running its own work rhythm. */}
      <group ref={wallsRef}>
        {walls.map((w, i) => (
          <HexPrism
            key={i}
            position={w.position}
            radius={0.42}
            depth={0.9}
            emissive={emissive}
            emissiveIntensity={0.45}
          />
        ))}
      </group>

      {/* Wireless hubs — small hexes hanging above each wall, blinking
          to answer appliance requests. */}
      <group ref={hubsRef}>
        {walls.map((w, i) => (
          <mesh
            key={i}
            position={[w.hubPosition[0], w.hubPosition[1], w.hubPosition[2]]}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry
              args={[0.14, 0.14, 0.1, 6, 1, false]}
            />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.5}
              metalness={0.55}
              roughness={0.35}
            />
          </mesh>
        ))}
      </group>

      {/* Appliance motes — small hexes drifting inside the room. Each
          charges off the nearest hub. */}
      <group ref={appliancesRef}>
        {appliances.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry
              args={[0.11, 0.11, 0.12, 6, 1, false]}
            />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.85}
              metalness={0.4}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
