// MotusGridia — Base Camps scene.
//
// Slug: base-camps. Canon: fiction-c1.
//
// Visual metaphor: a base-camp hex at the centre. Beneath it, a
// lower "garage" plate (buried, dimmer) with two small vehicle
// hexes that slide in and out of the bay. A thin rail runs across
// the plate from -X to +X — a train mote travels in on a long
// loop, pausing briefly at the camp. Three checkpoint posts stud
// the rail on the approach. Around the whole composition, six
// perimeter posts face outward — the transitional border the
// adventurers are paid to defend.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function BaseCamps({
  canon,
}: {
  canon: CodexCanon;
}) {
  const campRef = useRef<THREE.Mesh>(null);
  const garageRef = useRef<THREE.Mesh>(null);
  const trainRef = useRef<THREE.Mesh>(null);
  const vehicleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const perimeterRefs = useRef<(THREE.Mesh | null)[]>([]);
  const checkpointRefs = useRef<(THREE.Mesh | null)[]>([]);

  const emissive = canonColour(canon);

  // Two garage vehicles, sliding in and out of the bay on staggered
  // phases. z-extent: -0.8 (inside bay) to +0.2 (emerging).
  const vehicles = useMemo(
    () => [
      { x: -0.45, phase: 0 },
      { x: 0.45, phase: 3.2 },
    ],
    [],
  );

  // Six outward-facing perimeter posts at the edge.
  const perimeter = useMemo(() => {
    const out: { x: number; z: number; angle: number }[] = [];
    const n = 6;
    const radius = 2.3;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      out.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        angle,
      });
    }
    return out;
  }, []);

  // Three checkpoint posts along the rail, approaching from -X.
  const checkpoints = useMemo(
    () => [
      { x: -2.1 },
      { x: -1.3 },
      { x: -0.5 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Camp breathes slowly.
    const camp = campRef.current;
    if (camp) {
      const mat = camp.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.45 + Math.sin(t * 0.5) * 0.1;
      }
    }

    // Garage plate holds steady dim — the underground glow.
    const garage = garageRef.current;
    if (garage) {
      const mat = garage.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.2 + Math.sin(t * 0.4) * 0.05;
      }
    }

    // Vehicles slide on a ~10s cycle.
    vehicles.forEach((v, i) => {
      const mesh = vehicleRefs.current[i];
      if (!mesh) return;
      const period = 10;
      const phase = ((t + v.phase) % period) / period;
      // 0.0-0.15 emerge, 0.15-0.4 hold out, 0.4-0.55 retract,
      // 0.55-1.0 hidden inside bay.
      let outZ: number;
      if (phase < 0.15) {
        outZ = -0.6 + (phase / 0.15) * 0.8; // -0.6 -> 0.2
      } else if (phase < 0.4) {
        outZ = 0.2;
      } else if (phase < 0.55) {
        outZ = 0.2 - ((phase - 0.4) / 0.15) * 0.8; // 0.2 -> -0.6
      } else {
        outZ = -0.6;
      }
      mesh.position.z = outZ;
      const visible = phase < 0.55;
      mesh.visible = visible;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat && visible) {
        // Brightest when fully out.
        const out = phase < 0.15 ? phase / 0.15 :
          phase < 0.4 ? 1 :
          1 - (phase - 0.4) / 0.15;
        mat.emissiveIntensity = 0.4 + out * 0.6;
      }
    });

    // Train mote runs in from -X, pauses at the camp, continues
    // across. 14s cycle for the whole run.
    const train = trainRef.current;
    if (train) {
      const period = 14;
      const phase = (t % period) / period;
      let x: number;
      let mat = train.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (phase < 0.35) {
        // Approach: -2.8 -> 0
        x = -2.8 + (phase / 0.35) * 2.8;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.7;
        }
      } else if (phase < 0.55) {
        // Pause at camp
        x = 0;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 1.0;
        }
      } else if (phase < 0.85) {
        // Depart: 0 -> +2.8
        x = ((phase - 0.55) / 0.3) * 2.8;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.7;
        }
      } else {
        // Off-frame return
        x = 2.8 + ((phase - 0.85) / 0.15) * 0.01; // stays off-frame
        train.visible = false;
      }
      if (phase < 0.85) train.visible = true;
      train.position.x = x;
    }

    // Checkpoint posts flare when the train passes them.
    checkpoints.forEach((c, i) => {
      const post = checkpointRefs.current[i];
      if (!post) return;
      const train2 = trainRef.current;
      if (!train2) return;
      const dist = Math.abs(train2.position.x - c.x);
      const flare = train2.visible && dist < 0.3 ? 1 - dist / 0.3 : 0;
      const mat = post.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + flare * 0.9;
      }
    });

    // Perimeter posts breathe out of phase with one another.
    perimeter.forEach((_, i) => {
      const post = perimeterRefs.current[i];
      if (!post) return;
      const mat = post.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + Math.sin(t * 0.8 + i * 1.1) * 0.2;
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

      {/* Garage plate — dimmer, inset below. */}
      <mesh
        ref={garageRef}
        position={[0, -0.35, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1.1, 1.1, 0.12, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.2}
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>

      {/* Vehicles in the garage. */}
      {vehicles.map((v, i) => (
        <mesh
          key={`vehicle-${i}`}
          ref={(el) => {
            vehicleRefs.current[i] = el;
          }}
          position={[v.x, -0.28, -0.6]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.16, 0.16, 0.12, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.55}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* Base camp hex (taller than garage, centred). */}
      <mesh
        ref={campRef}
        position={[0, 0.25, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.6, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.45}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Rail strip across the plate, along X. */}
      <mesh
        position={[0, -0.05, 1.1]}
        frustumCulled={false}
      >
        <boxGeometry args={[5.4, 0.02, 0.08]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Train mote. */}
      <mesh
        ref={trainRef}
        position={[-2.8, 0.05, 1.1]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.3, 0.12, 0.14]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.7}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Checkpoint posts along the approach. */}
      {checkpoints.map((c, i) => (
        <mesh
          key={`checkpoint-${i}`}
          ref={(el) => {
            checkpointRefs.current[i] = el;
          }}
          position={[c.x, 0.12, 1.1]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.1, 0.1, 0.3, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.55}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* Perimeter posts around the camp. */}
      {perimeter.map((p, i) => (
        <mesh
          key={`perimeter-${i}`}
          ref={(el) => {
            perimeterRefs.current[i] = el;
          }}
          position={[p.x, 0.1, p.z]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.1, 0.1, 0.3, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.35}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
