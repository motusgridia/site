// MotusGridia — Honeycomb hero R3F scene.
//
// Spec: /landing-page-playbook.md § "What v0.1 ships" — "Cyberpunk hero —
//       slowly rotating honeycomb mesh (R3F), ~60 hex cells instanced,
//       deep indigo bg, cyan radial glow, bloom + chromatic aberration".
// Spec: /site/CLAUDE.md § Build conventions — "Lazy-load every R3F scene.
//       Use `next/dynamic` with `{ ssr: false, loading: () => <StaticHexFallback /> }`".
// Spec: /site/CLAUDE.md § Component rules #1 ("Hex DNA on every container")
//       and #5 ("Layered depth — bg + noise/grain + subtle radial glow").
//
// This module is intentionally defer-loaded behind `HeroCanvas.tsx`, which
// gates the dynamic import on `prefers-reduced-motion` + viewport width so
// the three.js / R3F chunk never loads for users who don't need it.
//
// Why InstancedMesh: 63 hex prisms would be 63 separate draw calls without
// instancing, blowing the frame budget on mid-tier devices. One InstancedMesh
// = one draw call regardless of cell count. See
// https://threejs.org/docs/#api/en/objects/InstancedMesh.
//
// Colour tokens pulled directly from /site/app/globals.css @theme block so
// the scene stays in lock-step with the locked design tokens. Do NOT add
// new colour values here — if a new shade is needed, the token goes into
// globals.css first (per /site/CLAUDE.md § "What requires explicit user
// confirmation").

"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Lattice geometry — pointy-top hex grid.
//
// Horizontal cell spacing for pointy-top: sqrt(3) × radius.
// Vertical row spacing for pointy-top:    1.5      × radius.
// Odd rows offset by sqrt(3)/2 × radius to interlock the honeycomb.
// See https://www.redblobgames.com/grids/hexagons/#basics for the full
// derivation.
// ---------------------------------------------------------------------------

const HEX_RADIUS = 0.5;
const HEX_DEPTH = 0.12;
const HEX_ROWS = 7;
const HEX_COLS = 9;
const INSTANCE_COUNT = HEX_ROWS * HEX_COLS; // 63 — matches the spec's "~60".
const ROTATION_SPEED = 0.04; // rad/s — one full rotation ≈ 2.6 minutes.

const ROW_SPACING = HEX_RADIUS * 1.5;
const COL_SPACING = HEX_RADIUS * Math.sqrt(3);

// Shrink each hex slightly so neighbours don't kiss — a ~0.88 scale leaves a
// visible hairline gap between cells which gives the lattice its circuitry
// feel (per /visual-identity.md § Lines are thin).
const HEX_CELL_SCALE = 0.88;

type Vec3 = readonly [number, number, number];

function computeHexPositions(): readonly Vec3[] {
  const positions: Vec3[] = [];
  for (let row = 0; row < HEX_ROWS; row++) {
    for (let col = 0; col < HEX_COLS; col++) {
      const x = col * COL_SPACING + (row % 2 === 0 ? 0 : COL_SPACING / 2);
      const y = row * ROW_SPACING;
      positions.push([x, y, 0]);
    }
  }
  // Centre the grid at origin so the rotation pivots around the optical
  // centre of the hero (which is also where the wordmark sits).
  const midX = ((HEX_COLS - 1) * COL_SPACING) / 2 + COL_SPACING / 4;
  const midY = ((HEX_ROWS - 1) * ROW_SPACING) / 2;
  return positions.map(
    ([x, y, z]) => [x - midX, y - midY, z] as Vec3,
  );
}

// ---------------------------------------------------------------------------
// Instanced honeycomb mesh.
// ---------------------------------------------------------------------------

