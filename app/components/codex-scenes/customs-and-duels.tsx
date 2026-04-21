// MotusGridia — Customs & Duels scene.
//
// Slug: customs-and-duels. Canon: fiction-c1.
//
// Visual metaphor: two combatant hexes facing each other across a
// central arena ring. They circle the ring on a slow orbit, step
// in to engage periodically (a closer orbit radius during "the
// exchange"), then step back out. Above them, a judgement hex
// hovers — lighting one side when the exchange favours them, the
// other on the return volley. Around the arena, six spectator hexes
// sit at the rim, breathing on their own phases — the tribal
// audience watching. A thin inner ring on the plate marks the arena.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function CustomsAndDuels({
  canon,
}: {
  canon: CodexCanon;
}) {
  const emissive = canonColour(canon);
  const combatantARef = useRef<THREE.Mesh>(null);
  const combatantBRef = useRef<THREE.Mesh>(null);
  const judgementRef = useRef<THREE.Mesh>(null);
  const spectatorRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Six spectators at fixed angles around the arena.
  const spectators = useMemo(() => {
    const out: { x: number; z: number; phase: number }[] = [];
    const n = 6;
    const r = 2.3;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + Math.PI / 6;
      out.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        phase: (i / n) * 2.5,
      });
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Duel cycle — 8s. Combatants circle at radius 1.3 for first
    // 60 %, then step in to 0.7 for the exchange (60-75 %), then
    // back out to 1.3 (75-100 %).
    const period = 8;
    const phase = (t % period) / period;
    let radius: number;
    if (phase < 0.6) {
      radius = 1.3;
    } else if (phase < 0.75) {
      radius = 1.3 - ((phase - 0.6) / 0.15) * 0.6;
    } else {
      radius = 0.7 + ((phase - 0.75) / 0.25) * 0.6;
    }

    const orbitAngle = t * 0.35;

    const a = combatantARef.current;
    if (a) {
      a.position.x = Math.cos(orbitAngle) * radius;
      a.position.z = Math.sin(orbitAngle) * radius;
      a.rotation.y = -orbitAngle + Math.PI / 2;
      const exchange = phase > 0.6 && phase < 0.75;
      const mat = a.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.45 + (exchange ? 0.5 : 0);
      }
    }
    const b = combatantBRef.current;
    if (b) {
      const bAngle = orbitAngle + Math.PI;
      b.position.x = Math.cos(bAngle) * radius;
      b.position.z = Math.sin(bAngle) * radius;
      b.rotation.y = -bAngle + Math.PI / 2;
      const exchange = phase > 0.6 && phase < 0.75;
      const mat = b.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.45 + (exchange ? 0.5 : 0);
      }
    }

    // Judgement hex — favours one side then the other in alternation.
    const j = judgementRef.current;
    if (j) {
      // Favour cycle — slow 3.5s sway.
      const favour = Math.sin(t * 0.4); // -1..1
      j.position.x = favour * 0.7;
      j.rotation.y = t * 0.3 + Math.PI / 6;
      const mat = j.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.6 + Math.sin(t * 1.3) * 0.15;
      }
    }

    // Spectators — tribal drum breath (faster than Grid ambient).
    spectators.forEach((s, i) => {
      const mesh = spectatorRefs.current[i];
      if (!mesh) return;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        // Fast drum beat — regular pulse at ~1.2Hz with per-spectator
        // phase offset.
        const beat = Math.max(0, Math.sin(t * 7 + s.phase));
        mat.emissiveIntensity = 0.3 + beat * 0.5;
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

      {/* Arena ring — thin flat ring marking the combat zone. */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <ringGeometry args={[1.4, 1.5, 48, 1]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.35}
          side={2}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Combatant A. */}
      <mesh
        ref={combatantARef}
        position={[1.3, 0.4, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.28, 0.28, 0.8, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.45}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Combatant B. */}
      <mesh
        ref={combatantBRef}
        position={[-1.3, 0.4, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.28, 0.28, 0.8, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.45}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Judgement hex — hovers above centre, drifts toward whoever favours. */}
      <mesh
        ref={judgementRef}
        position={[0, 1.6, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.18, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.6}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>

      {/* Spectators — ring of small hexes at the rim. */}
      {spectators.map((s, i) => (
        <mesh
          key={`spectator-${i}`}
          ref={(el) => {
            spectatorRefs.current[i] = el;
          }}
          position={[s.x, 0.18, s.z]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.17, 0.17, 0.36, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
