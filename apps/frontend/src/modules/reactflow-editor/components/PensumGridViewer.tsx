import { useState, useRef, useCallback, useEffect } from 'react';
import type { SemesterResponse, SubjectResponse } from '@/shared/types/api.types';
import { SubjectModal } from '@/shared/components/SubjectModal';
import { SemesterModal } from '@/shared/components/SemesterModal';
import { subjectApi } from '@/modules/subject/infrastructure/subject.api';

// ── Generic interfaces so both private and public callers can use this ────────
export interface GridSemester {
  id: string;
  number: number;
  name: string | null;
}

export interface GridSubject {
  id: string;
  semesterId: string;
  name: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  description: string | null;
  position?: number;
}

interface PensumGridViewerProps {
  curriculumId?: string;
  semesters: GridSemester[];
  subjects: GridSubject[];
  editable?: boolean;
  onRefresh?: () => void;
}

// ── Adapters for existing response types ──────────────────────────────────────
export function toGridSemesters(semesters: SemesterResponse[]): GridSemester[] {
  return semesters.map((s) => ({ id: s.id, number: s.number, name: s.name }));
}

export function toGridSubjects(subjects: SubjectResponse[]): GridSubject[] {
  return subjects.map((s) => ({
    id: s.id,
    semesterId: s.semesterId,
    name: s.name,
    code: s.code,
    credits: s.credits,
    hoursTheory: s.hoursTheory,
    hoursPractice: s.hoursPractice,
    description: s.description,
    position: (s as GridSubject).position ?? 0,
  }));
}

// ── Hours footer ──────────────────────────────────────────────────────────────
function HoursFooter({
  credits,
  hoursTheory,
  hoursPractice,
}: {
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
}) {
  const cd = hoursTheory;
  const pe = hoursPractice;
  const ta = credits * 32;
  const th = cd + pe + ta;

  return (
    <div className="px-3 py-1.5 bg-teal-50 border-t border-teal-100 shrink-0">
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-teal-800">
        <span><span className="font-semibold">Horas CD:</span> {cd}</span>
        <span><span className="font-semibold">Horas PE:</span> {pe}</span>
        <span><span className="font-semibold">Horas TA:</span> {ta}</span>
        <span><span className="font-semibold">TH:</span> {th}</span>
      </div>
    </div>
  );
}

// ── Drop indicator line ───────────────────────────────────────────────────────
function DropIndicator() {
  return (
    <div className="relative h-0.5 my-0.5 mx-1">
      <div className="absolute inset-0 bg-blue-400 rounded-full" />
      <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-blue-400 rounded-full" />
    </div>
  );
}

// ── Individual subject card ───────────────────────────────────────────────────
function SubjectCard({
  subject,
  editable,
  isDragging,
  onEdit,
  onDragStart,
  onDragEnd,
}: {
  subject: GridSubject;
  editable?: boolean;
  isDragging?: boolean;
  onEdit?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const topics = (subject.description
    ? subject.description.split(/[\n;]/).map((t) => t.trim()).filter(Boolean)
    : []
  ).slice(0, 4);

  return (
    <div
      data-subject-card
      draggable={editable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`rounded-lg overflow-hidden border border-teal-200 shadow-sm flex flex-col transition-opacity h-[210px] ${
        editable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'opacity-30' : 'opacity-100'}`}
    >
      {/* Teal header — fixed height */}
      <div className="bg-teal-500 px-3 h-12 shrink-0 flex items-center justify-between gap-1">
        <p className="font-semibold text-white text-xs leading-snug line-clamp-2">{subject.name}</p>
        {editable && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            title="Editar materia"
            className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors text-sm"
          >
            ✎
          </button>
        )}
      </div>

      {/* Content — flex-1, exactly 4 bullets */}
      <div className="px-3 py-2.5 bg-white flex-1 overflow-hidden">
        {topics.length > 0 ? (
          <ul className="space-y-1">
            {topics.map((topic, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-gray-700 leading-snug">
                <span className="text-teal-500 shrink-0 font-bold">•</span>
                <span className="line-clamp-1">{topic}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-gray-300 italic">
            {editable ? (
              <button
                onClick={onEdit}
                className="text-teal-400 hover:text-teal-600 hover:underline transition-colors not-italic"
              >
                + Agregar contenidos
              </button>
            ) : (
              'Sin contenidos definidos'
            )}
          </div>
        )}
      </div>

      <HoursFooter
        credits={subject.credits}
        hoursTheory={subject.hoursTheory}
        hoursPractice={subject.hoursPractice}
      />
    </div>
  );
}

// ── Modal state ───────────────────────────────────────────────────────────────
type SubjectModalState =
  | { type: 'edit'; subject: GridSubject }
  | { type: 'create'; semesterId: string }
  | null;

type SemesterModalState =
  | { type: 'edit'; semester: GridSemester }
  | { type: 'create' }
  | null;

// ── Zoom helpers ──────────────────────────────────────────────────────────────
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;
const clampZoom = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));
const roundZoom = (v: number) => Math.round(v * 10) / 10;

// ── Zoom controls bar ─────────────────────────────────────────────────────────
function ZoomControls({
  zoom,
  onZoom,
  onFit,
  onReset,
}: {
  zoom: number;
  onZoom: (z: number) => void;
  onFit: () => void;
  onReset: () => void;
}) {
  const btnClass =
    'w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors text-sm leading-none disabled:opacity-30 disabled:cursor-default';
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-0.5 bg-white rounded-lg border border-gray-200 shadow-sm px-1.5 py-1">
      <button
        className={btnClass}
        onClick={() => onZoom(clampZoom(roundZoom(zoom - ZOOM_STEP)))}
        disabled={zoom <= MIN_ZOOM}
        title="Alejar (−)"
      >
        −
      </button>
      <span className="text-xs text-gray-600 w-10 text-center select-none tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <button
        className={btnClass}
        onClick={() => onZoom(clampZoom(roundZoom(zoom + ZOOM_STEP)))}
        disabled={zoom >= MAX_ZOOM}
        title="Acercar (+)"
      >
        +
      </button>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <button
        className={btnClass}
        onClick={onFit}
        title="Ajustar todo a la pantalla"
      >
        ⊡
      </button>
      <button
        className={`${btnClass} text-xs`}
        onClick={onReset}
        title="Restablecer zoom (100%)"
      >
        ↺
      </button>
    </div>
  );
}

