// MotusGridia — DJ Panz scene.
//
// Slug: dj-panz. Canon: fiction-c1.
//
// Visual metaphor: a quiet author hex set slightly back from centre —
// Panz himself. In front and elevated, a brighter "speaker" hex that
// delivers to an audience arc of six listener hexes. A pulse fires
// from the author, reaches the speaker one beat later, and arrives at
// the audience one beat after that. The audience reads the speaker.
// The speaker is reading Panz. The network notices too late.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Listener = {
  position: readonly [number, number, number];
  phase: number;
};

export function DjPanz({ canon }: { canon: CodexCanon }) {
  const authorRef = useRef<THREE.Mesh>(null);
  const speakerRef = useRef<THREE.Mesh>(null);
  const listenersRef = useRef<THREE.Group>(null);
  const threadRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Audience arc — six listener hexes fanning across +Z in front of
  // the speaker. Per-listener phase delay creates the wave-arrives
  // cascade.
  const listeners = useMemo<Listener[]>(() => {
    const arr: Listener[] = [];
    const n: number = 6;
    const radius = 2.4;
    const spread = Math.PI / 2.2;
    for (let i = 0; i < n; i++) {
      const frac = n === 1 ? 0 : i / (n - 1);
      const angle = Math.PI / 2 - spread / 2 + frac * spread;
      // Phase delay grows with arc distance from centre of the arc.
      const centred = Math.abs(frac - 0.5);
      arr.push({
        position: [
          Math.cos(angle) * radius,
          0.05,
          Math.sin(angle) * radius,
        ] as const,
        phase: 0.4 + centred * 0.2,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Author pulse on a calm rhythm. This is the actual source — it
    // leads by ~0.4 seconds.
    const author = authorRef.current;
    if (author) {
      const pulse = (Math.sin(t * 0.7) + 1) / 2;
      const mat = author.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + pulse * 0.25;
      }
    }

    // Speaker pulse — same shape, one beat later. Much brighter.
    const speaker = speakerRef.current;
    if (speaker) {
      const pulse = (Math.sin(t * 0.7 - 0.4) + 1) / 2;
      const mat = speaker.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.9 + pulse * 0.7;
      }
    }

    // Listeners brighten on a per-listener delay after the speaker.
    const lg = listenersRef.current;
    if (lg) {
      lg.children.forEach((child, i) => {
        const listener = listeners[i];
        if (!listener) return;
        const pulse = (Math.sin(t * 0.7 - 0.4 - listener.phase) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.2 + pulse * 0.5;
        }
      });
    }

    // Thread between author and speaker — a thin connection that
    // pulses with the author's signal, reading as "string-pulling".
    const thread = threadRef.current;
    if (thread) {
      const pulse = (Math.sin(t * 0.7) + 1) / 2;
      const mat = thread.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.3 + pulse * 0.4;
      }
    }
  });

  return (
    <group>
      {/* Panz — author, set back, quiet. Slightly lower y so the
          speaker clearly leads the scene. */}
      <mesh
        ref={authorRef}
        position={[0, 0.2, -1.6]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.35, 0.35, 0.35, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.45}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>

      {/* Speaker — larger, elevated, bright. The public voice. */}
      <mesh
        ref={speakerRef}
        position={[0, 0.55, -0.4]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.55, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.1}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>

      {/* Thin connection box between author and speaker — the thread.
          Oriented along -Z so it visually links the two. */}
      <mesh ref={threadRef} position={[0, 0.35, -1]}>
        <boxGeometry args={[0.05, 0.05, 1.05]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>

      {/* Listeners — audience arc out front, brightening in a
          cascade after the speaker. */}
      <group ref={listenersRef}>
        {listeners.map((l, i) => (
          <HexPrism
            key={i}
            position={l.position}
            scale={0.24}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.15, 0.4]}
        radius={3.2}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
