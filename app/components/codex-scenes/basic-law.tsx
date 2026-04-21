// MotusGridia — Basic Law scene.
//
// Slug: basic-law. Canon: grounded.
//
// Visual metaphor: the non-negotiable floor beneath every Grid.
// A six-sided obelisk stands at centre on a wide hex platter.
// Three thin engraved bands girdle the obelisk — the articles of
// the law. Six satellite hexes stand at compass points around
// the platter — the Grids the law binds.
//
// Motion beats:
//   · The obelisk rotates very slowly (0.08 rad/s). Authority is
//     stable, not kinetic.
//   · A single engraved band lights at a time, top-down, in a
//     12-second reading cycle — the articles being "read aloud".
//   · Each satellite hex breathes on its own phase so the six
//     Grids feel independent of each other while all bound to the
//     centre.
//   · The platter carries a faint swelling glow synced to the
//     band-reading — the law's presence reaching outward.
//
// Replaces the inline HexObelisk scene.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

const SATELLITE_COUNT = 6;
const ARTICLE_COUNT = 3;

// Satellite radial distance — just outside the obelisk base.
const SATELLITE_RADIUS = 2.6;

// Band Y-positions on the obelisk, top-to-bottom.
const BAND_Y = [0.9, 0.1, -0.7] as const;

export function BasicLaw({ canon }: { canon: CodexCanon }) {
  const obeliskRef = useRef<THREE.Mesh>(null);
  const platterRef = useRef<THREE.Mesh>(null);
  const bandRefs = useRef<Array<THREE.Mesh | null>>([]);
  const satelliteRefs = useRef<Array<THREE.Mesh | null>>([]);
  const emissive = canonColour(canon);

  const satellitePositions = useMemo(() => {
    const out: Array<readonly [number, number, number]> = [];
    for (let i = 0; i < SATELLITE_COUNT; i++) {
      const angle = (i / SATELLITE_COUNT) * Math.PI * 2;
      out.push([
        Math.cos(angle) * SATELLITE_RADIUS,
        0,
        Math.sin(angle) * SATELLITE_RADIUS,
      ] as const);
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Obelisk — slow rotation, steady glow.
    const ob = obeliskRef.current;
    if (ob) ob.rotation.y = t * 0.08;

    // Reading cycle — 12 seconds for all three articles.
    // Each article gets 4 seconds: ramp up for 1s, hold for 2s, ramp
    // down for 1s. This gives a deliberate "recital" cadence.
    const cycle = 12;
    const cyclePhase = t % cycle;
    const activeArticle = Math.floor(cyclePhase / 4);
    const articlePhase = (cyclePhase % 4) / 4; // 0..1 within one article
    // Rise-peak-fall curve.
    let articleGlow: number;
    if (articlePhase < 0.25) {
      articleGlow = articlePhase / 0.25;
    } else if (articlePhase < 0.75) {
      articleGlow = 1;
    } else {
      articleGlow = 1 - (articlePhase - 0.75) / 0.25;
    }

    for (let i = 0; i < ARTICLE_COUNT; i++) {
      const b = bandRefs.current[i];
      if (!b) continue;
      const mat = b.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      if (i === activeArticle) {
        mat.emissiveIntensity = 0.25 + articleGlow * 1.3;
      } else {
        // Inactive bands keep a low steady glow — still inscribed,
        // just not the one being read.
        mat.emissiveIntensity = 0.2;
      }
    }

    // Platter — faint swelling synced to the reading.
    const pl = platterRef.current;
    if (pl) {
      const mat = pl.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.14 + articleGlow * 0.08;
      }
    }

    // Satellites — each breathes on its own phase. Independent but
    // bound — none of them pulse together.
    for (let i = 0; i < satelliteRefs.current.length; i++) {
      const s = satelliteRefs.current[i];
      if (!s) continue;
      const mat = s.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      const phase = i * 0.9;
      mat.emissiveIntensity = 0.28 + (Math.sin(t * 0.7 + phase) + 1) * 0.07;
    }
  });

  return (
    <group>
      {/* Wide hex platter — the grounded base. */}
      <mesh
        ref={platterRef}
        position={[0, -1.9, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[3.4, 3.4, 0.18, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.14}
          metalness={0.5}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* The obelisk — six-sided, slight taper, monolithic. */}
      <mesh
        ref={obeliskRef}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.9, 1.15, 3.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.48}
          metalness={0.62}
          roughness={0.25}
          flatShading
        />
      </mesh>

      {/* Three engraved bands — thin torus-like hex rings that girdle
          the obelisk at fixed Y. Light one at a time during the
          reading cycle. */}
      {BAND_Y.map((y, i) => (
        <mesh
          key={`band-${i}`}
          ref={(m) => {
            bandRefs.current[i] = m;
          }}
          position={[0, y, 0]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1.06, 1.06, 0.09, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.2}
            metalness={0.7}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Six satellite Grid-hexes at compass points. */}
      {satellitePositions.map((pos, i) => (
        <mesh
          key={`sat-${i}`}
          ref={(m) => {
            satelliteRefs.current[i] = m;
          }}
          position={[pos[0], -1.45, pos[2]]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.42, 0.42, 0.5, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.3}
            metalness={0.4}
            roughness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Cap hex on top of the obelisk — the seal. */}
      <HexPrism
        position={[0, 1.85, 0]}
        radius={0.8}
        depth={0.12}
        emissive={emissive}
        emissiveIntensity={0.6}
      />
    </group>
  );
}
