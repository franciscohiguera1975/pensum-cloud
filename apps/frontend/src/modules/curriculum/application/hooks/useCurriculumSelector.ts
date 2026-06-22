import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurriculumSelectorState {
  curriculumId: string;
  curriculumName: string;
  setCurriculum: (id: string, name: string) => void;
  clear: () => void;
}

export const useCurriculumSelector = create<CurriculumSelectorState>()(
  persist(
    (set) => ({
      curriculumId: '',
      curriculumName: '',
      setCurriculum: (id, name) => set({ curriculumId: id, curriculumName: name }),
      clear: () => set({ curriculumId: '', curriculumName: '' }),
    }),
    { name: 'curriculum-selector' },
  ),
);
