// MotusGridia — Tether Upgrade Tech scene.
//
// Slug: tether-upgrade-tech. Canon: fiction-c1.
//
// Visual metaphor: a row of four devices lined up in front of a
// single feed tower. One injector tether arcs from the tower to
// whichever device is currently being upgraded, moving along the
// line in sequence. Devices flash blue-white when hit — before dim,
// after bright — so the line reads as a progressive upgrade queue.
// The tower itself pulses steadily, feeding the line from the Grid
// main.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Device = {
  position: readonly [number, number, number];
};

export function TetherUpgradeTech({ canon }: { canon: CodexCanon }) {
  const towerRef = useRef<THREE.Mesh>(null);
  const devicesRef = useRef<THREE.Group>(null);
  const tetherRef = useRef<THREE.Mesh>(null);
  const emissive = canonColour(canon);

  // Four devices in a row in front of the tower, slightly raised so
  // they sit on the base platter rather than under it.
  const devices = useMemo<Device[]>(() => {
    const arr: Device[] = [];
    const startX = -1.35;
    const stride = 0.9;
    for (let i = 0; i < 4; i++) {
      arr.push({
        position: [startX + i * stride, 0.2, 1.1] as const,
      });
    }
    return arr;
  }, []);

  // The tower position — behind the devices, centred on x.
  const towerPos: [number, number, number] = [0, 0.6, -0.7];

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Tower — steady pulse, feeding the line. Higher floor than the
    // devices so it reads as the power source.
    const tower = towerRef.current;
    if (tower) {
      const pulse = (Math.sin(t * 1.2) + 1) / 2;
      const mat = tower.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.7 + pulse * 0.4;
      }
    }

    // Sequence — one device is "active" at a time. Cycle 1.2s per
    // device. Already-upgraded devices stay bright; not-yet stay dim.
    const cyclePeriod = 1.2;
    const activeIdx = Math.floor(t / cyclePeriod) % 4;
    const phaseInCycle = (t % cyclePeriod) / cyclePeriod;

    const dg = devicesRef.current;
    if (dg) {
      dg.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (!mat || !("emissiveIntensity" in mat)) return;
        const completed =
          i < activeIdx ||
          // Once the whole queue finishes a full cycle, all four
          // read as upgraded briefly, then the sequence restarts.
          (activeIdx === 3 && phaseInCycle > 0.85 && i <= 3);
        if (i === activeIdx) {
          // Flash peak at mid-phase, fade off either side.
          const intensity =
            0.2 + Math.max(0, Math.sin(phaseInCycle * Math.PI)) * 1.3;
          mat.emissiveIntensity = intensity;
        } else if (completed) {
          mat.emissiveIntensity = 0.75;
        } else {
          mat.emissiveIntensity = 0.15;
        }
      });
    }

    // Tether — a thin box-geometry from the tower to the active
    // device. Rotates to point at whichever device is being upgraded.
    const tether = tetherRef.current;
    if (tether) {
      const target = devices[activeIdx];
      if (target) {
        const midX = (towerPos[0] + target.position[0]) / 2;
        const midZ = (towerPos[2] + target.position[2]) / 2;
        const midY = (towerPos[1] + target.position[1]) / 2;
        tether.position.x = midX;
        tether.position.y = midY;
        tether.position.z = midZ;
        const dx = target.position[0] - towerPos[0];
        const dz = target.position[2] - towerPos[2];
        const length = Math.hypot(dx, dz);
        tether.scale.x = length;
        tether.rotation.y = -Math.atan2(dz, dx);
        const mat = tether.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          // Pulse fast while firing, fade between fires.
          const firePulse = Math.max(
            0,
            Math.sin(phaseInCycle * Math.PI),
          );
          mat.emissiveIntensity = 0.3 + firePulse * 1.4;
        }
      }
    }
  });

  return (
    <group>
      {/* Feed tower — tall, behind the devices, fed from the Grid
          main. */}
      <mesh
        ref={towerRef}
        position={towerPos}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.38, 0.5, 1.4, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.7}
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>

      {/* Devices — four in a row, getting upgraded in sequence. */}
      <group ref={devicesRef}>
        {devices.map((d, i) => (
          <HexPrism
            key={i}
            position={d.position}
            radius={0.28}
            depth={0.12}
            emissive={emissive}
            emissiveIntensity={0.15}
          />
        ))}
      </group>

      {/* Tether — the injector arc. */}
      <mesh
        ref={tetherRef}
        position={[0, 0.4, 0]}
        rotation={[0, 0, 0]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 0.025, 0.025]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Base platter. */}
      <HexPrism
        position={[0, -0.05, 0]}
        radius={3}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
