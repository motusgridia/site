// MotusGridia — Magway scene.
//
// Slug: magway. Canon: grounded.
//
// Visual metaphor: an underground artery between two Grids. A long
// translucent tube runs horizontally across the frame. Three pods
// travel the tube at staggered phases — never a single vehicle, always
// a fleet — so the scene reads as throughput, not a demo. Four station
// rings sit at intervals along the tube and light up as each pod
// passes through them. Two terminal hexes cap each end of the tube
// — the Grids the line connects.
//
// Motion beats:
//   · Three pods travel left-to-right on a 7-second cycle with
//     phase offsets of 0 / 2.33s / 4.67s. A pod that exits the
//     right end wraps round to the left.
//   · Each pod's own emissive intensity pulses brighter mid-travel
//     and dims at the ends — "accelerating out of a station".
//   · Four station rings along the tube pulse when a pod is within
//     their narrow proximity window — local "station admit" glow.
//   · The inner rail pulse carries a travelling wave so the rail
//     itself reads as powered, not static.
//   · Terminal hexes breathe independently — the two Grids at
//     either end each running on their own clock.
//
// Replaces the inline MagwayTube scene.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, type CodexCanon } from "./shared";

const TUBE_LENGTH = 14;
const POD_COUNT = 3;
const STATION_COUNT = 4;
const POD_PERIOD = 7;

// Station X-positions — evenly spaced along the tube's length.
const STATIONS = Array.from({ length: STATION_COUNT }, (_, i) => {
  const pad = 2.4;
  const usable = TUBE_LENGTH - pad * 2;
  return -TUBE_LENGTH / 2 + pad + (i * usable) / (STATION_COUNT - 1);
});

export function Magway({ canon }: { canon: CodexCanon }) {
  const podRefs = useRef<Array<THREE.Mesh | null>>([]);
  const stationRefs = useRef<Array<THREE.Mesh | null>>([]);
  const railRef = useRef<THREE.Mesh>(null);
  const leftTerminalRef = useRef<THREE.Mesh>(null);
  const rightTerminalRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Pod phase offsets — equally spaced across the period.
  const podPhases = useMemo(
    () =>
      Array.from({ length: POD_COUNT }, (_, i) => (i * POD_PERIOD) / POD_COUNT),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Pods — each runs a 7s loop from x=-7 to x=+7.
    for (let i = 0; i < podRefs.current.length; i++) {
      const pod = podRefs.current[i];
      if (!pod) continue;
      const phase = podPhases[i] ?? 0;
      const cycle = ((t + phase) % POD_PERIOD) / POD_PERIOD; // 0..1
      pod.position.x = -TUBE_LENGTH / 2 + cycle * TUBE_LENGTH;
      const mat = pod.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        // Brightest mid-travel.
        mat.emissiveIntensity = 0.7 + Math.sin(cycle * Math.PI) * 0.55;
      }
    }

    // Stations — light up when the nearest pod is within ~0.8 units.
    for (let i = 0; i < stationRefs.current.length; i++) {
      const s = stationRefs.current[i];
      if (!s) continue;
      const mat = s.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      const stationX = STATIONS[i] ?? 0;
      // Find closest pod to this station.
      let nearest = Infinity;
      for (let p = 0; p < POD_COUNT; p++) {
        const phase = podPhases[p] ?? 0;
        const cycle = ((t + phase) % POD_PERIOD) / POD_PERIOD;
        const podX = -TUBE_LENGTH / 2 + cycle * TUBE_LENGTH;
        const d = Math.abs(podX - stationX);
        if (d < nearest) nearest = d;
      }
      // Narrow admit window — 0.8 units wide — so stations only glow
      // when a pod is passing through.
      const proximity = Math.max(0, 1 - nearest / 0.8);
      mat.emissiveIntensity = 0.22 + proximity * 0.75;
    }

    // Rail — travelling wave of glow along the tube length. Use a
    // simple sine on the material's emissiveIntensity; the visual wave
    // is approximated since a single mesh can only carry one intensity
    // value.
    const rail = railRef.current;
    if (rail) {
      const mat = rail.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 1.0 + Math.sin(t * 2.2) * 0.35;
      }
    }

    // Terminal hexes — each breathes on its own phase.
    const lt = leftTerminalRef.current;
    if (lt) {
      const mat = lt.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + Math.sin(t * 0.7) * 0.12;
      }
    }
    const rt = rightTerminalRef.current;
    if (rt) {
      const mat = rt.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + Math.sin(t * 0.7 + 2.4) * 0.12;
      }
    }
  });

  return (
    <group>
      {/* Tube — long cylinder rotated to run along X. Translucent so
          pods are visible inside. Double-sided so the inner wall
          reads correctly when the camera is near. */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.1, 1.1, TUBE_LENGTH, 32, 1, true]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.12}
          metalness={0.5}
          roughness={0.5}
          side={THREE.DoubleSide}
          transparent
          opacity={0.33}
        />
      </mesh>

      {/* Outer ring collars — static hex bands at regular intervals to
          give the tube visible structure. Placed at the same X as the
          stations so they frame each station ring. */}
      {STATIONS.map((x, i) => (
        <mesh
          key={`collar-${i}`}
          position={[x, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1.14, 1.14, 0.12, 32, 1, true]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.18}
            metalness={0.5}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Station rings — inside the tube at each station X. Light up as
          pods pass through. */}
      {STATIONS.map((x, i) => (
        <mesh
          key={`station-${i}`}
          ref={(m) => {
            stationRefs.current[i] = m;
          }}
          position={[x, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          frustumCulled={false}
        >
          <torusGeometry args={[0.95, 0.04, 8, 36]} />
          <meshStandardMaterial
            color={emissive}
            emissive={emissive}
            emissiveIntensity={0.22}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Inner cyan rail — a bright hot line running the full tube
          length. Carries the travelling-wave pulse. */}
      <mesh ref={railRef} rotation={[0, 0, Math.PI / 2]} position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.05, TUBE_LENGTH, 12]} />
        <meshStandardMaterial
          color={emissive}
          emissive={emissive}
          emissiveIntensity={1.1}
        />
      </mesh>

      {/* Pods — three capsules running the tube. */}
      {Array.from({ length: POD_COUNT }, (_, i) => (
        <mesh
          key={`pod-${i}`}
          ref={(m) => {
            podRefs.current[i] = m;
          }}
          rotation={[0, 0, Math.PI / 2]}
          frustumCulled={false}
        >
          <capsuleGeometry args={[0.42, 1.3, 8, 16]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.9}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Terminal hex at the left end — the Grid the line leaves. */}
      <mesh
        ref={leftTerminalRef}
        position={[-TUBE_LENGTH / 2 - 0.3, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1.6, 1.6, 0.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Terminal hex at the right end — the Grid the line arrives at. */}
      <mesh
        ref={rightTerminalRef}
        position={[TUBE_LENGTH / 2 + 0.3, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1.6, 1.6, 0.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
