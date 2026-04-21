// MotusGridia — Off-Grid Megacities scene.
//
// Slug: off-grid-megacities. Canon: fiction-c1.
//
// Visual metaphor: a dense cluster of tall hex towers at
// irregular heights — the megacity skyline. Each tower belongs
// to a "district" and its emissive colour comes from a cycling
// ownership register — meaning towers periodically flash to a
// new ownership colour as gangs contest territory. Small drone
// motes orbit between the towers at different altitudes. A few
// ground-level street motes pulse at the plate level — the CQC
// street-combat traffic.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function OffGridMegacities({
  canon,
}: {
  canon: CodexCanon;
}) {
  const emissive = canonColour(canon);
  const towerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const droneRefs = useRef<(THREE.Mesh | null)[]>([]);
  const streetRefs = useRef<(THREE.Mesh | null)[]>([]);

  // 9 towers in an irregular cluster.
  const towers = useMemo(
    () => [
      { x: -1.2, z: -1.0, h: 2.1, r: 0.22, ownerPhase: 0 },
      { x: -0.4, z: -1.2, h: 1.8, r: 0.19, ownerPhase: 2.0 },
      { x: 0.6, z: -0.8, h: 2.4, r: 0.24, ownerPhase: 4.5 },
      { x: 1.4, z: -0.3, h: 2.0, r: 0.2, ownerPhase: 1.1 },
      { x: -1.4, z: 0.2, h: 1.6, r: 0.18, ownerPhase: 3.3 },
      { x: -0.3, z: 0.1, h: 2.6, r: 0.26, ownerPhase: 5.5 },
      { x: 0.9, z: 0.6, h: 1.9, r: 0.2, ownerPhase: 6.2 },
      { x: -0.8, z: 1.2, h: 2.2, r: 0.22, ownerPhase: 2.9 },
      { x: 0.5, z: 1.4, h: 1.7, r: 0.19, ownerPhase: 4.1 },
    ],
    [],
  );

  // 6 drones orbiting at staggered altitudes and radii.
  const drones = useMemo(
    () => [
      { r: 1.6, y: 0.8, speed: 0.5, phase: 0 },
      { r: 2.0, y: 1.3, speed: -0.35, phase: 1.5 },
      { r: 1.3, y: 1.7, speed: 0.6, phase: 3.0 },
      { r: 1.8, y: 2.1, speed: -0.45, phase: 4.2 },
      { r: 2.2, y: 0.4, speed: 0.3, phase: 5.1 },
      { r: 1.5, y: 2.3, speed: -0.5, phase: 2.3 },
    ],
    [],
  );

  // 5 street motes pulsing at ground level in corridors between
  // towers.
  const streets = useMemo(
    () => [
      { x: -0.8, z: -0.6, phase: 0 },
      { x: 0.2, z: -0.5, phase: 1.2 },
      { x: 1.0, z: 0.2, phase: 2.4 },
      { x: -1.0, z: 0.7, phase: 3.6 },
      { x: 0.1, z: 0.9, phase: 4.8 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Towers — ownership flip via emissive intensity wave. Each
    // tower has its own phase so the flips don't land together.
    towers.forEach((twr, i) => {
      const tower = towerRefs.current[i];
      if (!tower) return;
      const period = 9;
      const phase = ((t + twr.ownerPhase) % period) / period;
      // 0.0-0.1 flip flash, 0.1-1.0 steady
      let flare = 0;
      if (phase < 0.1) {
        flare = Math.sin((phase / 0.1) * Math.PI);
      }
      const mat = tower.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + flare * 0.8 + Math.sin(t * 0.8 + i) * 0.05;
      }
    });

    // Drones — orbit at their own speed and radius.
    drones.forEach((d, i) => {
      const drone = droneRefs.current[i];
      if (!drone) return;
      const angle = t * d.speed + d.phase;
      drone.position.x = Math.cos(angle) * d.r;
      drone.position.z = Math.sin(angle) * d.r;
      drone.position.y = d.y + Math.sin(t * 1.5 + i) * 0.05;
      const mat = drone.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.55 + Math.sin(t * 2 + i * 0.8) * 0.15;
      }
    });

    // Street motes — pulse between dim and bright on independent
    // phases (CQC activity ebbing and flowing).
    streets.forEach((s, i) => {
      const mote = streetRefs.current[i];
      if (!mote) return;
      const period = 3.5;
      const phase = ((t + s.phase) % period) / period;
      // Flare window in middle 30% of the period.
      let flare = 0;
      if (phase > 0.35 && phase < 0.65) {
        flare = Math.sin(((phase - 0.35) / 0.3) * Math.PI);
      }
      const mat = mote.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + flare * 1.0;
      }
    });
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

      {/* Towers — irregular hex cluster. */}
      {towers.map((twr, i) => (
        <mesh
          key={`tower-${i}`}
          ref={(el) => {
            towerRefs.current[i] = el;
          }}
          position={[twr.x, twr.h / 2, twr.z]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[twr.r, twr.r, twr.h, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.55}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* Drones orbiting the skyline. */}
      {drones.map((_, i) => (
        <mesh
          key={`drone-${i}`}
          ref={(el) => {
            droneRefs.current[i] = el;
          }}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.55}
          />
        </mesh>
      ))}

      {/* Street-level CQC pulse motes. */}
      {streets.map((s, i) => (
        <mesh
          key={`street-${i}`}
          ref={(el) => {
            streetRefs.current[i] = el;
          }}
          position={[s.x, 0.08, s.z]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}
