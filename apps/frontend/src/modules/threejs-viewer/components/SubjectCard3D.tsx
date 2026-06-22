import { useState } from 'react';
import { Text } from '@react-three/drei';
import type { SubjectNode3D } from '../utils/buildScene';
import { CARD_W, CARD_H } from '../utils/buildScene';

const CARD_D = 0.18;
const HEADER_H = 0.48;

interface SubjectCard3DProps {
  node: SubjectNode3D;
  onHover?: (node: SubjectNode3D | null) => void;
  onClick?: (node: SubjectNode3D) => void;
}

export function SubjectCard3D({ node, onHover, onClick }: SubjectCard3DProps) {
  const [hovered, setHovered] = useState(false);

  const handlers = {
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onClick?.(node);
    },
    onPointerEnter: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(true);
      onHover?.(node);
      document.body.style.cursor = 'pointer';
    },
    onPointerLeave: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(false);
      onHover?.(null);
      document.body.style.cursor = 'default';
    },
  };

  return (
    <group position={node.position} scale={hovered ? 1.04 : 1}>
      {/* ── Card body ─────────────────────────────────────────────────── */}
      <mesh {...handlers} castShadow>
        <boxGeometry args={[CARD_W, CARD_H, CARD_D]} />
        <meshStandardMaterial
          color={hovered ? '#f0fdf4' : '#ffffff'}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* ── Colored header strip (front face) ─────────────────────────── */}
      <mesh position={[0, CARD_H / 2 - HEADER_H / 2, CARD_D / 2 + 0.002]}>
        <planeGeometry args={[CARD_W, HEADER_H]} />
        <meshStandardMaterial color={node.color} roughness={0.4} />
      </mesh>

      {/* ── Left accent bar (semester color) ──────────────────────────── */}
      <mesh position={[-CARD_W / 2 + 0.025, -HEADER_H / 2, CARD_D / 2 + 0.002]}>
        <planeGeometry args={[0.05, CARD_H - HEADER_H]} />
        <meshStandardMaterial color={node.color} roughness={0.4} />
      </mesh>

      {/* ── Subject code (inside header) ──────────────────────────────── */}
      <Text
        position={[0, CARD_H / 2 - HEADER_H / 2, CARD_D / 2 + 0.015]}
        fontSize={0.19}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
        maxWidth={CARD_W - 0.3}
      >
        {node.code}
      </Text>

      {/* ── Subject name ──────────────────────────────────────────────── */}
      <Text
        position={[0.07, CARD_H / 2 - HEADER_H - (CARD_H - HEADER_H) / 2 + 0.3, CARD_D / 2 + 0.015]}
        fontSize={0.145}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_W - 0.35}
        textAlign="center"
        lineHeight={1.25}
      >
        {node.name}
      </Text>

      {/* ── Footer: credits · hours ────────────────────────────────────── */}
      <Text
        position={[0, -CARD_H / 2 + 0.22, CARD_D / 2 + 0.015]}
        fontSize={0.115}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        {`${node.credits} cr  ·  TD ${node.hoursTheory}h  PE ${node.hoursPractice}h`}
      </Text>
    </group>
  );
}
