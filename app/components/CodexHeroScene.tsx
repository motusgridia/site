// MotusGridia — Codex sub-page 3D hero scenes.
//
// Spec: Standing directive (session 6) —
//       "make the site feel as much like a 3d space as possible. every
//        concept illustrated visually, solar-system-style 3d model UX".
// Spec: /site/CLAUDE.md § Component rules (hex DNA, 1px lines, layered depth,
//       reduced motion), § Writing rules (punchy, direct — applies to names
//       and comments as much as copy).
// Spec: /site/lib/content.ts § CANON_ACCENT — cyan = grounded,
//       amber = fiction-c1 / fiction-c2.
//
// Every codex entry gets a 3D hero that illustrates the idea. This file
// holds the dispatcher + every concrete scene variant, all co-located so
// the lazy-loaded chunk ships exactly one module. Scenes are intentionally
// small (15–80 lines each); when a scene grows past that it gets promoted
// into its own file.
//
// Current catalogue (bespoke → default fallback for the rest):
//   honeycomb-architecture, grid-network, magway, hubs, grid-domes,
//   basic-law, wireless-power, memory-metal, drone-delivery, illum,
//   the-hive, bacterium-zones, alien-prince, eastern-grids, kafiristan,
//   judgement-day, cyber-vikings, reward-banks, off-grid, alien-queen.
//
// Split-in-progress: new scenes go in `app/components/codex-scenes/<name>.tsx`
// and import shared primitives from `./codex-scenes/shared`. The older
// inline scenes (everything before alien-queen) still live in this file
// — they will migrate out as they receive updates, to avoid a big-bang
// refactor. The Throne scene (alien-queen) is the first to land under
// the new pattern.
//
// Camera framing is letterbox (4:1-ish) to match the surrounding banner
// slot the scene replaces. Objects orbit in the XZ plane so the wide
// aspect ratio reads naturally instead of feeling cropped.

"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import {
  canonColour,
  canonFill,
  HexPrism,
  type CodexHeroProps,
} from "./codex-scenes/shared";
import { AlienEmpire } from "./codex-scenes/alien-empire";
import { AsteroidMining } from "./codex-scenes/asteroid-mining";
import { AugmentedReality } from "./codex-scenes/augmented-reality";
import { BlueprintTrade } from "./codex-scenes/blueprint-trade";
import { ChildProtection } from "./codex-scenes/child-protection";
import { Education } from "./codex-scenes/education";
import { EHair } from "./codex-scenes/e-hair";
import { EmergencyServices } from "./codex-scenes/emergency-services";
import { GridLawTeams } from "./codex-scenes/grid-law-teams";
import { GridsPlatform } from "./codex-scenes/grids-platform";
import { Modularity } from "./codex-scenes/modularity";
import { Optionism } from "./codex-scenes/optionism";
import { Throne } from "./codex-scenes/throne";
import { VrTechnology } from "./codex-scenes/vr-technology";

// Re-export the public type so existing pages/components importing
// `CodexHeroProps` from this module keep working without churn.
export type { CodexHeroProps };

// ---------------------------------------------------------------------------
// Scene: Honeycomb Architecture — tight cluster of 7 hexes rotating.
//
// One centre cell + six neighbours. Shows the fundamental honeycomb unit:
// a Grid and its six-way adjacency. Reads in half a second at 300px tall.
// ---------------------------------------------------------------------------

function HoneycombCluster({ canon }: { canon: CodexHeroProps["canon"] }) {
  const groupRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Six neighbour offsets in axial → world. Centre is (0,0).
  const neighbours = useMemo(() => {
    const r = 1;
    const SQRT3 = Math.sqrt(3);
    const positions: Array<readonly [number, number, number]> = [];
    const dirs: Array<readonly [number, number]> = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];
    for (const dir of dirs) {
      const [dq, dr] = dir;
      const x = r * SQRT3 * (dq + dr / 2);
      const z = r * 1.5 * dr;
      positions.push([x, 0, z] as const);
    }
    return positions;
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      <HexPrism emissive={emissive} emissiveIntensity={0.4} scale={0.92} />
      {neighbours.map((pos, i) => (
        <HexPrism
          key={i}
          position={pos}
          emissive={emissive}
          emissiveIntensity={0.22}
          scale={0.92}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Grid Network — three combs orbiting a planetary centre.
//
// Echoes the "planet covered in honeycomb" copy from the entry. A dark
// sphere anchors the scene; three triangular hex clusters orbit around it
// at different radii and tilts.
// ---------------------------------------------------------------------------

function OrbitComb({
  radius,
  speed,
  tilt,
  phase,
  canon,
}: {
  radius: number;
  speed: number;
  tilt: number;
  phase: number;
  canon: CodexHeroProps["canon"];
}) {
  const ref = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime * speed + phase;
    g.position.set(
      Math.cos(t) * radius,
      Math.sin(t) * Math.sin(tilt) * radius * 0.3,
      Math.sin(t) * radius,
    );
    g.rotation.y = -t * 0.5;
  });

  return (
    <group ref={ref}>
      <HexPrism emissive={emissive} emissiveIntensity={0.55} scale={0.5} />
      <HexPrism
        position={[0.9, 0, 0]}
        emissive={emissive}
        emissiveIntensity={0.35}
        scale={0.5}
      />
      <HexPrism
        position={[-0.45, 0, 0.78]}
        emissive={emissive}
        emissiveIntensity={0.35}
        scale={0.5}
      />
    </group>
  );
}

function PlanetaryNetwork({ canon }: { canon: CodexHeroProps["canon"] }) {
  const emissive = canonColour(canon);
  return (
    <group>
      {/* Planet core — matte dark sphere with a faint emissive so it reads
          as a body rather than a silhouette hole. */}
      <mesh>
        <sphereGeometry args={[1.2, 48, 32]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.08}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>
      <OrbitComb radius={3.2} speed={0.35} tilt={0.2} phase={0} canon={canon} />
      <OrbitComb
        radius={4.1}
        speed={0.26}
        tilt={-0.3}
        phase={2.1}
        canon={canon}
      />
      <OrbitComb
        radius={5.0}
        speed={0.18}
        tilt={0.45}
        phase={4.2}
        canon={canon}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Magway — translucent tube cross-section with a pod travelling
// through it. The tube extends off-frame on both ends to signal the
// "underground artery" nature of the system.
// ---------------------------------------------------------------------------

function MagwayTube({ canon }: { canon: CodexHeroProps["canon"] }) {
  const podRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const pod = podRef.current;
    if (!pod) return;
    // Pod travels along X, loops every 4.5 seconds.
    const t = (state.clock.elapsedTime * 1.8) % 14;
    pod.position.x = -7 + t;
  });

  return (
    <group>
      {/* Tube — a long cylinder rotated to run along X. Double-sided so we
          see both inner and outer walls when it clips the camera frustum. */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.1, 1.1, 14, 32, 1, true]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.12}
          metalness={0.5}
          roughness={0.5}
          side={THREE.DoubleSide}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Inner cyan rail — pulses with the pod. */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 14, 12]} />
        <meshStandardMaterial
          color={emissive}
          emissive={emissive}
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Pod — elongated pill, emissive front face so direction-of-travel
          reads at a glance. */}
      <mesh ref={podRef} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.45, 1.4, 8, 16]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.9}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Hubs — vertical megastructure. A stack of hex prisms growing up,
