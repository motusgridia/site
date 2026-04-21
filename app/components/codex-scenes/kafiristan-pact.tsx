// MotusGridia — Kafiristan Pact scene.
//
// Slug: kafiristan-pact. Canon: fiction-c1.
//
// Visual metaphor: three signatory hexes standing in a closed
// triangle at mid-height, facing a small dark hex at the centre
// (Kafiristan — the refused territory). One signatory (Illum,
// the only named signer) burns at full brightness on a steady
// pulse; the other two float at half-brightness and phase-shift,
// reading as present but unnamed. A faint tri-line connects the
// three corners — the Pact itself. The central hex stays dim and
// does not pulse; it is the thing the agreement binds.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type SignatoryRef = {
  mesh: React.RefObject<THREE.Mesh | null>;
  // Angle around the triangle. 0 = front, flanked at 2π/3 each.
  angleBase: number;
  // How much this signatory is "named" in the archive. The named
  // signer (Illum) gets 1.0; the two unnamed signers get ~0.45.
  nameability: number;
  // Phase offset on the pulse — named signer leads, the two
  // unnamed lag by different beats so the triangle never lights
  // as one body.
  phaseOffset: number;
};

export function KafiristanPact({ canon }: { canon: CodexCanon }) {
  const groupRef = useRef<THREE.Group>(null);
  const illumRef = useRef<THREE.Mesh>(null);
  const veiledARef = useRef<THREE.Mesh>(null);
  const veiledBRef = useRef<THREE.Mesh>(null);
  const kafRef = useRef<THREE.Mesh>(null);
  const lineARef = useRef<THREE.Mesh>(null);
  const lineBRef = useRef<THREE.Mesh>(null);
  const lineCRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  const triangleRadius = 1.3;
  const signatories: SignatoryRef[] = [
    {
      mesh: illumRef,
      angleBase: Math.PI / 2, // top of triangle — Illum, the named
      nameability: 1.0,
      phaseOffset: 0,
    },
    {
      mesh: veiledARef,
      angleBase: Math.PI / 2 + (2 * Math.PI) / 3,
      nameability: 0.45,
      phaseOffset: 1.1,
    },
    {
      mesh: veiledBRef,
      angleBase: Math.PI / 2 - (2 * Math.PI) / 3,
      nameability: 0.45,
      phaseOffset: 2.2,
    },
  ];

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Whole triangle drifts — slow covert-alliance rotation. The
    // Pact is older than any single operation it runs.
    const group = groupRef.current;
    if (group) {
      group.rotation.y = t * 0.07;
    }

    // Signatory pulse. Named signer stays on a strong steady beat;
    // unnamed signers pulse at a faint, slower rate and never sync
    // with the named one.
    signatories.forEach((sig) => {
      const m = sig.mesh.current;
      if (!m) return;
      const pulse =
        (Math.sin(t * 0.6 + sig.phaseOffset) + 1) / 2;
      const base = sig.nameability * 0.5;
      const swing = sig.nameability * 0.45;
      const mat = m.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = base + pulse * swing;
      }
    });

    // Kafiristan — the bound territory. Dim, unchanging, does not
    // participate in the Pact's pulse.
    const kaf = kafRef.current;
    if (kaf) {
      const mat = kaf.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.12 + Math.sin(t * 0.25) * 0.02;
      }
    }

    // Tri-line — the agreement itself. Faint, rises slightly when
    // the named signer is at peak. Makes the shape visible as a
    // single binding even though no-one on earth sees it drawn.
    const lineIntensity =
      0.15 + ((Math.sin(t * 0.6) + 1) / 2) * 0.2;
    [lineARef, lineBRef, lineCRef].forEach((ref) => {
      const line = ref.current;
      if (!line) return;
      const mat = line.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = lineIntensity;
      }
    });
  });

  // Signatory positions, for both mesh placement and line maths.
  const posFor = (angle: number): readonly [number, number, number] =>
    [Math.cos(angle) * triangleRadius, 0.45, Math.sin(angle) * triangleRadius] as const;
  const pIllum = posFor(signatories[0]!.angleBase);
  const pVeilA = posFor(signatories[1]!.angleBase);
  const pVeilB = posFor(signatories[2]!.angleBase);

  // A thin cylinder aligned between two points reads as a line.
  // Helper returns [position, rotation, length] for a line between
  // two XZ-plane points at fixed Y.
  const lineBetween = (
    a: readonly [number, number, number],
    b: readonly [number, number, number],
  ): {
    position: readonly [number, number, number];
    rotation: readonly [number, number, number];
    length: number;
  } => {
    const midX = (a[0] + b[0]) / 2;
    const midZ = (a[2] + b[2]) / 2;
    const dx = b[0] - a[0];
    const dz = b[2] - a[2];
    const length = Math.sqrt(dx * dx + dz * dz);
    // Cylinder is vertical by default; rotate around Z by -π/2 to
    // lay it flat, then around Y to point it along the XZ vector.
    const yaw = Math.atan2(dz, dx);
    return {
      position: [midX, 0.45, midZ] as const,
      rotation: [0, -yaw, Math.PI / 2] as const,
      length,
    };
  };
  const lIA = lineBetween(pIllum, pVeilA);
  const lAB = lineBetween(pVeilA, pVeilB);
  const lBI = lineBetween(pVeilB, pIllum);

  return (
    <group>
      {/* Base plate — the room the three sit in. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={2.6}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.07}
      />

      <group ref={groupRef}>
        {/* Illum — named signer, top of triangle, full brightness. */}
        <mesh
          ref={illumRef}
          position={[pIllum[0], pIllum[1], pIllum[2]]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.28, 0.28, 0.7, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.85}
            metalness={0.55}
            roughness={0.4}
          />
        </mesh>

        {/* Veiled signer A — unnamed, lower brightness. */}
        <mesh
          ref={veiledARef}
          position={[pVeilA[0], pVeilA[1], pVeilA[2]]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.28, 0.28, 0.7, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.3}
            metalness={0.4}
            roughness={0.55}
          />
        </mesh>

        {/* Veiled signer B — unnamed, lower brightness. */}
        <mesh
          ref={veiledBRef}
          position={[pVeilB[0], pVeilB[1], pVeilB[2]]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.28, 0.28, 0.7, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.3}
            metalness={0.4}
            roughness={0.55}
          />
        </mesh>

        {/* The tri-line — three thin bars spanning the signatories
            at their shared height. This is the Pact drawn in space. */}
        <mesh
          ref={lineARef}
          position={[lIA.position[0], lIA.position[1], lIA.position[2]]}
          rotation={[lIA.rotation[0], lIA.rotation[1], lIA.rotation[2]]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.012, 0.012, lIA.length, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
        <mesh
          ref={lineBRef}
          position={[lAB.position[0], lAB.position[1], lAB.position[2]]}
          rotation={[lAB.rotation[0], lAB.rotation[1], lAB.rotation[2]]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.012, 0.012, lAB.length, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
        <mesh
          ref={lineCRef}
          position={[lBI.position[0], lBI.position[1], lBI.position[2]]}
          rotation={[lBI.rotation[0], lBI.rotation[1], lBI.rotation[2]]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.012, 0.012, lBI.length, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>

        {/* Kafiristan — the refused centre. Dim, dark, the thing
            the triangle is built around. */}
        <mesh
          ref={kafRef}
          position={[0, 0.25, 0]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.38, 0.5, 0.3, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.12}
            metalness={0.25}
            roughness={0.75}
          />
        </mesh>
      </group>
    </group>
  );
}