function Honeycomb() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => computeHexPositions(), []);

  // Write the instance matrices exactly once, after the InstancedMesh has
  // mounted but before the first paint. useLayoutEffect (not useEffect)
  // guarantees the matrix data is uploaded to the GPU before the browser
  // ships the first frame — otherwise we'd see a one-frame flash of the
  // default identity transforms (all 63 hexes stacked on top of each other
  // at the origin).
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    positions.forEach((pos, i) => {
      const [x, y, z] = pos;
      dummy.position.set(x, y, z);
      // CylinderGeometry with 6 radialSegments stands upright around the Y
      // axis. Lay it flat so the hex caps face the camera by rotating π/2
      // around X, then π/6 around Y to convert from flat-top to pointy-top.
      dummy.rotation.set(Math.PI / 2, Math.PI / 6, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Rotate the whole cluster around Z (camera axis) so the lattice spins
    // in-plane. Subtle enough that the motion reads as "breathing" rather
    // than "carousel".
    mesh.rotation.z += ROTATION_SPEED * delta;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, INSTANCE_COUNT]}
      // Keep the whole lattice in-frame even when individual cells rotate
      // beyond the camera frustum — with only 63 cells the cull-check cost
      // is not worth the edge-case safety.
      frustumCulled={false}
    >
      <cylinderGeometry
        args={[
          HEX_RADIUS * HEX_CELL_SCALE,
          HEX_RADIUS * HEX_CELL_SCALE,
          HEX_DEPTH,
          6, // radialSegments = 6 → exact hexagon
          1,
          false,
        ]}
      />
      <meshStandardMaterial
        // Base = bg-panel (deep indigo) from globals.css @theme.
        color="#0b1030"
        // Subtle cyan self-emission so the hexes glow against the dark bg
        // even without a directional light. Keeps the scene coherent if a
        // user's GPU skips shadow/light calculations.
        emissive="#22e5ff"
        // Low intensity — /site/CLAUDE.md § Anti-patterns calls out
        // "magenta/cyan as large fill" as forbidden; emissive stays as a
        // whisper, not a shout.
        emissiveIntensity={0.14}
        metalness={0.35}
        roughness={0.45}
        // Render both faces so the hex caps look identical when the lattice
        // rotates past perpendicular to the camera (otherwise the back face
        // goes black mid-rotation).
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------------------
// Canvas wrapper with post-processing.
//
// The Canvas is absolute-positioned inside the hero section by its parent
// (`HeroCanvas.tsx`), which also handles the reduced-motion / small-viewport
// gating. This component assumes it's being rendered in a "motion allowed"
// context.
// ---------------------------------------------------------------------------

export default function HoneycombScene() {
  return (
    <Canvas
      // Cap device pixel ratio at 1.5× — going higher chews through GPU
      // budget on Retina for negligible visual gain on 0.04-rad/s motion.
      dpr={[1, 1.5]}
      // Perspective camera pulled back so the whole 9×7 lattice fits the
      // frame at fov 42. Z = 7 puts the lattice just behind where a human
      // eye would "rest" on the scene.
      camera={{ position: [0, 0, 7], fov: 42 }}
      // alpha: true preserves the parent section's `.hero-static` radial
      // gradient — the canvas composites on top rather than painting its
      // own bg. Keeps SSR fallback and live canvas visually continuous.
      gl={{ antialias: true, alpha: true }}
      // Anti-pattern guard: `pointer-events-none` keeps hover/click working
      // on the hex decorative glyphs and wordmark beneath the canvas.
      // Tailwind utilities used per /site/CLAUDE.md § Build conventions
      // "No inline styles".
      className="pointer-events-none absolute inset-0"
      // /site/CLAUDE.md § Component rules: no drop shadows, no spring
      // easing — the linear rotation loop respects that.
    >
      {/* Soft ambient fills the dark sides of each hex prism. */}
      <ambientLight intensity={0.42} color="#1a2240" />

      {/* Key light = cyan accent tinted, off-axis so the hex caps catch a
          single rim highlight. This is what makes the "glowing circuitry"
          effect read even at low emissive intensity. */}
      <directionalLight
        position={[3, 4, 6]}
        intensity={0.85}
        color="#22e5ff"
      />

      <Honeycomb />

      {/* Post-processing stack — the cyberpunk finish.
          - Bloom: soft halo around the cyan emissive pixels. Low intensity
            so it never overwhelms the wordmark.
          - ChromaticAberration: minute RGB split around the screen edges,
            mimicking the CRT-lens distortion called out in /visual-identity.md.
          Both are within the "glow alpha ≤ 0.25" cap from /site/CLAUDE.md. */}
      <EffectComposer>
        <Bloom
          intensity={0.38}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0009, 0.0013]}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </Canvas>
  );
}
