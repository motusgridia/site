// MotusGridia — DeGarido Architecture scene.
//
// Slug: degarido-architecture. Canon: grounded.
//
// Visual metaphor: a central main-structure hex with six pod modules
// docked around it. The pods breathe — sliding out from the core by
// ~0.3 units, holding, then sliding back — on per-pod phase offsets so
// the whole unit reads as reconfiguring rather than vibrating. A slow
// rotation on the whole footprint frames it as a single settlement
// rather than a gear. Reads as modular architecture: assembles,
// reassembles, packs away.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Pod = {
  angle: number;
  phase: number;
};

export function DegaridoArchitecture({ canon }: { canon: CodexCanon }) {
  const mainRef = useRef<THREE.Mesh>(null);
  const podsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Six pods — one per hex face — docking directly against the main
  // structure when retracted, sitting slightly out when extended.
  const pods = useMemo<Pod[]>(() => {
    const arr: Pod[] = [];
    for (let i = 0; i < 6; i++) {
      arr.push({
        angle: (i / 6) * Math.PI * 2,
        // Stagger phases so the docking cycle never has all pods
        // extending or retracting in unison.
        phase: i * 0.9,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Whole footprint rotates slowly so the settlement feels alive
    // but not busy. 0.08 rad/sec.
    const main = mainRef.current;
    if (main) {
      main.rotation.y = t * 0.08;
      // Main structure pulses gently — the dwelling is occupied.
      const pulse = (Math.sin(t * 0.5) + 1) / 2;
      const mat = main.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.7 + pulse * 0.35;
      }
    }
    const pg = podsRef.current;
    if (pg) {
      pg.rotation.y = t * 0.08; // matches main so pods stay aligned
      pg.children.forEach((child, i) => {
        const pod = pods[i];
        if (!pod) return;
        // Slide in/out by up to 0.3 units along each pod's radial axis.
        // sin oscillation with per-pod phase — docking cycle, not
        // vibration.
        const extension = 0.9 + ((Math.sin(t * 0.45 + pod.phase) + 1) / 2) * 0.35;
        child.position.x = Math.cos(pod.angle) * extension;
        child.position.z = Math.sin(pod.angle) * extension;
        // Pods glow brighter when extended — reads as the extension
        // being deliberate (opening a door, powering up a room).
        const ext = (extension - 0.9) / 0.35;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.35 + ext * 0.5;
        }
      });
    }
  });

  return (
    <group>
      {/* Main structure — central hex, tall-ish so the pods read as
          docking against its sides rather than crawling on a disc. */}
      <mesh
        ref={mainRef}
        position={[0, 0.45, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.75, 0.75, 0.75, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.9}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* Pods — six modular sub-rooms that dock against the main
          structure. Each pod is a small hex that slides along its
          radial axis. */}
      <group ref={podsRef} position={[0, 0.45, 0]}>
        {pods.map((_, i) => (
          <mesh
            key={i}
            rotation={[0, Math.PI / 6, 0]}
            frustumCulled={false}
          >
            <cylinderGeometry args={[0.32, 0.32, 0.55, 6, 1, false]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.45}
              metalness={0.3}
              roughness={0.45}
            />
          </mesh>
        ))}
      </group>

      {/* Base platter — the footprint the unit drops onto, slightly
          larger than the extended pod radius so the base reads as a
          ground plate, not a floor decal. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2}
        depth={0.12}
        emissive={emissive}
        emissiveIntensity={0.1}
      />
    </group>
  );
}
