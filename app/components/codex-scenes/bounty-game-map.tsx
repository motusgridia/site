// MotusGridia — Bounty Game Map scene.
//
// Slug: bounty-game-map. Canon: fiction-c1.
//
// Visual metaphor: a flat hex-grid of district cells at different
// emissive intensities — the colour mapping is abstracted (since
// the canon colour is already amber, we use intensity instead of
// hue to convey the red/amber/green state). Cells breathe on their
// own cycles. A few "bounty" pin hexes rise above particular cells
// to mark active contracts. A few "match" pulses fire between pairs
// of cells — the accepted-challenge traffic. A small app-frame hex
// floats over the top edge as the UI signifier.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function BountyGameMap({
  canon,
}: {
  canon: CodexCanon;
}) {
  const emissive = canonColour(canon);
  const cellRefs = useRef<(THREE.Mesh | null)[]>([]);
  const bountyRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matchPulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const appFrameRef = useRef<THREE.Mesh>(null);

  /** Hex grid dimensions. */
  const gridRows = 5;
  const gridCols = 7;
  /** District cell cluster size. */
  const cellR = 0.27;

  // Compute axial-like hex grid positions. Flat-top would be
  // simpler but we're pointy-top so compute accordingly.
  const cells = useMemo(() => {
    const out: { x: number; z: number; state: "hot" | "mid" | "cool"; phase: number }[] = [];
    const colWidth = cellR * Math.sqrt(3);
    const rowHeight = cellR * 1.5;
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const xOffset = r % 2 === 0 ? 0 : colWidth / 2;
        const x = (c - gridCols / 2 + 0.5) * colWidth + xOffset;
        const z = (r - gridRows / 2 + 0.5) * rowHeight;
        // Pick state pseudo-randomly via trig.
        const s = Math.sin(r * 1.7 + c * 2.3);
        const state = s > 0.33 ? "hot" : s > -0.2 ? "mid" : "cool";
        out.push({ x, z, state, phase: (r * 0.4 + c * 0.25) });
      }
    }
    return out;
  }, []);

  // Pick 4 cells to host bounty pins.
  const bountyCellIndices = useMemo(
    () => [
      3, // upper row-left
      10, // upper row-right
      18, // middle
      28, // lower row-right
    ],
    [],
  );

  // 3 accepted-match pulses: one between pairs of cells.
  const matches = useMemo(
    () => [
      { fromIdx: 5, toIdx: 20, phase: 0 },
      { fromIdx: 11, toIdx: 24, phase: 2.2 },
      { fromIdx: 2, toIdx: 32, phase: 4.4 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // District cells — brightness per state + slow breath.
    cells.forEach((cell, i) => {
      const mesh = cellRefs.current[i];
      if (!mesh) return;
      const base =
        cell.state === "hot" ? 0.7 : cell.state === "mid" ? 0.45 : 0.22;
      const breath = Math.sin(t * 0.5 + cell.phase) * 0.12;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = base + breath;
      }
    });

    // Bounty pins — float up and down, always bright.
    bountyRefs.current.forEach((pin, i) => {
      if (!pin) return;
      pin.position.y = 0.55 + Math.sin(t * 1.2 + i * 0.9) * 0.1;
      const mat = pin.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.85 + Math.sin(t * 2 + i) * 0.1;
      }
    });

    // Match pulses — travel from fromIdx to toIdx on a ~4s cycle.
    matches.forEach((m, i) => {
      const pulse = matchPulseRefs.current[i];
      if (!pulse) return;
      const from = cells[m.fromIdx];
      const to = cells[m.toIdx];
      if (!from || !to) return;
      const period = 4;
      const phase = ((t + m.phase) % period) / period;
      if (phase < 0.8) {
        const travel = phase / 0.8;
        pulse.position.x = from.x + (to.x - from.x) * travel;
        pulse.position.z = from.z + (to.z - from.z) * travel;
        pulse.position.y = 0.35 + Math.sin(travel * Math.PI) * 0.25;
        pulse.visible = true;
        const mat = pulse.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.9 - Math.abs(travel - 0.5) * 0.4;
        }
      } else {
        pulse.visible = false;
      }
    });

    // App-frame header pulses gently.
    const frame = appFrameRef.current;
    if (frame) {
      const mat = frame.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.5 + Math.sin(t * 0.7) * 0.1;
      }
    }
  });

  return (
    <group>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={3.0}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* District cells — flat hex grid. */}
      {cells.map((c, i) => (
        <mesh
          key={`cell-${i}`}
          ref={(el) => {
            cellRefs.current[i] = el;
          }}
          position={[c.x, 0.04, c.z]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[cellR, cellR, 0.1, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.4}
            roughness={0.45}
          />
        </mesh>
      ))}

      {/* Bounty pins — tall thin hexes above selected cells. */}
      {bountyCellIndices.map((idx, i) => {
        const c = cells[idx];
        if (!c) return null;
        return (
          <mesh
            key={`bounty-${i}`}
            ref={(el) => {
              bountyRefs.current[i] = el;
            }}
            position={[c.x, 0.55, c.z]}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.07, 0.07, 0.35, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.85}
              metalness={0.55}
              roughness={0.3}
            />
          </mesh>
        );
      })}

      {/* Match pulses — small motes travelling between cell pairs. */}
      {matches.map((_, i) => (
        <mesh
          key={`match-${i}`}
          ref={(el) => {
            matchPulseRefs.current[i] = el;
          }}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}

      {/* App frame header — thin bar above the grid suggesting UI chrome. */}
      <mesh
        ref={appFrameRef}
        position={[0, 1.55, 0]}
        frustumCulled={false}
      >
        <boxGeometry args={[3.2, 0.1, 0.18]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