// slightly twisted at each level for the "megastructure not box" read.
// ---------------------------------------------------------------------------

function HubTower({ canon }: { canon: CodexHeroProps["canon"] }) {
  const towerRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  const levels = 10;

  useFrame((_, delta) => {
    const t = towerRef.current;
    if (!t) return;
    t.rotation.y += delta * 0.18;
  });

  return (
    <group ref={towerRef} position={[0, -1.2, 0]}>
      {Array.from({ length: levels }, (_, i) => {
        // Scale the hex smaller as we go up. Each floor twists slightly
        // against the one below so the silhouette reads as a spire.
        const y = i * 0.55;
        const scale = 1 - i * 0.07;
        const twist = i * 0.08;
        return (
          <HexPrism
            key={i}
            position={[0, y, 0]}
            rotation={[0, Math.PI / 6 + twist, 0]}
            depth={0.45}
            scale={scale}
            emissive={emissive}
            emissiveIntensity={0.22 + i * 0.04}
          />
        );
      })}

      {/* Base ring of 6 small hexes — the comb around the Hub. */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 2.4;
        return (
          <HexPrism
            key={`base-${i}`}
            position={[Math.cos(angle) * r, -0.3, Math.sin(angle) * r]}
            scale={0.45}
            emissive={emissive}
            emissiveIntensity={0.2}
          />
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Grid Domes — transparent dome over a small hex comb.
// ---------------------------------------------------------------------------

function DomedGrid({ canon }: { canon: CodexHeroProps["canon"] }) {
  const ref = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += delta * 0.1;
  });

  return (
    <group ref={ref}>
      {/* Central hex + ring of 6 — the ground plan. */}
      <HexPrism emissive={emissive} emissiveIntensity={0.35} scale={0.85} />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const r = Math.sqrt(3);
        return (
          <HexPrism
            key={i}
            position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}
            emissive={emissive}
            emissiveIntensity={0.22}
            scale={0.85}
          />
        );
      })}

      {/* Dome — hemisphere, wireframe + transparent fill so hex structure
          stays visible through it. */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={emissive}
          emissive={emissive}
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Inner glass sheen — subtle translucent hemisphere underneath the
          wireframe to suggest "glass" rather than "lines only". */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry
          args={[2.28, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.05}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Basic Law — a single floating hex obelisk, faceted, slowly
// rotating. One pillar for the "non-negotiable floor beneath every Grid".
// ---------------------------------------------------------------------------

function HexObelisk({ canon }: { canon: CodexHeroProps["canon"] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((_, delta) => {
    const m = meshRef.current;
    if (!m) return;
    m.rotation.y += delta * 0.18;
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[1, 1.2, 3.5, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.55}
          metalness={0.6}
          roughness={0.25}
          flatShading
        />
      </mesh>

      {/* Ground platter — wide thin hex under the obelisk. */}
      <HexPrism
        position={[0, -1.9, 0]}
        radius={2.2}
        depth={0.12}
        emissive={emissive}
        emissiveIntensity={0.18}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Wireless Power — emitter tower with concentric cyan rings
// pulsing outward across the floor.
// ---------------------------------------------------------------------------

function PulseRing({
  phase,
  canon,
}: {
  phase: number;
  canon: CodexHeroProps["canon"];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    const mat = matRef.current;
    if (!m || !mat) return;
    const t = ((state.clock.elapsedTime + phase) % 3) / 3;
    const r = 0.4 + t * 4.2;
    m.scale.setScalar(r);
    mat.opacity = 1 - t;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
      <ringGeometry args={[0.95, 1, 64]} />
      <meshBasicMaterial
        ref={matRef}
        color={emissive}
        transparent
        opacity={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function EmitterTower({ canon }: { canon: CodexHeroProps["canon"] }) {
  const emissive = canonColour(canon);
  return (
    <group>
      {/* Central coil — thin hex prism tower. */}
      <HexPrism
        position={[0, 0, 0]}
        depth={2.4}
        radius={0.45}
        emissive={emissive}
        emissiveIntensity={0.9}
      />
      {/* Emitter cap — small hex on top glowing bright. */}
      <HexPrism
        position={[0, 1.45, 0]}
        depth={0.18}
        radius={0.75}
        emissive={emissive}
        emissiveIntensity={1.4}
      />
      {/* Three rings pulsing outward with staggered phases. */}
      <PulseRing phase={0} canon={canon} />
      <PulseRing phase={1} canon={canon} />
      <PulseRing phase={2} canon={canon} />

      {/* Floor hex — receives the rings visually. */}
      <HexPrism
        position={[0, -0.85, 0]}
        radius={3.2}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.14}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Memory Metal — morphing geometry. A hex prism that breathes
// between a flat hex and a raised prism to suggest "snaps between shapes".
// ---------------------------------------------------------------------------

function MorphingHex({ canon }: { canon: CodexHeroProps["canon"] }) {
  const ref = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    // Square pulse with easing — sits at one state then snaps to the next.
    const phase = (Math.sin(t * 0.8) + 1) / 2;
    const eased = Math.pow(phase, 3);
    m.scale.set(1 + eased * 0.4, 0.3 + eased * 1.2, 1 + eased * 0.4);
    m.rotation.y = t * 0.25;
  });

  return (
    <group>
      <mesh ref={ref} rotation={[0, Math.PI / 6, 0]} frustumCulled={false}>
        <cylinderGeometry args={[1.1, 1.1, 1, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.2}
          flatShading
        />
      </mesh>
      {/* Ring of four indicator cubes around the metal block — the preset
          slots the alloy can snap between. */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const r = 2.4;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, -0.6, Math.sin(angle) * r]}
          >
            <boxGeometry args={[0.25, 0.25, 0.25]} />
            <meshStandardMaterial
              color="#0b1030"
              emissive={emissive}
              emissiveIntensity={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Drone Delivery — orbiting drones around a central hex Grid.
// Each drone is a small emissive cube.
// ---------------------------------------------------------------------------

function OrbitingDrone({
  radius,
  speed,
  yOffset,
  phase,
  canon,
}: {
  radius: number;
  speed: number;
  yOffset: number;
  phase: number;
  canon: CodexHeroProps["canon"];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime * speed + phase;
    m.position.set(Math.cos(t) * radius, yOffset, Math.sin(t) * radius);
    m.rotation.y = t;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.28, 0.12, 0.28]} />
      <meshStandardMaterial
        color="#0b1030"
        emissive={emissive}
        emissiveIntensity={1.1}
        metalness={0.5}
        roughness={0.3}
      />
    </mesh>
  );
}

function DroneSwarm({ canon }: { canon: CodexHeroProps["canon"] }) {
  const emissive = canonColour(canon);
  return (
    <group>
      <HexPrism emissive={emissive} emissiveIntensity={0.35} scale={0.9} />
      {Array.from({ length: 8 }, (_, i) => (
        <OrbitingDrone
          key={i}
          radius={1.6 + (i % 3) * 0.4}
          speed={0.6 + (i % 4) * 0.15}
          yOffset={0.35 + ((i % 3) - 1) * 0.25}
          phase={i}
          canon={canon}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Illum — half-human, half-hive. A hex split diagonally between
// cyan (the human eye) and amber (the bacterium-red eye). Slow rotation.
// ---------------------------------------------------------------------------

function BisectedHex() {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += delta * 0.22;
  });

  return (
    <group ref={ref}>
      {/* Cyan half — emissive cyan only. */}
      <HexPrism
        position={[-0.08, 0, 0]}
        scale={0.9}
        emissive="#22e5ff"
        emissiveIntensity={0.55}
      />
      {/* Amber half — offset slightly and smaller to read as a split.
          Overlapping geometry is the simplest way to fake a bisection
          without a custom shader; at this scale the seam isn't visible. */}
      <HexPrism
        position={[0.08, 0.02, 0]}
        scale={0.88}
        emissive="#ff6347"
        emissiveIntensity={0.7}
        depth={0.24}
      />
      {/* Red spark plume — small red emissive sphere hovering above the
          amber side. */}
      <mesh position={[0.45, 0.5, 0]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshBasicMaterial color="#ff3a1c" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: The Hive — scattered bacterium nodes pulsing in coordination.
//
// The copy calls out "billions of microscopic agents, distributed across
// infected hosts… forming a single intelligence that talks to itself
// across continents". The scene reads as a cluster of small nodes at
// different depths, all pulsing in sync when the "signal" fires. A
// second inverse pulse answers — the signal bouncing back. Sync is the
// point; distance without the sync would just look like noise.
// ---------------------------------------------------------------------------

function HiveNode({
  position,
  phase,
  canon,
}: {
  position: readonly [number, number, number];
  phase: number;
  canon: CodexHeroProps["canon"];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    // Shared-clock pulse — every node listens to the same wall clock so
    // the ensemble reads as coordinated, not random. Phase offset per
    // node is small so the hive "breathes" rather than strobes.
    const t = state.clock.elapsedTime * 1.4 + phase * 0.25;
    const pulse = (Math.sin(t) + 1) / 2;
    m.scale.setScalar(0.18 + pulse * 0.22);
  });

  return (
    <mesh ref={ref} position={[position[0], position[1], position[2]]}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial
        color="#7a0d0d"
        emissive={emissive}
        emissiveIntensity={1.4}
      />
    </mesh>
  );
}

function HiveNetwork({ canon }: { canon: CodexHeroProps["canon"] }) {
  const groupRef = useRef<THREE.Group>(null);

  // Deterministic pseudo-random positions — spread across a wide XZ
  // footprint with slight Y variation. Seeded so the hive never
  // reshuffles between renders.
  const nodes = useMemo(() => {
    const seeded = [
      [2.8, 0.3, -1.2],
      [-2.4, -0.4, 1.1],
      [1.6, 0.6, 2.3],
      [-1.8, 0.2, -2.1],
      [3.2, -0.2, 1.8],
      [-3.1, 0.5, -0.6],
      [0.4, 0.8, -2.7],
      [-0.7, -0.3, 2.8],
      [2.1, -0.5, -2.4],
      [-2.7, 0.6, 2.2],
      [0.9, 0.3, 1.0],
      [-1.2, -0.2, -0.8],
    ] as const;
    return seeded;
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += delta * 0.08;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <HiveNode key={i} position={pos} phase={i} canon={canon} />
      ))}
      {/* Faint central "aggregate" hex — the shape the distributed mind
          would occupy if it were a body. Reads as a ghost below the
          node cloud. */}
      <HexPrism
        position={[0, -1, 0]}
        radius={2.2}
        depth={0.05}
        emissive={canonColour(canon)}
        emissiveIntensity={0.1}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Bacterium Zones — honeycomb cluster with a spreading infection
// glow. Cells at the centre burn hot amber-red; cells at the perimeter
// stay cool. A pulse waves outward, picking up new cells as it goes —
// the "ink along the river veins" motion.
// ---------------------------------------------------------------------------

function InfectedCell({
  position,
  distance,
  canon,
}: {
  position: readonly [number, number, number];
  // Ring distance from origin in hex rings (0 = centre, 1 = first ring…).
  distance: number;
  canon: CodexHeroProps["canon"];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    // Wave that sweeps outward through the rings. When the wave reaches
    // this cell's ring, it flares hot; afterwards it cools but not all
    // the way back to base — the infection sticks.
    const t = state.clock.elapsedTime * 0.6;
    const wave = (Math.sin(t - distance * 1.2) + 1) / 2;
    const glow = 0.25 + wave * 0.9 + Math.max(0, 1 - distance * 0.35) * 0.4;
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = glow;
  });

  return (
    <mesh
      ref={ref}
      position={[position[0], position[1], position[2]]}
      rotation={[0, Math.PI / 6, 0]}
      frustumCulled={false}
    >
      <cylinderGeometry args={[0.95, 0.95, 0.22, 6, 1, false]} />
      <meshStandardMaterial
        color="#3a0505"
        emissive={emissive}
        emissiveIntensity={0.3}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

function InfectedZone({ canon }: { canon: CodexHeroProps["canon"] }) {
  const groupRef = useRef<THREE.Group>(null);

  // Two-ring hex comb (centre + 6 + 12 = 19 cells). Distance is the
  // ring index so the pulse sweeps outward in waves.
  const cells = useMemo(() => {
    const SQRT3 = Math.sqrt(3);
    const r = 1;
    const out: Array<{
      pos: readonly [number, number, number];
      ring: number;
    }> = [{ pos: [0, 0, 0] as const, ring: 0 }];
    const dirs: Array<readonly [number, number]> = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];
    // Ring 1 — the six immediate neighbours.
    for (const [dq, dr] of dirs) {
      const x = r * SQRT3 * (dq + dr / 2);
      const z = r * 1.5 * dr;
      out.push({ pos: [x, 0, z] as const, ring: 1 });
    }
    // Ring 2 — twelve cells around ring 1.
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = r * SQRT3 * 2;
      out.push({
        pos: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius,
        ] as const,
        ring: 2,
      });
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += delta * 0.05;
  });

  return (
    <group ref={groupRef}>
      {cells.map((cell, i) => (
        <InfectedCell
          key={i}
          position={cell.pos}
          distance={cell.ring}
          canon={canon}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Alien Prince — a chess-like hex board at varying heights. The
// "mind reading the board" is implied by the vertical variation and
// slow rotation. No pulses, no action — just contemplation. The Prince
// does not move first.
// ---------------------------------------------------------------------------

function StrategyBoard({ canon }: { canon: CodexHeroProps["canon"] }) {
  const ref = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // 4x3 board of hexes, each at a deterministic pseudo-random height so
  // the pieces feel placed, not procedurally scattered. A few "lifted"
  // pieces read as the Prince's active considerations; the low pieces
  // read as idle state.
  const pieces = useMemo(() => {
    const heights = [
      0.0, 0.6, 0.1, 0.9, 0.3, 0.0, 1.2, 0.2, 0.7, 0.0, 0.4, 0.8,
    ];
    const out: Array<{
      pos: readonly [number, number, number];
      lift: number;
    }> = [];
    const SQRT3 = Math.sqrt(3);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 3; row++) {
        const x = (col - 1.5) * SQRT3 * 0.95;
        const z = (row - 1) * 1.55;
        const h = heights[col * 3 + row] ?? 0;
        out.push({ pos: [x, h * 0.6 - 0.2, z] as const, lift: h });
      }
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += delta * 0.07;
  });

  return (
    <group ref={ref}>
      {pieces.map((p, i) => (
        <HexPrism
          key={i}
          position={p.pos}
          scale={0.52}
          depth={0.3}
          emissive={emissive}
          // Lifted pieces glow harder — they are the considered moves.
          emissiveIntensity={0.15 + p.lift * 0.55}
        />
      ))}
      {/* Ground platter — a dark wide hex under the whole board so the
          pieces read as "placed on a surface" rather than floating in
          void. */}
      <HexPrism
        position={[0, -0.6, 0]}
        radius={4.2}
        depth={0.05}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Eastern Grids — a honeycomb cluster with sensing rings
// converging inward instead of broadcasting outward. The Grid is
// listening, not emitting. Contrast with the Wireless Power scene
// (same geometry family, inverted motion).
// ---------------------------------------------------------------------------

function SensingRing({
  phase,
  canon,
}: {
  phase: number;
  canon: CodexHeroProps["canon"];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    const mat = matRef.current;
    if (!m || !mat) return;
    // Inverse of the PulseRing motion — ring starts wide and collapses
    // inward, opacity fades as it arrives at the centre. Signal
    // converging, not emanating.
    const t = ((state.clock.elapsedTime + phase) % 3) / 3;
    const r = 4.2 - t * 3.8;
    m.scale.setScalar(r);
    mat.opacity = t;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
      <ringGeometry args={[0.95, 1, 64]} />
      <meshBasicMaterial
        ref={matRef}
        color={emissive}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function SensingGrid({ canon }: { canon: CodexHeroProps["canon"] }) {
  const emissive = canonColour(canon);
  return (
    <group>
      {/* Central hex + ring of 6 — the Grid being sensed. */}
      <HexPrism emissive={emissive} emissiveIntensity={0.45} scale={0.85} />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const r = Math.sqrt(3);
        return (
          <HexPrism
            key={i}
            position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}
            emissive={emissive}
            emissiveIntensity={0.25}
            scale={0.85}
          />
        );
      })}
      {/* Three sensing rings, staggered phases. */}
      <SensingRing phase={0} canon={canon} />
      <SensingRing phase={1} canon={canon} />
      <SensingRing phase={2} canon={canon} />
      {/* Floor plate — receives the converging rings. */}
      <HexPrism
        position={[0, -0.85, 0]}
        radius={3.4}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.12}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Kafiristan — a ring of hex cells surrounding a dark central
// void. Small motes drift inward and vanish at the boundary. The
// territory that gives nothing back and takes everything sent into it.
// No rotation — Kafiristan is still.
// ---------------------------------------------------------------------------

function VoidMote({
  phase,
  angle,
  canon,
}: {
  phase: number;
  angle: number;
  canon: CodexHeroProps["canon"];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    const mat = matRef.current;
    if (!m || !mat) return;
    // Mote travels from ring edge (r=2.5) inward to the void (r=0) then
    // disappears. Each mote has its own phase so the drift reads as
    // continuous.
    const t = ((state.clock.elapsedTime * 0.35 + phase) % 1);
    const r = 2.5 * (1 - t);
    m.position.set(Math.cos(angle) * r, 0.1, Math.sin(angle) * r);
    // Fade out as the mote approaches the centre — swallowed, not
    // arriving.
    mat.opacity = Math.max(0, 1 - t * 1.4);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 8, 6]} />
      <meshBasicMaterial ref={matRef} color={emissive} transparent />
    </mesh>
  );
}

function HollowTerritory({ canon }: { canon: CodexHeroProps["canon"] }) {
  const emissive = canonColour(canon);

  // Outer ring of 12 hex cells — the Grids' perimeter, not converting
  // the interior.
  const perimeter = useMemo(() => {
    const positions: Array<readonly [number, number, number]> = [];
    const ringRadius = 3.2;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      positions.push([
        Math.cos(angle) * ringRadius,
        0,
        Math.sin(angle) * ringRadius,
      ] as const);
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Perimeter hex ring — dimmer than most other scenes. Kafiristan
          is the geography the network has stopped trying to light up. */}
      {perimeter.map((pos, i) => (
        <HexPrism
          key={i}
          position={pos}
          scale={0.55}
          emissive={emissive}
          emissiveIntensity={0.2}
        />
      ))}

      {/* Central void disc — a dark hex platter with faint inner glow.
          The "nothing comes back" territory. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[1.8, 6]} />
        <meshBasicMaterial color="#05060a" />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.06, 6, 1, false]} />
        <meshStandardMaterial
          color="#0a0a12"
          emissive={emissive}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Motes drifting inward — each swallowed at the void boundary. */}
      {Array.from({ length: 10 }, (_, i) => (
        <VoidMote
          key={i}
          phase={i / 10}
          angle={(i / 10) * Math.PI * 2}
          canon={canon}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Judgement Day — a black sphere plummeting toward a horizon
// plane with a red spark tail, hex Grid floor fracturing on impact.
// Canon is fiction-c2; the hotter amber keeps the palette consistent
// with the page tone.
// ---------------------------------------------------------------------------

function MeteorFall({ canon }: { canon: CodexHeroProps["canon"] }) {
  const meteorRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = meteorRef.current;
    const tr = trailRef.current;
    if (!m || !tr) return;
    // Loop over 4s — meteor starts at +y=5, falls to y=0.2, then resets.
    // Easing is quadratic on the descent so impact reads fast without
    // looking scripted.
    const t = (state.clock.elapsedTime % 4) / 4;
    const eased = t * t;
    const y = 5 - eased * 4.8;
    m.position.set(0.6, y, -0.4);
    // Tail scales with descent — longer as it approaches the ground.
    const len = 0.4 + eased * 2.2;
    tr.scale.set(1, len, 1);
    tr.position.set(0.6, y + len * 0.45, -0.4);
  });

  return (
    <group>
      {/* Ground floor — a wide hex platter representing the On-Grid
          surface. Dimmer than most floors; this is the world about to
          be hit. */}
      <HexPrism
        position={[0, -0.8, 0]}
        radius={3.6}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.12}
      />

      {/* Impact fractures — six narrow hex shards radiating out from
          the impact point. Static positions; the dramatic motion is
          the meteor, not the shockwave. */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 1.6;
        return (
          <HexPrism
            key={i}
            position={[Math.cos(angle) * r, -0.7, Math.sin(angle) * r]}
            scale={0.3}
            emissive={emissive}
            emissiveIntensity={0.45}
          />
        );
      })}

      {/* Tail — red emissive cylinder above the meteor, scaled each
          frame so the tail grows during descent. */}
      <mesh ref={trailRef}>
        <cylinderGeometry args={[0.12, 0.02, 1, 8]} />
        <meshBasicMaterial color="#ff3a1c" transparent opacity={0.85} />
      </mesh>

      {/* Meteor — a faceted dark sphere that reads as a rock, not a
          planet. Low geometry count for the flat-shading read. */}
      <group ref={meteorRef}>
        <mesh>
          <icosahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial
            color="#05060a"
            emissive="#ff3a1c"
            emissiveIntensity={0.4}
            metalness={0.2}
            roughness={0.9}
            flatShading
          />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Cyber Vikings — five angular hex silhouettes at irregular
// heights and tilts, all leaning slightly forward like raiders
// cresting a ridge. Red edge glow rather than face glow so the
// silhouette reads as menacing outline. No auto-rotation — stillness
// is the threat.
// ---------------------------------------------------------------------------

function RaiderSilhouettes({ canon }: { canon: CodexHeroProps["canon"] }) {
  const emissive = canonColour(canon);

  // Hand-placed raider positions — irregular spacing + heights so the
  // line doesn't read as a uniform row. Forward lean is baked into
  // the rotation values.
  const raiders = useMemo(
    () =>
      [
        { pos: [-3.4, -0.2, 0.4] as const, tilt: 0.18, scale: 0.95 },
        { pos: [-1.8, 0.4, -0.2] as const, tilt: 0.12, scale: 1.1 },
        { pos: [-0.1, -0.1, 0.3] as const, tilt: 0.22, scale: 1.25 },
        { pos: [1.9, 0.3, -0.1] as const, tilt: 0.15, scale: 1.05 },
        { pos: [3.3, -0.2, 0.2] as const, tilt: 0.2, scale: 0.9 },
      ] as const,
    [],
  );

  return (
    <group>
      {raiders.map((r, i) => (
        <group key={i} position={r.pos} rotation={[r.tilt, 0.3, 0]}>
          {/* Body — a tall narrow hex prism for the raider silhouette. */}
          <HexPrism
            rotation={[0, Math.PI / 6, 0]}
            radius={0.42}
            depth={1.8}
            scale={r.scale}
            emissive="#ff2a0c"
            emissiveIntensity={0.8}
            color="#1a0606"
          />
          {/* Head — small cube perched on top. Reads as "rider" rather
              than abstract prism. */}
          <mesh position={[0, 1.1 * r.scale, 0]}>
            <boxGeometry args={[0.32, 0.28, 0.28]} />
            <meshStandardMaterial
              color="#1a0606"
              emissive="#ff3a1c"
              emissiveIntensity={0.6}
              metalness={0.3}
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}
      {/* Floor — a wide dim hex disc in a cold tone so the raiders
          read against it. Uses emissive so the ridge reads in frame. */}
      <HexPrism
        position={[0, -1.1, 0]}
        radius={4}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.1}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Reward Banks — ziggurat of hex tiers ascending, each more
// emissive than the one below. Small floating "coin" disc orbits
// above the top tier. The tiered-reward read drops in instantly.
// ---------------------------------------------------------------------------

function ValueCoin({ canon }: { canon: CodexHeroProps["canon"] }) {
  const ref = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime * 0.9;
    m.position.set(Math.cos(t) * 0.8, 2.2 + Math.sin(t * 1.4) * 0.08, Math.sin(t) * 0.8);
    m.rotation.y = t * 2;
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.22, 0.22, 0.05, 6, 1, false]} />
      <meshStandardMaterial
        color="#0b1030"
        emissive={emissive}
        emissiveIntensity={1.4}
        metalness={0.7}
        roughness={0.2}
      />
    </mesh>
  );
}

function ValueZiggurat({ canon }: { canon: CodexHeroProps["canon"] }) {
  const ref = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += delta * 0.1;
  });

  // Four tiers ascending — each narrower and more emissive than the
  // tier below. Reads as a reward ladder, not a building.
  const tiers = useMemo(
    () => [
      { y: -1.0, radius: 2.0, depth: 0.4, glow: 0.2 },
      { y: -0.45, radius: 1.55, depth: 0.4, glow: 0.35 },
      { y: 0.1, radius: 1.1, depth: 0.4, glow: 0.55 },
      { y: 0.65, radius: 0.7, depth: 0.4, glow: 0.85 },
    ],
    [],
  );

  return (
    <group ref={ref}>
      {tiers.map((t, i) => (
        <HexPrism
          key={i}
          position={[0, t.y, 0]}
          radius={t.radius}
          depth={t.depth}
          emissive={emissive}
          emissiveIntensity={t.glow}
        />
      ))}
      <ValueCoin canon={canon} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scene: Off-Grid — honeycomb cluster where ~40% of cells flicker or
// sit dim. The network compromised. Flicker is subtle (not epilepsy)
// and on a per-cell phase so the dimness reads as ambient failure,
// not coordinated motion.
// ---------------------------------------------------------------------------

function BrokenCell({
  position,
  broken,
  phase,
  canon,
}: {
  position: readonly [number, number, number];
  broken: boolean;
  phase: number;
  canon: CodexHeroProps["canon"];
}) {
  const ref = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (broken) {
      // Broken cells pulse low + occasionally flicker near-dark. Mix
      // a slow and a fast sine so the flicker is irregular.
      const t = state.clock.elapsedTime;
      const slow = (Math.sin(t * 0.6 + phase) + 1) / 2;
      const fast = Math.sin(t * 5.2 + phase * 3);
      const glow = 0.08 + slow * 0.18 + (fast > 0.85 ? -0.15 : 0);
      mat.emissiveIntensity = Math.max(0.04, glow);
    }
  });

  return (
    <mesh
      ref={ref}
      position={[position[0], position[1], position[2]]}
      rotation={[0, Math.PI / 6, 0]}
      frustumCulled={false}
    >
      <cylinderGeometry args={[0.9, 0.9, 0.22, 6, 1, false]} />
      <meshStandardMaterial
        color="#0b1030"
        emissive={emissive}
        emissiveIntensity={broken ? 0.12 : 0.45}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

function BrokenComb({ canon }: { canon: CodexHeroProps["canon"] }) {
  const groupRef = useRef<THREE.Group>(null);

  // Same 19-cell 2-ring layout as InfectedZone. Deterministic broken
  // mask so the damage pattern is stable across renders.
  const cells = useMemo(() => {
    const SQRT3 = Math.sqrt(3);
    const r = 1;
    const brokenMask = [
      true, // centre
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
    ];
    const out: Array<{
      pos: readonly [number, number, number];
      broken: boolean;
    }> = [{ pos: [0, 0, 0] as const, broken: brokenMask[0] ?? false }];
    const dirs: Array<readonly [number, number]> = [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ];
    dirs.forEach(([dq, dr], i) => {
      const x = r * SQRT3 * (dq + dr / 2);
      const z = r * 1.5 * dr;
      out.push({ pos: [x, 0, z] as const, broken: brokenMask[1 + i] ?? false });
    });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = r * SQRT3 * 2;
      out.push({
        pos: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius,
        ] as const,
        broken: brokenMask[7 + i] ?? false,
      });
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += delta * 0.04;
  });

  return (
    <group ref={groupRef}>
      {cells.map((c, i) => (
        <BrokenCell
          key={i}
          position={c.pos}
          broken={c.broken}
          phase={i * 0.7}
          canon={canon}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Default scene — used for any entry without a dedicated variant.
// A single large hex prism slowly rotating with a ring of 6 smaller
// satellites. Canon sets the glow tone.
// ---------------------------------------------------------------------------

function DefaultHexStar({ canon }: { canon: CodexHeroProps["canon"] }) {
  const ref = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += delta * 0.15;
  });

  // Six satellites on a wider ring, spun by the group above.
  const ringRadius = 2.6;

  return (
    <group ref={ref}>
      <HexPrism emissive={emissive} emissiveIntensity={0.55} scale={1.1} />
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <HexPrism
            key={i}
            position={[
              Math.cos(angle) * ringRadius,
              0,
              Math.sin(angle) * ringRadius,
            ]}
            scale={0.45}
            emissive={emissive}
            emissiveIntensity={0.28}
          />
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher — pick a scene for the slug. Unknown slugs fall back to the
// default. Keeping this as a switch (not a Record<>) so TypeScript will
// catch typos and so exhaustiveness is easy to eyeball at code review.
// ---------------------------------------------------------------------------

function SceneForSlug({ slug, canon }: CodexHeroProps) {
  switch (slug) {
    case "honeycomb-architecture":
      return <HoneycombCluster canon={canon} />;
    case "grid-network":
      return <PlanetaryNetwork canon={canon} />;
    case "magway":
      return <MagwayTube canon={canon} />;
    case "hubs":
      return <HubTower canon={canon} />;
    case "grid-domes":
      return <DomedGrid canon={canon} />;
    case "basic-law":
      return <HexObelisk canon={canon} />;
    case "wireless-power":
      return <EmitterTower canon={canon} />;
    case "memory-metal":
      return <MorphingHex canon={canon} />;
    case "drone-delivery":
      return <DroneSwarm canon={canon} />;
    case "illum":
      return <BisectedHex />;
    case "the-hive":
      return <HiveNetwork canon={canon} />;
    case "bacterium-zones":
      return <InfectedZone canon={canon} />;
    case "alien-prince":
      return <StrategyBoard canon={canon} />;
    case "eastern-grids":
      return <SensingGrid canon={canon} />;
    case "kafiristan":
      return <HollowTerritory canon={canon} />;
    case "judgement-day":
      return <MeteorFall canon={canon} />;
    case "cyber-vikings":
      return <RaiderSilhouettes canon={canon} />;
    case "reward-banks":
      return <ValueZiggurat canon={canon} />;
    case "off-grid":
      return <BrokenComb canon={canon} />;
    case "alien-queen":
      return <Throne canon={canon} />;
    case "e-hair":
      return <EHair canon={canon} />;
    case "alien-empire":
      return <AlienEmpire canon={canon} />;
    case "modularity":
      return <Modularity canon={canon} />;
    case "blueprint-trade":
      return <BlueprintTrade canon={canon} />;
    case "augmented-reality":
      return <AugmentedReality canon={canon} />;
    case "grids-platform":
      return <GridsPlatform canon={canon} />;
    case "asteroid-mining":
      return <AsteroidMining canon={canon} />;
    case "optionism":
      return <Optionism canon={canon} />;
    case "vr-technology":
      return <VrTechnology canon={canon} />;
    case "emergency-services":
      return <EmergencyServices canon={canon} />;
    case "education":
      return <Education canon={canon} />;
    case "grid-law-teams":
      return <GridLawTeams canon={canon} />;
    case "child-protection":
      return <ChildProtection canon={canon} />;
    default:
      return <DefaultHexStar canon={canon} />;
  }
}

// ---------------------------------------------------------------------------
// Canvas wrapper — one camera preset that flatters a 4:1 letterbox frame.
// Scene-specific variations (camera push-in, different light rigs) would
// be layered on top only if a scene needs it; for v0.1 one wrapper handles
// all ten variants.
// ---------------------------------------------------------------------------

export default function CodexHeroScene({ slug, canon }: CodexHeroProps) {
  const keyLight = canonColour(canon);
  const fill = canonFill(canon);

  // Some scenes look better with a slightly pulled-back camera. Hub tower
  // is tall, planetary network is wide. Rather than per-scene cameras,
  // we lift the camera for the few scenes that need it and otherwise use
  // the default letterbox framing.
  const cameraPosition = useMemo<[number, number, number]>(() => {
    switch (slug) {
      case "grid-network":
        return [0, 2.4, 8.5];
      case "hubs":
        return [0, 2.8, 8];
      case "magway":
        return [0, 0.5, 5];
      case "the-hive":
        // Hive nodes spread across a wide XZ footprint — pull back so
        // the whole cloud reads in one frame.
        return [0, 2.4, 8];
      case "bacterium-zones":
        // 2-ring comb is wide but flat — slight extra pullback, low Y.
        return [0, 2.6, 7.2];
      case "kafiristan":
        // Perimeter ring needs breathing room so the void reads as
        // central rather than cropped.
        return [0, 2.4, 7.5];
      case "judgement-day":
        // Meteor starts at y=5 — need the camera a little higher to
        // frame the top of the fall without cropping.
        return [0, 2.8, 7];
      case "off-grid":
        // Same 2-ring comb footprint as bacterium-zones.
        return [0, 2.6, 7.2];
      case "alien-queen":
        // Throne is tall (~1.6 above ground) and ring radius is 3.6.
        // Pull back a hair so seat and retinue both read.
        return [0, 2.4, 7.8];
      case "alien-empire":
        // 5x5 lattice at 1.1 spacing is wide; monolith rises to 2.5.
        // Pull back and up so the lattice reads as formation, not clutter.
        return [0, 3.2, 8.2];
      case "grids-platform":
        // Nine-cell cluster with outer radius 2.6 — pull back so the
        // graph reads in full without spoke cells cropping.
        return [0, 2.6, 7.4];
      case "asteroid-mining":
        // Asteroid floats at y=2, spaceport at y=0 — tall composition
        // needs the camera higher and a touch further out.
        return [0, 2.6, 7];
      case "optionism":
        // Five clusters spread to radius ~2.3 — pull back so the
        // outer satellites don't crop.
        return [0, 2.6, 7.2];
      case "emergency-services":
        // Eight-cell outer ring at radius 2.6 — pull back so the
        // radar sweep reads across the full frame.
        return [0, 2.6, 7.4];
      case "education":
        // Three-row audience plus elevated teacher at z=-1.1 —
        // camera needs a hair further back and centred slightly
        // forward to keep the teacher in frame.
        return [0, 2.6, 7];
      case "grid-law-teams":
        // Twelve-juror ring at radius 2.2 with heights up to y=1.5
        // — pull back slightly so the ring reads as a full circle.
        return [0, 2.6, 7.2];
      case "child-protection":
        // Six-hex outer ring at radius 2.6 plus motes trailing to
        // rim along +X. Camera needs the wide frame.
        return [0, 2.4, 7.2];
      default:
        return [0, 2, 6];
    }
  }, [slug]);

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: cameraPosition, fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} color="#1a2240" />
        <directionalLight
          position={[5, 6, 4]}
          intensity={0.85}
          color={keyLight}
        />
        <directionalLight
          position={[-4, 3, -3]}
          intensity={0.35}
          color={fill}
        />

        <SceneForSlug slug={slug} canon={canon} />

        {/* Non-interactive auto-orbit is handled inside each scene via
            useFrame. OrbitControls is here so the cursor can still drag
            for visitors who want a closer look, but pan is off — this is
            a hero, not the Explorer, and full navigation invites
            confusion. */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate
          maxPolarAngle={Math.PI * 0.52}
          minPolarAngle={Math.PI * 0.12}
          // rotateSpeed low so a stray drag doesn't whip the scene.
          rotateSpeed={0.4}
          target={[0, 0, 0]}
        />

        <EffectComposer>
          <Bloom
            intensity={0.3}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0007, 0.001]}
            radialModulation={false}
            modulationOffset={0}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

