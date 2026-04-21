// MotusGridia — Media Production Tech scene.
//
// Slug: media-production-tech. Canon: fiction-c1.
//
// Visual metaphor: a three-node pipeline from left to right. A home
// actor hex (VR rig) on the left. A green-screen stage hex at
// centre-left. A render-bank cluster at centre-right. A finished-film
// hex on the right. Data pulses travel along the chain — from actor
// and stage into the render, and from the render out to the film.
// When a pulse arrives at the film, the film flashes brighter and the
// cycle restarts. Reads as a production pipeline, not a stack of
// isolated tools.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function MediaProductionTech({
  canon,
}: {
  canon: CodexCanon;
}) {
  const actorRef = useRef<THREE.Mesh>(null);
  const stageRef = useRef<THREE.Mesh>(null);
  const renderRef = useRef<THREE.Group>(null);
  const filmRef = useRef<THREE.Mesh>(null);
  const pulseARef = useRef<THREE.Mesh>(null);
  const pulseBRef = useRef<THREE.Mesh>(null);
  const pulseOutRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Fixed nodes along the pipeline.
  const actorPos = { x: -2.4, y: 0.35 };
  const stagePos = { x: -0.9, y: 0.35 };
  const renderPos = { x: 0.9, y: 0.35 };
  const filmPos = { x: 2.4, y: 0.35 };

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // The pipeline runs on a 6-second cycle. Actor and stage both
    // emit pulses into the render; the render processes, then emits
    // one pulse out to the film. Breaks:
    //   0.0-0.4: pulse A (actor → render) travels
    //   0.1-0.5: pulse B (stage → render) travels, staggered
    //   0.5-0.7: render brightens (processing)
    //   0.7-1.0: pulse out (render → film) travels
    const cyclePeriod = 6;
    const phase = (t % cyclePeriod) / cyclePeriod;

    // Actor — steady VR capture. Pulses on its own slower rhythm.
    const actor = actorRef.current;
    if (actor) {
      const mat = actor.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const pulse = (Math.sin(t * 1.8) + 1) / 2;
        mat.emissiveIntensity = 0.55 + pulse * 0.35;
      }
    }

    // Stage — green-screen studio. Steady bright (it's literally lit).
    const stage = stageRef.current;
    if (stage) {
      const mat = stage.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const pulse = (Math.sin(t * 1.4 + 1) + 1) / 2;
        mat.emissiveIntensity = 0.6 + pulse * 0.25;
      }
    }

    // Render — bank of compute. Flares brighter during processing.
    const rg = renderRef.current;
    if (rg) {
      rg.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          const processing = phase > 0.5 && phase < 0.75 ? 0.8 : 0;
          const pulse =
            (Math.sin(t * 3 + i * 1.3) + 1) / 2;
          mat.emissiveIntensity = 0.45 + pulse * 0.35 + processing;
        }
      });
    }

    // Film — receives the output. Flashes when pulse arrives (>=0.95).
    const film = filmRef.current;
    if (film) {
      const mat = film.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const flash = phase > 0.9 ? 1.0 : 0;
        const pulse = (Math.sin(t * 2) + 1) / 2;
        mat.emissiveIntensity = 0.4 + pulse * 0.2 + flash;
      }
    }

    // Pulse A — actor → render during phase 0.0-0.4.
    const pA = pulseARef.current;
    if (pA) {
      const active = phase < 0.4;
      pA.visible = active;
      if (active) {
        const local = phase / 0.4;
        pA.position.x =
          actorPos.x + (renderPos.x - actorPos.x) * local;
        pA.position.y = 0.5;
        pA.position.z = 0;
      }
    }

    // Pulse B — stage → render during phase 0.1-0.5 (staggered).
    const pB = pulseBRef.current;
    if (pB) {
      const active = phase >= 0.1 && phase < 0.5;
      pB.visible = active;
      if (active) {
        const local = (phase - 0.1) / 0.4;
        pB.position.x =
          stagePos.x + (renderPos.x - stagePos.x) * local;
        pB.position.y = 0.5;
        pB.position.z = 0;
      }
    }

    // Pulse out — render → film during phase 0.7-1.0.
    const pOut = pulseOutRef.current;
    if (pOut) {
      const active = phase >= 0.7;
      pOut.visible = active;
      if (active) {
        const local = (phase - 0.7) / 0.3;
        pOut.position.x =
          renderPos.x + (filmPos.x - renderPos.x) * local;
        pOut.position.y = 0.5;
        pOut.position.z = 0;
      }
    }
  });

  return (
    <group>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={3.8}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.06}
      />

      {/* Actor (home VR rig) — small hex with headset halo above. */}
      <mesh
        ref={actorRef}
        position={[actorPos.x, actorPos.y, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.42, 0.42, 0.55, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.55}
          metalness={0.45}
          roughness={0.45}
        />
      </mesh>

      {/* Stage (green screen) — flat wide hex. */}
      <mesh
        ref={stageRef}
        position={[stagePos.x, stagePos.y - 0.05, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.35, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.6}
          metalness={0.4}
          roughness={0.55}
        />
      </mesh>

      {/* Render bank — three small hexes clustered. */}
      <group ref={renderRef}>
        <HexPrism
          position={[renderPos.x - 0.2, 0.45, -0.25]}
          radius={0.22}
          depth={0.75}
          emissive={emissive}
          emissiveIntensity={0.45}
        />
        <HexPrism
          position={[renderPos.x + 0.2, 0.45, -0.25]}
          radius={0.22}
          depth={0.75}
          emissive={emissive}
          emissiveIntensity={0.45}
        />
        <HexPrism
          position={[renderPos.x, 0.45, 0.25]}
          radius={0.22}
          depth={0.75}
          emissive={emissive}
          emissiveIntensity={0.45}
        />
      </group>

      {/* Film output — tall hex on the right, flashes on delivery. */}
      <mesh
        ref={filmRef}
        position={[filmPos.x, filmPos.y + 0.15, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.38, 0.38, 0.85, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      {/* Pulses — small hexes travelling between nodes. */}
      <mesh
        ref={pulseARef}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.1, 0.1, 0.08, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.1}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      <mesh
        ref={pulseBRef}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.1, 0.1, 0.08, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.1}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      <mesh
        ref={pulseOutRef}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.12, 0.12, 0.08, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.2}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
