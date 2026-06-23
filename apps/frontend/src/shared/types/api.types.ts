export interface UniversityResponse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  country: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FacultyResponse {
  id: string;
  tenantId: string;
  universityId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareerResponse {
  id: string;
  tenantId: string;
  facultyId: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumResponse {
  id: string;
  tenantId: string;
  careerId: string;
  version: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface SemesterResponse {
  id: string;
  tenantId: string;
  curriculumId: string;
  number: number;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectResponse {
  id: string;
  tenantId: string;
  semesterId: string;
  name: string;
  code: string;
  credits: number;
  hoursTheory: number;
  hoursPractice: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrerequisiteResponse {
  subjectId: string;
  requiresId: string;
  tenantId: string;
  createdAt: string;
}

export interface UserResponse {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  universityIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}
