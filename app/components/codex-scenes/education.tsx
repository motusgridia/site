// MotusGridia — Education scene.
//
// Slug: education. Canon: grounded.
//
// Visual metaphor: a raised teacher hex at one end of the frame, with
// three curved rows of student hexes fanning out below and behind
// it. The teacher pulses at a slow broadcast rate; the students
// brighten in a delayed cascade as the signal reaches each row.
// Reads as livestream class rather than classroom.
//
// Lands under the codex-scenes/ sibling pattern.

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type * as THREE from "three";

import { canonColour, HexPrism, type CodexCanon } from "./shared";

type Student = {
  position: readonly [number, number, number];
  row: number;
};

export function Education({ canon }: { canon: CodexCanon }) {
  const teacherRef = useRef<THREE.Mesh>(null);
  const studentsRef = useRef<THREE.Group>(null);
  const emissive = canonColour(canon);

  // Three arcs of students in front of the teacher. Each arc has
  // five students; the arc radius increases per row so the rows
  // read as a receding audience.
  const students = useMemo<Student[]>(() => {
    const arr: Student[] = [];
    const rows: number = 3;
    const perRow: number = 5;
    for (let row = 0; row < rows; row++) {
      const radius = 1.6 + row * 0.8;
      const spread = (Math.PI / 3) + row * 0.08; // widens per row
      for (let i = 0; i < perRow; i++) {
        // Centre the arc on +Z (in front of the teacher). Angles
        // evenly distributed across the spread.
        const frac = perRow === 1 ? 0 : i / (perRow - 1);
        const angle =
          Math.PI / 2 - spread / 2 + frac * spread;
        arr.push({
          position: [
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius,
          ] as const,
          row,
        });
      }
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Teacher broadcasts on a slow pulse.
    const teacher = teacherRef.current;
    if (teacher) {
      const pulse = (Math.sin(t * 0.9) + 1) / 2;
      const mat = teacher.material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (mat && "emissiveIntensity" in mat) {
        mat.emissiveIntensity = 0.8 + pulse * 0.7;
      }
    }
    // Students brighten on a per-row delay — same pulse shape, each
    // row shifted a beat later than the one in front of it.
    const st = studentsRef.current;
    if (st) {
      st.children.forEach((child, i) => {
        const student = students[i];
        if (!student) return;
        const phase = student.row * 0.45;
        const pulse = (Math.sin(t * 0.9 - phase) + 1) / 2;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as
          | THREE.MeshStandardMaterial
          | undefined;
        if (mat && "emissiveIntensity" in mat) {
          mat.emissiveIntensity = 0.2 + pulse * 0.5;
        }
      });
    }
  });

  return (
    <group>
      {/* Teacher hex — elevated, behind the audience. The broadcast
          source. */}
      <mesh
        ref={teacherRef}
        position={[0, 0.55, -1.1]}
        rotation={[0, Math.PI / 6, 0]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.55, 0.55, 0.5, 6, 1, false]} />
        <meshStandardMaterial
          color="#0b1030"
          emissive={emissive}
          emissiveIntensity={1.1}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* Students — three arcs of five facing the teacher. Per-row
          delay on the pulse gives a cascade. */}
      <group ref={studentsRef}>
        {students.map((s, i) => (
          <HexPrism
            key={i}
            position={s.position}
            scale={0.24}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        ))}
      </group>

      {/* Base platter */}
      <HexPrism
        position={[0, -0.2, 0.5]}
        radius={3.2}
        depth={0.1}
        emissive={emissive}
        emissiveIntensity={0.08}
      />
    </group>
  );
}
