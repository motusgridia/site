// MotusGridia — Revolt 13 scene.
//
// Slug: revolt-13. Canon: fiction-c1.
//
// Visual metaphor: a transitional-state cluster — twelve small hexes
// in a loose irregular grid representing neighbourhoods. A few start
// lit (early adopters). Over time a "conversion" wave spreads from
// the lit ones to their neighbours: each dim hex that is adjacent to
// a lit one gradually brightens, then flips lit itself, at which
// point it starts converting *its* neighbours. Models the rising
// shape of the movement — not a single origin, not a coordinated
// broadcast, but peer-to-peer acceptance propagation. No state is
// ever fully lit in this scene (we cycle back by dimming the oldest
// lit nodes) so the motion continues.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Cell = {
  position: readonly [number, number, number];
  /** Phase in the rising-converting cycle. */
  phase: number;
  /** Base brightness floor for visual variety. */
  floor: number;
};

export function Revolt13({ canon }: { canon: CodexCanon }) {
  const cellsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Twelve neighbourhood cells in a loose cluster.
  const cells = useMemo<Cell[]>(() => {
    const positions: Array<readonly [number, number]> = [
      [-1.5, -1.2],
      [-0.6, -1.6],
      [0.5, -1.3],
      [1.4, -0.8],
      [-1.7, -0.2],
      [-0.7, -0.4],
      [0.3, -0.1],
      [1.3, 0.3],
      [-1.4, 0.9],
      [-0.4, 0.7],
      [0.6, 1.1],
      [1.5, 1.3],
    ];
    // Phase offsets chosen so waves ripple left→right then back.
    const phases = [
      0, 0.8, 1.6, 2.4, 0.4, 1.2, 2.0, 2.8, 0.2, 1.0, 1.8, 2.6,
    ];
    return positions.map((p, i) => ({
      position: [p[0], 0.12, p[1]] as const,
      phase: phases[i] ?? i * 0.5,
      floor: 0.15 + (i % 3) * 0.05,
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    const cg = cellsRef.current;
    if (cg) {
      cg.children.forEach((child, i) => {
        const c = cells[i];
        if (!c) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (!mat || !("emissiveIntensity" in mat)) return;
        // Saw cycle per cell: rise slowly over most of the period,
        // then drop back to the floor. Visual read: "the movement
        // takes hold here, peaks, fades back while holding in next
        // wave." Period 8s so each wave is visible.
        const period = 8;
        const phase = ((t + c.phase) % period) / period;
        let intensity: number;
        if (phase < 0.7) {
          // Rising phase — gradual acceptance.
          intensity = c.floor + (phase / 0.7) * 0.8;
        } else {
          // Hold + slow decay — the movement settled, then moved on.
          const decay = (phase - 0.7) / 0.3;
          intensity = c.floor + 0.8 - decay * 0.5;
        }
        // Small flicker on top — individual posters going up and
        // coming down, not a smooth ramp.
        const flicker = Math.sin(t * 3 + i) * 0.04;
        mat.emissiveIntensity = Math.max(
          c.floor,
          intensity + flicker,
        );
      });
    }
  });

  return (
    <group>
      {/* Neighbourhood cells. */}
      <group ref={cellsRef}>
        {cells.map((c, i) => (
          <HexPrism
            key={i}
            position={c.position}
            radius={0.32}
            depth={0.2}
            emissive={emissive}
            emissiveIntensity={c.floor}
          />
        ))}
      </group>

      {/* Base platter. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={3}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
