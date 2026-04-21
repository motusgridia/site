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
//   Inline (pre-split):
//     honeycomb-architecture, grid-network, magway, hubs, grid-domes,
//     basic-law, wireless-power, memory-metal, drone-delivery, illum,
//     the-hive, bacterium-zones, alien-prince, eastern-grids, kafiristan,
//     judgement-day, cyber-vikings, reward-banks, off-grid.
//   Sibling modules under `codex-scenes/<slug>.tsx`:
//     alien-queen (throne), alien-empire, e-hair, modularity,
//     blueprint-trade, augmented-reality, grids-platform, asteroid-mining,
//     optionism, vr-technology, emergency-services, education,
//     grid-law-teams, child-protection, vargas-model,
//     degarido-architecture, dreamgirl, the-saviour, vader, dj-panz,
//     northern-dominion.
//
// Split pattern: new scenes land under `app/components/codex-scenes/<slug>.tsx`
// and import primitives from `./codex-scenes/shared`. The older inline
// scenes still live in this file — they migrate out as they receive
// updates to avoid a big-bang refactor. The Throne scene (alien-queen)
// was the first to land under the pattern; thirteen more have followed.
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
import { AdvancedMaterials } from "./codex-scenes/advanced-materials";
import { AdvancedPcsInWalls } from "./codex-scenes/advanced-pcs-in-walls";
import { AlienBacterium } from "./codex-scenes/alien-bacterium";
import { AlienEmpire } from "./codex-scenes/alien-empire";
import { AlienParasites } from "./codex-scenes/alien-parasites";
import { AsteroidMining } from "./codex-scenes/asteroid-mining";
import { AugmentedReality } from "./codex-scenes/augmented-reality";
import { AuraAndPhotons } from "./codex-scenes/aura-and-photons";
import { AwolAndroids } from "./codex-scenes/awol-androids";
import { AxeMaiden } from "./codex-scenes/axe-maiden";
import { BaseCamps } from "./codex-scenes/base-camps";
import { BasicLaw } from "./codex-scenes/basic-law";
import { BioengineeredTribes } from "./codex-scenes/bioengineered-tribes";
import { BioGun } from "./codex-scenes/bio-gun";
import { BlueprintTrade } from "./codex-scenes/blueprint-trade";
import { BountyGameMap } from "./codex-scenes/bounty-game-map";
import { ChildProtection } from "./codex-scenes/child-protection";
import { CoolingTubes } from "./codex-scenes/cooling-tubes";
import { CustomsAndDuels } from "./codex-scenes/customs-and-duels";
import { CybertalibanTribe } from "./codex-scenes/cybertaliban-tribe";
import { DarkContinent } from "./codex-scenes/dark-continent";
import { DegaridoArchitecture } from "./codex-scenes/degarido-architecture";
import { DjPanz } from "./codex-scenes/dj-panz";
import { Dreamgirl } from "./codex-scenes/dreamgirl";
import { Education } from "./codex-scenes/education";
import { EHair } from "./codex-scenes/e-hair";
import { EmergencyServices } from "./codex-scenes/emergency-services";
import { EnergyLevelBands } from "./codex-scenes/energy-level-bands";
import { Fashion } from "./codex-scenes/fashion";
import { Flight } from "./codex-scenes/flight";
import { GhostHunters } from "./codex-scenes/ghost-hunters";
import { GridLawTeams } from "./codex-scenes/grid-law-teams";
import { GridNetwork } from "./codex-scenes/grid-network";
import { GridsPlatform } from "./codex-scenes/grids-platform";
import { HoneycombArchitecture } from "./codex-scenes/honeycomb-architecture";
import { Hubs } from "./codex-scenes/hubs";
import { KafiristanPact } from "./codex-scenes/kafiristan-pact";
import { LiveStreamedScience } from "./codex-scenes/live-streamed-science";
import { Magway } from "./codex-scenes/magway";
import { MediaProductionTech } from "./codex-scenes/media-production-tech";
import { Modularity } from "./codex-scenes/modularity";
import { NanoCamBullets } from "./codex-scenes/nano-cam-bullets";
import { NeutralZoneMilitia } from "./codex-scenes/neutral-zone-militia";
import { NorthernDominion } from "./codex-scenes/northern-dominion";
import { OffGridMegacities } from "./codex-scenes/off-grid-megacities";
import { OnGridFaction } from "./codex-scenes/on-grid-faction";
import { Optionism } from "./codex-scenes/optionism";
import { PhilosophersPact } from "./codex-scenes/philosophers-pact";
import { PlasmaCrystalSwords } from "./codex-scenes/plasma-crystal-swords";
import { PrintedVillages } from "./codex-scenes/printed-villages";
import { Revolt13 } from "./codex-scenes/revolt-13";
import { TemporaryResidence } from "./codex-scenes/temporary-residence";
import { TetherUpgradeTech } from "./codex-scenes/tether-upgrade-tech";
import { TheSaviour } from "./codex-scenes/the-saviour";
import { Throne } from "./codex-scenes/throne";
import { TransitionalStates } from "./codex-scenes/transitional-states";
import { Vader } from "./codex-scenes/vader";
import { VargasModel } from "./codex-scenes/vargas-model";
import { Voting } from "./codex-scenes/voting";
import { VrTechnology } from "./codex-scenes/vr-technology";

