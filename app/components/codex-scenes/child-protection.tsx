// MotusGridia — Child Protection Mechanism scene.
//
// Slug: child-protection. Canon: grounded.
//
// Visual metaphor: a small hex at centre — the child — enclosed by
// a translucent protective shell. A wider outer ring of six "Basic
// Law" hex cells sits beyond the shell, pulsing in unison to signal
// the network-wide override. A single path of small motes drifts
// outward from centre to the rim, representing the guaranteed exit
// at adulthood.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function ChildProtection({ canon }: { canon: CodexCanon }) {
  const shellRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const exitMotesRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Six-hex outer ring — the Basic Law floor that overrides any
  // Grid's internal rulebook on child safety. Evenly spaced, no
  // jitter; the override is uniform.
  const ringCells = useMemo(() => {
    const arr: Array<readonly [number, number, number]> = [];
    const radius = 2.6;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      arr.push([
        Math.cos(angle) * radius,
        0.1,
        Math.sin(angle) * radius,
      ] as const);
    }
    return arr;
  }, []);

  // Five motes on the exit path — the "walk out at eighteen"
  // guarantee. They travel from centre outward along +X, fade near
  // the rim, and respawn back at the centre.
  const exitMotes = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({ phase: i * 0.6 }));
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Shell softly breathes — the protection is active, not
    // dormant.
    const shell = shellRef.current;
    if (shell) {
      shell.rotation.y += 0.006;
      const pulse = (Math.sin(t * 0.5) + 1) / 2;
      const mat = shell.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.3 + pulse * 0.35;
      }
    }
    // Outer ring pulses in unison — a network-wide floor, not a
    // local rule.
    const ring = ringRef.current;
    if (ring) {
      const pulse = (Math.sin(t * 0.7) + 1) / 2;
      ring.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.25 + pulse * 0.5;
        }
      });
    }
    // Exit motes travel outward at 0.6 units/sec along +X, fade near
    // the rim, loop back to the centre. Deterministic positions per
    // frame.
    const motes = exitMotesRef.current;
    if (motes) {
      motes.children.forEach((child, i) => {
        const m = exitMotes[i];
        if (!m) return;
        const travel = ((t * 0.6 + m.phase) % 2.4);
        child.position.x = travel;
        child.position.z = 0;
        const rim = travel / 2.4;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.6 * (1 - rim);
        }
        child.scale.setScalar(0.12 * (1 - rim * 0.4));
      });
    }
  });

  return (
    <group>
      {/* Child hex — tiny, bright, centred. */}
      <HexPrism
        position={[0, 0.15, 0]}
        radius={0.35}
        depth={0.3}
        color="#0b1030"
        emissive={emissive}
        emissiveIntensity={1.2}
      />

      {/* Protective shell — larger translucent hex around the child.
          The Basic Law's protective envelope. */}
      <mesh
        ref={shellRef}
        position={[0, 0.2, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.85, 0.85, 0.55, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.2}
          roughness={0.3}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Basic Law ring — six outer hexes. The network-wide
          override. */}
      <group ref={ringRef}>
        {ringCells.map((pos, i) => (
          <HexPrism
            key={i}
            position={pos}
            scale={0.3}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Exit motes — five small hexes travelling outward on +X,
          reading as the adult-exit path. */}
      <group ref={exitMotesRef}>
        {exitMotes.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[1, 1, 0.2, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.5}
              metalness={0.3}
              roughness={0.45}
            />
          </mesh>
        ))}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.15, 0]}
        radius={3.4}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
