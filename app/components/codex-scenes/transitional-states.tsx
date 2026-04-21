// MotusGridia — Transitional States scene.
//
// Slug: transitional-states. Canon: fiction-c1.
//
// Visual metaphor: three-hex composition across the plate. On
// the left a rougher Off-Grid hex, on the right a brighter
// On-Grid hex, and a transitional-zone hex between them.
// Running through the middle is a checkpoint belt — three small
// checkpoint-post hexes on a line, and a craft-workshop cluster
// on the Off-Grid-facing side. Motes travel left-to-right along
// the checkpoint line, brightening as they pass each post —
// travellers being scanned and processed into the Grid. A slow
// pulse from the On-Grid hex signals the completed onboarding.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

const MOTE_COUNT = 5;
const CHECKPOINT_COUNT = 3;
const CRAFT_COUNT = 3;

export function TransitionalStates({
  canon,
}: {
  canon: CodexCanon;
}) {
  const offGridRef = useRef<THREE.Mesh>(null);
  const transitionalRef = useRef<THREE.Mesh>(null);
  const onGridRef = useRef<THREE.Mesh>(null);
  const motesRef = useRef<Array<THREE.Mesh | null>>([]);
  const checkpointsRef = useRef<Array<THREE.Mesh | null>>([]);
  const craftRef = useRef<Array<THREE.Mesh | null>>([]);
  const beltRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Checkpoint positions — evenly spaced along the transit belt
  // between off-grid and on-grid hexes. x ranges roughly
  // -0.75 → +0.75.
  const checkpointXs = useMemo(() => {
    const xs: number[] = [];
    for (let i = 0; i < CHECKPOINT_COUNT; i += 1) {
      const k = (i + 1) / (CHECKPOINT_COUNT + 1);
      xs.push(-0.9 + k * 1.8);
    }
    return xs;
  }, []);

  // Craft workshop cluster positions — near the Off-Grid hex,
  // slightly below the belt.
  const craftPositions = useMemo<
    Array<[number, number, number]>
  >(() => {
    return [
      [-1.5, 0.55, 0.55],
      [-1.9, 0.55, 0.05],
      [-1.55, 0.55, -0.5],
    ];
  }, []);

  // Mote offsets — stagger start phases so motes travel the
  // belt continuously.
  const motePhases = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < MOTE_COUNT; i += 1) {
      arr.push(i / MOTE_COUNT);
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Off-Grid hex — rougher, cooler pulse, lower overall.
    const offGrid = offGridRef.current;
    if (offGrid) {
      const mat = offGrid.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.3 + Math.sin(t * 0.4) * 0.05;
      }
    }

    // Transitional hex — between the two, rises slowly as motes
    // pass through (imagine growing into membership).
    const transitional = transitionalRef.current;
    if (transitional) {
      const mat = transitional.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.5 + Math.sin(t * 0.8) * 0.08;
      }
    }

    // On-Grid hex — brightest, steady with a slow high pulse to
    // signal the onboarding endpoint.
    const onGrid = onGridRef.current;
    if (onGrid) {
      const mat = onGrid.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.8 + Math.sin(t * 0.6) * 0.1;
      }
    }

    // Belt — gentle rotation on underfoot.
    const belt = beltRef.current;
    if (belt) {
      belt.rotation.z = Math.sin(t * 0.15) * 0.04;
    }

    // Checkpoints — each flashes brighter when a mote passes.
    for (let i = 0; i < CHECKPOINT_COUNT; i += 1) {
      const cp = checkpointsRef.current[i];
      if (!cp) continue;
      // Find nearest mote.
      let close = 0;
      const cpX = checkpointXs[i];
      if (cpX === undefined) continue;
      for (let m = 0; m < MOTE_COUNT; m += 1) {
        const phase = motePhases[m];
        if (phase === undefined) continue;
        const p = ((t * 0.18 + phase) % 1);
        const mx = -2.1 + p * 4.2;
        const d = Math.abs(mx - cpX);
        if (d < 0.18) {
          const k = 1 - d / 0.18;
          if (k > close) close = k;
        }
      }
      const mat = cp.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + close * 0.9;
      }
    }

    // Motes — travel left-to-right along the belt, brightening
    // with each checkpoint passed.
    for (let i = 0; i < MOTE_COUNT; i += 1) {
      const mote = motesRef.current[i];
      if (!mote) continue;
      const phase = motePhases[i];
      if (phase === undefined) continue;
      const p = ((t * 0.18 + phase) % 1);
      mote.position.x = -2.1 + p * 4.2;
      mote.position.y = 0.55;
      mote.position.z = Math.sin(t * 0.8 + i) * 0.04;
      // Intensity climbs with progress through the belt.
      const mat = mote.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.6 + p * 0.8;
      }
      // Fade in/out at ends.
      let op = 0.85;
      if (p < 0.08) op = p / 0.08;
      else if (p > 0.92) op = (1 - p) / 0.08;
      if (mat && "opacity" in mat) {
        mat.opacity = op * 0.9;
      }
    }

    // Craft workshops — steady, small breathing glow.
    for (let i = 0; i < CRAFT_COUNT; i += 1) {
      const c = craftRef.current[i];
      if (!c) continue;
      const mat = c.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.25 + Math.sin(t * 0.5 + i) * 0.06;
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

      {/* Transit belt — a thin hex beneath the motes' path. */}
      <mesh
        ref={beltRef}
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <ringGeometry args={[1.5, 1.58, 48, 1]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.28}
          side={2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Off-Grid hex — left, larger, rougher. */}
      <mesh
        ref={offGridRef}
        position={[-1.9, 0.5, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 1.0, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.55}
        />
      </mesh>

      {/* Transitional hex — middle, slightly elevated. */}
      <mesh
        ref={transitionalRef}
        position={[0, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.5, 0.5, 1.1, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.5}
          roughness={0.45}
        />
      </mesh>

      {/* On-Grid hex — right, brightest, most crystalline. */}
      <mesh
        ref={onGridRef}
        position={[1.9, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 1.1, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.8}
          metalness={0.65}
          roughness={0.3}
        />
      </mesh>

      {/* Checkpoint posts — small hexes between off-grid and
          on-grid, forming the scanning belt. */}
      {checkpointXs.map((x, i) => (
        <mesh
          key={`cp-${i}`}
          ref={(el) => {
            checkpointsRef.current[i] = el;
          }}
          position={[x, 0.45, 0]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.12, 0.12, 0.7, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.35}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Craft workshops — small hexes on the Off-Grid side. */}
      {craftPositions.map((pos, i) => (
        <mesh
          key={`craft-${i}`}
          ref={(el) => {
            craftRef.current[i] = el;
          }}
          position={pos}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.14, 0.14, 0.4, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.25}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Motes — small hex sprites travelling the belt. */}
      {Array.from({ length: MOTE_COUNT }).map((_, i) => (
        <mesh
          key={`mote-${i}`}
          ref={(el) => {
            motesRef.current[i] = el;
          }}
          position={[-2.1, 0.55, 0]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.06, 0.06, 0.14, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.7}
            metalness={0.5}
            roughness={0.3}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}
