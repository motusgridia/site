// MotusGridia — Grid Network scene.
//
// Slug: grid-network. Canon: grounded.
//
// Visual metaphor: a planet covered in Grids with traffic between
// them. The planet sphere sits at centre with three equatorial
// hex bands painted on. Three orbital "Grids" circle it — each a
// small comb cluster with a Hub spire pointing outward. Traffic
// particles flow between the orbital Grids on slow arcs, never
// stopping — the network is always moving.
//
// Motion beats:
//   · Planet rotates slowly (0.05 rad/s).
//   · Three orbital Grids on independent orbits, each at a
//     different radius and inclination. Each orbit has its own
//     speed so the relative positions are always different.
//   · Each Grid's Hub spire breathes on its own phase.
//   · Traffic: three particles each trace a great-circle arc
//     between a different pair of Grids every 6 seconds.
//   · Whole scene has a gentle axis wobble so the equator
//     catches the camera differently across the cycle.
//
// Replaces the inline PlanetaryNetwork + OrbitComb scenes.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { canonColour, type CodexCanon } from "./shared";

// Orbit configs — radius / speed / tilt / phase. Speeds are slow
// enough that the full orbit takes ~20-35 seconds.
const ORBITS = [
  { radius: 3.2, speed: 0.32, tilt: 0.22, phase: 0 },
  { radius: 4.05, speed: 0.24, tilt: -0.32, phase: 2.1 },
  { radius: 4.95, speed: 0.17, tilt: 0.46, phase: 4.2 },
] as const;

function orbitPosition(
  radius: number,
  speed: number,
  tilt: number,
  phase: number,
  t: number,
): [number, number, number] {
  const a = t * speed + phase;
  return [
    Math.cos(a) * radius,
    Math.sin(a) * Math.sin(tilt) * radius * 0.3,
    Math.sin(a) * radius,
  ];
}

