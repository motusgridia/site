// MotusGridia — Judgement Day scene.
//
// Slug: judgement-day. Canon: fiction-c2.
//
// Visual metaphor: the hammer falling. Not one rock — a barrage. A
// primary meteor plummets from high altitude on a 4-second cycle,
// with two smaller secondaries on offset schedules. Each impact
// triggers a shockwave ring that expands across the hex floor and
// fades, six fracture shards radiating from centre flare hot, and
// the floor platter flashes. Judgement is ongoing, not a single hit.
//
// Motion beats:
//   · Primary meteor: 4s cycle, quadratic descent easing, hits at
//     y ≈ -0.45 and resets.
//   · Two secondary meteors: 6s and 5.3s cycles, smaller footprint,
//     offset phases so the sky is never empty.
//   · Each meteor's tail scales with descent — longer as it
//     approaches the ground.
//   · Three shockwave rings, each anchored to a meteor. On the
//     frame each meteor impacts, its ring snaps to radius 0 and
//     expands outward to ~4 units while opacity fades.
//   · Six fracture shards pulse hot during the 0.15s window around
//     each primary impact — the tremor.
//   · Floor hex emissiveIntensity spikes briefly on each primary
//     impact.
//
// Replaces the inline MeteorFall scene.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, type CodexCanon } from "./shared";

// Meteor configs — cycle period, horizontal offset, size, impact Y.
const METEORS = [
  { period: 4.0, offset: 0.0, xz: [0.6, -0.4] as const, size: 0.35, primary: true },
  { period: 6.0, offset: 1.4, xz: [-1.4, 0.6] as const, size: 0.22, primary: false },
  { period: 5.3, offset: 3.1, xz: [1.9, 0.3] as const, size: 0.2, primary: false },
] as const;

const GROUND_Y = -0.45;
const START_Y = 5;

export function JudgementDay({ canon }: { canon: CodexCanon }) {
  const meteorRefs = useRef<Array<THREE.Group | null>>([]);
  const tailRefs = useRef<Array<THREE.Mesh | null>>([]);
  const ringRefs = useRef<Array<THREE.Mesh | null>>([]);
  const ringMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const shardRefs = useRef<Array<THREE.Mesh | null>>([]);
  const floorRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  const shardPositions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 1.6;
        return [Math.cos(angle) * r, -0.7, Math.sin(angle) * r] as const;
      }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Meteors + tails.
    for (let i = 0; i < METEORS.length; i++) {
      const cfg = METEORS[i];
      if (!cfg) continue;
      const m = meteorRefs.current[i];
      const tr = tailRefs.current[i];
      if (!m || !tr) continue;
      const phase = ((t + cfg.offset) % cfg.period) / cfg.period;
      const eased = phase * phase;
      const y = START_Y - eased * (START_Y - GROUND_Y);
      m.position.set(cfg.xz[0], y, cfg.xz[1]);
      const len = 0.4 + eased * 2.2;
      tr.scale.set(1, len, 1);
      tr.position.set(cfg.xz[0], y + len * 0.45, cfg.xz[1]);
    }

    // Shockwave rings — each belongs to a meteor. Impact moment is
    // the instant `phase` wraps back to 0 (i.e. phase is very small).
    // The ring expands from r=0.3 to r=4.2 across ~1.2s of the cycle.
    for (let i = 0; i < METEORS.length; i++) {
      const cfg = METEORS[i];
      const ring = ringRefs.current[i];
      const mat = ringMatRefs.current[i];
      if (!cfg || !ring || !mat) continue;
      const phase = ((t + cfg.offset) % cfg.period) / cfg.period;
      // Ring is visible during the first ~30% of the cycle after impact.
      const ringWindow = 0.3;
      if (phase < ringWindow) {
        const rp = phase / ringWindow; // 0..1 during the ring's life
        const r = 0.3 + rp * 3.9;
        ring.scale.setScalar(r);
        ring.position.set(cfg.xz[0], -0.7 + 0.01, cfg.xz[1]);
        mat.opacity = (1 - rp) * 0.85;
      } else {
        mat.opacity = 0;
      }
    }

    // Fracture shards — pulse hot during the brief window right
    // after each primary impact. Primary impact is when meteor 0's
    // phase is within 0..0.08 of zero.
    const primaryCfg = METEORS[0];
    if (primaryCfg) {
      const primaryPhase = ((t + primaryCfg.offset) % primaryCfg.period) /
        primaryCfg.period;
      const impactWindow = 0.08;
      const impactPulse =
        primaryPhase < impactWindow
          ? Math.sin((primaryPhase / impactWindow) * Math.PI)
          : 0;
      for (let i = 0; i < shardRefs.current.length; i++) {
        const s = shardRefs.current[i];
        if (!s) continue;
        const mat = s.material as THREE.MeshStandardMaterial | undefined;
        if (!mat || !("emissiveIntensity" in mat)) continue;
        mat.emissiveIntensity = 0.35 + impactPulse * 1.3;
      }
      const floor = floorRef.current;
      if (floor) {
        const mat = floor.material as THREE.MeshStandardMaterial | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.12 + impactPulse * 0.35;
        }
      }
    }
  });

  return (
    <group>
      {/* Ground floor — wide hex platter. */}
      <mesh
        ref={floorRef}
        position={[0, -0.8, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[3.6, 3.6, 0.1, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.12}
          metalness={0.4}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Fracture shards — six radiating outward. */}
      {shardPositions.map((pos, i) => (
        <mesh
          key={`shard-${i}`}
          ref={(m) => {
            shardRefs.current[i] = m;
          }}
          position={[pos[0], pos[1], pos[2]]}
          rotation={[0, Math.PI / 6, 0]}
          scale={0.3}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1, 1, 0.4, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.45}
            metalness={0.4}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Shockwave rings — one per meteor. */}
      {METEORS.map((_, i) => (
        <mesh
          key={`ring-${i}`}
          ref={(m) => {
            ringRefs.current[i] = m;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          frustumCulled={false}
        >
          <ringGeometry args={[0.95, 1, 48]} />
          <meshBasicMaterial
            ref={(m) => {
              ringMatRefs.current[i] = m;
            }}
            color={emissive}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Meteor tails — each cylinder scales with its meteor's descent. */}
      {METEORS.map((_, i) => (
        <mesh
          key={`tail-${i}`}
          ref={(m) => {
            tailRefs.current[i] = m;
          }}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.12, 0.02, 1, 8]} />
          <meshBasicMaterial color="#ff3a1c" transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Meteors — each a faceted dark icosahedron, size varies by config. */}
      {METEORS.map((cfg, i) => (
        <group
          key={`meteor-${i}`}
          ref={(g) => {
            meteorRefs.current[i] = g;
          }}
        >
          <mesh>
            <icosahedronGeometry args={[cfg.size, 0]} />
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
      ))}
    </group>
  );
}
