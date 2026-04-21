// MotusGridia — Wireless Power scene.
//
// Slug: wireless-power. Canon: grounded.
//
// Visual metaphor: a broadcast grid. An emitter tower stands at
// centre radiating energy outward in expanding hex rings. Six
// receiver hexes stand at a fixed distance on the floor; each
// lights up as a ring passes through its position and dims once
// the ring has moved past. A stack of coil windings up the tower
// carries a travelling pulse upward before each emission — the
// charge building before release.
//
// Motion beats:
//   · Tower rotates slowly on its Y axis. Coil windings spin with
//     the tower.
//   · Three pulse rings at staggered phases expand outward on a
//     3-second cycle and fade as they go. Emitter cap brightens
//     the moment each ring is emitted.
//   · Coil windings — 5 hex rings stacked up the tower — each
//     pulses on its own phase, with higher windings firing slightly
//     after lower ones. Reads as charge rising up the coil.
//   · Six receiver hexes at radius 2.5 each light up sharply when
//     the nearest ring radius matches their distance, then settle
//     back.
//
// Replaces the inline EmitterTower + PulseRing scenes.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

const RING_COUNT = 3;
const RING_PERIOD = 3;
const RECEIVER_COUNT = 6;
const RECEIVER_RADIUS = 2.5;
const COIL_COUNT = 5;

// Ring radius range — maps phase 0..1 to r ∈ [0.4, 4.6].
const RING_MIN = 0.4;
const RING_MAX = 4.6;

function ringRadius(phase: number) {
  return RING_MIN + phase * (RING_MAX - RING_MIN);
}

export function WirelessPower({ canon }: { canon: CodexCanon }) {
  const towerRef = useRef<THREE.Group>(null);
  const capRef = useRef<THREE.Mesh>(null);
  const ringRefs = useRef<Array<THREE.Mesh | null>>([]);
  const ringMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const coilRefs = useRef<Array<THREE.Mesh | null>>([]);
  const receiverRefs = useRef<Array<THREE.Mesh | null>>([]);
  const emissive = canonColour(canon);

  const receiverPositions = useMemo(
    () =>
      Array.from({ length: RECEIVER_COUNT }, (_, i) => {
        const angle = (i / RECEIVER_COUNT) * Math.PI * 2;
        return [
          Math.cos(angle) * RECEIVER_RADIUS,
          -0.75,
          Math.sin(angle) * RECEIVER_RADIUS,
        ] as const;
      }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    const tower = towerRef.current;
    if (tower) tower.rotation.y += delta * 0.15;

    // Pulse rings — each on its own phase.
    const ringPhases: number[] = [];
    for (let i = 0; i < RING_COUNT; i++) {
      const phase = ((t + i) % RING_PERIOD) / RING_PERIOD;
      ringPhases.push(phase);
      const ring = ringRefs.current[i];
      const mat = ringMatRefs.current[i];
      if (!ring || !mat) continue;
      ring.scale.setScalar(ringRadius(phase));
      mat.opacity = 1 - phase;
    }

    // Emitter cap — bright at ring emission, dims between.
    const cap = capRef.current;
    if (cap) {
      const matC = cap.material as THREE.MeshStandardMaterial | undefined;
      if (matC && "emissiveIntensity" in matC) {
        // Minimum ring phase — if any ring just emitted, its phase is
        // near zero.
        const minPhase = Math.min(...ringPhases);
        // Sharp flash when a ring is within the first 15% of its cycle.
        const flash =
          minPhase < 0.15 ? 1 - minPhase / 0.15 : 0;
        matC.emissiveIntensity = 1.2 + flash * 1.4;
      }
    }

    // Coil windings — travelling pulse up the tower. Each winding
    // brightens when its own (offset) phase is near 0, and the offset
    // increases with Y so the pulse sweeps upward.
    for (let i = 0; i < coilRefs.current.length; i++) {
      const c = coilRefs.current[i];
      if (!c) continue;
      const mat = c.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      // Winding i fires `i * 0.15s` after the base clock.
      const coilPhase = ((t - i * 0.15) % 1.2) / 1.2;
      const glow = coilPhase < 0.25 ? 1 - coilPhase / 0.25 : 0;
      mat.emissiveIntensity = 0.35 + glow * 1.1;
    }

    // Receivers — light up when the nearest ring radius matches the
    // receiver's distance from centre.
    for (let i = 0; i < receiverRefs.current.length; i++) {
      const rec = receiverRefs.current[i];
      if (!rec) continue;
      const mat = rec.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      // Distance from the tower axis.
      const dist = RECEIVER_RADIUS;
      // Find nearest ring radius.
      let nearestDelta = Infinity;
      for (const phase of ringPhases) {
        const r = ringRadius(phase);
        const d = Math.abs(r - dist);
        if (d < nearestDelta) nearestDelta = d;
      }
      // Admit window — 0.4 unit tolerance.
      const admit = Math.max(0, 1 - nearestDelta / 0.4);
      mat.emissiveIntensity = 0.22 + admit * 1.0;
    }
  });

  return (
    <group>
      {/* Tower + coils — rotating as one. */}
      <group ref={towerRef}>
        {/* Central coil — thin hex prism tower. */}
        <HexPrism
          position={[0, 0, 0]}
          depth={2.4}
          radius={0.45}
          emissive={emissive}
          emissiveIntensity={0.9}
        />

        {/* Coil windings — 5 flat hex rings stacked up the tower. */}
        {Array.from({ length: COIL_COUNT }, (_, i) => {
          const y = -0.9 + (i / (COIL_COUNT - 1)) * 1.9;
          return (
            <mesh
              key={`coil-${i}`}
              ref={(m) => {
                coilRefs.current[i] = m;
              }}
              position={[0, y, 0]}
              rotation={[0, Math.PI / 6, 0]}
              frustumCulled={false}
            >
              <cylinderGeometry args={[0.6, 0.6, 0.08, 6, 1, false]} />
              <meshStandardMaterial
                color="#0b1030"
                emissive={emissive}
                emissiveIntensity={0.35}
                metalness={0.7}
                roughness={0.2}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}

        {/* Emitter cap — small hex on top glowing bright. */}
        <mesh
          ref={capRef}
          position={[0, 1.45, 0]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.75, 0.75, 0.18, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={1.4}
            metalness={0.6}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Pulse rings — outside the rotating tower so they stay cardinal. */}
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(m) => {
            ringRefs.current[i] = m;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.7, 0]}
          frustumCulled={false}
        >
          <ringGeometry args={[0.95, 1, 64]} />
          <meshBasicMaterial
            ref={(m) => {
              ringMatRefs.current[i] = m;
            }}
            color={emissive}
            transparent
            opacity={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Receivers — six small hex tiles around the emitter. */}
      {receiverPositions.map((pos, i) => (
        <mesh
          key={`receiver-${i}`}
          ref={(m) => {
            receiverRefs.current[i] = m;
          }}
          position={[pos[0], pos[1], pos[2]]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.35, 0.35, 0.18, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.22}
            metalness={0.5}
            roughness={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Floor hex — receives the rings visually. */}
      <HexPrism
        position={[0, -0.85, 0]}
        radius={3.2}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.14}
      />
    </group>
  );
}