function OrbitGrid({
  config,
  canon,
  onSpireRef,
}: {
  config: (typeof ORBITS)[number];
  canon: CodexCanon;
  onSpireRef: (mesh: THREE.Mesh | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const [x, y, z] = orbitPosition(
      config.radius,
      config.speed,
      config.tilt,
      config.phase,
      state.clock.elapsedTime,
    );
    g.position.set(x, y, z);
    // Rotate the Grid to keep the Hub pointing outward from the
    // planet — compute angle from group position to origin.
    g.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      {/* The Grid disc — three hexes in a tight cluster. Scaled down
          so the whole Grid reads as a small outpost against the
          planet's scale. */}
      <mesh
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.14, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.55}
          metalness={0.4}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        position={[0.72, 0, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.14, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.35}
          metalness={0.4}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        position={[-0.36, 0, 0.62]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.14, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.35}
          metalness={0.4}
          roughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hub spire — points outward along +Z (away from planet
          after lookAt). Breathes on a phase set by the outer
          scene. */}
      <mesh
        ref={onSpireRef}
        position={[0, 0, -0.6]}
        rotation={[Math.PI / 2, 0, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.07, 0.11, 1.0, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.8}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

export function GridNetwork({ canon }: { canon: CodexCanon }) {
  const planetRef = useRef<THREE.Mesh>(null);
  const wobbleRef = useRef<THREE.Group>(null);
  const bandRefs = useRef<Array<THREE.Mesh | null>>([]);
  const spireRefs = useRef<Array<THREE.Mesh | null>>([]);
  const trafficRefs = useRef<Array<THREE.Mesh | null>>([]);
  const emissive = canonColour(canon);

  // Three traffic particles, each assigned a pair of orbits to bounce
  // between. Indices reference the ORBITS array.
  const trafficRoutes = useMemo(
    () => [
      { from: 0, to: 1, period: 6, offset: 0 },
      { from: 1, to: 2, period: 7.5, offset: 2 },
      { from: 2, to: 0, period: 5.5, offset: 4 },
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Planet rotation + slight axial wobble on the outer group.
    const planet = planetRef.current;
    if (planet) planet.rotation.y = t * 0.05;

    const wob = wobbleRef.current;
    if (wob) wob.rotation.x = Math.sin(t * 0.15) * 0.08;

    // Equator bands — gentle breathing.
    for (let i = 0; i < bandRefs.current.length; i++) {
      const b = bandRefs.current[i];
      if (!b) continue;
      const mat = b.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      mat.emissiveIntensity = 0.18 + Math.sin(t * 0.6 + i * 1.2) * 0.05;
    }

    // Hub spires — each breathes on a different phase.
    for (let i = 0; i < spireRefs.current.length; i++) {
      const s = spireRefs.current[i];
      if (!s) continue;
      const mat = s.material as THREE.MeshStandardMaterial | undefined;
      if (!mat || !("emissiveIntensity" in mat)) continue;
      mat.emissiveIntensity = 0.6 + Math.sin(t * 1.1 + i * 1.7) * 0.25;
    }

    // Traffic particles — linear interpolation between orbit
    // positions, sinusoidally eased so the particle slows at each
    // endpoint (arrival + departure have weight).
    for (let i = 0; i < trafficRoutes.length; i++) {
      const mesh = trafficRefs.current[i];
      const route = trafficRoutes[i];
      if (!mesh || !route) continue;
      const fromConfig = ORBITS[route.from];
      const toConfig = ORBITS[route.to];
      if (!fromConfig || !toConfig) continue;
      const [fx, fy, fz] = orbitPosition(
        fromConfig.radius,
        fromConfig.speed,
        fromConfig.tilt,
        fromConfig.phase,
        t,
      );
      const [tx, ty, tz] = orbitPosition(
        toConfig.radius,
        toConfig.speed,
        toConfig.tilt,
        toConfig.phase,
        t,
      );
      // Eased phase: 0 → 1 → 0 across period
      const raw = ((t + route.offset) % route.period) / route.period;
      // Triangle wave then eased sine to create "travel out, travel
      // back" with pauses at the ends.
      const tri = raw < 0.5 ? raw * 2 : (1 - raw) * 2;
      const eased = (1 - Math.cos(tri * Math.PI)) / 2;
      mesh.position.set(
        fx + (tx - fx) * eased,
        fy + (ty - fy) * eased,
        fz + (tz - fz) * eased,
      );
      const matT = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (matT && "emissiveIntensity" in matT) {
        // Brightest in the middle of the trip.
        matT.emissiveIntensity =
          0.6 + Math.sin(tri * Math.PI) * 0.8;
      }
    }
  });

  return (
    <group ref={wobbleRef}>
      {/* Planet — matte dark sphere with faint glow so it reads
          as a body, not a hole. */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.2, 48, 32]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.08}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Equator hex bands — three thin rings at different latitudes
          painted as decorative hex-lattice suggestions. */}
      {[0, -0.55, 0.55].map((y, i) => (
        <mesh
          key={`band-${i}`}
          ref={(m) => {
            bandRefs.current[i] = m;
          }}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          frustumCulled={false}
        >
          <torusGeometry
            args={[
              // Radius narrows toward the poles.
              Math.sqrt(Math.max(0, 1.2 * 1.2 - y * y)),
              0.02,
              8,
              48,
            ]}
          />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.18}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Three orbital Grids. */}
      {ORBITS.map((config, i) => (
        <OrbitGrid
          key={`grid-${i}`}
          config={config}
          canon={canon}
          onSpireRef={(m) => {
            spireRefs.current[i] = m;
          }}
        />
      ))}

      {/* Traffic particles — small glowing spheres travelling between
          orbital Grids. */}
      {trafficRoutes.map((_, i) => (
        <mesh
          key={`traffic-${i}`}
          ref={(m) => {
            trafficRefs.current[i] = m;
          }}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshStandardMaterial
            color={emissive}
            emissive={emissive}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  );
}
