const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  residents: {
    list:   ()           => request<unknown[]>('/residents'),
    get:    (id: number) => request<unknown>(`/residents/${id}`),
    create: (body: unknown) => request<{ id: number }>('/residents', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: unknown) => request<{ success: boolean }>(`/residents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  logs: {
    meal:      (body: unknown) => request<{ id: number }>('/logs/meal',      { method: 'POST', body: JSON.stringify(body) }),
    sleep:     (body: unknown) => request<{ id: number }>('/logs/sleep',     { method: 'POST', body: JSON.stringify(body) }),
    mood:      (body: unknown) => request<{ id: number }>('/logs/mood',      { method: 'POST', body: JSON.stringify(body) }),
    medication:(body: unknown) => request<{ id: number }>('/logs/medication',{ method: 'POST', body: JSON.stringify(body) }),
    activity:  (body: unknown) => request<{ id: number }>('/logs/activity',  { method: 'POST', body: JSON.stringify(body) }),
    incident:  (body: unknown) => request<{ id: number }>('/logs/incident',  { method: 'POST', body: JSON.stringify(body) }),
    history:   (residentId: number, days = 7) => request<unknown>(`/logs/${residentId}?days=${days}`),
  },
  alerts: {
    list:        (params?: { status?: string; facility_id?: number }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return request<unknown[]>(`/alerts${qs ? `?${qs}` : ''}`);
    },
    create:      (body: unknown) => request<{ id: number }>('/alerts', { method: 'POST', body: JSON.stringify(body) }),
    acknowledge: (id: number, staff_id?: number) => request<{ success: boolean }>(`/alerts/${id}/acknowledge`, { method: 'PUT', body: JSON.stringify({ staff_id }) }),
    resolve:     (id: number, staff_id?: number, resolution_notes?: string) => request<{ success: boolean }>(`/alerts/${id}/resolve`, { method: 'PUT', body: JSON.stringify({ staff_id, resolution_notes }) }),
  },
  staff: {
    list: () => request<unknown[]>('/staff'),
  },
};