// Re-export the public type so existing pages/components importing
// `CodexHeroProps` from this module keep working without churn.
export type { CodexHeroProps };

// ---------------------------------------------------------------------------
// Scene: Honeycomb Architecture — promoted to
// `./codex-scenes/honeycomb-architecture.tsx`. Kept inline originally, then
// upgraded to breathing-per-cell + outer-ring join cycle. See module.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Scene: Grid Network — promoted to `./codex-scenes/grid-network.tsx`. The
// inline OrbitComb + PlanetaryNetwork are gone; the module adds Hub spires
// that face outward, equator bands on the planet, and traffic particles
// that arc between Grids. See module.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Scene: Magway — promoted to `./codex-scenes/magway.tsx`. The inline
// MagwayTube was a single pod in a tube. The module version carries a
// three-pod fleet, station rings that admit each pod in turn, and
// terminal hexes at either end.

// ---------------------------------------------------------------------------
// Scene: Hubs — vertical megastructure. A stack of hex prisms growing up,
// slightly twisted at each level for the "megastructure not box" read.
// ---------------------------------------------------------------------------

// Scene: Hubs — promoted to `./codex-scenes/hubs.tsx`. The inline HubTower
// was a stacked spire that rotated. The module version adds the transit
// capsule, per-level breathing, and the spider-web connection beams from
// the tower top down to each base-ring hex.

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
// Scene: Basic Law — promoted to `./codex-scenes/basic-law.tsx`. The inline
// HexObelisk was a lone rotating hex; the module version adds the
// reading-cycle bands + six bound satellite Grids.
// ---------------------------------------------------------------------------

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
      return <HoneycombArchitecture canon={canon} />;
    case "grid-network":
      return <GridNetwork canon={canon} />;
    case "magway":
      return <Magway canon={canon} />;
    case "hubs":
      return <Hubs canon={canon} />;
    case "grid-domes":
      return <DomedGrid canon={canon} />;
    case "basic-law":
      return <BasicLaw canon={canon} />;
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
    case "vargas-model":
      return <VargasModel canon={canon} />;
    case "degarido-architecture":
      return <DegaridoArchitecture canon={canon} />;
    case "dreamgirl":
      return <Dreamgirl canon={canon} />;
    case "the-saviour":
      return <TheSaviour canon={canon} />;
    case "vader":
      return <Vader canon={canon} />;
    case "dj-panz":
      return <DjPanz canon={canon} />;
    case "northern-dominion":
      return <NorthernDominion canon={canon} />;
    case "advanced-materials":
      return <AdvancedMaterials canon={canon} />;
    case "tether-upgrade-tech":
      return <TetherUpgradeTech canon={canon} />;
    case "live-streamed-science":
      return <LiveStreamedScience canon={canon} />;
    case "temporary-residence":
      return <TemporaryResidence canon={canon} />;
    case "revolt-13":
      return <Revolt13 canon={canon} />;
    case "dark-continent":
      return <DarkContinent canon={canon} />;
    case "cybertaliban-tribe":
      return <CybertalibanTribe canon={canon} />;
    case "awol-androids":
      return <AwolAndroids canon={canon} />;
    case "voting":
      return <Voting canon={canon} />;
    case "bioengineered-tribes":
      return <BioengineeredTribes canon={canon} />;
    case "flight":
      return <Flight canon={canon} />;
    case "advanced-pcs-in-walls":
      return <AdvancedPcsInWalls canon={canon} />;
    case "printed-villages":
      return <PrintedVillages canon={canon} />;
    case "neutral-zone-militia":
      return <NeutralZoneMilitia canon={canon} />;
    case "ghost-hunters":
      return <GhostHunters canon={canon} />;
    case "media-production-tech":
      return <MediaProductionTech canon={canon} />;
    case "energy-level-bands":
      return <EnergyLevelBands canon={canon} />;
    case "philosophers-pact":
      return <PhilosophersPact canon={canon} />;
    case "base-camps":
      return <BaseCamps canon={canon} />;
    case "plasma-crystal-swords":
      return <PlasmaCrystalSwords canon={canon} />;
    case "alien-bacterium":
      return <AlienBacterium canon={canon} />;
    case "off-grid-megacities":
      return <OffGridMegacities canon={canon} />;
    case "bounty-game-map":
      return <BountyGameMap canon={canon} />;
    case "alien-parasites":
      return <AlienParasites canon={canon} />;
    case "fashion":
      return <Fashion canon={canon} />;
    case "customs-and-duels":
      return <CustomsAndDuels canon={canon} />;
    case "aura-and-photons":
      return <AuraAndPhotons canon={canon} />;
    case "bio-gun":
      return <BioGun canon={canon} />;
    case "cooling-tubes":
      return <CoolingTubes canon={canon} />;
    case "axe-maiden":
      return <AxeMaiden canon={canon} />;
    case "nano-cam-bullets":
      return <NanoCamBullets canon={canon} />;
    case "transitional-states":
      return <TransitionalStates canon={canon} />;
    case "kafiristan-pact":
      return <KafiristanPact canon={canon} />;
    case "on-grid-faction":
      return <OnGridFaction canon={canon} />;
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
      case "vargas-model":
        // Left + right clusters span x ∈ [-2.6, 2.6] — wider frame
        // keeps both sides and the raised mediator in view.
        return [0, 2.4, 7.4];
      case "degarido-architecture":
        // Docking pods extend to radius ~1.25 at max — default framing
        // plus a slight lift reads the settlement from above.
        return [0, 2.8, 6.4];
      case "dreamgirl":
        // Four source hexes at radius 2.3 plus a still centre — needs
        // a wider frame to make the symmetry read.
        return [0, 2.4, 7.2];
      case "the-saviour":
        // Wave origin at x=-2.8 + village cells out to ~2.4 — pull
        // back to keep the whole village and the Saviour in frame.
        return [0, 2.6, 7.6];
      case "vader":
        // Tall body at y=0.9 + outer ring at radius 2.4 — camera
        // needs height and distance for the layered containment read.
        return [0, 2.8, 7];
      case "dj-panz":
        // Author set back at z=-1.6, audience arc at radius 2.4 —
        // camera slightly raised to read the z-depth ordering.
        return [0, 2.6, 6.8];
      case "northern-dominion":
        // Clan ring at radius 2.3, lab buried at y=-0.25, subjects
        // orbiting low — camera angled to show all three layers.
        return [0, 3, 7.2];
      case "advanced-materials":
        // Crystal at y=0.55, Tesla nodes at radius 1.9 mid-ring —
        // default-depth camera reads the transfer ring cleanly.
        return [0, 2.4, 6.8];
      case "tether-upgrade-tech":
        // Tower at z=-0.7 + device row at z=1.1 — camera off-axis
        // slightly high so the tether arc reads across the row.
        return [0, 2.2, 6.5];
      case "live-streamed-science":
        // Twelve observers at radius 2.2 + suppliers at z≈-2 — pull
        // back so the whole ring plus the supply chain read in one
        // frame.
        return [0, 2.6, 7.4];
      case "temporary-residence":
        // 3×3 grid spanning ~2.3×2.3 — camera lifted to read the
        // occupancy pattern top-down-ish.
        return [0, 3.2, 6.2];
      case "revolt-13":
        // Irregular cluster spanning x ∈ [-1.7, 1.5], z ∈ [-1.6, 1.3]
        // — lift the camera slightly for the rise-pattern read.
        return [0, 3, 6.2];
      case "dark-continent":
        // Two planetary anchors at x = ±2.2 + mid-corridor — wide
        // frame needed to show both powers plus the rebel lane.
        return [0, 2.4, 7.8];
      case "cybertaliban-tribe":
        // Patriarch at centre + warrior ring at radius ~1.4 + tree
        // silhouettes at x≈±2.5 — slight lift, moderate distance so
        // the trees frame but don't crowd.
        return [0, 2.4, 7];
      case "awol-androids":
        // Three distinct clusters at [-1.7,-0.9], [1.6,0.8], [0.1,1.6]
        // — wide lifted frame so all three read at once.
        return [0, 3.4, 6.8];
      case "voting":
        // Voter ring at radius 2.2 + proposal centre + transfer arc
        // — default depth with slight lift reads cleanly.
        return [0, 2.4, 7];
      case "bioengineered-tribes":
        // Three packs at [-1.6,-1.0], [1.7,0.7], [-0.2,1.8] —
        // lifted camera so the three orbit circles read as distinct
        // groups not one blob.
        return [0, 3.3, 6.8];
      case "flight":
        // Aircraft at altitudes y ∈ [0.8, 1.6] orbiting at radii up
        // to 2.6 — camera needs to see the lift, not just the plate.
        return [0, 2.2, 7];
      case "advanced-pcs-in-walls":
        // Walls at radius 1.65 at y=0.35 + hubs at y=0.72. Slightly
        // higher camera so the hub plane reads above the wall plane.
        return [0, 2.6, 6.8];
      case "printed-villages":
        // Five homes on a plate plus a silo at [2.1, _, -1.9]. Wider
        // frame so the silo sits inside the shot with the village.
        return [0, 3, 7];
      case "neutral-zone-militia":
        // Hideout at centre, wolves at radius 1.35, assassins at
        // radius 2.7 — wide frame so all three radii read at once.
        return [0, 2.6, 7.4];
      case "ghost-hunters":
        // North cluster at z≈+2, bacterium front swinging z∈[-2, +0.5]
        // — a little elevation plus extra depth so both zones sit
        // in the shot without cropping the bacterium's retreat.
        return [0, 3, 7.6];
      case "media-production-tech":
        // Horizontal pipeline from x=-2.4 to x=+2.4 — wide frame,
        // low lift so the pulses travelling at y=0.5 read as a line.
        return [0, 2.2, 7.6];
      case "energy-level-bands":
        // Wearer + column + overlay panel at y=1.1 + bands orbiting.
        // Closer frame reads the column+overlay meter clearly.
        return [0, 2.2, 6];
      case "philosophers-pact":
        // Three nodes in a triangle — front at z=1.4, back at z=-0.7.
        // Slight lift reads the triangle geometry and the shell
        // hex hovering at y=1.35 above the centroid.
        return [0, 2.6, 6.4];
      case "base-camps":
        // Camp + rail + perimeter — wide frame to fit the train's
        // approach from x=-2.8 and departure toward +2.8.
        return [0, 2.6, 7.4];
      case "plasma-crystal-swords":
        // Two blades side-by-side at y up to ~1.8 — closer frame
        // so the plasma channel inside the crystal reads clearly.
        return [0, 2.2, 5.6];
      case "alien-bacterium":
        // Hemispheric cloud at y ~ 0.4-1.6, projectile arcs across
        // plate — slight pullback so the hive-ring pulses read.
        return [0, 2.4, 7];
      case "off-grid-megacities":
        // Tallest tower h=2.6 (top at y=2.6); cluster spans ~3 in
        // XZ. Lift and pull back to read the skyline as a skyline.
        return [0, 3.2, 7.8];
      case "bounty-game-map":
        // Flat 5x7 district grid plus the app-frame header at
        // y=1.55. Camera lift reads the grid top-downish without
        // losing the floating header.
        return [0, 3.0, 6.2];
      case "alien-parasites":
        // Host taller than usual (y up to ~1.35) with pupil mote and
        // branches radiating out — closer frame so the spike flare
        // reads and the failed-host sibling stays in frame.
        return [0, 2.4, 6.2];
      case "fashion":
        // Three figures on a catwalk across x ~ -1.9 to +1.9, tallest
        // at h=1.4 plus 0.35 identity pins — wider frame, slight lift.
        return [0, 2.4, 6.8];
      case "customs-and-duels":
        // Arena plate radius 2.8, spectators at r=2.3, combatants
        // orbit at r=1.3, judgement at y=1.6. Wide enough to show
        // the whole tribal audience without losing the exchange.
        return [0, 2.8, 7.4];
      case "aura-and-photons":
        // Body at y=0.55, aura ring at waist, photons rise to ~1.8,
        // aurora at y=2.0. Pull back a hair so the peak aurora and
        // the crystal orbit both fit.
        return [0, 2.4, 6.4];
      case "bio-gun":
        // Gun at x=-1.6 to target at x=+1.6. Wide frame so the slug
        // reads as flight rather than a single flash.
        return [0, 2.4, 6.8];
      case "cooling-tubes":
        // Reservoirs at r=1.6 around host, drip line to y=2.0 — tall
        // and wide frame so the circulation and the drip both read.
        return [0, 2.6, 6.8];
      case "axe-maiden":
        // Figure at centre, axes orbiting at r≈0.66, memorial hex at
        // z=-1.6 — slight lift + moderate depth so the memorial and
        // the arena ring both read without crowding the figure.
        return [0, 2.4, 6.6];
      case "nano-cam-bullets":
        // Gun at x=-1.15 to target at x=+1.85 — wide horizontal
        // composition. Slight lift so the bullet's y-kinks read as
        // course corrections rather than a flat streak.
        return [0, 2.2, 6.8];
      case "transitional-states":
        // Three hexes across x ∈ [-1.9, +1.9] plus checkpoint belt
        // and craft cluster — wide frame to keep the whole gradient
        // from Off-Grid to On-Grid in shot.
        return [0, 2.6, 7.4];
      case "kafiristan-pact":
        // Triangle of signatories at radius 1.3 with central hex —
        // closer frame so the three-in-a-room intimacy reads.
        return [0, 2.2, 6.4];
      case "on-grid-faction":
        // 7-hex honeycomb + three 1.4-tall spires + facility at
        // x=1.8,y=-0.65. Wider frame so the hidden facility stays
        // in shot without dominating.
        return [0, 2.4, 7.8];
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

