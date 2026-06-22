import { useMemo } from 'react';
import * as THREE from 'three';
import type { PrerequisiteEdge3D as EdgeData } from '../utils/buildScene';

interface PrerequisiteEdge3DProps {
  edge: EdgeData;
}

export function PrerequisiteEdge3D({ edge }: PrerequisiteEdge3DProps) {
  const points = useMemo(
    () => [new THREE.Vector3(...edge.from), new THREE.Vector3(...edge.to)],
    [edge.from, edge.to],
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <line geometry={geometry} {...({} as any)}>
      <lineBasicMaterial color="#6366f1" opacity={0.6} transparent linewidth={2} />
    </line>
  );
}
