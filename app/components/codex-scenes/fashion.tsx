// MotusGridia — Fashion scene.
//
// Slug: fashion. Canon: fiction-c1.
//
// Visual metaphor: a catwalk of three figures, each hex-bodied
// but with different silhouette details (vents, branch extrusions,
// a cleaner profile) — the three registers of Grid-world fashion.
// Thin accent motes sit beside each figure at head-height as
// the "identity pin" each figure carries. A slow rotation on the
// group gives the catwalk feel without literal motion.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function Fashion({
  canon,
}: {
  canon: CodexCanon;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const figureRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ventRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pinRefs = useRef<(THREE.Mesh | null)[]>([]);
  const branchRefs = useRef<(THREE.Mesh | null)[]>([]);
  const emissive = canonColour(canon);

  // Three figures — Off-Grid tribal (left), On-Grid understated
  // (centre), parasite-host (right). Each has a different height
  // and a different detail signature.
  const figures = useMemo(
    () => [
      // Off-Grid tribal — with vents flaring out (e-hair wearer).
      { x: -1.6, h: 1.2, r: 0.3, phase: 0, kind: "vents" as const },
      // On-Grid understated — clean, taller, steady.
      { x: 0, h: 1.4, r: 0.28, phase: 2.5, kind: "clean" as const },
      // Parasite host — with branching extrusions.
      { x: 1.6, h: 1.15, r: 0.3, phase: 4.8, kind: "branches" as const },
    ],
    [],
  );

  // Vent strips for figure 0.
  const ventCount = 4;
  // Branch extrusions for figure 2.
  const branchCount = 5;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Slow group rotation — catwalk pan.
    const group = groupRef.current;
    if (group) {
      group.rotation.y = Math.sin(t * 0.15) * 0.3;
    }

    // Figures breathe on their own phases.
    figures.forEach((f, i) => {
      const mesh = figureRefs.current[i];
      if (!mesh) return;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + Math.sin(t * 0.7 + f.phase) * 0.1;
      }
    });

    // Vents flicker (aura escaping).
    ventRefs.current.forEach((v, i) => {
      if (!v) return;
      const mat = v.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.7 + Math.sin(t * 3 + i * 1.3) * 0.3;
      }
    });

    // Branches pulse (parasite activity).
    branchRefs.current.forEach((b, i) => {
      if (!b) return;
      const mat = b.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.55 + Math.sin(t * 1.4 + i * 0.9) * 0.2;
      }
    });

    // Identity pins hover and pulse.
    pinRefs.current.forEach((p, i) => {
      if (!p) return;
      p.position.y = (figures[i]?.h ?? 1.2) + 0.35 + Math.sin(t * 1.1 + i) * 0.05;
      const mat = p.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.8 + Math.sin(t * 1.8 + i * 1.6) * 0.15;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2.8}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Figures. */}
      {figures.map((f, i) => (
        <mesh
          key={`figure-${i}`}
          ref={(el) => {
            figureRefs.current[i] = el;
          }}
          position={[f.x, f.h / 2, 0]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[f.r, f.r, f.h, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Identity pins. */}
      {figures.map((f, i) => (
        <mesh
          key={`pin-${i}`}
          ref={(el) => {
            pinRefs.current[i] = el;
          }}
          position={[f.x, f.h + 0.35, 0]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.09, 0.09, 0.14, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.8}
            metalness={0.55}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Vents — thin vertical strips on figure 0. */}
      {Array.from({ length: ventCount }).map((_, i) => {
        const f = figures[0];
        if (!f) return null;
        const angle = (i / ventCount) * Math.PI * 2;
        const dx = Math.cos(angle) * (f.r + 0.02);
        const dz = Math.sin(angle) * (f.r + 0.02);
        return (
          <mesh
            key={`vent-${i}`}
            ref={(el) => {
              ventRefs.current[i] = el;
            }}
            position={[f.x + dx, f.h / 2, dz]}
            rotation={[0, -angle, 0]}
            frustumCulled={false}
          >
            <boxGeometry args={[0.02, f.h * 0.75, 0.02]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.7}
            />
          </mesh>
        );
      })}

      {/* Branches — thin extrusions on figure 2 (parasite host). */}
      {Array.from({ length: branchCount }).map((_, i) => {
        const f = figures[2];
        if (!f) return null;
        const angle = (i / branchCount) * Math.PI * 2;
        const branchLen = 0.3;
        const dx = Math.cos(angle) * (f.r + branchLen * 0.5);
        const dz = Math.sin(angle) * (f.r + branchLen * 0.5);
        const yOffset = 0.4 + (i % 3) * 0.2;
        return (
          <mesh
            key={`branch-${i}`}
            ref={(el) => {
              branchRefs.current[i] = el;
            }}
            position={[f.x + dx, yOffset, dz]}
            rotation={[0, -angle, 0]}
            frustumCulled={false}
          >
            <boxGeometry args={[branchLen, 0.025, 0.025]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.55}
            />
          </mesh>
        );
      })}
    </group>
  );
}
