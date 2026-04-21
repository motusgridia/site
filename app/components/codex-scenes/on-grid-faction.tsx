// MotusGridia — On-Grid Society scene.
//
// Slug: on-grid-faction. Canon: fiction-c1.
//
// Visual metaphor: the utopia as the fiction sees it. On top, a
// complete 7-hex honeycomb (centre + six neighbours) at mid-height
// with three Hub spires rising from alternate cells, small motes
// pulsing between hexes as Magway traffic. Below the main plate,
// pushed out of the eye's natural line, a single dimmer hex pulses
// on its own, slower beat — the unethical facility the surface
// does not acknowledge. The whole composition reads as "shiny on
// top, quiet dark underneath."
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Mote = {
  // Fraction around the ring of 6 segments the mote travels on.
  baseFrac: number;
  // Travel speed (radians/second equivalent on the 6-path loop).
  speed: number;
};

export function OnGridFaction({ canon }: { canon: CodexCanon }) {
  const centreRef = useRef<THREE.Mesh>(null);
  const neighboursRef = useRef<THREE.Group>(null);
  const spireARef = useRef<THREE.Mesh>(null);
  const spireBRef = useRef<THREE.Mesh>(null);
  const spireCRef = useRef<THREE.Mesh>(null);
  const facilityRef = useRef<THREE.Mesh>(null);
  const motesRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Six neighbour hex positions around the centre. Standard
  // pointy-top hex ring at a fixed radius.
  const neighbourPositions = useMemo<
    ReadonlyArray<readonly [number, number, number]>
  >(() => {
    const out: Array<readonly [number, number, number]> = [];
    const r: number = 1.55;
    const count: number = 6;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.PI / 6;
      out.push([Math.cos(a) * r, 0, Math.sin(a) * r] as const);
    }
    return out;
  }, []);

  // Traffic motes — 8 small glow points drifting around the
  // six-neighbour ring. Different speeds keep the ring from
  // looking like a single rotating wheel.
  const motes = useMemo<Mote[]>(() => {
    const out: Mote[] = [];
    const count: number = 8;
    for (let i = 0; i < count; i++) {
      out.push({
        baseFrac: i / count,
        speed: 0.08 + (i % 3) * 0.04,
      });
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Centre hex — steady utopia glow.
    const centre = centreRef.current;
    if (centre) {
      const mat = centre.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity =
          0.55 + ((Math.sin(t * 0.45) + 1) / 2) * 0.15;
      }
    }

    // Neighbours — mild individual breathing, offset per cell so
    // the comb reads as a living network not a single pulse.
    const ns = neighboursRef.current;
    if (ns) {
      ns.children.forEach((child, i) => {
        const pulse =
          (Math.sin(t * 0.5 + i * 0.7) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.3 + pulse * 0.3;
        }
      });
    }

    // Spires — Hub towers. Strong, constant, with a slow swell.
    const spireSwell =
      0.75 + ((Math.sin(t * 0.35) + 1) / 2) * 0.25;
    [spireARef, spireBRef, spireCRef].forEach((ref, idx) => {
      const m = ref.current;
      if (!m) return;
      const mat = m.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        // Each spire offset slightly so they don't pulse in sync.
        mat.emissiveIntensity =
          spireSwell * (0.9 + ((Math.sin(t * 0.35 + idx) + 1) / 2) * 0.2);
      }
    });

    // Motes — step each mote along the neighbour ring. The ring
    // has six corners; fractional travel between corners renders
    // as a mote moving along one edge of the comb.
    const mg = motesRef.current;
    if (mg) {
      mg.children.forEach((child, i) => {
        const mote = motes[i];
        if (!mote) return;
        const frac = (mote.baseFrac + t * mote.speed) % 1;
        const segmentFloat = frac * 6;
        const segmentIdx = Math.floor(segmentFloat);
        const segmentT = segmentFloat - segmentIdx;
        const a = neighbourPositions[segmentIdx % 6];
        const b = neighbourPositions[(segmentIdx + 1) % 6];
        if (!a || !b) return;
        const mesh = child as THREE.Mesh;
        mesh.position.set(
          a[0] + (b[0] - a[0]) * segmentT,
          a[1] + (b[1] - a[1]) * segmentT + 0.15,
          a[2] + (b[2] - a[2]) * segmentT,
        );
      });
    }

    // Facility — dirty secret beneath the comb. Slow, low pulse,
    // with occasional sharper flare the surface does not see.
    const fac = facilityRef.current;
    if (fac) {
      // Slow base breath (period ~8s) plus a rare flare.
      const base = 0.15 + ((Math.sin(t * 0.25) + 1) / 2) * 0.1;
      const flarePhase = (t % 11) / 11;
      const flare =
        flarePhase > 0.85 ? (flarePhase - 0.85) / 0.15 : 0;
      const mat = fac.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = base + flare * 0.6;
      }
    }
  });

  return (
    <group>
      {/* Base plate — the ground of the utopia. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={3.2}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Centre hex — the On-Grid's own cell. Brighter than the
          neighbours to read as capital-less centre of gravity. */}
      <mesh
        ref={centreRef}
        position={[0, 0.2, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.6, 0.6, 0.5, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.6}
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>

      {/* Six neighbour hexes — the comb completes. */}
      <group ref={neighboursRef}>
        {neighbourPositions.map((p, i) => (
          <HexPrism
            key={i}
            position={[p[0], 0.18, p[2]]}
            radius={0.55}
            depth={0.4}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Three Hub spires — rise from alternate neighbour cells.
          Thin, tall, unmistakably built. */}
      <mesh
        ref={spireARef}
        position={[
          neighbourPositions[0]![0],
          0.95,
          neighbourPositions[0]![2],
        ]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.1, 0.14, 1.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.8}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh
        ref={spireBRef}
        position={[
          neighbourPositions[2]![0],
          0.95,
          neighbourPositions[2]![2],
        ]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.1, 0.14, 1.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.8}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh
        ref={spireCRef}
        position={[
          neighbourPositions[4]![0],
          0.95,
          neighbourPositions[4]![2],
        ]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.1, 0.14, 1.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.8}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Traffic motes — small glow dots on the Magway ring. */}
      <group ref={motesRef}>
        {motes.map((_, i) => (
          <mesh key={i} frustumCulled={false}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.9}
              metalness={0.2}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* The facility — offset below and behind. Not central,
          not intended to catch the eye. Slow flare. */}
      <mesh
        ref={facilityRef}
        position={[1.8, -0.65, -1.1]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.32, 0.42, 0.45, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.15}
          metalness={0.25}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}
