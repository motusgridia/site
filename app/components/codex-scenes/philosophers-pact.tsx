// MotusGridia — Philosopher's Pact scene.
//
// Slug: philosophers-pact. Canon: fiction-c1.
//
// Visual metaphor: three hexes in an equilateral triangle — Illum at
// the front (the present-administrator node), the Grid Philosopher
// upper-left (the founding-principles node), and Vader's Grandfather
// upper-right (the future-lineage node). Three thin arcs run between
// them. Motes ping back and forth along the arcs on a slow, staggered
// cadence — the pact convenes rarely but deliberately. A small opaque
// shell hex sits above the triangle's centroid, dimming and lifting
// when all three motes converge, brightening when none are in flight —
// the channel is opaque by design.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function PhilosophersPact({
  canon,
}: {
  canon: CodexCanon;
}) {
  const emissive = canonColour(canon);

  // Three member node hexes, spaced as an equilateral triangle
  // around the plate centre.
  const nodes = useMemo(
    () => [
      // Illum — front-centre, the public-facing administrator.
      { id: "illum", x: 0, z: 1.4, radius: 0.38, depth: 0.42 },
      // Grid Philosopher — back-left, founding-era.
      { id: "philosopher", x: -1.2, z: -0.7, radius: 0.38, depth: 0.42 },
      // Vader's Grandfather — back-right, lineage progenitor.
      { id: "grandfather", x: 1.2, z: -0.7, radius: 0.38, depth: 0.42 },
    ],
    [],
  );

  const nodeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const shellRef = useRef<THREE.Mesh>(null);
  const moteRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Three arcs — one between each pair of members. Each arc has a
  // mote that travels along it on its own phase.
  const arcs = useMemo(
    () => {
      const n = nodes;
      const a = n[0];
      const b = n[1];
      const c = n[2];
      if (!a || !b || !c) return [];
      return [
        // illum <-> philosopher
        {
          from: [a.x, a.z] as const,
          to: [b.x, b.z] as const,
          phase: 0,
          period: 7.2,
        },
        // philosopher <-> grandfather
        {
          from: [b.x, b.z] as const,
          to: [c.x, c.z] as const,
          phase: 2.4,
          period: 7.2,
        },
        // grandfather <-> illum
        {
          from: [c.x, c.z] as const,
          to: [a.x, a.z] as const,
          phase: 4.8,
          period: 7.2,
        },
      ];
    },
    [nodes],
  );

  // Pre-computed arc centres / lengths / angles for the thin arc
  // boxes between nodes. Rebuilding every frame would be wasteful
  // since the triangle geometry is static.
  const arcGeometry = useMemo(
    () =>
      arcs.map((a) => {
        const dx = a.to[0] - a.from[0];
        const dz = a.to[1] - a.from[1];
        const length = Math.sqrt(dx * dx + dz * dz);
        const cx = (a.from[0] + a.to[0]) / 2;
        const cz = (a.from[1] + a.to[1]) / 2;
        const angle = Math.atan2(dz, dx);
        return { cx, cz, length, angle };
      }),
    [arcs],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Motes — travel along each arc on a phase offset. Each mote
    // is visible only during its "in flight" window.
    let inFlight = 0;
    arcs.forEach((arc, i) => {
      const mote = moteRefs.current[i];
      if (!mote) return;
      const phase = ((t + arc.phase) % arc.period) / arc.period;
      // Travel window sits in the middle 45 % of the cycle; the
      // rest of the cycle the mote is hidden — the pact is a
      // rare-convene channel, not a constant stream.
      const active = phase > 0.275 && phase < 0.725;
      mote.visible = active;
      if (active) {
        const travel = (phase - 0.275) / 0.45; // 0 -> 1 across window
        const x = arc.from[0] + (arc.to[0] - arc.from[0]) * travel;
        const z = arc.from[1] + (arc.to[1] - arc.from[1]) * travel;
        mote.position.x = x;
        mote.position.y = 0.45 + Math.sin(travel * Math.PI) * 0.25;
        mote.position.z = z;
        const mat = mote.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Brightest at the midpoint, dim at endpoints.
          mat.emissiveIntensity = 0.6 + Math.sin(travel * Math.PI) * 0.9;
        }
        inFlight += 1;
      }
    });

    // Node brightness — each node breathes on a long cycle, and
    // spikes briefly when a mote arrives (phase near 1).
    nodes.forEach((_, i) => {
      const node = nodeRefs.current[i];
      if (!node) return;
      const breathing = 0.4 + Math.sin(t * 0.6 + i * 1.3) * 0.15;
      // Spike when an inbound mote is near-end of its arc.
      let arrivalSpike = 0;
      arcs.forEach((arc, ai) => {
        // arcs[0] is illum<->philosopher, endpoint is node 1
        // arcs[1] is philosopher<->grandfather, endpoint is node 2
        // arcs[2] is grandfather<->illum, endpoint is node 0
        const endNodeIndex = (ai + 1) % 3;
        if (endNodeIndex !== i) return;
        const phase = ((t + arc.phase) % arc.period) / arc.period;
        if (phase > 0.6 && phase < 0.75) {
          arrivalSpike = Math.max(
            arrivalSpike,
            (0.75 - phase) / 0.15 + 0.2,
          );
        }
      });
      const mat = node.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = breathing + arrivalSpike * 0.7;
      }
    });

    // Shell hex — hovers over the triangle's centroid. Dims when
    // motes are flying (the channel is opaque by design —
    // convening looks dark from the outside). Brightens when
    // the channel is idle.
    const shell = shellRef.current;
    if (shell) {
      const idleBright = inFlight === 0 ? 1 : 0;
      const target = 0.25 + idleBright * 0.5;
      const mat = shell.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = target;
      }
      shell.position.y = 1.35 - inFlight * 0.05;
      shell.rotation.y = t * 0.15 + Math.PI / 6;
    }
  });

  return (
    <group>
      {/* Base plate. */}
      <HexPrism
        position={[0, -0.1, 0]}
        radius={2.8}
        depth={0.08}
        emissive={emissive}
        emissiveIntensity={0.08}
      />

      {/* Member nodes. */}
      {nodes.map((n, i) => (
        <mesh
          key={n.id}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          position={[n.x, n.depth / 2, n.z]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[n.radius, n.radius, n.depth, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.4}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Connection arcs — thin boxes laid between each pair. */}
      {arcGeometry.map((g, i) => (
        <mesh
          key={`arc-${i}`}
          position={[g.cx, 0.05, g.cz]}
          rotation={[0, -g.angle, 0]}
          frustumCulled={false}
        >
          <boxGeometry args={[g.length, 0.02, 0.02]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}

      {/* Motes — one per arc, hidden off-window. */}
      {arcs.map((_, i) => (
        <mesh
          key={`mote-${i}`}
          ref={(el) => {
            moteRefs.current[i] = el;
          }}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}

      {/* Shell hex hovering over the centroid — the opaque channel. */}
      <mesh
        ref={shellRef}
        position={[0, 1.35, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.18, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.35}
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
