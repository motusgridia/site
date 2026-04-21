// MotusGridia — E-Hair scene.
//
// Slug: e-hair. Canon: fiction-c1.
//
// Visual metaphor: a central host-body hex, surrounded by thin vertical
// hair prongs rising from a shared base, with small photon motes
// flashing into the aura around the body. The host's core pulses; the
// prongs carry the pulse upward; the motes react a beat later as
// "captured solar atoms" released by the aura.
//
// Lands under the codex-scenes/ sibling pattern. Imports primitives
// from ./shared.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function EHair({ canon }: { canon: CodexCanon }) {
  const hostRef = useRef<THREE.Group>(null);
  const prongsRef = useRef<THREE.Group>(null);
  const motesRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // 8 prongs arranged around the host at two radii so the silhouette
  // reads as a cluster, not a fence. Inner ring taller, outer ring
  // shorter — approximation of "the more skin you cover the more
  // you put out."
  const prongs = useMemo(() => {
    const arr: Array<{
      position: readonly [number, number, number];
      height: number;
      scale: number;
    }> = [];
    const innerRadius = 0.95;
    const outerRadius = 1.55;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      // Alternate inner/outer so no two adjacent prongs share a radius.
      const r = i % 2 === 0 ? innerRadius : outerRadius;
      const height = i % 2 === 0 ? 1.6 : 1.1;
      arr.push({
        position: [Math.cos(angle) * r, height / 2, Math.sin(angle) * r] as const,
        height,
        scale: 0.12,
      });
    }
    return arr;
  }, []);

  // 14 photon motes at varied heights around the host. Positions are
  // deterministic so hydration stays clean; per-mote phase offsets give
  // the impression of random flashes.
  const motes = useMemo(() => {
    const arr: Array<{
      position: readonly [number, number, number];
      phase: number;
    }> = [];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + (i * 0.37) % 1.2;
      const radius = 1.9 + ((i * 0.21) % 0.7);
      const y = 0.2 + ((i * 0.41) % 1.6);
      arr.push({
        position: [
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius,
        ] as const,
        phase: (i / 14) * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Host breath — slow in-out. The body is the battery; it pulses
    // with the draw.
    const hostPulse = (Math.sin(t * 0.6) + 1) / 2;
    const host = hostRef.current;
    if (host) {
      host.traverse((obj) => {
        const maybeMesh = obj as THREE.Mesh;
        const mat = maybeMesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.9 + hostPulse * 0.9;
        }
      });
    }
    // Prong pulse — one beat behind the host, faster decay. The
    // prongs carry the energy up out of the body.
    const prongPulse = (Math.sin(t * 0.6 - 0.6) + 1) / 2;
    const prongs = prongsRef.current;
    if (prongs) {
      prongs.traverse((obj) => {
        const maybeMesh = obj as THREE.Mesh;
        const mat = maybeMesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.4 + prongPulse * 0.6;
        }
      });
    }
    // Mote flicker — each mote has its own phase so the aura looks
    // alive, not metronomic. Motes pulse faster than the body draws.
    const motes = motesRef.current;
    if (motes) {
      motes.children.forEach((child, i) => {
        const phase = i * 0.449;
        const flicker = (Math.sin(t * 1.8 + phase) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.15 + flicker * 0.7;
        }
      });
    }
  });

  return (
    <group>
      {/* Host body — tall central hex with a hot core. The battery. */}
      <group ref={hostRef}>
        <HexPrism
          position={[0, 0.8, 0]}
          radius={0.6}
          depth={1.6}
          color="#0e0404"
          emissive={emissive}
          emissiveIntensity={1.1}
        />
        {/* Chip — tiny hex sitting where the head would be. Brightest
            point in the scene. Reads as the control node. */}
        <HexPrism
          position={[0, 1.75, 0]}
          radius={0.28}
          depth={0.18}
          color="#1a0606"
          emissive={emissive}
          emissiveIntensity={1.8}
        />
      </group>

      {/* Prongs — narrow tall hex prisms standing around the host. The
          "hairs" — conductive, carrying the body's energy outward. */}
      <group ref={prongsRef}>
        {prongs.map((p, i) => (
          <HexPrism
            key={i}
            position={p.position}
            radius={0.06}
            depth={p.height}
            color="#05090f"
            emissive={emissive}
            emissiveIntensity={0.5}
          />
        ))}
      </group>

      {/* Photon motes — small flickering hex cells at random offsets.
          The captured solar atoms. They pulse faster than the body
          draws, because once released they escape quickly. */}
      <group ref={motesRef}>
        {motes.map((m, i) => (
          <HexPrism
            key={i}
            position={m.position}
            scale={0.12}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Base platter — the ground the host stands on. Dim, wide,
          same colour family so the composition holds together. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2.1}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.12}
      />
    </group>
  );
}
