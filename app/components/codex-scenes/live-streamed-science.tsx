// MotusGridia — Live-Streamed Science scene.
//
// Slug: live-streamed-science. Canon: fiction-c1.
//
// Visual metaphor: a translucent-looking lab hex in the centre — the
// lab whose interior is visible. Around it, twelve observer motes at
// mid-radius that "vote" by pulsing; when a mote votes its brightness
// spikes. Meanwhile an ingredient-supply chain of three small hexes
// along -Z feeds toward the lab on its own cadence, each one also
// streaming (visible to observers too). The lab's baseline emission
// tracks the cumulative vote count — the more observers are voting
// now, the brighter the lab runs. Reads as transparency measured.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Observer = {
  position: readonly [number, number, number];
  phase: number;
  speed: number;
};

type Supplier = {
  position: readonly [number, number, number];
  phase: number;
};

export function LiveStreamedScience({
  canon,
}: {
  canon: CodexCanon;
}) {
  const labRef = useRef<THREE.Mesh>(null);
  const observersRef = useRef<THREE.Group>(null);
  const suppliersRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Twelve observer motes at the mid-ring.
  const observers = useMemo<Observer[]>(() => {
    const arr: Observer[] = [];
    const radius = 2.2;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      arr.push({
        position: [
          Math.cos(angle) * radius,
          0.15,
          Math.sin(angle) * radius,
        ] as const,
        phase: i * 0.4,
        speed: 0.8 + (i % 3) * 0.2,
      });
    }
    return arr;
  }, []);

  // Three supplier hexes feeding the lab along -Z.
  const suppliers = useMemo<Supplier[]>(() => {
    return [
      {
        position: [-0.9, 0.1, -1.9] as const,
        phase: 0,
      },
      {
        position: [0, 0.1, -2.2] as const,
        phase: 0.8,
      },
      {
        position: [0.9, 0.1, -1.9] as const,
        phase: 1.6,
      },
    ];
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Cumulative observer vote intensity this frame. Sum of each
    // observer's positive-lobe contribution. Normalised to [0, 1].
    let voteSum = 0;
    observers.forEach((o) => {
      voteSum += Math.max(0, Math.sin(t * o.speed - o.phase));
    });
    const normalised = voteSum / observers.length;

    // Lab — baseline tracks the vote count. More votes right now ⇒
    // brighter lab. Reads as transparency earning trust in real time.
    const lab = labRef.current;
    if (lab) {
      const mat = lab.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + normalised * 1.1;
      }
    }

    // Observers — each pulses on its own phase. Positive-lobe only,
    // so a vote is a visible spike rather than a sine-background.
    const og = observersRef.current;
    if (og) {
      og.children.forEach((child, i) => {
        const o = observers[i];
        if (!o) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const vote = Math.max(0, Math.sin(t * o.speed - o.phase));
          mat.emissiveIntensity = 0.15 + vote * 0.9;
        }
      });
    }

    // Suppliers — three hexes feeding the lab. Each streams on its
    // own phase. Slow slow rhythm — upstream work is steadier than
    // the observer spikes.
    const sg = suppliersRef.current;
    if (sg) {
      sg.children.forEach((child, i) => {
        const s = suppliers[i];
        if (!s) return;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const pulse = (Math.sin(t * 0.6 - s.phase) + 1) / 2;
          mat.emissiveIntensity = 0.3 + pulse * 0.4;
        }
      });
    }
  });

  return (
    <group>
      {/* Lab — central, tall, brighter material. The visible-from-
          outside laboratory the society can watch. */}
      <mesh
        ref={labRef}
        position={[0, 0.5, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.8, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.6}
          metalness={0.45}
          roughness={0.4}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Observer motes — twelve around the mid-ring. */}
      <group ref={observersRef}>
        {observers.map((o, i) => (
          <HexPrism
            key={i}
            position={o.position}
            radius={0.14}
            depth={0.14}
            emissive={emissive}
            emissiveIntensity={0.15}
          />
        ))}
      </group>

      {/* Supplier hexes — three feeding the lab from the rear. */}
      <group ref={suppliersRef}>
        {suppliers.map((s, i) => (
          <HexPrism
            key={i}
            position={s.position}
            radius={0.22}
            depth={0.2}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Base platter. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={3.2}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
