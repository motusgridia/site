// MotusGridia — Alien Prince scene.
//
// Slug: alien-prince. Canon: fiction.
//
// Visual metaphor: the mind at the top of the hive, reading the
// board. Twelve hex pieces on a 4×3 grid at varying heights. Every
// piece breathes gently — the Prince is always considering — but
// every few seconds one specific piece rises and brightens: the
// current move under active deliberation. A faint threat-line
// between the considered piece and its paired counter appears for
// the duration of the consideration and fades as the Prince moves
// attention to the next piece.
//
// The Prince does not move first. The scene is all hesitation and
// reading, no action — just contemplation cycling across pieces.
//
// Motion beats:
//   · Slow Y-rotation (0.07 rad/s) on the whole board.
//   · Per-piece lift breathes on a 5-8s cycle with phase offsets so
//     no two pieces sit at the same height at the same moment.
//   · "Considered" piece rotates every 4s: that piece's lift spikes,
//     emissiveIntensity peaks, and a threat beam to its fixed paired
//     piece fades in (0.8s rise, 2.4s hold, 0.8s fall).
//   · Threat beam is a thin cylinder between the two piece centres.
//
// Replaces the inline StrategyBoard scene.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

// Fixed heights — deterministic so SSR/CSR never reshuffle.
const HEIGHTS = [
  0.0, 0.6, 0.1, 0.9, 0.3, 0.0, 1.2, 0.2, 0.7, 0.0, 0.4, 0.8,
];

// Pair map — for each piece index, who is its "counter" (the piece
// the threat beam connects to when this piece is considered).
const PAIRS: Record<number, number> = {
  0: 6,
  1: 7,
  2: 11,
  3: 10,
  4: 5,
  5: 4,
  6: 0,
  7: 1,
  8: 3,
  9: 2,
  10: 3,
  11: 2,
};

const CONSIDER_PERIOD = 4;

export function AlienPrince({ canon }: { canon: CodexCanon }) {
  const groupRef = useRef<THREE.Group>(null);
  const pieceRefs = useRef<Array<THREE.Mesh | null>>([]);
  const beamRef = useRef<THREE.Mesh>(null);
  const beamMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const emissive = canonColour(canon);

  const pieces = useMemo(() => {
    const out: Array<{
      basePos: readonly [number, number, number];
      baseLift: number;
      breathPhase: number;
    }> = [];
    const SQRT3 = Math.sqrt(3);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 3; row++) {
        const idx = col * 3 + row;
        const x = (col - 1.5) * SQRT3 * 0.95;
        const z = (row - 1) * 1.55;
        const h = HEIGHTS[idx] ?? 0;
        out.push({
          basePos: [x, 0, z] as const,
          baseLift: h,
          breathPhase: idx * 0.7,
        });
      }
    }
    return out;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    const g = groupRef.current;
    if (g) g.rotation.y += delta * 0.07;

    // Determine the currently-considered piece. Every CONSIDER_PERIOD
    // seconds, the Prince's focus moves to the next piece in sequence.
    const considerIdx = Math.floor(t / CONSIDER_PERIOD) % pieces.length;
    const phaseInConsider = (t % CONSIDER_PERIOD) / CONSIDER_PERIOD;
    // Rise-hold-fall envelope for the consideration focus.
    let focus: number;
    if (phaseInConsider < 0.2) {
      focus = phaseInConsider / 0.2;
    } else if (phaseInConsider < 0.8) {
      focus = 1;
    } else {
      focus = 1 - (phaseInConsider - 0.8) / 0.2;
    }

    const heights: number[] = [];
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if (!p) continue;
      const breath = Math.sin(t * 0.5 + p.breathPhase) * 0.1;
      const focusLift = i === considerIdx ? focus * 0.45 : 0;
      const y = p.baseLift * 0.6 - 0.2 + breath + focusLift;
      heights.push(y);
      const m = pieceRefs.current[i];
      if (!m) continue;
      m.position.set(p.basePos[0], y, p.basePos[2]);
      const mat = m.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const baseGlow = 0.15 + p.baseLift * 0.35;
        mat.emissiveIntensity = baseGlow + focusLift * 1.0;
      }
    }

    // Threat beam — between the considered piece and its paired counter.
    const beam = beamRef.current;
    const mat = beamMatRef.current;
    if (beam && mat) {
      const pairIdx = PAIRS[considerIdx];
      const a = pieces[considerIdx];
      const b = pairIdx !== undefined ? pieces[pairIdx] : undefined;
      const yA = heights[considerIdx];
      const yB = pairIdx !== undefined ? heights[pairIdx] : undefined;
      if (a && b && yA !== undefined && yB !== undefined) {
        const dx = b.basePos[0] - a.basePos[0];
        const dy = yB - yA;
        const dz = b.basePos[2] - a.basePos[2];
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        beam.position.set(
          a.basePos[0] + dx / 2,
          yA + dy / 2,
          a.basePos[2] + dz / 2,
        );
        beam.rotation.set(
          Math.atan2(dz, Math.sqrt(dx * dx + dy * dy)),
          0,
          Math.atan2(dx, -dy),
        );
        beam.scale.set(1, length, 1);
        mat.opacity = focus * 0.35;
      } else {
        mat.opacity = 0;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {pieces.map((p, i) => (
        <mesh
          key={`piece-${i}`}
          ref={(m) => {
            pieceRefs.current[i] = m;
          }}
          position={[p.basePos[0], p.baseLift * 0.6 - 0.2, p.basePos[2]]}
          rotation={[0, Math.PI / 6, 0]}
          scale={0.52}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1, 1, 0.6, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.15 + p.baseLift * 0.35}
            metalness={0.4}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Threat beam — single reused mesh, positioned + rotated
          per-frame to connect the currently-considered piece to its
          paired counter. */}
      <mesh ref={beamRef} frustumCulled={false}>
        <cylinderGeometry args={[0.02, 0.02, 1, 6, 1, false]} />
        <meshBasicMaterial
          ref={beamMatRef}
          color={emissive}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Ground platter — wide hex under the board. */}
      <HexPrism
        position={[0, -0.6, 0]}
        radius={4.2}
        depth={0.05}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
