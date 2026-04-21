// MotusGridia — Nano-Cam Bullets scene.
//
// Slug: nano-cam-bullets. Canon: fiction-c1.
//
// Visual metaphor: a rifle laid horizontally across the plate,
// carrying two scopes — the primary optic (smaller) and the
// larger secondary viewfinder beside it. A small analogue-stick
// hex sits by the trigger. A bullet is fired in cycle from the
// muzzle, traversing the plate with visible y-axis course
// corrections at the moments the stick flicks — each kink is a
// pilot input translating into a trajectory bend. The bullet
// ends at a target hex which flashes on impact.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

export function NanoCamBullets({
  canon,
}: {
  canon: CodexCanon;
}) {
  const gunRef = useRef<THREE.Mesh>(null);
  const primaryScopeRef = useRef<THREE.Mesh>(null);
  const secondaryScopeRef = useRef<THREE.Mesh>(null);
  const stickRef = useRef<THREE.Mesh>(null);
  const bulletRef = useRef<THREE.Mesh>(null);
  const muzzleFlashRef = useRef<THREE.Mesh>(null);
  const targetRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Course-correction kink schedule — fractions of flight phase,
  // each with a small y-offset the bullet drifts to.
  const kinks: Array<[number, number]> = [
    [0.15, 0.06],
    [0.45, -0.05],
    [0.72, 0.04],
  ];

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // 6s fire cycle.
    // 0.00-0.22 aim (secondary scope pulses, gun dim).
    // 0.22-0.30 muzzle flash.
    // 0.30-0.90 bullet in flight with course kinks.
    // 0.90-0.96 target impact flash.
    // 0.96-1.00 reset.
    const period = 6;
    const phase = (t % period) / period;

    const gun = gunRef.current;
    if (gun) {
      const mat = gun.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.35 + Math.sin(t * 0.6) * 0.05;
      }
    }

    // Primary scope — steady low glow.
    const primaryScope = primaryScopeRef.current;
    if (primaryScope) {
      const mat = primaryScope.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.45 + Math.sin(t * 1.2) * 0.1;
      }
    }

    // Secondary scope — the nano-cam viewfinder. Brighter during
    // aim + flight. This is the signature visual.
    const secondary = secondaryScopeRef.current;
    if (secondary) {
      let k: number;
      if (phase < 0.22) {
        k = 0.5 + phase * 2.0;
      } else if (phase < 0.9) {
        k = 0.95 + Math.sin(t * 3.0) * 0.08;
      } else {
        k = 0.4;
      }
      const mat = secondary.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = k;
      }
    }

    // Analogue stick — flicks during flight at kink moments.
    const stick = stickRef.current;
    if (stick) {
      let tilt = 0;
      let glow = 0.35;
      if (phase >= 0.3 && phase < 0.9) {
        const flightPhase = (phase - 0.3) / 0.6;
        for (const [kp, dy] of kinks) {
          const d = Math.abs(flightPhase - kp);
          if (d < 0.06) {
            tilt = (dy / 0.06) * (1 - d / 0.06) * 1.4;
            glow = 0.9;
          }
        }
      }
      stick.rotation.z = tilt;
      const mat = stick.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = glow;
      }
    }

    // Bullet — travels from muzzle (x=-0.9) to target (x=+1.8).
    const bullet = bulletRef.current;
    if (bullet) {
      if (phase >= 0.3 && phase < 0.9) {
        const flightPhase = (phase - 0.3) / 0.6;
        // Linear x travel; y picks up cumulative kinks before
        // flightPhase, plus a small live wiggle at the current
        // kink.
        const x = -0.9 + flightPhase * 2.7;
        let y = 0.55;
        for (const [kp, dy] of kinks) {
          if (flightPhase >= kp) y += dy;
          else {
            // Smooth into the kink as we approach it.
            const d = kp - flightPhase;
            if (d < 0.08) y += dy * (1 - d / 0.08);
          }
        }
        bullet.position.x = x;
        bullet.position.y = y;
        bullet.position.z = 0;
        bullet.rotation.z = -Math.atan2(
          (kinks[0]?.[1] ?? 0) * 0.1,
          1,
        );
        bullet.visible = true;
      } else {
        bullet.visible = false;
      }
    }

    // Muzzle flash — short burst only during 0.22-0.32.
    const muzzle = muzzleFlashRef.current;
    if (muzzle) {
      if (phase >= 0.22 && phase < 0.32) {
        const k = 1 - (phase - 0.22) / 0.1;
        muzzle.visible = true;
        const mat = muzzle.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = k * 1.8;
        }
        muzzle.scale.setScalar(0.9 + k * 0.4);
      } else {
        muzzle.visible = false;
      }
    }

    // Target — steady dim, flashes on impact (phase 0.88-0.95).
    const target = targetRef.current;
    if (target) {
      let ti = 0.35;
      if (phase >= 0.88 && phase < 0.95) {
        const k = 1 - Math.abs((phase - 0.91) / 0.03);
        ti = 0.35 + k * 1.1;
      }
      const mat = target.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = Math.max(0.25, ti);
      }
    }

    // Aim-line trail — faint dashed line muzzle→target,
    // brighter during aim + flight.
    const trail = trailRef.current;
    if (trail) {
      let ti = 0.08;
      if (phase < 0.22) ti = 0.08 + phase * 0.4;
      else if (phase < 0.9) ti = 0.25;
      const mat = trail.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = ti;
      }
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

      {/* Aim-line — faint rail from muzzle to target. */}
      <mesh
        ref={trailRef}
        position={[0.45, 0.55, 0]}
        frustumCulled={false}
      >
        <boxGeometry args={[2.7, 0.012, 0.012]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.12}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Gun body — long hex lying horizontally. */}
      <mesh
        ref={gunRef}
        position={[-1.15, 0.55, 0]}
        rotation={[0, 0, Math.PI / 2]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.9, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>

      {/* Primary scope — small, stacked on rear of gun. */}
      <mesh
        ref={primaryScopeRef}
        position={[-1.45, 0.88, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.13, 0.13, 0.22, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>

      {/* Secondary (nano-cam viewer) scope — bigger, beside the
          primary. The signature feature. */}
      <mesh
        ref={secondaryScopeRef}
        position={[-0.95, 0.95, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.18, 0.18, 0.3, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.95}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>

      {/* Analogue stick — tiny hex on a pivot, by the trigger. */}
      <mesh
        ref={stickRef}
        position={[-1.7, 0.3, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.06, 0.06, 0.18, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Muzzle flash — cone-adjacent hex at gun end. */}
      <mesh
        ref={muzzleFlashRef}
        position={[-0.85, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
        visible={false}
      >
        <cylinderGeometry args={[0.16, 0.08, 0.18, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.6}
          metalness={0.2}
          roughness={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Bullet — small hex in flight. */}
      <mesh
        ref={bulletRef}
        position={[-0.9, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
        visible={false}
      >
        <cylinderGeometry args={[0.05, 0.05, 0.18, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.1}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>

      {/* Target — hex at the end of the trajectory. */}
      <mesh
        ref={targetRef}
        position={[1.85, 0.55, 0]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.6, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.4}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
