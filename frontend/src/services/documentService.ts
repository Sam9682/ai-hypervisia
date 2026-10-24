import api from './api';

export interface DocumentItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  category: string;
  access_level: string;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
  total: number;
}

export interface GeneratedPdfItem {
  download_id: string;
  filename: string;
  course_name: string;
  audience: string;
  created_at: string;
  expires_at: string;
}

export interface GeneratedPdfListResponse {
  pdfs: GeneratedPdfItem[];
  total: number;
}

export async function listDocuments(): Promise<DocumentListResponse> {
  const response = await api.get<DocumentListResponse>('/documents');
  return response.data;
}

export async function listGeneratedPdfs(): Promise<GeneratedPdfListResponse> {
  const response = await api.get<GeneratedPdfListResponse>('/courses/generated');
  return response.data;
}

export function getDocumentDownloadUrl(documentId: string): string {
  const baseURL = api.defaults.baseURL || '';
  return `${baseURL}/documents/${documentId}/download`;
}

export function getGeneratedPdfDownloadUrl(downloadId: string): string {
  const baseURL = api.defaults.baseURL || '';
  return `${baseURL}/courses/download/${downloadId}`;
}

export async function downloadFile(url: string, filename: string): Promise<void> {
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
