import api from './api';

export interface AppSettings {
  pdf_ttl_hours: number;
  docs_shared_enabled: boolean;
}

export interface UpdateSettingsRequest {
  pdf_ttl_hours?: number;
  docs_shared_enabled?: boolean;
}

export async function getSettings(): Promise<AppSettings> {
  const response = await api.get<AppSettings>('/settings');
  return response.data;
}

export async function updateSettings(data: UpdateSettingsRequest): Promise<AppSettings> {
  const response = await api.put<AppSettings>('/settings', data);
  return response.data;
}
