// MotusGridia — Augmented Reality scene.
//
// Slug: augmented-reality. Canon: grounded.
//
// Visual metaphor: a solid hex sits on the base. A second, translucent
// hex — the "preview" — hovers above it, offset slightly and glowing
// brighter, as if overlaid by a headset. The preview rotates and
// pulses while the source sits still. A small retinue of "annotation"
// hex cells orbit the preview at low speed, reading as the metadata
// that AR surfaces around an object.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function AugmentedReality({ canon }: { canon: CodexCanon }) {
  const previewRef = useRef<THREE.Mesh>(null);
  const annotationsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  const annotationPositions = useMemo(() => {
    const arr: Array<readonly [number, number, number]> = [];
    // Six small annotation hexes orbiting around the preview object
    // at three different heights so the ring has depth.
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 1.8;
      const y = 0.9 + (i % 3) * 0.3;
      arr.push([
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius,
      ] as const);
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const preview = previewRef.current;
    if (preview) {
      // Preview rotates slowly and bobs vertically — "projection is
      // live and looking at you."
      preview.rotation.y += 0.008;
      preview.position.y = 1.3 + Math.sin(t * 0.6) * 0.08;
      const mat = preview.material as THREE.MeshStandardMaterial;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.9 + ((Math.sin(t * 1.4) + 1) / 2) * 0.6;
      }
    }
    const ann = annotationsRef.current;
    if (ann) {
      ann.rotation.y -= 0.01;
    }
  });

  return (
    <group>
      {/* Source hex — the real object on the bench. Solid, still. */}
      <HexPrism
        position={[0, 0.1, 0]}
        radius={0.9}
        depth={0.32}
        color="#0b1030"
        emissive={emissive}
        emissiveIntensity={0.3}
      />

      {/* Preview hex — floating above, translucent, hot. The AR
          overlay the headset is painting on top of the object. Uses
          a separate mesh with transparent=true so the material can
          go semi-clear without affecting the source. */}
      <mesh
        ref={previewRef}
        position={[0, 1.3, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.8, 0.8, 0.28, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.2}
          metalness={0.2}
          roughness={0.3}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Annotation satellites — six small hex cells that orbit the
          preview, reading as the metadata AR attaches to the object
          (price, creator, print time, etc). */}
      <group ref={annotationsRef}>
        {annotationPositions.map((pos, i) => (
          <HexPrism
            key={i}
            position={pos}
            scale={0.22}
            emissive={emissive}
            emissiveIntensity={0.55}
          />
        ))}
      </group>

      {/* Base platter — the workshop bench. */}
      <HexPrism
        position={[0, -0.2, 0]}
        radius={2}
        depth={0.12}
        emissive={emissive}
        emissiveIntensity={0.1}
      />
    </group>
  );
}
