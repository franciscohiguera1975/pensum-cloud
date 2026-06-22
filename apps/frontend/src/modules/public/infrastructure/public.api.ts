import axios from 'axios';

// No auth headers — public endpoints only need the tenant slug in the URL
const publicClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
}

export interface PublicUniversity {
  id: string;
  name: string;
  code: string;
  country: string | null;
  website: string | null;
}

export interface PublicFaculty {
  id: string;
  name: string;
  code: string;
}

export interface PublicCareer {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export interface PublicCurriculum {
  id: string;
  name: string;
  version: string;
  status: string;
  description: string | null;
}

export interface PublicSubject {
  id: string;
  name: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  description: string | null;
  prerequisiteIds: string[];
}

export interface PublicSemester {
  id: string;
  number: number;
  name: string | null;
  subjects: PublicSubject[];
}

export interface PublicCurriculumFull extends PublicCurriculum {
  semesters: PublicSemester[];
}

const base = (slug: string) => `/public/${encodeURIComponent(slug)}`;

export const publicApi = {
  getTenants: async (): Promise<PublicTenant[]> => {
    const { data } = await publicClient.get<PublicTenant[]>('/public/tenants');
    return data;
  },
  getUniversities: async (slug: string): Promise<PublicUniversity[]> => {
    const { data } = await publicClient.get<PublicUniversity[]>(`${base(slug)}/universities`);
    return data;
  },
  getFaculties: async (slug: string, universityId: string): Promise<PublicFaculty[]> => {
    const { data } = await publicClient.get<PublicFaculty[]>(`${base(slug)}/universities/${universityId}/faculties`);
    return data;
  },
  getCareers: async (slug: string, facultyId: string): Promise<PublicCareer[]> => {
    const { data } = await publicClient.get<PublicCareer[]>(`${base(slug)}/faculties/${facultyId}/careers`);
    return data;
  },
  getCurricula: async (slug: string, careerId: string): Promise<PublicCurriculum[]> => {
    const { data } = await publicClient.get<PublicCurriculum[]>(`${base(slug)}/careers/${careerId}/curricula`);
    return data;
  },
  getCurriculumFull: async (slug: string, curriculumId: string): Promise<PublicCurriculumFull> => {
    const { data } = await publicClient.get<PublicCurriculumFull>(`${base(slug)}/curricula/${curriculumId}`);
    return data;
  },
};
