// MotusGridia — Cooling & Fluid Tubes scene.
//
// Slug: cooling-tubes. Canon: fiction-c1.
//
// Visual metaphor: a central host hex with 4 thin tubes arcing out
// to reservoir hexes placed at the rim of the plate. Fluid motes
// travel along each tube on independent cycles — the circulation
// the lore describes. The host hex runs a heat cycle: cool → spike
// → cooldown. During the spike, the reservoirs brighten and the
// motes travel faster (the system working harder to bleed heat).
// A drip line hangs above the host with small droplets descending
// at irregular intervals — the parasite-host drug drip.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function CoolingTubes({
  canon,
}: {
  canon: CodexCanon;
}) {
  const hostRef = useRef<THREE.Mesh>(null);
  const reservoirRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tubeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const moteRefs = useRef<(THREE.Mesh | null)[]>([]);
  const dripRefs = useRef<(THREE.Mesh | null)[]>([]);
  const dripLineRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Four reservoirs at compass points around the rim.
  const reservoirs = useMemo(() => {
    const out: { x: number; z: number; angle: number }[] = [];
    const n = 4;
    const r = 1.6;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + Math.PI / 4;
      out.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        angle,
      });
    }
    return out;
  }, []);

  // One mote per tube, each with its own phase.
  const motes = useMemo(() => {
    return reservoirs.map((_, i) => ({ phase: (i / reservoirs.length) * 2 }));
  }, [reservoirs]);

  // Three drip droplets, staggered.
  const drips = useMemo(() => {
    return [0, 1, 2].map((i) => ({ phase: (i / 3) * 2.2 }));
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Heat cycle — 10s.
    const period = 10;
    const phase = (t % period) / period;
    let heat: number;
    if (phase < 0.4) {
      heat = 0.35 + Math.sin(t * 0.6) * 0.05;
    } else if (phase < 0.6) {
      heat = 0.4 + ((phase - 0.4) / 0.2) * 0.85;
    } else if (phase < 0.8) {
      heat = 1.25 - ((phase - 0.6) / 0.2) * 0.9;
    } else {
      heat = 0.35 + Math.sin(t * 0.6) * 0.05;
    }

    // Host — brightness tracks heat.
    const host = hostRef.current;
    if (host) {
      const mat = host.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + heat * 0.55;
      }
    }

    // Reservoirs — brighten with heat (working harder).
    reservoirRefs.current.forEach((mesh) => {
      if (!mesh) return;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + heat * 0.45;
      }
    });

    // Tubes — gentle steady glow; barely changes with heat.
    tubeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.45 + Math.sin(t * 1.2 + i) * 0.08;
      }
    });

    // Motes travel along each tube. Travel speed grows with heat.
    const travelSpeed = 0.35 + heat * 0.6;
    motes.forEach((m, i) => {
      const mesh = moteRefs.current[i];
      if (!mesh) return;
      const r = reservoirs[i];
      if (!r) return;
      const localPhase = ((t + m.phase) * travelSpeed) % 1;
      // Alternate direction: even index host→reservoir, odd reservoir→host.
      const u = i % 2 === 0 ? localPhase : 1 - localPhase;
      mesh.position.x = u * r.x;
      mesh.position.z = u * r.z;
      mesh.position.y = 0.55 + Math.sin(localPhase * Math.PI) * 0.12;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.9 + heat * 0.4;
      }
    });

    // Drip line — steady dim.
    const dripLine = dripLineRef.current;
    if (dripLine) {
      const mat = dripLine.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.4;
      }
    }

    // Drip droplets — descend from y=2.0 to y=1.2, loop.
    drips.forEach((d, i) => {
      const mesh = dripRefs.current[i];
      if (!mesh) return;
      const localPhase = ((t + d.phase) * 0.4) % 1;
      mesh.position.y = 2.0 - localPhase * 0.8;
      mesh.visible = localPhase < 0.85;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.9;
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

      {/* Host — central cyborg. */}
      <mesh
        ref={hostRef}
        position={[0, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.36, 0.36, 1.1, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Reservoirs — small hexes at the rim. */}
      {reservoirs.map((r, i) => (
        <mesh
          key={`res-${i}`}
          ref={(el) => {
            reservoirRefs.current[i] = el;
          }}
          position={[r.x, 0.3, r.z]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.18, 0.18, 0.5, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Tubes — thin boxes from host to each reservoir. */}
      {reservoirs.map((r, i) => {
        const length = Math.hypot(r.x, r.z);
        const midX = r.x * 0.5;
        const midZ = r.z * 0.5;
        const rotY = -Math.atan2(r.z, r.x);
        return (
          <mesh
            key={`tube-${i}`}
            ref={(el) => {
              tubeRefs.current[i] = el;
            }}
            position={[midX, 0.55, midZ]}
            rotation={[0, rotY, 0]}
            frustumCulled={false}
          >
            <boxGeometry args={[length, 0.03, 0.03]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.45}
            />
          </mesh>
        );
      })}

      {/* Motes — small spheres travelling along each tube. */}
      {motes.map((_, i) => (
        <mesh
          key={`mote-${i}`}
          ref={(el) => {
            moteRefs.current[i] = el;
          }}
          position={[0, 0.55, 0]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}

      {/* Drip line — thin vertical bar above the host. */}
      <mesh
        ref={dripLineRef}
        position={[0, 1.7, 0]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.025, 0.6, 0.025]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Drip droplets. */}
      {drips.map((_, i) => (
        <mesh
          key={`drip-${i}`}
          ref={(el) => {
            dripRefs.current[i] = el;
          }}
          position={[0, 2.0, 0]}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
