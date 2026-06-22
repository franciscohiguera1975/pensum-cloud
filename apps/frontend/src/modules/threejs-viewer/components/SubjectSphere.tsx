import { useState, useRef } from 'react';
import { Text } from '@react-three/drei';
import type { Mesh } from 'three';
import type { SubjectNode3D } from '../utils/buildScene';

interface SubjectSphereProps {
  node: SubjectNode3D;
  onHover?: (node: SubjectNode3D | null) => void;
  onClick?: (node: SubjectNode3D) => void;
}

export function SubjectSphere({ node, onHover, onClick }: SubjectSphereProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const radius = 0.4 + node.credits * 0.08;

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={() => onClick?.(node)}
        onPointerEnter={() => {
          setHovered(true);
          onHover?.(node);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover?.(null);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered ? 0.4 : 0.1}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      <Text
        position={[0, radius + 0.35, 0]}
        fontSize={0.25}
        color="#1f2937"
        anchorX="center"
        anchorY="bottom"
        maxWidth={3}
      >
        {node.code}
      </Text>
    </group>
  );
}