// ── Main grid viewer ──────────────────────────────────────────────────────────
export function PensumGridViewer({
  curriculumId,
  semesters,
  subjects,
  editable,
  onRefresh,
}: PensumGridViewerProps) {
  const sorted = [...semesters].sort((a, b) => a.number - b.number);
  const [subjectModal, setSubjectModal] = useState<SubjectModalState>(null);
  const [semesterModal, setSemesterModal] = useState<SemesterModalState>(null);
  const [zoom, setZoom] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // dragOver tracks which semester + insert-index the cursor is hovering
  const [dragOver, setDragOver] = useState<{ semesterId: string; index: number } | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss drag error after 4 seconds
  useEffect(() => {
    if (!dragError) return;
    const t = setTimeout(() => setDragError(null), 4000);
    return () => clearTimeout(t);
  }, [dragError]);

  // Ctrl+wheel to zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => clampZoom(roundZoom(z + delta)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const fitToView = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const cw = containerRef.current.clientWidth - 32;
    const ch = containerRef.current.clientHeight - 32;
    const naturalW = contentRef.current.scrollWidth / zoom;
    const naturalH = contentRef.current.scrollHeight / zoom;
    if (naturalW === 0 || naturalH === 0) return;
    const fit = Math.min(cw / naturalW, ch / naturalH, 1);
    setZoom(clampZoom(roundZoom(fit)));
  }, [zoom]);

  // Calculate insert index within a semester column based on mouse Y position
  const calcInsertIndex = useCallback(
    (e: React.DragEvent<HTMLDivElement>, semesterId: string): number => {
      const cards = e.currentTarget.querySelectorAll('[data-subject-card]');
      // exclude the dragging card from count
      const semSubjects = subjects.filter(
        (s) => s.semesterId === semesterId && s.id !== draggingId,
      );
      let insertIndex = semSubjects.length;
      let cardIdx = 0;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        // skip the dragging card element
        if (card.style.opacity === '0.3' || card.classList.contains('opacity-30')) continue;
        const rect = card.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          insertIndex = cardIdx;
          break;
        }
        cardIdx++;
      }
      return insertIndex;
    },
    [draggingId, subjects],
  );

  const handleDrop = useCallback(
    async (targetSemesterId: string) => {
      if (!draggingId || dragOver === null) {
        setDraggingId(null);
        setDragOver(null);
        return;
      }
      const id = draggingId;
      const position = dragOver.index;
      setDraggingId(null);
      setDragOver(null);
      try {
        await subjectApi.reorder(id, targetSemesterId, position);
        onRefresh?.();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'No se pudo mover la materia';
        setDragError(msg);
      }
    },
    [draggingId, dragOver, onRefresh],
  );

  if (sorted.length === 0 && !editable) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No hay semestres disponibles.
      </div>
    );
  }

  const nextSemesterNumber = (sorted[sorted.length - 1]?.number ?? 0) + 1;

  return (
    <>
      {/* Outer container */}
      <div ref={containerRef} className="h-full overflow-auto bg-gray-50 relative">

        {/* Error toast */}
        {dragError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span>⚠ {dragError}</span>
            <button onClick={() => setDragError(null)} className="ml-1 opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Scaleable content */}
        <div
          ref={contentRef}
          className="p-6 min-w-max"
          style={{ zoom } as React.CSSProperties}
        >
          {/* ── Columns layout (flex) ── */}
          <div className="flex gap-5 items-start">
            {sorted.map((sem) => {
              const semSubjects = subjects
                .filter((s) => s.semesterId === sem.id)
                .sort((a, b) => {
                  const pa = a.position ?? 0;
                  const pb = b.position ?? 0;
                  return pa !== pb ? pa - pb : a.code.localeCompare(b.code);
                });
              const isDropTarget = dragOver?.semesterId === sem.id;

              return (
                <div
                  key={sem.id}
                  style={{ width: 256, flexShrink: 0 }}
                  className={`flex flex-col gap-2 rounded-xl p-2 transition-colors duration-150 ${
                    isDropTarget
                      ? 'bg-blue-50 outline outline-2 outline-blue-300'
                      : 'bg-transparent'
                  }`}
                  onDragOver={(e) => {
                    if (!draggingId) return;
                    e.preventDefault();
                    const index = calcInsertIndex(e, sem.id);
                    setDragOver((prev) =>
                      prev?.semesterId === sem.id && prev.index === index
                        ? prev
                        : { semesterId: sem.id, index },
                    );
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOver(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(sem.id);
                  }}
                >
                  {/* Semester number circle */}
                  <div className="flex justify-center mb-1">
                    <button
                      onClick={() => editable && setSemesterModal({ type: 'edit', semester: sem })}
                      title={editable ? 'Editar semestre' : undefined}
                      className={`w-14 h-14 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md select-none ${editable ? 'hover:bg-teal-600 transition-colors cursor-pointer' : ''}`}
                    >
                      {sem.number}
                    </button>
                  </div>
                  {sem.name && (
                    <p className="text-center text-xs text-gray-500 font-medium -mt-1 mb-1">{sem.name}</p>
                  )}

                  {/* Subject cards with drop indicators */}
                  {semSubjects.map((sub, i) => (
                    <div key={sub.id}>
                      {/* Drop indicator BEFORE this card */}
                      {isDropTarget && dragOver!.index === i && draggingId !== sub.id && (
                        <DropIndicator />
                      )}
                      <SubjectCard
                        subject={sub}
                        editable={editable}
                        isDragging={draggingId === sub.id}
                        onEdit={() => setSubjectModal({ type: 'edit', subject: sub })}
                        onDragStart={() => setDraggingId(sub.id)}
                        onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                      />
                    </div>
                  ))}

                  {/* Drop indicator AFTER last card */}
                  {isDropTarget && dragOver!.index >= semSubjects.filter((s) => s.id !== draggingId).length && (
                    <DropIndicator />
                  )}

                  {/* Empty column drop hint */}
                  {isDropTarget && semSubjects.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center text-blue-400 text-xs">
                      Soltar aquí
                    </div>
                  )}

                  {/* Add subject button */}
                  {editable && (
                    <button
                      onClick={() => setSubjectModal({ type: 'create', semesterId: sem.id })}
                      title="Agregar materia"
                      className="h-9 border-2 border-dashed border-teal-200 rounded-lg text-teal-400 text-xs hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center gap-1 mt-1"
                    >
                      + Agregar materia
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add semester column */}
            {editable && (
              <div style={{ width: 256, flexShrink: 0 }} className="flex flex-col items-center pt-2">
                <button
                  onClick={() => setSemesterModal({ type: 'create' })}
                  title="Agregar semestre"
                  className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 text-gray-400 flex items-center justify-center text-2xl hover:border-teal-400 hover:text-teal-500 transition-colors"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Zoom controls (absolute, bottom-right) */}
        <ZoomControls
          zoom={zoom}
          onZoom={setZoom}
          onFit={fitToView}
          onReset={() => setZoom(1)}
        />
      </div>

      {/* ── Subject modal (create / edit) ── */}
      {subjectModal?.type === 'edit' && (
        <SubjectModal
          mode="edit"
          subject={subjectModal.subject}
          onClose={() => setSubjectModal(null)}
          onSaved={() => { onRefresh?.(); setSubjectModal(null); }}
          onDeleted={() => { onRefresh?.(); setSubjectModal(null); }}
        />
      )}
      {subjectModal?.type === 'create' && (
        <SubjectModal
          mode="create"
          semesterId={subjectModal.semesterId}
          semesters={sorted}
          onClose={() => setSubjectModal(null)}
          onSaved={() => { onRefresh?.(); setSubjectModal(null); }}
        />
      )}

      {/* ── Semester modal (create / edit) ── */}
      {semesterModal?.type === 'edit' && (
        <SemesterModal
          mode="edit"
          semester={semesterModal.semester}
          onClose={() => setSemesterModal(null)}
          onSaved={() => { onRefresh?.(); setSemesterModal(null); }}
          onDeleted={() => { onRefresh?.(); setSemesterModal(null); }}
        />
      )}
      {semesterModal?.type === 'create' && (
        <SemesterModal
          mode="create"
          curriculumId={curriculumId}
          nextNumber={nextSemesterNumber}
          onClose={() => setSemesterModal(null)}
          onSaved={() => { onRefresh?.(); setSemesterModal(null); }}
        />
      )}
    </>
  );
}
