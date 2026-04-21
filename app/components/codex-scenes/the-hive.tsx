// MotusGridia — The Hive scene.
//
// Slug: the-hive. Canon: fiction.
//
// Visual metaphor: a distributed mind. Twelve nodes scattered in
// space, each a red-amber sphere, all listening to the same clock so
// the ensemble reads as coordinated, not random. Bright thought-packets
// fly between nodes continuously — the mind thinking. Every 8 seconds
// the whole hive spikes in unison for a fraction of a second — the
// collective attention snapping to a decision.
//
// Motion beats:
//   · Each node has its own phase so the baseline pulse "breathes"
//     across the cloud rather than strobing in lockstep.
//   · Every 8 seconds a unison spike pushes every node's scale and
//     emissiveIntensity up together for ~0.4s, then releases.
//   · Six thought-packets — small bright spheres — fly between
//     random node pairs on 3-5s cycles, fading in and out at the
//     endpoints so nodes appear to dispatch and receive them.
//   · A ghost aggregate hex underneath swells with each unison
//     spike — the mind's body, implied.
//   · Whole cluster drifts in slow Y-rotation so the topology never
//     sits still.
//
// Replaces the inline HiveNode + HiveNetwork scenes.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

// Seeded node positions. Deterministic so SSR vs CSR never reshuffles.
const NODES: ReadonlyArray<readonly [number, number, number]> = [
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
];

const PACKET_COUNT = 6;
const UNISON_PERIOD = 8; // seconds

// Deterministic packet routes — each packet bounces between a fixed
// pair of nodes on its own cycle. Pseudo-random but reproducible.
const PACKET_ROUTES: ReadonlyArray<{
  from: number;
  to: number;
  period: number;
  offset: number;
}> = [
  { from: 0, to: 5, period: 3.2, offset: 0 },
  { from: 1, to: 7, period: 4.1, offset: 0.8 },
  { from: 2, to: 9, period: 3.8, offset: 1.6 },
  { from: 3, to: 11, period: 4.5, offset: 2.3 },
  { from: 4, to: 6, period: 3.5, offset: 3.0 },
  { from: 8, to: 10, period: 4.2, offset: 3.7 },
];

export function TheHive({ canon }: { canon: CodexCanon }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRefs = useRef<Array<THREE.Mesh | null>>([]);
  const packetRefs = useRef<Array<THREE.Mesh | null>>([]);
  const ghostRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Per-node phase offsets — stable across frames.
  const nodePhases = useMemo(
    () => NODES.map((_, i) => i * 0.47),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Slow group rotation.
    const g = groupRef.current;
    if (g) g.rotation.y += delta * 0.08;

    // Unison spike — a sharp, narrow peak every 8s.
    const unisonPhase = (t % UNISON_PERIOD) / UNISON_PERIOD;
    // Window: 0.88..1.0 is the spike (~0.96s). Curve: cosine hump.
    let unison = 0;
    if (unisonPhase > 0.88) {
      const within = (unisonPhase - 0.88) / 0.12;
      unison = Math.sin(within * Math.PI);
    }

    // Per-node breathing + unison add-on.
    for (let i = 0; i < nodeRefs.current.length; i++) {
      const m = nodeRefs.current[i];
      if (!m) continue;
      const phase = nodePhases[i] ?? 0;
      const baseline = (Math.sin(t * 1.4 + phase) + 1) / 2;
      const scale = 0.18 + baseline * 0.18 + unison * 0.18;
      m.scale.setScalar(scale);
      const mat = m.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 1.0 + baseline * 0.6 + unison * 1.2;
      }
    }

    // Packets — each flies between a pair of nodes on its own cycle.
    // We use a bounce phase: 0 → 1 → 0 per period, so a packet leaves,
    // arrives, turns around, comes back. The emissive dims at the
    // endpoints so the packet appears to be absorbed/dispatched rather
    // than just bouncing forever through empty space.
    for (let i = 0; i < packetRefs.current.length; i++) {
      const m = packetRefs.current[i];
      const route = PACKET_ROUTES[i];
      if (!m || !route) continue;
      const from = NODES[route.from];
      const to = NODES[route.to];
      if (!from || !to) continue;
      const raw = ((t + route.offset) % route.period) / route.period;
      const tri = raw < 0.5 ? raw * 2 : (1 - raw) * 2;
      const eased = (1 - Math.cos(tri * Math.PI)) / 2;
      m.position.set(
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
        from[2] + (to[2] - from[2]) * eased,
      );
      const mat = m.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        // Brightest mid-flight, invisible at the endpoints.
        mat.emissiveIntensity = Math.sin(tri * Math.PI) * 1.6;
      }
    }

    // Ghost aggregate — swells with the unison spike.
    const ghost = ghostRef.current;
    if (ghost) {
      const mat = ghost.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.1 + unison * 0.45;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {NODES.map((pos, i) => (
        <mesh
          key={`node-${i}`}
          ref={(m) => {
            nodeRefs.current[i] = m;
          }}
          position={[pos[0], pos[1], pos[2]]}
        >
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial
            color="#7a0d0d"
            emissive={emissive}
            emissiveIntensity={1.4}
          />
        </mesh>
      ))}

      {/* Thought-packets — small bright spheres flying between node
          pairs. Drawn outside the node loop so each packet owns its
          own stable ref slot. */}
      {PACKET_ROUTES.map((_, i) => (
        <mesh
          key={`packet-${i}`}
          ref={(m) => {
            packetRefs.current[i] = m;
          }}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial
            color={emissive}
            emissive={emissive}
            emissiveIntensity={0}
          />
        </mesh>
      ))}

      {/* Ghost aggregate — the body the hive would occupy if it had
          one. Its emissiveIntensity is driven by the unison spike so
          the implied body brightens at each collective decision. */}
      <mesh
        ref={ghostRef}
        position={[0, -1, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[2.2, 2.2, 0.05, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.1}
          metalness={0.3}
          roughness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Faint floor — HexPrism static hex so the cloud has a horizon. */}
      <HexPrism
        position={[0, -1.1, 0]}
        radius={3.2}
        depth={0.02}
        emissive={emissive}
        emissiveIntensity={0.05}
      />
    </group>
  );
}
