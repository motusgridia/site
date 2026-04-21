// MotusGridia — Aura & Photons scene.
//
// Slug: aura-and-photons. Canon: fiction-c1.
//
// Visual metaphor: a central cyborg hex wearing an aura. The aura
// is a thin ring hovering a short distance from the body,
// expanding/contracting on the energy cycle — tight at rest, wide
// during spikes. Photon motes stream out from the body, rising and
// fading; more motes when the aura is wide. Three crystal chips
// orbit on a slow ring, colouring the nearby aura segment. A thin
// Aurora arc overhead flares only during the highest spikes — the
// upper-bound display the lore flags.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function AuraAndPhotons({
  canon,
}: {
  canon: CodexCanon;
}) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const auraRingRef = useRef<THREE.Mesh>(null);
  const crystalRefs = useRef<(THREE.Mesh | null)[]>([]);
  const photonRefs = useRef<(THREE.Mesh | null)[]>([]);
  const auroraRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Photon motes — randomised start heights and phases so the
  // stream reads as a continuous release, not a single pulse.
  const photons = useMemo(() => {
    const out: { angle: number; phase: number; speed: number }[] = [];
    const n = 18;
    for (let i = 0; i < n; i++) {
      out.push({
        angle: (i / n) * Math.PI * 2 + (i % 3) * 0.5,
        phase: (i / n) * 2.1,
        speed: 0.4 + (i % 5) * 0.08,
      });
    }
    return out;
  }, []);

  const crystalCount = 3;

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Energy spike cycle — 9s. Aura ring radius grows during the
    // spike window, contracts back during rest.
    const period = 9;
    const phase = (t % period) / period;
    let intensity: number;
    if (phase < 0.5) {
      intensity = 0.3 + Math.sin(t * 0.7) * 0.05;
    } else if (phase < 0.68) {
      intensity = 0.35 + ((phase - 0.5) / 0.18) * 0.95;
    } else if (phase < 0.8) {
      intensity = 1.3 - ((phase - 0.68) / 0.12) * 0.95;
    } else {
      intensity = 0.3 + Math.sin(t * 0.7) * 0.05;
    }

    // Body — glows with intensity.
    const body = bodyRef.current;
    if (body) {
      const mat = body.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + intensity * 0.5;
      }
    }

    // Aura ring — scales in XZ with intensity. Slow rotation keeps
    // the crystal occlusion visually live.
    const aura = auraRingRef.current;
    if (aura) {
      const scale = 0.9 + intensity * 0.55;
      aura.scale.set(scale, 1, scale);
      aura.rotation.z = t * 0.25;
      const mat = aura.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4 + intensity * 0.5;
      }
    }

    // Crystals — orbit on a slow ring at fixed radius.
    for (let i = 0; i < crystalCount; i++) {
      const mesh = crystalRefs.current[i];
      if (!mesh) continue;
      const a = t * 0.45 + (i / crystalCount) * Math.PI * 2;
      mesh.position.x = Math.cos(a) * 1.3;
      mesh.position.z = Math.sin(a) * 1.3;
      mesh.rotation.y = t * 0.5 + i;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.6 + Math.sin(t * 1.4 + i * 1.3) * 0.2;
      }
    }

    // Photons — rise from body, fade, reset. Each mote runs on its
    // own cycle and is only visible while in flight.
    photons.forEach((p, i) => {
      const mesh = photonRefs.current[i];
      if (!mesh) return;
      const localPhase = ((t + p.phase) * p.speed) % 1;
      const rise = localPhase * 1.4;
      const dx = Math.cos(p.angle) * (0.32 + localPhase * 0.3);
      const dz = Math.sin(p.angle) * (0.32 + localPhase * 0.3);
      mesh.position.set(dx, 0.4 + rise, dz);
      // More motes visible during the spike window.
      const visible = intensity > 0.55 || (i % 3 === 0);
      mesh.visible = visible;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        // Fade as it rises.
        mat.emissiveIntensity = (1 - localPhase) * 1.2;
      }
    });

    // Aurora — only visible at peak. Slow drift across X.
    const aurora = auroraRef.current;
    if (aurora) {
      const visible = intensity > 0.9;
      aurora.visible = visible;
      aurora.rotation.z = Math.sin(t * 0.3) * 0.15;
      const mat = aurora.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = Math.max(0, intensity - 0.9) * 6;
      }
    }
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

      {/* Body hex — the cyborg. */}
      <mesh
        ref={bodyRef}
        position={[0, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.32, 0.32, 1.1, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Aura ring — thin flat ring in XZ, centred on body waist. */}
      <mesh
        ref={auraRingRef}
        position={[0, 0.55, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <ringGeometry args={[0.65, 0.72, 48, 1]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          side={2}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Crystals — three small hexes orbiting. */}
      {Array.from({ length: crystalCount }).map((_, i) => (
        <mesh
          key={`crystal-${i}`}
          ref={(el) => {
            crystalRefs.current[i] = el;
          }}
          position={[1.3, 0.55, 0]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.11, 0.11, 0.2, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.6}
            metalness={0.55}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Photon motes — small spheres that rise from the body. */}
      {photons.map((_, i) => (
        <mesh
          key={`photon-${i}`}
          ref={(el) => {
            photonRefs.current[i] = el;
          }}
          position={[0, 0.4, 0]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}

      {/* Aurora — thin arc above, only visible at spike peak. */}
      <mesh
        ref={auroraRef}
        position={[0, 2.0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <ringGeometry args={[1.1, 1.18, 64, 1, Math.PI * 0.15, Math.PI * 0.7]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0}
          side={2}
          transparent
          opacity={0.65}
        />
      </mesh>
    </group>
  );
}
