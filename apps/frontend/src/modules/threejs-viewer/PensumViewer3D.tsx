import { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { useQueryClient } from '@tanstack/react-query';
import { SubjectCard3D } from './components/SubjectCard3D';
import { SemesterLabel3D } from './components/SemesterLabel3D';
import { PrerequisiteEdge3D } from './components/PrerequisiteEdge3D';
import { useViewerScene } from './hooks/useViewerScene';
import { buildScene } from './utils/buildScene';
import { SubjectModal } from '@/shared/components/SubjectModal';
import { SemesterModal } from '@/shared/components/SemesterModal';
import type { SubjectNode3D, SemesterColumn3D } from './utils/buildScene';
import type { SemesterResponse, SubjectResponse, PrerequisiteResponse } from '@/shared/types/api.types';

// ── Shared scene tooltip ───────────────────────────────────────────────────────
function HoverTooltip({ node }: { node: SubjectNode3D }) {
  return (
    <div className="absolute top-16 left-4 z-10 bg-white rounded-xl shadow-xl p-4 text-sm border border-gray-100 max-w-xs pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: node.color }}
        />
        <span className="font-bold text-gray-800">{node.code}</span>
        <span className="text-xs text-gray-400">· S.{node.semesterNumber}</span>
      </div>
      <p className="text-gray-700 font-medium leading-tight mb-2">{node.name}</p>
      <div className="grid grid-cols-3 gap-1 text-xs text-center">
        <div className="bg-gray-50 rounded px-1 py-1">
          <div className="text-gray-800 font-semibold">{node.credits}</div>
          <div className="text-gray-400">créditos</div>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1">
          <div className="text-gray-800 font-semibold">{node.hoursTheory}h</div>
          <div className="text-gray-400">docente</div>
        </div>
        <div className="bg-gray-50 rounded px-1 py-1">
          <div className="text-gray-800 font-semibold">{node.hoursPractice}h</div>
          <div className="text-gray-400">práctica</div>
        </div>
      </div>
      {node.description && (
        <p className="text-xs text-gray-400 mt-2 italic line-clamp-2">{node.description}</p>
      )}
    </div>
  );
}

// ── Shared 3D scene content ────────────────────────────────────────────────────
function SceneContent({
  nodes,
  edges,
  semesterColumns,
  centerX,
  onHover,
  onClick,
}: {
  nodes: SubjectNode3D[];
  edges: ReturnType<typeof buildScene>['edges'];
  semesterColumns: SemesterColumn3D[];
  centerX: number;
  onHover: (n: SubjectNode3D | null) => void;
  onClick?: (n: SubjectNode3D) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[centerX, 15, 10]} intensity={1.1} castShadow />
      <pointLight position={[centerX, -8, 8]} intensity={0.4} />

      <Grid
        args={[120, 120]}
        cellSize={1}
        cellThickness={0.4}
        cellColor="#e5e7eb"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#d1d5db"
        fadeDistance={60}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
        position={[centerX, -GRID_Y, 0]}
      />

      {/* Semester column labels */}
      {semesterColumns.map((col) => (
        <SemesterLabel3D key={col.id} column={col} />
      ))}

      {/* Prerequisite lines */}
      {edges.map((edge) => (
        <PrerequisiteEdge3D key={edge.id} edge={edge} />
      ))}

      {/* Subject cards */}
      {nodes.map((node) => (
        <SubjectCard3D
          key={node.id}
          node={node}
          onHover={onHover}
          onClick={onClick}
        />
      ))}
    </>
  );
}

// Vertical offset so grid is below cards
const GRID_Y = 1.5;

// ── Compute horizontal center of the scene ────────────────────────────────────
function sceneCenter(semesterColumns: SemesterColumn3D[]): number {
  if (semesterColumns.length === 0) return 0;
  return semesterColumns[semesterColumns.length - 1].xBase / 2;
}

// ── Editable viewer (authenticated, with CRUD) ────────────────────────────────
interface PensumViewer3DProps {
  curriculumId: string;
  curriculumName: string;
}

