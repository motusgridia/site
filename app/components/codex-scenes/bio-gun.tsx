// MotusGridia — Bio-Gun scene.
//
// Slug: bio-gun. Canon: fiction-c1.
//
// Visual metaphor: the weapon on the left of the plate, the target
// hex on the right. The weapon body is a long hex with a stubby
// barrel extension pointing right. A row of four ammo cartridges
// sits alongside the body — dim when at rest, one cartridge lit at
// a time as the magazine cycles. On each firing cycle a bacterium
// slug travels from the muzzle across the plate, hits the target,
// flashes the target, and then decays — the bacterium dying from
// the impact the way the lore says.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function BioGun({
  canon,
}: {
  canon: CodexCanon;
}) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const muzzleRef = useRef<THREE.Mesh>(null);
  const slugRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef<THREE.Mesh>(null);
  const cartridgeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cryoRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  const gunX = -1.6;
  const muzzleX = -0.9;
  const targetX = 1.6;
  const cartridgeCount = 4;

  // Cartridges sit in a line along the +Z side of the weapon.
  const cartridges = useMemo(() => {
    const out: { x: number; z: number }[] = [];
    for (let i = 0; i < cartridgeCount; i++) {
      out.push({
        x: gunX - 0.45 + i * 0.3,
        z: 0.35,
      });
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Fire cycle — 5s.
    // 0.00-0.45 charge (cartridge travels to chamber).
    // 0.45-0.50 muzzle flash.
    // 0.50-0.80 slug in flight from muzzle to target.
    // 0.80-0.88 target hit flash.
    // 0.88-1.00 decay (slug fades, target settles).
    const period = 5;
    const phase = (t % period) / period;
    const cycleIndex = Math.floor(t / period) % cartridgeCount;

    // Body — steady hum, slightly brighter during charge.
    const body = bodyRef.current;
    if (body) {
      const mat = body.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const charge = phase < 0.45 ? phase / 0.45 : 0;
        mat.emissiveIntensity = 0.35 + charge * 0.2;
      }
    }

    // Cryo-cell — steady cool pulse; dims during fire.
    const cryo = cryoRef.current;
    if (cryo) {
      const mat = cryo.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const fireDim = phase > 0.45 && phase < 0.55 ? 0.3 : 1.0;
        mat.emissiveIntensity = (0.45 + Math.sin(t * 1.8) * 0.1) * fireDim;
      }
    }

    // Cartridges — only the active one lit at a time.
    cartridgeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const active = i === cycleIndex;
        mat.emissiveIntensity = active ? 0.9 : 0.22;
      }
    });

    // Muzzle — flashes during the 0.45-0.5 window.
    const muzzle = muzzleRef.current;
    if (muzzle) {
      const mat = muzzle.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const flash = phase > 0.45 && phase < 0.55;
        mat.emissiveIntensity = flash ? 2.2 : 0.3;
      }
    }

    // Slug — visible only during flight window.
    const slug = slugRef.current;
    if (slug) {
      const inFlight = phase > 0.5 && phase < 0.8;
      slug.visible = inFlight;
      if (inFlight) {
        const flightP = (phase - 0.5) / 0.3;
        slug.position.x = muzzleX + (targetX - muzzleX) * flightP;
        // Slight arc so it reads as a projectile, not a laser.
        slug.position.y = 0.55 + Math.sin(flightP * Math.PI) * 0.1;
      }
    }

    // Target — steady dim, flashes at impact.
    const target = targetRef.current;
    if (target) {
      const mat = target.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        const hit = phase > 0.8 && phase < 0.92;
        const hitAmount = hit ? Math.sin(((phase - 0.8) / 0.12) * Math.PI) : 0;
        mat.emissiveIntensity = 0.3 + hitAmount * 1.8;
      }
      target.rotation.y = t * 0.2 + Math.PI / 6;
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

      {/* Weapon body — long hex lying on its side, pointing right. */}
      <mesh
        ref={bodyRef}
        position={[gunX, 0.55, 0]}
        rotation={[0, 0, Math.PI / 2]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.22, 0.22, 1.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.35}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      {/* Muzzle — stubby hex just past the body. */}
      <mesh
        ref={muzzleRef}
        position={[muzzleX, 0.55, 0]}
        rotation={[0, 0, Math.PI / 2]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.14, 0.14, 0.28, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Cryo-cell — small hex behind the magazine. */}
      <mesh
        ref={cryoRef}
        position={[gunX - 0.7, 0.55, 0.18]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.16, 0.16, 0.22, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.45}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Cartridges — 4 small hexes in a line. */}
      {cartridges.map((c, i) => (
        <mesh
          key={`cart-${i}`}
          ref={(el) => {
            cartridgeRefs.current[i] = el;
          }}
          position={[c.x, 0.35, c.z]}
          rotation={[0, Math.PI / 6, 0]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.08, 0.08, 0.24, 6, 1, false]} />
          <meshStandardMaterial
            color="#0b1030"
            emissive={emissive}
            emissiveIntensity={0.22}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Bacterium slug — small sphere that travels across the plate. */}
      <mesh
        ref={slugRef}
        position={[muzzleX, 0.55, 0]}
        frustumCulled={false}
        visible={false}
      >
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.6}
        />
      </mesh>

      {/* Target — hex on the right that takes the hit. */}
      <mesh
        ref={targetRef}
        position={[targetX, 0.45, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.9, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
