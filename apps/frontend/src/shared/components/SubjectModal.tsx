import { useState } from 'react';
import { subjectApi } from '@/modules/subject/infrastructure/subject.api';
import type { SubjectResponse } from '@/shared/types/api.types';

interface SemesterOption {
  id: string;
  number: number;
  name: string | null;
}

interface SubjectData {
  id: string;
  name: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  description: string | null;
}

interface SubjectModalProps {
  mode: 'create' | 'edit';
  subject?: SubjectData;
  semesterId?: string;          // pre-selected (create mode from column "+")
  semesters?: SemesterOption[]; // dropdown when no semesterId
  onClose: () => void;
  onSaved: (saved: SubjectResponse) => void;
  onDeleted?: () => void;
}

export function SubjectModal({
  mode,
  subject,
  semesterId,
  semesters,
  onClose,
  onSaved,
  onDeleted,
}: SubjectModalProps) {
  const [name, setName] = useState(subject?.name ?? '');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState(subject?.credits ?? 3);
  const [hoursTheory, setHoursTheory] = useState(subject?.hoursTheory ?? 48);
  const [hoursPractice, setHoursPractice] = useState(subject?.hoursPractice ?? 0);
  const [description, setDescription] = useState(() =>
    subject?.description
      ? subject.description.split(';').map((t) => t.trim()).filter(Boolean).join('\n')
      : '',
  );
  const [selectedSemId, setSelectedSemId] = useState(semesterId ?? semesters?.[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ta = credits * 32;
  const th = hoursTheory + hoursPractice + ta;

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    setError(null);
    try {
      const desc =
        description.split('\n').map((t) => t.trim()).filter(Boolean).join(';') || null;
      let saved: SubjectResponse;
      if (mode === 'edit' && subject) {
        saved = await subjectApi.update(subject.id, {
          name: name.trim(),
          credits,
          hoursTheory,
          hoursPractice,
          description: desc,
        });
      } else {
        if (!code.trim()) { setError('El código es obligatorio'); setSaving(false); return; }
        const sid = selectedSemId;
        if (!sid) { setError('Selecciona un semestre'); setSaving(false); return; }
        saved = await subjectApi.create(sid, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          credits,
          hoursTheory,
          hoursPractice,
          description: desc,
        });
      }
      onSaved(saved);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await subjectApi.remove(subject!.id);
      onDeleted?.();
    } catch {
      setError('Error al eliminar');
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-teal-500 px-5 py-4 rounded-t-xl flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white text-sm">
              {mode === 'create' ? 'Nueva Materia' : 'Editar Materia'}
            </h3>
            {subject && (
              <p className="text-teal-100 text-xs mt-0.5 font-mono">{subject.code}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white text-lg leading-none mt-0.5"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Semester selector (create only, multiple semesters) */}
          {mode === 'create' && !semesterId && semesters && semesters.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Semestre</label>
              <select
                value={selectedSemId}
                onChange={(e) => setSelectedSemId(e.target.value)}
                className="border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    Semestre {s.number}{s.name ? ` — ${s.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ej: Cálculo Diferencial e Integral"
              autoFocus
            />
          </div>

          {/* Code (create only) */}
          {mode === 'create' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Código <span className="text-red-400">*</span>
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="border rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Ej: MAT-101"
                maxLength={20}
              />
            </div>
          )}

          {/* Credits + Hours */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Créditos</label>
              <input
                type="number"
                min={1}
                max={10}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Horas CD</label>
              <input
                type="number"
                min={0}
                value={hoursTheory}
                onChange={(e) => setHoursTheory(Number(e.target.value))}
                className="border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Horas PE</label>
              <input
                type="number"
                min={0}
                value={hoursPractice}
                onChange={(e) => setHoursPractice(Number(e.target.value))}
                className="border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Auto-computed hours */}
          <div className="flex gap-5 px-3 py-2 bg-teal-50 rounded border border-teal-100 text-xs text-teal-800">
            <span><span className="font-semibold">TA:</span> {ta}h</span>
            <span><span className="font-semibold">TH:</span> {th}h</span>
            <span className="text-teal-400 text-xs">(TA = créditos × 32h)</span>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Contenidos{' '}
              <span className="text-gray-400 font-normal">(un tema por línea)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] border rounded px-3 py-2 text-xs resize-y focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder={'Tema 1\nTema 2\nTema 3'}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center gap-2">
          {mode === 'edit' && onDeleted && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                confirmDelete
                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                  : 'text-red-500 border-red-200 hover:bg-red-50'
              }`}
            >
              {deleting ? 'Eliminando…' : confirmDelete ? '¿Confirmar eliminación?' : 'Eliminar'}
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 border rounded text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-4 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
