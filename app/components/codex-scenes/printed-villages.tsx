// MotusGridia — 3D-Printed Villages scene.
//
// Slug: printed-villages. Canon: fiction-c1.
//
// Visual metaphor: five home sites on a shared plate. Each site runs
// its own build cycle — scale.y climbs from nearly-flat to full height
// over a few seconds, holds briefly as a finished home, then resets
// and starts again (the next print job). A printer mote travels
// between the currently-building site and the silo at the back of the
// plate, so the build cadence reads as printer output, not
// spontaneous growth. A material silo hex sits back-right, pulsing
// slowly — the feedstock source.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Site = {
  position: readonly [number, number, number];
  /** Peak build height for this site. */
  height: number;
  /** Full cycle time (seconds) from foundation to finished build. */
  period: number;
  phase: number;
};

export function PrintedVillages({
  canon,
}: {
  canon: CodexCanon;
}) {
  const sitesRef = useRef<THREE.Group>(null);
  const printerRef = useRef<THREE.Mesh>(null);
  const siloRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Five home sites, irregular spacing — a village, not a grid.
  const sites = useMemo<Site[]>(
    () => [
      {
        position: [-1.5, 0, -0.8] as const,
        height: 0.85,
        period: 5,
        phase: 0,
      },
      {
        position: [-0.3, 0, -1.4] as const,
        height: 1.1,
        period: 6.5,
        phase: 1.4,
      },
      {
        position: [1.2, 0, -0.4] as const,
        height: 0.75,
        period: 4.5,
        phase: 2.8,
      },
      {
        position: [0.4, 0, 1.0] as const,
        height: 0.95,
        period: 7,
        phase: 4.1,
      },
      {
        position: [-1.3, 0, 0.8] as const,
        height: 0.7,
        period: 5.5,
        phase: 0.6,
      },
    ],
    [],
  );

  // Silo sits back-right, off the village itself.
  const siloPosition: readonly [number, number, number] = [
    2.1, 0.35, -1.9,
  ];

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Sites — each one scales up over its build cycle, holds briefly,
    // drops back to foundation, restarts. `progress` in [0,1] drives
    // both scale.y and emissive.
    const sg = sitesRef.current;
    if (sg) {
      sg.children.forEach((child, i) => {
        const s = sites[i];
        if (!s) return;
        const phase = ((t + s.phase) % s.period) / s.period;
        // Build curve: 0-0.7 ramp up, 0.7-0.9 hold finished, 0.9-1 drop.
        let progress: number;
        if (phase < 0.7) {
          progress = phase / 0.7;
        } else if (phase < 0.9) {
          progress = 1;
        } else {
          progress = Math.max(0, 1 - (phase - 0.9) / 0.1);
        }
        const mesh = child as THREE.Mesh;
        mesh.scale.y = 0.08 + progress * 0.92;
        // Y-position follows because the geometry centre lifts as
        // scale.y climbs — keep the floor at y=0.
        mesh.position.y = (s.height * mesh.scale.y) / 2;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Flash brighter on completion.
          const flash = phase > 0.65 && phase < 0.9 ? 0.35 : 0;
          mat.emissiveIntensity = 0.35 + progress * 0.4 + flash;
        }
      });
    }

    // Printer — pick the currently-building site (highest non-complete
    // progress) and move the printer hex between silo and that site.
    let targetIdx = 0;
    let targetProgress = -1;
    sites.forEach((s, i) => {
      const phase = ((t + s.phase) % s.period) / s.period;
      if (phase < 0.7 && phase > targetProgress) {
        targetProgress = phase;
        targetIdx = i;
      }
    });
    const printer = printerRef.current;
    const target = sites[targetIdx];
    if (printer && target) {
      // Sweep between silo and target on a short cycle.
      const sweep = (Math.sin(t * 1.4) + 1) / 2;
      printer.position.x =
        siloPosition[0] * (1 - sweep) + target.position[0] * sweep;
      printer.position.z =
        siloPosition[2] * (1 - sweep) + target.position[2] * sweep;
      printer.position.y = 0.85 + Math.sin(t * 3) * 0.05;
      const mat = printer.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const pulse = (Math.sin(t * 5) + 1) / 2;
        mat.emissiveIntensity = 0.8 + pulse * 0.4;
      }
    }

    // Silo — steady slow pulse.
    const silo = siloRef.current;
    if (silo) {
      const mat = silo.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const pulse = (Math.sin(t * 0.7) + 1) / 2;
        mat.emissiveIntensity = 0.35 + pulse * 0.25;
      }
    }
  });

  return (
    <group>
      {/* Village plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={3}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Home sites — five, each building on its own cycle. */}
      <group ref={sitesRef}>
        {sites.map((s, i) => (
          <mesh
            key={i}
            position={[s.position[0], 0, s.position[2]]}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry
              args={[0.4, 0.4, s.height, 6, 1, false]}
            />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.35}
              metalness={0.4}
              roughness={0.45}
            />
          </mesh>
        ))}
      </group>

      {/* Printer mote — moves between silo and current build site. */}
      <mesh
        ref={printerRef}
        position={[0, 0.85, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.15, 0.15, 0.16, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.9}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Material silo — back-right, feedstock source. */}
      <mesh
        ref={siloRef}
        position={[siloPosition[0], siloPosition[1], siloPosition[2]]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.45, 0.45, 1.2, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.35}
          metalness={0.45}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}