export function PensumViewer3D({ curriculumId, curriculumName }: PensumViewer3DProps) {
  const queryClient = useQueryClient();
  const [hovered, setHovered] = useState<SubjectNode3D | null>(null);
  const [editTarget, setEditTarget] = useState<SubjectNode3D | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const { nodes, edges, semesterColumns, semesters, isLoading } = useViewerScene(curriculumId);

  const centerX = useMemo(() => sceneCenter(semesterColumns), [semesterColumns]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['semesters', curriculumId] });
    queryClient.invalidateQueries({ queryKey: ['subjects-all'] });
    queryClient.invalidateQueries({ queryKey: ['prerequisites-all'] });
  };

  const nextSemesterNumber = (semesters[semesters.length - 1]?.number ?? 0) + 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Cargando visualización 3D…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b bg-white flex items-center gap-3 shrink-0">
        <h2 className="font-semibold text-gray-800 text-sm">{curriculumName}</h2>
        <span className="text-xs text-gray-400">Clic en tarjeta para editar · Arrastra para rotar</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowAddSubject(true)}
            className="text-xs px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
          >
            + Materia
          </button>
          <button
            onClick={() => setShowAddSemester(true)}
            className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            + Semestre
          </button>
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && !editTarget && <HoverTooltip node={hovered} />}

      <div className="flex-1">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[centerX, 6, 22]} fov={58} />
          <OrbitControls
            target={[centerX, 0, 0]}
            enablePan
            enableZoom
            enableRotate
            minDistance={3}
            maxDistance={80}
            dampingFactor={0.06}
            enableDamping
          />
          <Suspense fallback={null}>
            <Environment preset="city" />
            <SceneContent
              nodes={nodes}
              edges={edges}
              semesterColumns={semesterColumns}
              centerX={centerX}
              onHover={setHovered}
              onClick={setEditTarget}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Edit subject modal */}
      {editTarget && (
        <SubjectModal
          mode="edit"
          subject={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { invalidateAll(); setEditTarget(null); }}
          onDeleted={() => { invalidateAll(); setEditTarget(null); }}
        />
      )}

      {/* Add subject modal */}
      {showAddSubject && (
        <SubjectModal
          mode="create"
          semesters={semesters}
          onClose={() => setShowAddSubject(false)}
          onSaved={() => { invalidateAll(); setShowAddSubject(false); }}
        />
      )}

      {/* Add semester modal */}
      {showAddSemester && (
        <SemesterModal
          mode="create"
          curriculumId={curriculumId}
          nextNumber={nextSemesterNumber}
          onClose={() => setShowAddSemester(false)}
          onSaved={() => { invalidateAll(); setShowAddSemester(false); }}
        />
      )}
    </div>
  );
}

// ── Read-only public viewer (accepts raw data, no auth) ───────────────────────
interface PensumViewer3DPublicProps {
  semesters: SemesterResponse[];
  subjects: SubjectResponse[];
  prerequisites: PrerequisiteResponse[];
}

export function PensumViewer3DPublic({
  semesters,
  subjects,
  prerequisites,
}: PensumViewer3DPublicProps) {
  const [hovered, setHovered] = useState<SubjectNode3D | null>(null);

  const { nodes, edges, semesterColumns } = useMemo(
    () => buildScene(semesters, subjects, prerequisites),
    [semesters, subjects, prerequisites],
  );

  const centerX = useMemo(() => sceneCenter(semesterColumns), [semesterColumns]);

  return (
    <div className="relative w-full h-full">
      {hovered && <HoverTooltip node={hovered} />}

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[centerX, 6, 22]} fov={58} />
        <OrbitControls
          target={[centerX, 0, 0]}
          enablePan
          enableZoom
          enableRotate
          minDistance={3}
          maxDistance={80}
          dampingFactor={0.06}
          enableDamping
        />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <SceneContent
            nodes={nodes}
            edges={edges}
            semesterColumns={semesterColumns}
            centerX={centerX}
            onHover={setHovered}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
