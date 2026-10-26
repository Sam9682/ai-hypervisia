import api from './api';

// --- Types ---

export type AudienceLevel =
  | 'seconde'
  | 'terminale'
  | 'licence'
  | 'master'
  | 'ingenieur'
  | 'professeur'
  | 'chercheur';

export interface CourseItem {
  name: string;
  display_name: string;
  has_pdf: boolean;
}

export interface CourseListResponse {
  courses: CourseItem[];
  total: number;
}

export interface GenerateCourseRequest {
  course_name: string;
  audience: AudienceLevel;
  ai_provider: 'shai' | 'kiro' | 'openai';
  custom_context?: string;
}

export interface GenerateResponse {
  download_id: string;
  latex_content: string;
  course_name: string;
  audience: string;
  ai_provider: string;
  filename: string;
  expires_at: string;
}

// --- Constants ---

export const AUDIENCE_LABELS: Record<AudienceLevel, string> = {
  seconde: 'Élève de Seconde (15-16 ans, lycée)',
  terminale: 'Élève de Terminale (17-18 ans, lycée)',
  licence: 'Étudiant en Licence (L1-L3, université)',
  master: 'Étudiant en Master Mathématiques',
  ingenieur: 'Élève ingénieur Grande École',
  professeur: 'Professeur des universités',
  chercheur: 'Chercheur en entreprise / laboratoire',
};

export const AI_PROVIDERS = [
  { value: 'shai', label: 'shai (OVH)' },
  { value: 'kiro', label: 'kiro (AWS)' },
  { value: 'openai', label: 'openai (GPT-4)' },
] as const;

// --- API Functions ---

export async function listCourses(): Promise<CourseListResponse> {
  const response = await api.get<CourseListResponse>('/courses/list');
  return response.data;
}

export async function generateCourse(
  request: GenerateCourseRequest
): Promise<GenerateResponse> {
  const response = await api.post<GenerateResponse>('/courses/generate', request);
  return response.data;
}

export function getDownloadUrl(downloadId: string): string {
  const baseURL = api.defaults.baseURL || '';
  return `${baseURL}/courses/download/${downloadId}`;
}

export async function downloadPdf(downloadId: string, filename: string): Promise<void> {
  const url = getDownloadUrl(downloadId);
  const token = localStorage.getItem('access_token');
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}
