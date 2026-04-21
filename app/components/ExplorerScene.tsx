// MotusGridia — 3D Codex Explorer scene.
//
// Spec: Standing directive (session 6) —
//       "make the site feel as much like a 3d space as possible. every
//        concept illustrated visually, solar-system-style 3d model UX".
// Spec: /site/CLAUDE.md § Component rules #1 ("Hex DNA on every container"),
//       #6 ("Motion budget"), #7 ("Reduced motion is first-class").
// Spec: /site/lib/content.ts § CANON_ACCENT — cyan for grounded,
//       amber for fiction-c1 / fiction-c2.
//
// Each codex entry becomes one hex prism in a navigable 3D honeycomb laid
// out as a spiral on the XZ plane. Cells are colour-coded by canon. Hover
// raises the cell and shows a title tooltip via drei's <Html>; click routes
// to /codex/<slug>.
//
// Why individual meshes (not InstancedMesh): each cell needs its own
// pointer events and per-cell hover state. drei's <Instances> / <Instance>
// supports that but adds indirection and breaks per-instance emissive
// animation. With ~21 cells the straightforward per-cell mesh approach
// costs ~21 draw calls, well inside the frame budget. Revisit once the
// codex crosses ~100 entries.
//
// Why grid on XZ plane (not XY): the camera orbits around +Y ("up" in
// three.js default), so laying the grid flat on y=0 gives a map-on-a-table
// read that responds correctly to OrbitControls' polar-angle clamping.

"use client";

import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ExplorerEntry = {
  slug: string;
  title: string;
  type: string; // CodexType enum, kept loose so we don't pull the server schema.
  canon: "grounded" | "fiction-c1" | "fiction-c2";
  summary: string;
  /** Slugs this entry links OUT to (forward graph edges from content-index). */
  relatedSlugs: ReadonlyArray<string>;
};

type Props = {
  entries: ReadonlyArray<ExplorerEntry>;
};

// ---------------------------------------------------------------------------
// Hex lattice maths — pointy-top axial coordinates.
//
// References:
//   https://www.redblobgames.com/grids/hexagons/#coordinates-axial
//   https://www.redblobgames.com/grids/hexagons/#rings
// ---------------------------------------------------------------------------

const HEX_RADIUS = 1;
const HEX_DEPTH = 0.22;
const HEX_CELL_SCALE = 0.92; // hairline gap between neighbours, per /visual-identity.md "lines are thin"

// Axial direction vectors, traversal order for a ring walk starting at the
// SW corner. Order: E, NE, N, W, SW, S — pairs (dq, dr).
const HEX_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

/**
 * Spiral-outwards hex coordinates. Returns exactly `n` axial (q, r) pairs
 * starting at the origin. Rings grow outward until filled to capacity.
 */
function hexSpiral(n: number): ReadonlyArray<readonly [number, number]> {
  if (n <= 0) return [];
  const coords: Array<readonly [number, number]> = [[0, 0]];
  if (n === 1) return coords;
  let ring = 1;
  while (coords.length < n) {
    // Start at the SW corner of this ring.
    let q = -ring;
    let r = ring;
    for (let side = 0; side < 6; side++) {
      const dir = HEX_DIRS[side];
      if (!dir) continue; // satisfies noUncheckedIndexedAccess
      const [dq, dr] = dir;
      for (let step = 0; step < ring; step++) {
        coords.push([q, r]);
        q += dq;
        r += dr;
        if (coords.length >= n) return coords;
      }
    }
    ring++;
  }
  return coords;
}

/** Axial → world (pointy-top), grid laid flat on the XZ plane. */
function axialToWorld(
  q: number,
  r: number,
): readonly [number, number, number] {
  const x = HEX_RADIUS * Math.sqrt(3) * (q + r / 2);
  const z = HEX_RADIUS * 1.5 * r;
  return [x, 0, z];
}

/** Canon → hex emissive colour. Matches CANON_ACCENT in /site/lib/content.ts. */
function canonColour(canon: ExplorerEntry["canon"]): string {
  switch (canon) {
    case "grounded":
      return "#22e5ff";
    case "fiction-c1":
      return "#ffb347";
    case "fiction-c2":
      return "#ff9a1f";
  }
}

// ---------------------------------------------------------------------------
// Single cell — one codex entry.
// ---------------------------------------------------------------------------

