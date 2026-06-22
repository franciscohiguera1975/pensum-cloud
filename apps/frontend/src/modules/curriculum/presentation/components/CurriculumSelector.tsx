import { useState } from 'react';
import { useCurriculumSelector } from '@/modules/curriculum/application/hooks/useCurriculumSelector';

export function CurriculumSelector() {
  const { curriculumId, curriculumName, setCurriculum } = useCurriculumSelector();
  const [inputId, setInputId] = useState(curriculumId);
  const [inputName, setInputName] = useState(curriculumName);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const id = inputId.trim();
    if (!id) return;
    setCurriculum(id, inputName.trim() || id);
  };

  return (
    <form onSubmit={handleApply} className="flex items-center gap-2">
      <input
        type="text"
        value={inputId}
        onChange={(e) => setInputId(e.target.value)}
        placeholder="Curriculum UUID"
        className="border rounded px-2 py-1 text-xs font-mono w-72 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <input
        type="text"
        value={inputName}
        onChange={(e) => setInputName(e.target.value)}
        placeholder="Nombre (opcional)"
        className="border rounded px-2 py-1 text-xs w-44 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <button
        type="submit"
        className="bg-indigo-600 text-white text-xs rounded px-3 py-1.5 hover:bg-indigo-700 transition-colors"
      >
        Cargar
      </button>
    </form>
  );
}
