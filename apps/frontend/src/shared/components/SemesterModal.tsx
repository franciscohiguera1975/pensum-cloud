import { useState } from 'react';
import { semesterApi } from '@/modules/semester/infrastructure/semester.api';
import type { SemesterResponse } from '@/shared/types/api.types';

interface SemesterData {
  id: string;
  number: number;
  name: string | null;
}

interface SemesterModalProps {
  mode: 'create' | 'edit';
  curriculumId?: string;  // required for create mode
  semester?: SemesterData;   // required for edit mode
  nextNumber?: number;        // auto-fill for create mode
  onClose: () => void;
  onSaved: (saved: SemesterResponse) => void;
  onDeleted?: () => void;
}

export function SemesterModal({
  mode,
  curriculumId,
  semester,
  nextNumber,
  onClose,
  onSaved,
  onDeleted,
}: SemesterModalProps) {
  const [number, setNumber] = useState(semester?.number ?? nextNumber ?? 1);
  const [name, setName] = useState(semester?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let saved: SemesterResponse;
      if (mode === 'edit' && semester) {
        saved = await semesterApi.update(semester.id, { name: name.trim() || undefined });
      } else {
        if (!curriculumId) { setError('Sin currículum seleccionado'); setSaving(false); return; }
        saved = await semesterApi.create(curriculumId, {
          number,
          name: name.trim() || undefined,
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
      await semesterApi.remove(semester!.id);
      onDeleted?.();
    } catch {
      setError('No se puede eliminar (¿tiene materias?)');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[360px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-700 px-5 py-4 rounded-t-xl flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">
            {mode === 'create' ? 'Nuevo Semestre' : `Semestre ${semester?.number}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">
            ×
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Number (create only) */}
          {mode === 'create' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Número</label>
              <input
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
                className="border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Nombre <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Ej: Fundamentos Científicos"
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

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
              {deleting ? 'Eliminando…' : confirmDelete ? '¿Confirmar?' : 'Eliminar'}
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
