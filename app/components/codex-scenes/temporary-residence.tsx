// MotusGridia — Temporary Residence Grids scene.
//
// Slug: temporary-residence. Canon: grounded.
//
// Visual metaphor: a 3×3 grid of nine residence slots, each lighting
// up and dimming on its own occupation window — nine stays in
// progress, each on a different clock. One mote per occupied slot
// rises and lowers slightly (the guest in residence). When a window
// closes (sine trough), the slot darkens briefly and re-lights as a
// new guest arrives — occupancy that reads as rotation, not vacancy.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Slot = {
  position: readonly [number, number, number];
  /** How fast this slot cycles — shorter stays rotate faster. */
  period: number;
  phase: number;
};

export function TemporaryResidence({
  canon,
}: {
  canon: CodexCanon;
}) {
  const slotsRef = useRef<THREE.Group>(null);
  const guestsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // 3×3 grid of residence slots.
  const slots = useMemo<Slot[]>(() => {
    const arr: Slot[] = [];
    const spacing = 1.15;
    const startX = -spacing;
    const startZ = -spacing;
    let i = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        arr.push({
          position: [
            startX + col * spacing,
            0.15,
            startZ + row * spacing,
          ] as const,
          // Mix of periods — 48h, a week, a few weeks — rendered as
          // different base cycles so the occupancy staggers.
          period: 3 + (i % 4) * 1.5,
          phase: (i * 0.7) % (2 * Math.PI),
        });
        i++;
      }
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Each slot has its own window. Brightness tracks a saw shaped
    // curve — ramps up while occupied, drops at handover, ramps up
    // again as the next guest arrives. That uses fract(t / period).
    const sg = slotsRef.current;
    if (sg) {
      sg.children.forEach((child, i) => {
        const s = slots[i];
        if (!s) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (!mat || !("emissiveIntensity" in mat)) return;
        const phase = ((t + s.phase) % s.period) / s.period;
        // Occupancy curve: ramp up in first 10%, hold for 80%, drop
        // in last 10%. Reads as arrive → settle → depart.
        let occ: number;
        if (phase < 0.1) {
          occ = phase / 0.1;
        } else if (phase > 0.9) {
          occ = (1 - phase) / 0.1;
        } else {
          occ = 1;
        }
        mat.emissiveIntensity = 0.2 + occ * 0.7;
      });
    }

    // Guests — one mote per slot, bobbing gently while their stay
    // is in progress. Between stays the mote drops out of view.
    const gg = guestsRef.current;
    if (gg) {
      gg.children.forEach((child, i) => {
        const s = slots[i];
        if (!s) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        const phase = ((t + s.phase) % s.period) / s.period;
        const occupied = phase > 0.05 && phase < 0.95;
        child.position.x = s.position[0];
        child.position.z = s.position[2];
        // Hover above the slot when occupied, sink below when not.
        child.position.y = occupied
          ? 0.45 + Math.sin(t * 1.4 + i) * 0.04
          : -0.5;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = occupied ? 0.9 : 0;
        }
      });
    }
  });

  return (
    <group>
      {/* Residence slots — 3×3 grid. */}
      <group ref={slotsRef}>
        {slots.map((s, i) => (
          <HexPrism
            key={i}
            position={s.position}
            radius={0.35}
            depth={0.24}
            emissive={emissive}
            emissiveIntensity={0.2}
          />
        ))}
      </group>

      {/* Guest motes — small hex above each occupied slot. */}
      <group ref={guestsRef}>
        {slots.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.08, 0.08, 0.08, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.9}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Base platter. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={3}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