type CellProps = {
  entry: ExplorerEntry;
  position: readonly [number, number, number];
  isHovered: boolean;
  onClick: (slug: string) => void;
  onHover: (slug: string | null) => void;
};

function Cell({ entry, position, isHovered, onClick, onHover }: CellProps) {
  const colour = canonColour(entry.canon);

  // Lift + scale on hover. Together they read as "picking a tile off the
  // board" rather than a flat highlight.
  const hoverLift = isHovered ? 0.4 : 0;
  const hoverScale = isHovered ? 1.1 : 1;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick(entry.slug);
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(entry.slug);
    if (typeof document !== "undefined") {
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = () => {
    onHover(null);
    if (typeof document !== "undefined") {
      document.body.style.cursor = "";
    }
  };

  return (
    <group
      position={[position[0], position[1] + hoverLift, position[2]]}
    >
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={hoverScale}
        // Default CylinderGeometry with 6 radialSegments is flat-top; rotate
        // π/6 around Y to convert to pointy-top so the hex points align
        // with our axial lattice.
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry
          args={[
            HEX_RADIUS * HEX_CELL_SCALE,
            HEX_RADIUS * HEX_CELL_SCALE,
            HEX_DEPTH,
            6,
            1,
            false,
          ]}
        />
        <meshStandardMaterial
          color="#0b1030"
          emissive={colour}
          emissiveIntensity={isHovered ? 0.8 : 0.22}
          metalness={0.35}
          roughness={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hover label — tooltip above the raised cell. Html without the
          `transform` prop renders as a 2D screen-space overlay so the
          label stays legible regardless of camera orbit. */}
      {isHovered ? (
        <Html
          position={[0, HEX_DEPTH + 0.6, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="flex min-w-[12rem] max-w-[18rem] flex-col gap-1 border border-line-soft bg-bg-deep/95 px-3 py-2 backdrop-blur">
            <span className="mono text-accent-cyan">{entry.type}</span>
            <span className="text-body text-ink-primary">{entry.title}</span>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Grid — one cell per codex entry, laid out as a hex spiral.
// ---------------------------------------------------------------------------

// Edge represents a single cross-link in the graph. Stored with both slugs
// so the hover filter can brighten edges touching the hovered cell.
type Edge = {
  from: readonly [number, number, number];
  to: readonly [number, number, number];
  fromSlug: string;
  toSlug: string;
};

// Edge colours — matched to line-soft / accent-cyan from globals.css so the
// graph reads in the same palette as the 2D UI. Idle = near-invisible
// hairline; active = cyan glow when either endpoint is hovered.
const EDGE_COLOR_IDLE = "#1a2240";
const EDGE_COLOR_ACTIVE = "#22e5ff";

function Grid({ entries }: Props) {
  const router = useRouter();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const cells = useMemo(() => {
    const coords = hexSpiral(entries.length);
    return entries.map((entry, i) => {
      const coord = coords[i] ?? ([0, 0] as const);
      const position = axialToWorld(coord[0], coord[1]);
      return { entry, position };
    });
  }, [entries]);

  // slug → world position lookup used by the edge builder below. Separate
  // memo so the lookup is stable across hover re-renders.
  const positionBySlug = useMemo(() => {
    const map = new Map<string, readonly [number, number, number]>();
    for (const { entry, position } of cells) {
      map.set(entry.slug, position);
    }
    return map;
  }, [cells]);

  // Compute unique edges once. `related_codex` is directional in the data
  // model (A declares B as related), but for rendering we collapse A→B and
  // B→A into one line so the visual graph doesn't draw doubled-up strokes.
  // We key on the slug pair (lexicographic) so the dedupe is deterministic.
  const edges = useMemo<ReadonlyArray<Edge>>(() => {
    const seen = new Set<string>();
    const list: Edge[] = [];
    for (const { entry } of cells) {
      const fromPos = positionBySlug.get(entry.slug);
      if (!fromPos) continue;
      for (const toSlug of entry.relatedSlugs) {
        if (toSlug === entry.slug) continue; // no self-loops
        const key =
          entry.slug < toSlug
            ? `${entry.slug}|${toSlug}`
            : `${toSlug}|${entry.slug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const toPos = positionBySlug.get(toSlug);
        if (!toPos) continue; // target slug not in the current lattice
        list.push({
          from: fromPos,
          to: toPos,
          fromSlug: entry.slug,
          toSlug,
        });
      }
    }
    return list;
  }, [cells, positionBySlug]);

  // Restore the cursor when the scene unmounts — if a user clicks a cell,
  // navigation unmounts the Canvas before pointer-out fires, so the
  // "pointer" cursor would otherwise linger on the destination route.
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.cursor = "";
      }
    };
  }, []);

  const handleClick = (slug: string) => {
    // Clear cursor immediately; the unmount cleanup above is the safety
    // net in case the click fires without a matching pointer-out.
    if (typeof document !== "undefined") {
      document.body.style.cursor = "";
    }
    router.push(`/codex/${slug}`);
  };

  return (
    <group>
      {/* Edges render BEFORE cells so cells paint on top. Edges float a
          hair above the cell tops (y = HEX_DEPTH / 2 + 0.01) so they
          don't z-fight with the hex cap and so they read as "wires
          bridging cell to cell" rather than "shadows on the ground". */}
      {edges.map((edge) => {
        const active =
          hoveredSlug !== null &&
          (edge.fromSlug === hoveredSlug || edge.toSlug === hoveredSlug);
        // When nothing is hovered: all edges render at idle (whisper).
        // When something is hovered: touching edges brighten, the rest
        // dim further so the graph reads "this cell's neighbourhood".
        const opacity = active ? 0.85 : hoveredSlug === null ? 0.22 : 0.06;
        const width = active ? 2 : 1;
        const y = HEX_DEPTH / 2 + 0.01;
        return (
          <Line
            key={`${edge.fromSlug}|${edge.toSlug}`}
            points={[
              [edge.from[0], edge.from[1] + y, edge.from[2]],
              [edge.to[0], edge.to[1] + y, edge.to[2]],
            ]}
            color={active ? EDGE_COLOR_ACTIVE : EDGE_COLOR_IDLE}
            lineWidth={width}
            transparent
            opacity={opacity}
            dashed={!active}
            dashSize={0.22}
            gapSize={0.14}
          />
        );
      })}

      {cells.map(({ entry, position }) => (
        <Cell
          key={entry.slug}
          entry={entry}
          position={position}
          isHovered={hoveredSlug === entry.slug}
          onClick={handleClick}
          onHover={setHoveredSlug}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Canvas wrapper + post-processing.
// ---------------------------------------------------------------------------

export default function ExplorerScene({ entries }: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        // Camera high and back — "looking at a map on a table". The user
        // can orbit freely; we only clamp below-horizon so they can't fly
        // under the grid.
        camera={{ position: [0, 12, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Ambient fills the dark undersides of each hex prism. */}
        <ambientLight intensity={0.42} color="#1a2240" />

        {/* Key light — cyan tint from above/right, casts a rim on the cells
            that catches the emissive halo. */}
        <directionalLight
          position={[6, 10, 4]}
          intensity={0.8}
          color="#22e5ff"
        />

        {/* Counter-fill — warm amber from the opposite side so fiction cells
            sit in a faint amber glow even before their own emissive fires.
            Reads as "two lights in the lab" per /visual-identity.md. */}
        <directionalLight
          position={[-5, 6, -3]}
          intensity={0.3}
          color="#ffb347"
        />

        <Grid entries={entries} />

        {/* OrbitControls — full 3D navigation, but clamp below-horizon so
            the user can't tilt under the grid plane (the cells have no
            underside shading). makeDefault registers it as the primary
            camera controller so drei hooks can find it if we add any. */}
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={6}
          maxDistance={32}
          // Just under π/2 — cell top faces stay in view; users can't flip
          // the camera under the grid.
          maxPolarAngle={Math.PI * 0.48}
          // Prevent the camera from approaching the +Y pole where the
          // orbit gimbals lock. 0.1 rad off pole keeps controls smooth.
          minPolarAngle={Math.PI * 0.05}
          target={[0, 0, 0]}
        />

        {/* Post-processing — same cyberpunk finish as the hero honeycomb,
            slightly lower bloom because the Explorer scene is already busy
            with per-cell emissive values. */}
        <EffectComposer>
          <Bloom
            intensity={0.36}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0008, 0.0011]}
            radialModulation={false}
            modulationOffset={0}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
