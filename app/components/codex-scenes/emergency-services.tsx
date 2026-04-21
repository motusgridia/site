// MotusGridia — Emergency Services scene.
//
// Slug: emergency-services. Canon: grounded.
//
// Visual metaphor: a central incident hex pulses at a fast rate. A
// radar-style wave propagates outward from it, and eight responder
// hexes around the perimeter light up in sequence as the wave
// reaches them. The nearest responders arrive first — the system is
// proximity-routed. Scene reads as a call going out and being picked
// up.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Responder = {
  position: readonly [number, number, number];
  distance: number;
};

export function EmergencyServices({ canon }: { canon: CodexCanon }) {
  const incidentRef = useRef<THREE.Mesh>(null);
  const respondersRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Eight responders around the perimeter at mixed distances — the
  // nearest few arrive first when the wave propagates.
  const responders = useMemo<Responder[]>(() => {
    const arr: Responder[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      // Alternate inner/outer rings so the wave animation has
      // distinct arrival times.
      const distance = i % 2 === 0 ? 1.9 : 2.6;
      arr.push({
        position: [
          Math.cos(angle) * distance,
          0,
          Math.sin(angle) * distance,
        ] as const,
        distance,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const incident = incidentRef.current;
    if (incident) {
      // Fast incident pulse — urgency.
      const pulse = (Math.sin(t * 3.2) + 1) / 2;
      const mat = incident.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.9 + pulse * 0.8;
      }
    }

    // Wave travels outward at 1.2 units/sec; responder lights up
    // when the wavefront reaches its distance. Modulo so the wave
    // loops back to the centre periodically.
    const waveRadius = (t * 1.2) % 3.8;
    const resp = respondersRef.current;
    if (resp) {
      resp.children.forEach((child, i) => {
        const r = responders[i];
        if (!r) return;
        // Brightness decays with distance from wavefront — narrow
        // window around the match for a crisp "ping arrives" read.
        const delta = Math.abs(waveRadius - r.distance);
        const hit = Math.max(0, 1 - delta * 3);
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.2 + hit * 1.2;
        }
      });
    }
  });

  return (
    <group>
      {/* Incident hex — central, pulsing fast. The call source. */}
      <mesh
        ref={incidentRef}
        position={[0, 0.1, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.6, 0.6, 0.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.4}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* Responders — eight cells around the perimeter at two radii.
          Light up as the wave reaches them. */}
      <group ref={respondersRef}>
        {responders.map((r, i) => (
          <HexPrism
            key={i}
            position={r.position}
            scale={0.28}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.15, 0]}
        radius={3.3}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
