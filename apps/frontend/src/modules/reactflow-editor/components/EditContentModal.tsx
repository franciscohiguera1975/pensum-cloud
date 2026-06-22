import { useState } from 'react';
import { subjectApi } from '@/modules/subject/infrastructure/subject.api';

interface EditContentModalProps {
  subjectId: string;
  subjectName: string;
  description: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditContentModal({
  subjectId,
  subjectName,
  description,
  onClose,
  onSaved,
}: EditContentModalProps) {
  const [text, setText] = useState(() =>
    description
      ? description
          .split(/[;]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .join('\n')
      : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const newDescription =
        text
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
          .join(';') || null;
      await subjectApi.update(subjectId, { description: newDescription });
      onSaved();
      onClose();
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-5 w-[420px] flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{subjectName}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Editar contenidos — un tema por línea</p>
        </div>

        <textarea
          className="min-h-[200px] border rounded p-2.5 text-xs resize-y focus:outline-none focus:ring-1 focus:ring-teal-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Tema 1\nTema 2\nTema 3'}
          autoFocus
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 border rounded text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
