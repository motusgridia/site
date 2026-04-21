// MotusGridia — Alien Bacterium scene.
//
// Slug: alien-bacterium. Canon: fiction-c1.
//
// Visual metaphor: a dense cloud of small motes suspended in a
// volumetric shell, breathing on a long surge/docile cycle. The
// motes swarm closer and brighten during the surge phase, then
// disperse and dim during docile. Three pulses of dense hive-mind
// coordination radiate outward from the centre during peak surge.
// Beneath the cloud, a small projectile hex carries a dose across
// the plate — the bio-gun delivery variant — arriving at a target
// hex on the far side, which flashes on impact.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function AlienBacterium({
  canon,
}: {
  canon: CodexCanon;
}) {
  const cloudRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const projectileRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  /** Number of motes in the bacterium cloud. */
  const moteCount = 40;

  // Pre-compute base positions on a sphere around the origin. The
  // useFrame loop will scale distance and brightness — the base
  // positions stay fixed so the swarm reads as coherent.
  const motes = useMemo(() => {
    const out: { bx: number; by: number; bz: number; phase: number }[] = [];
    for (let i = 0; i < moteCount; i++) {
      // Spread across a hemisphere above the plate. Fibonacci-ish
      // sampling so the motes don't clump into visible grid bands.
      const theta = i * 2.399; // golden-angle
      const y = 0.4 + (i / moteCount) * 1.2;
      const r = 0.7 + Math.sin(i * 0.7) * 0.15;
      out.push({
        bx: Math.cos(theta) * r,
        by: y,
        bz: Math.sin(theta) * r,
        phase: (i / moteCount) * Math.PI * 2,
      });
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Surge / docile — 8s full cycle. 0 to ~0.4 rest, 0.4 to 0.7
    // surge peak, 0.7 to 1.0 cooldown.
    const period = 8;
    const phase = (t % period) / period;
    let surge: number;
    if (phase < 0.4) {
      surge = 0.15 + (phase / 0.4) * 0.1;
    } else if (phase < 0.7) {
      surge = 0.25 + ((phase - 0.4) / 0.3) * 0.75;
    } else {
      surge = 1.0 - ((phase - 0.7) / 0.3) * 0.85;
    }

    // Cloud motes — positions orbit slightly, brightness follows surge.
    const cloud = cloudRef.current;
    if (cloud) {
      cloud.children.forEach((child, i) => {
        const m = motes[i];
        if (!m) return;
        // Low-amplitude drift — surge pulls them inward, docile lets
        // them drift outward.
        const contract = 0.6 + surge * 0.3;
        child.position.x = m.bx * (2 - contract) + Math.sin(t * 0.7 + m.phase) * 0.05;
        child.position.y = m.by + Math.sin(t * 0.5 + m.phase) * 0.05;
        child.position.z = m.bz * (2 - contract) + Math.cos(t * 0.7 + m.phase) * 0.05;
        const mat = (child as THREE.Mesh).material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.3 + surge * 1.0 + Math.sin(t * 2 + m.phase) * 0.1;
        }
      });
    }

    // Hive-mind radiation rings — 3 staggered ring pulses at peak
    // surge only.
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      // Each ring runs on a 2.67s sub-period inside the main cycle,
      // but only during the surge window (phase 0.45-0.75).
      const subPhase = ((t + i * 0.9) % 2.67) / 2.67;
      const inSurge = phase > 0.42 && phase < 0.78;
      ring.visible = inSurge;
      if (inSurge) {
        const radius = 0.4 + subPhase * 2.0;
        ring.scale.x = radius;
        ring.scale.y = radius;
        ring.scale.z = 1;
        const mat = ring.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = Math.max(0, 0.9 - subPhase * 0.9);
        }
      }
    });

    // Projectile — on its own 5s cycle, travels from x=-2.3 (gun
    // location) to x=+2.2 (target). During cloud surge the projectile
    // is brightest.
    const proj = projectileRef.current;
    const target = targetRef.current;
    if (proj && target) {
      const projPeriod = 5;
      const projPhase = (t % projPeriod) / projPeriod;
      if (projPhase < 0.55) {
        // In flight
        const travel = projPhase / 0.55;
        proj.position.x = -2.3 + travel * 4.5;
        proj.position.y = 0.3 + Math.sin(travel * Math.PI) * 0.2;
        proj.visible = true;
        const mat = proj.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.8 + surge * 0.6;
        }
      } else {
        proj.visible = false;
      }
      // Target hex flashes at impact.
      const impactFlash = projPhase > 0.5 && projPhase < 0.7
        ? (projPhase > 0.55 ? (1 - (projPhase - 0.55) / 0.15) : (projPhase - 0.5) / 0.05)
        : 0;
      const tmat = target.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (tmat && "emissiveIntensity" in tmat) {
        tmat.emissiveIntensity = 0.3 + impactFlash * 1.4;
      }
    }
  });

  return (
    <group>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2.9}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Cloud of motes. */}
      <group ref={cloudRef} position={[0, 0, 0]}>
        {motes.map((_, i) => (
          <mesh key={`mote-${i}`} frustumCulled={false}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* Hive-mind pulse rings — flat on the plane at y=0.8
          (cloud midpoint). */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`ring-${i}`}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          position={[0, 0.75, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          frustumCulled={false}
        >
          <ringGeometry args={[0.9, 1.0, 48, 1]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.6}
            transparent
            opacity={0.7}
            side={2}
          />
        </mesh>
      ))}

      {/* Bio-gun muzzle hex (left). */}
      <mesh
        position={[-2.3, 0.15, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.2, 0.2, 0.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>

      {/* Projectile (travels left to right). */}
      <mesh
        ref={projectileRef}
        position={[-2.3, 0.3, 0]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Target hex (right). */}
      <mesh
        ref={targetRef}
        position={[2.2, 0.15, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.35, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
