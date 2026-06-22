import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  publicApi,
  type PublicUniversity,
  type PublicFaculty,
  type PublicCareer,
  type PublicCurriculum,
  type PublicCurriculumFull,
} from '@/modules/public/infrastructure/public.api';
import { buildFlowGraph } from '@/modules/reactflow-editor/utils/buildFlowGraph';
import { SubjectNode } from '@/modules/reactflow-editor/components/SubjectNode';
import { SemesterHeaderNode } from '@/modules/reactflow-editor/components/SemesterHeaderNode';
import {
  PensumGridViewer,
  type GridSemester,
  type GridSubject,
} from '@/modules/reactflow-editor/components/PensumGridViewer';
import { PensumViewer3DPublic } from '@/modules/threejs-viewer/PensumViewer3D';
import type { SemesterResponse, SubjectResponse, PrerequisiteResponse } from '@/shared/types/api.types';
import { Link } from 'react-router-dom';

// ── Adapt public data → PensumGridViewer format ───────────────────────────────
function adaptToGrid(curriculum: PublicCurriculumFull): {
  semesters: GridSemester[];
  subjects: GridSubject[];
} {
  const semesters: GridSemester[] = curriculum.semesters.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name ?? null,
  }));

  const subjects: GridSubject[] = curriculum.semesters.flatMap((s) =>
    s.subjects.map((sub) => ({
      id: sub.id,
      semesterId: s.id,
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
      hoursTheory: sub.hoursTheory,
      hoursPractice: sub.hoursPractice,
      description: sub.description,
    })),
  );

  return { semesters, subjects };
}

// ── Adapt public data → React Flow format ────────────────────────────────────
function adaptToFlowGraph(curriculum: PublicCurriculumFull) {
  const semesters: SemesterResponse[] = curriculum.semesters.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name ?? null,
    curriculumId: curriculum.id,
    tenantId: '',
    createdAt: '',
    updatedAt: '',
  }));

  const subjects: SubjectResponse[] = curriculum.semesters.flatMap((s) =>
    s.subjects.map((sub) => ({
      id: sub.id,
      semesterId: s.id,
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
      hoursTheory: sub.hoursTheory,
      hoursPractice: sub.hoursPractice,
      description: sub.description,
      tenantId: '',
      createdAt: '',
      updatedAt: '',
    })),
  );

  const prerequisites: PrerequisiteResponse[] = curriculum.semesters.flatMap((s) =>
    s.subjects.flatMap((sub) =>
      sub.prerequisiteIds.map((reqId) => ({
        subjectId: sub.id,
        requiresId: reqId,
        tenantId: '',
        createdAt: '',
      })),
    ),
  );

  return buildFlowGraph(semesters, subjects, prerequisites);
}

// ── Adapt public data → 3D scene format ───────────────────────────────────────
function adaptToScene(curriculum: PublicCurriculumFull): {
  semesters: SemesterResponse[];
  subjects: SubjectResponse[];
  prerequisites: PrerequisiteResponse[];
} {
  const semesters: SemesterResponse[] = curriculum.semesters.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name ?? null,
    curriculumId: curriculum.id,
    tenantId: '',
    createdAt: '',
    updatedAt: '',
  }));

  const subjects: SubjectResponse[] = curriculum.semesters.flatMap((s) =>
    s.subjects.map((sub) => ({
      id: sub.id,
      semesterId: s.id,
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
      hoursTheory: sub.hoursTheory,
      hoursPractice: sub.hoursPractice,
      description: sub.description,
      tenantId: '',
      createdAt: '',
      updatedAt: '',
    })),
  );

  const prerequisites: PrerequisiteResponse[] = curriculum.semesters.flatMap((s) =>
    s.subjects.flatMap((sub) =>
      sub.prerequisiteIds.map((reqId) => ({
        subjectId: sub.id,
        requiresId: reqId,
        tenantId: '',
        createdAt: '',
      })),
    ),
  );

  return { semesters, subjects, prerequisites };
}

const nodeTypes: NodeTypes = {
  subject: SubjectNode as NodeTypes[string],
  semesterHeader: SemesterHeaderNode as NodeTypes[string],
};

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Borrador', ACTIVE: 'Activo', ARCHIVED: 'Archivado' };
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-yellow-100 text-yellow-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

