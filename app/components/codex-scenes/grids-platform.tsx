// MotusGridia — GRIDS Platform scene.
//
// Slug: grids-platform. Canon: grounded.
//
// Visual metaphor: a cluster of hex cells in a wide disk, connected by
// thin line segments that pulse at different rates. The platform is
// the connection graph — one Grid talking to every other through a
// shared digital layer. Line segments are rendered as stretched
// thin hex slivers between cell positions so we stay within the
// scene's established hex DNA.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Edge = {
  from: readonly [number, number, number];
  to: readonly [number, number, number];
  phase: number;
};

export function GridsPlatform({ canon }: { canon: CodexCanon }) {
  const edgesRef = useRef<THREE.Group>(null);
  const cellsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Nine cells: one central hub plus eight around it at two radii.
  // Deterministic layout so hydration is clean.
  const cells = useMemo<
    Array<{ position: readonly [number, number, number]; scale: number }>
  >(() => {
    const arr: Array<{
      position: readonly [number, number, number];
      scale: number;
    }> = [];
    // Centre
    arr.push({ position: [0, 0, 0] as const, scale: 0.55 });
    // Inner ring of 4
    const inner = 1.6;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      arr.push({
        position: [
          Math.cos(angle) * inner,
          0,
          Math.sin(angle) * inner,
        ] as const,
        scale: 0.35,
      });
    }
    // Outer ring of 4
    const outer = 2.6;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      arr.push({
        position: [
          Math.cos(angle) * outer,
          0,
          Math.sin(angle) * outer,
        ] as const,
        scale: 0.3,
      });
    }
    return arr;
  }, []);

  // Edges: centre → every other cell, plus a few ring-to-ring links
  // so the graph reads as a network, not a spoke-star. Only link
  // pairs that exist.
  const edges = useMemo<Edge[]>(() => {
    const arr: Edge[] = [];
    const centre = cells[0];
    if (!centre) return arr;
    // Spokes from centre to inner ring (indices 1-4).
    for (let i = 1; i <= 4; i++) {
      const target = cells[i];
      if (!target) continue;
      arr.push({
        from: centre.position,
        to: target.position,
        phase: i * 0.4,
      });
    }
    // Inner-to-outer pairs — match by index parity.
    for (let i = 1; i <= 4; i++) {
      const inner = cells[i];
      const outer = cells[i + 4];
      if (!inner || !outer) continue;
      arr.push({
        from: inner.position,
        to: outer.position,
        phase: i * 0.6 + 1.1,
      });
    }
    // A couple of inner-to-inner chords so the graph isn't a snowflake.
    const pairs: Array<readonly [number, number]> = [
      [1, 3],
      [2, 4],
    ];
    for (const [a, b] of pairs) {
      const ca = cells[a];
      const cb = cells[b];
      if (!ca || !cb) continue;
      arr.push({
        from: ca.position,
        to: cb.position,
        phase: (a + b) * 0.3,
      });
    }
    return arr;
  }, [cells]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Cells pulse — each on its own phase so the cluster breathes
    // out of sync.
    const cellsG = cellsRef.current;
    if (cellsG) {
      cellsG.children.forEach((child, i) => {
        const pulse = (Math.sin(t * 0.7 + i * 0.9) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.25 + pulse * 0.6;
        }
      });
    }
    // Edges pulse at a faster rate — signal traffic. Offset per edge.
    const edgesG = edgesRef.current;
    if (edgesG) {
      edgesG.children.forEach((child, i) => {
        const edge = edges[i];
        if (!edge) return;
        const pulse = (Math.sin(t * 1.4 + edge.phase) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.15 + pulse * 0.5;
        }
      });
    }
  });

  return (
    <group>
      {/* Cells — the Grids themselves. Rendered with direct mesh so
          we can update material props via the group.traverse loop. */}
      <group ref={cellsRef}>
        {cells.map((c, i) => (
          <HexPrism
            key={i}
            position={c.position}
            scale={c.scale}
            emissive={emissive}
            emissiveIntensity={0.35}
          />
        ))}
      </group>

      {/* Edges — thin hex slivers between cells. Computed length and
          rotation per pair. Mesh rotation points the stretched axis
          from `from` to `to`. */}
      <group ref={edgesRef}>
        {edges.map((edge, i) => {
          const dx = edge.to[0] - edge.from[0];
          const dz = edge.to[2] - edge.from[2];
          const length = Math.sqrt(dx * dx + dz * dz);
          const midX = (edge.from[0] + edge.to[0]) / 2;
          const midZ = (edge.from[2] + edge.to[2]) / 2;
          const angle = Math.atan2(dz, dx);
          return (
            <mesh
              key={i}
              position={[midX, -0.04, midZ]}
              rotation={[0, -angle, 0]}
              frustumCulled={false}
            >
              <boxGeometry args={[length, 0.04, 0.05]} />
              <meshStandardMaterial
                color="#0b1030"
                emissive={emissive}
                emissiveIntensity={0.3}
                metalness={0.3}
                roughness={0.5}
              />
            </mesh>
          );
        })}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.12, 0]}
        radius={3.2}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
