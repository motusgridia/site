// MotusGridia — Hubs scene.
//
// Slug: hubs. Canon: grounded.
//
// Visual metaphor: the Hub is a Grid's spine. A tall spiralling
// tower of stacked hex levels with a transit capsule that climbs
// up and down its full height, plus a six-hex base ring (the comb
// the Hub sits in the centre of) with connection beams tying the
// ring to the top of the tower.
//
// Motion beats:
//   · Tower rotates slowly on its Y axis.
//   · A bright capsule rises up the tower, reaching the top at
//     7 seconds, then falls back in the next 7s. Continuous loop.
//   · Each tower level has an independent breath phase so the
//     spire never pulses in unison.
//   · Six thin beams rise from the top cap of the tower to each
//     base-ring hex (the spider-web connection). The beams glow
//     faintly and pulse every 5s — traffic landing at the Hub.
//   · Base ring hexes breathe independently.
//
// Replaces the inline HubTower scene.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, type CodexCanon } from "./shared";

const LEVELS = 10;
const BASE_COUNT = 6;
const BASE_RADIUS = 2.4;

export function Hubs({ canon }: { canon: CodexCanon }) {
  const towerRef = useRef<THREE.Group>(null);
  const capsuleRef = useRef<THREE.Mesh>(null);
  const levelRefs = useRef<Array<THREE.Mesh | null>>([]);
  const baseRefs = useRef<Array<THREE.Mesh | null>>([]);
  const beamRefs = useRef<Array<THREE.Mesh | null>>([]);
  const emissive = canonColour(canon);

  // Precompute base ring positions + beam transforms.
  const baseRing = useMemo(() => {
    const out: Array<{
      pos: readonly [number, number, number];
      beam: {
        midY: number;
        midX: number;
        midZ: number;
        length: number;
        rotX: number;
        rotZ: number;
      };
    }> = [];
    // Tower top at local Y = (LEVELS-1)*0.55 + 0.45 (cap of top level).
    const topY = (LEVELS - 1) * 0.55 + 0.45;
    for (let i = 0; i < BASE_COUNT; i++) {
      const angle = (i / BASE_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * BASE_RADIUS;
      const z = Math.sin(angle) * BASE_RADIUS;
      const y = -0.3; // base ring Y relative to tower base (group at -1.2)
      // Beam from (0, topY, 0) to (x, y, z). We render as a thin
      // cylinder whose length = distance and whose midpoint sits at
      // the average of the two endpoints.
      const dx = x - 0;
      const dy = y - topY;
      const dz = z - 0;
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const midX = x / 2;
      const midY = (topY + y) / 2;
      const midZ = z / 2;
      // CylinderGeometry is Y-aligned by default. Rotate the cylinder
      // so it points from (0,topY,0) to (x,y,z). We tilt around the
      // Z axis by the XY angle, then around Y for the azimuth.
      const rotZ = Math.atan2(dx, -dy); // in X/Y plane
      const rotX = Math.atan2(dz, Math.sqrt(dx * dx + dy * dy));
      out.push({
        pos: [x, y, z] as const,
        beam: { midX, midY, midZ, length, rotX, rotZ },
      });
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Tower Y-rotation.
    const tower = towerRef.current;
    if (tower) tower.rotation.y = t * 0.15;

    // Capsule — rises and falls between y=0 and y=topY over 14s.
    const topY = (LEVELS - 1) * 0.55 + 0.45;
    const period = 14;
    const phase = (t % period) / period;
    const half = phase < 0.5 ? phase * 2 : (1 - phase) * 2; // 0→1→0
    // Eased so the capsule pauses briefly at top/bottom.
    const eased = (1 - Math.cos(half * Math.PI)) / 2;
    const capsule = capsuleRef.current;
    if (capsule) {
      capsule.position.y = eased * topY;
      const mat = capsule.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        // Brightest mid-travel.
        mat.emissiveIntensity = 0.7 + Math.sin(half * Math.PI) * 0.6;
      }
    }

    // Level breathing — each level has its own phase, rate matches
    // the breath of the Grid as a whole.
    for (let i = 0; i < levelRefs.current.length; i++) {
      const m = levelRefs.current[i];
      if (!m) continue;
      const mat = m.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      const levelPhase = i * 0.55;
      mat.emissiveIntensity =
        0.22 + i * 0.04 + Math.sin(t * 0.9 + levelPhase) * 0.05;
    }

    // Base ring — each hex breathes independently.
    for (let i = 0; i < baseRefs.current.length; i++) {
      const m = baseRefs.current[i];
      if (!m) continue;
      const mat = m.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      mat.emissiveIntensity = 0.22 + (Math.sin(t * 0.8 + i * 1.1) + 1) * 0.05;
    }

    // Beams — faint steady glow with a 5s traffic pulse.
    for (let i = 0; i < beamRefs.current.length; i++) {
      const m = beamRefs.current[i];
      if (!m) continue;
      const mat = m.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      const beamPhase = ((t + i * 0.8) % 5) / 5;
      const pulse = beamPhase < 0.1 ? beamPhase / 0.1 : (1 - beamPhase) / 0.9;
      mat.emissiveIntensity = 0.14 + pulse * 0.35;
    }
  });

  return (
    <group position={[0, -1.2, 0]}>
      {/* Tower itself — 10 stacked hex levels, twisting as they
          climb. Keep rotation off the tower group so the capsule
          moves relative to a stable tower column. */}
      <group ref={towerRef}>
        {Array.from({ length: LEVELS }, (_, i) => {
          const y = i * 0.55;
          const scale = 1 - i * 0.07;
          const twist = i * 0.08;
          return (
            <mesh
              key={`level-${i}`}
              ref={(m) => {
                levelRefs.current[i] = m;
              }}
              position={[0, y, 0]}
              rotation={[0, Math.PI / 6 + twist, 0]}
              scale={scale}
              frustumCulled={false}
            >
              <cylinderGeometry args={[1, 1, 0.45, 6, 1, false]} />
              <meshStandardMaterial
                color="#0b1030"
                emissive={emissive}
                emissiveIntensity={0.22 + i * 0.04}
                metalness={0.45}
                roughness={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}

        {/* Transit capsule — small bright sphere that rides the
            tower. Positioned independently of the tower rotation
            so it travels vertically, not around. */}
        <mesh ref={capsuleRef} position={[1.05, 0, 0]} frustumCulled={false}>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshStandardMaterial
            color={emissive}
            emissive={emissive}
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>

      {/* Base ring — six hexes around the Hub. Lives outside the
          rotating tower group so it stays cardinal-oriented. */}
      {baseRing.map((b, i) => (
        <mesh
          key={`base-${i}`}
          ref={(m) => {
            baseRefs.current[i] = m;
          }}
          position={[b.pos[0], b.pos[1], b.pos[2]]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.42, 0.42, 0.22, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.25}
            metalness={0.4}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Connection beams from top of tower to each base hex. Thin
          cylinders, length + orientation precomputed in useMemo
          above. */}
      {baseRing.map((b, i) => (
        <mesh
          key={`beam-${i}`}
          ref={(m) => {
            beamRefs.current[i] = m;
          }}
          position={[b.beam.midX, b.beam.midY, b.beam.midZ]}
          rotation={[b.beam.rotX, 0, b.beam.rotZ]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.015, 0.015, b.beam.length, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.15}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
