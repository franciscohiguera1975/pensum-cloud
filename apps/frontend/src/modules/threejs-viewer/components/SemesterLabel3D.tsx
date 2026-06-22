import { Text } from '@react-three/drei';
import type { SemesterColumn3D } from '../utils/buildScene';
import { CARD_W } from '../utils/buildScene';

interface SemesterLabel3DProps {
  column: SemesterColumn3D;
}

export function SemesterLabel3D({ column }: SemesterLabel3DProps) {
  const label = column.name ?? `Semestre ${column.number}`;

  return (
    <group position={[column.xBase, column.labelY, 0]}>
      {/* Colored pill background */}
      <mesh>
        <boxGeometry args={[CARD_W, 0.52, 0.1]} />
        <meshStandardMaterial color={column.color} roughness={0.45} />
      </mesh>

      {/* Label text */}
      <Text
        position={[0, 0, 0.08]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_W - 0.2}
        textAlign="center"
      >
        {label}
      </Text>
    </group>
  );
}
