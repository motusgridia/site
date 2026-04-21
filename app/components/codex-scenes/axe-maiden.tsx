// MotusGridia — Axe Maiden scene.
//
// Slug: axe-maiden. Canon: fiction-c1.
//
// Visual metaphor: the figure herself, hex-bodied, standing off
// centre. Two axe hexes float beside her at shoulder height —
// the dual-axe signature. An arena-ring motif underfoot carries
// over from customs-and-duels to place her in the duel context.
// The arc of the scene is her state change: the figure's aura
// pulse is strong at the start of each cycle, dims sharply mid-
// cycle (the break), then rebuilds more cautiously — never as
// strong as before. A small "prosthetic" brace hex at her lower
// body glows on during the rebuild phase. Behind her, a single
// dim memorial-hex stands for the sister she avenged.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function AxeMaiden({
  canon,
}: {
  canon: CodexCanon;
}) {
  const figureRef = useRef<THREE.Mesh>(null);
  const axeARef = useRef<THREE.Mesh>(null);
  const axeBRef = useRef<THREE.Mesh>(null);
  const braceRef = useRef<THREE.Mesh>(null);
  const memorialRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Life-arc cycle — 14s. Longer than usual to let the break
    // read. 0.00-0.38 rise (training, peak combat). 0.38-0.48
    // break (the duel revenge — sharp drop). 0.48-1.00 rebuild
    // (prosthetics, recovery, never back to peak).
    const period = 14;
    const phase = (t % period) / period;
    let figureIntensity: number;
    let axeIntensity: number;
    let braceGlow: number;
    if (phase < 0.38) {
      figureIntensity = 0.4 + Math.sin(t * 0.8) * 0.15 + phase * 1.0;
      axeIntensity = 0.7 + Math.sin(t * 1.1) * 0.2;
      braceGlow = 0;
    } else if (phase < 0.48) {
      // Break — sharp drop.
      const k = (phase - 0.38) / 0.1;
      figureIntensity = 0.78 - k * 0.6;
      axeIntensity = 0.9 - k * 0.75;
      braceGlow = 0;
    } else {
      // Rebuild — slow rise, caps well below peak.
      const k = (phase - 0.48) / 0.52;
      figureIntensity = 0.18 + k * 0.25;
      axeIntensity = 0.15 + k * 0.1;
      braceGlow = 0.3 + k * 0.45;
    }

    const figure = figureRef.current;
    if (figure) {
      const mat = figure.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = figureIntensity;
      }
    }

    // Axes — orbit slightly around the figure (not in hand, but
    // floating as icons of her identity). The axes dim together
    // on the break phase.
    const axeA = axeARef.current;
    if (axeA) {
      const a = t * 0.4;
      axeA.position.x = -0.58 + Math.cos(a) * 0.08;
      axeA.position.z = 0.08 + Math.sin(a) * 0.08;
      axeA.rotation.y = t * 0.7;
      const mat = axeA.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = axeIntensity;
      }
    }
    const axeB = axeBRef.current;
    if (axeB) {
      const a = t * 0.4 + Math.PI;
      axeB.position.x = 0.58 + Math.cos(a) * 0.08;
      axeB.position.z = 0.08 + Math.sin(a) * 0.08;
      axeB.rotation.y = t * 0.7;
      const mat = axeB.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = axeIntensity;
      }
    }

    // Brace — the prosthetic band, only visible during rebuild.
    const brace = braceRef.current;
    if (brace) {
      brace.visible = braceGlow > 0.05;
      const mat = brace.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = braceGlow;
      }
    }

    // Memorial hex — steady dim, doesn't change on cycle.
    const memorial = memorialRef.current;
    if (memorial) {
      const mat = memorial.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.22 + Math.sin(t * 0.35) * 0.04;
      }
    }

    // Arena ring — gentle rotation.
    const ring = ringRef.current;
    if (ring) {
      ring.rotation.z = t * 0.2;
    }
  });

  return (
    <group>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2.8}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Arena ring underfoot — duel context. */}
      <mesh
        ref={ringRef}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <ringGeometry args={[1.2, 1.3, 48, 1]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          side={2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Figure — short, stocky, slightly wider hex than default. */}
      <mesh
        ref={figureRef}
        position={[0, 0.5, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.36, 0.36, 1.0, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Prosthetic brace — thin band around the lower body. */}
      <mesh
        ref={braceRef}
        position={[0, 0.15, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
        visible={false}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.15, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Axe A — small hex to the left. */}
      <mesh
        ref={axeARef}
        position={[-0.58, 0.75, 0.08]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.12, 0.12, 0.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.7}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      {/* Axe B — small hex to the right. */}
      <mesh
        ref={axeBRef}
        position={[0.58, 0.75, 0.08]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.12, 0.12, 0.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.7}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      {/* Memorial — dim sister hex behind the figure. */}
      <mesh
        ref={memorialRef}
        position={[0, 0.4, -1.6]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.8, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.22}
          metalness={0.45}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}