// ── Selectable card ───────────────────────────────────────────────────────────
function SelectCard({
  title,
  subtitle,
  badge,
  isSelected,
  onClick,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  isSelected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-lg border px-4 py-3 transition-all hover:shadow-sm ${
        isSelected ? 'border-indigo-500 ring-1 ring-indigo-300' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 font-medium text-gray-800 text-sm">{title}</span>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[badge] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABELS[badge] ?? badge}
          </span>
        )}
        <span className="text-gray-300 text-sm">›</span>
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </button>
  );
}

// ── Pensum Viewer (public, read-only) ─────────────────────────────────────────
type PublicView = 'grid' | 'flow' | '3d';

function PublicPensumViewer({ slug, curriculum }: { slug: string; curriculum: PublicCurriculum }) {
  const [view, setView] = useState<PublicView>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Exit fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-curriculum-full', slug, curriculum.id],
    queryFn: () => publicApi.getCurriculumFull(slug, curriculum.id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Cargando pensum...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        No se pudo cargar el pensum.
      </div>
    );
  }

  const { nodes, edges } = adaptToFlowGraph(data);
  const { semesters: gridSems, subjects: gridSubs } = adaptToGrid(data);
  const scene3D = adaptToScene(data);
  const totalSubjects = data.semesters.reduce((acc, s) => acc + s.subjects.length, 0);

  const viewerHeight = view === '3d' ? 560 : view === 'flow' ? 520 : 580;

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-white'
          : 'mt-4 border border-gray-200 rounded-xl overflow-hidden'
      }
    >
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b flex items-center gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <span className="font-semibold text-gray-800 text-sm">{data.name}</span>
            <span className="text-xs text-gray-400 ml-2">v{data.version}</span>
          </div>
          {/* Tab toggle */}
          <div className="flex rounded-md overflow-hidden border text-xs shrink-0">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1 transition-colors ${view === 'grid' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              📋 Contenidos
            </button>
            <button
              onClick={() => setView('flow')}
              className={`px-3 py-1 transition-colors ${view === 'flow' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              🔗 Prerrequisitos
            </button>
            <button
              onClick={() => setView('3d')}
              className={`px-3 py-1 transition-colors ${view === '3d' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              🌐 Vista 3D
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[data.status] ?? ''}`}>
            {STATUS_LABELS[data.status] ?? data.status}
          </span>
          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-base leading-none"
          >
            {isFullscreen ? '⊠' : '⛶'}
          </button>
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div
          className={isFullscreen ? 'flex-1 overflow-y-auto' : ''}
          style={isFullscreen ? undefined : { height: `${viewerHeight}px`, overflowY: 'auto' }}
        >
          <PensumGridViewer semesters={gridSems} subjects={gridSubs} />
        </div>
      )}

      {/* React Flow prerequisites view */}
      {view === 'flow' && (
        <>
          <div
            className={isFullscreen ? 'flex-1' : ''}
            style={isFullscreen ? undefined : { height: `${viewerHeight}px` }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              zoomOnDoubleClick={false}
            >
              <Background />
              <Controls showInteractive={false} />
              <MiniMap zoomable pannable />
            </ReactFlow>
          </div>
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 border-t shrink-0">
            Vista de solo lectura · {data.semesters.length} semestres · {totalSubjects} materias
          </div>
        </>
      )}

      {/* 3D view */}
      {view === '3d' && (
        <>
          <div
            className={isFullscreen ? 'flex-1' : ''}
            style={isFullscreen ? undefined : { height: `${viewerHeight}px` }}
          >
            <PensumViewer3DPublic
              semesters={scene3D.semesters}
              subjects={scene3D.subjects}
              prerequisites={scene3D.prerequisites}
            />
          </div>
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 border-t shrink-0">
            Vista 3D de solo lectura · Arrastra para rotar · Scroll para zoom · {totalSubjects} materias
          </div>
        </>
      )}
    </div>
  );
}

// ── Column list ───────────────────────────────────────────────────────────────
function Column<T extends { id: string; name: string }>({
  title,
  items,
  isLoading,
  selected,
  onSelect,
  renderSubtitle,
  renderBadge,
}: {
  title: string;
  items: T[];
  isLoading: boolean;
  selected: T | null;
  onSelect: (item: T) => void;
  renderSubtitle?: (item: T) => string | undefined;
  renderBadge?: (item: T) => string | undefined;
}) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      {isLoading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Sin resultados</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <SelectCard
              key={item.id}
              title={item.name}
              subtitle={renderSubtitle?.(item)}
              badge={renderBadge?.(item)}
              isSelected={selected?.id === item.id}
              onClick={() => onSelect(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Public Page ──────────────────────────────────────────────────────────
export function PublicPage() {
  const [inputSlug, setInputSlug] = useState('demo-university');
  const [activeSlug, setActiveSlug] = useState('');

  const [selUniversity, setSelUniversity] = useState<PublicUniversity | null>(null);
  const [selFaculty, setSelFaculty] = useState<PublicFaculty | null>(null);
  const [selCareer, setSelCareer] = useState<PublicCareer | null>(null);
  const [selCurriculum, setSelCurriculum] = useState<PublicCurriculum | null>(null);

  const reset = () => {
    setSelUniversity(null);
    setSelFaculty(null);
    setSelCareer(null);
    setSelCurriculum(null);
  };

  const { data: universities = [], isLoading: loadingUnis, isError: errorUnis } = useQuery({
    queryKey: ['public-universities', activeSlug],
    queryFn: () => publicApi.getUniversities(activeSlug),
    enabled: !!activeSlug,
  });

  const { data: faculties = [], isLoading: loadingFacs } = useQuery({
    queryKey: ['public-faculties', activeSlug, selUniversity?.id],
    queryFn: () => publicApi.getFaculties(activeSlug, selUniversity!.id),
    enabled: !!activeSlug && !!selUniversity,
  });

  const { data: careers = [], isLoading: loadingCareers } = useQuery({
    queryKey: ['public-careers', activeSlug, selFaculty?.id],
    queryFn: () => publicApi.getCareers(activeSlug, selFaculty!.id),
    enabled: !!activeSlug && !!selFaculty,
  });

  const { data: curricula = [], isLoading: loadingCurricula } = useQuery({
    queryKey: ['public-curricula', activeSlug, selCareer?.id],
    queryFn: () => publicApi.getCurricula(activeSlug, selCareer!.id),
    enabled: !!activeSlug && !!selCareer,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = inputSlug.trim();
    if (!slug) return;
    reset();
    setActiveSlug(slug);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-base tracking-tight">Pensum Cloud</p>
          <p className="text-xs text-indigo-300">Consulta pública de pensums</p>
        </div>
        <Link
          to="/login"
          className="text-xs text-indigo-300 hover:text-white transition-colors border border-indigo-700 hover:border-indigo-400 px-3 py-1.5 rounded-lg"
        >
          Ingresar →
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tenant selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Consulta de Pensums</h1>
          <p className="text-sm text-gray-500 mb-4">
            Ingresa el identificador de tu institución para ver los pensums disponibles.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={inputSlug}
              onChange={(e) => setInputSlug(e.target.value)}
              placeholder="Ej: demo-university"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Buscar
            </button>
          </form>
          {errorUnis && (
            <p className="text-xs text-red-500 mt-2">
              Institución no encontrada. Verifica el identificador.
            </p>
          )}
        </div>

        {/* Hierarchical selector */}
        {activeSlug && (
          <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
            <Column
              title="Universidades"
              items={universities}
              isLoading={loadingUnis}
              selected={selUniversity}
              onSelect={(u) => { setSelUniversity(u); setSelFaculty(null); setSelCareer(null); setSelCurriculum(null); }}
              renderSubtitle={(u) => u.country ?? u.code}
            />

            {selUniversity && (
              <Column
                title="Facultades"
                items={faculties}
                isLoading={loadingFacs}
                selected={selFaculty}
                onSelect={(f) => { setSelFaculty(f); setSelCareer(null); setSelCurriculum(null); }}
                renderSubtitle={(f) => f.code}
              />
            )}

            {selFaculty && (
              <Column
                title="Carreras"
                items={careers}
                isLoading={loadingCareers}
                selected={selCareer}
                onSelect={(c) => { setSelCareer(c); setSelCurriculum(null); }}
                renderSubtitle={(c) => c.description ?? c.code}
              />
            )}

            {selCareer && (
              <Column
                title="Pensums"
                items={curricula}
                isLoading={loadingCurricula}
                selected={selCurriculum}
                onSelect={(c) => setSelCurriculum(c)}
                renderSubtitle={(c) => `Versión ${c.version}`}
                renderBadge={(c) => c.status}
              />
            )}
          </div>
        )}

        {/* Pensum viewer */}
        {selCurriculum && activeSlug && (
          <PublicPensumViewer slug={activeSlug} curriculum={selCurriculum} />
        )}

        {/* Empty state */}
        {!activeSlug && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏛️</p>
            <p className="text-sm">Ingresa el identificador de tu institución para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
