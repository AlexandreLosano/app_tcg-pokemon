import type {
  FormStatus,
  StatusFilter,
  Generation,
  Region,
  FormEntry,
  TcgCardSearchResult,
  SyncSummary,
  CollectionEntryUpdate,
} from '../types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

async function patch<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  generations: {
    list: () => get<Generation[]>('/generations'),
  },
  regions: {
    list: () => get<Region[]>('/regions'),
  },
  forms: {
    list: (params: { generation_id?: number; region_id?: number; status?: StatusFilter }) => {
      const qs = new URLSearchParams();
      if (params.generation_id) qs.set('generation_id', String(params.generation_id));
      if (params.region_id) qs.set('region_id', String(params.region_id));
      if (params.status) qs.set('status', params.status);
      const q = qs.toString();
      return get<FormEntry[]>(`/forms${q ? '?' + q : ''}`);
    },
    setStatus: (formId: number, status: FormStatus) =>
      patch<{ id: number; status: FormStatus; status_overridden: boolean }>(`/forms/${formId}/status`, {
        status,
      }),
  },
  collection: {
    update: (
      formId: number,
      data: Partial<{ owned: boolean; is_definitive: boolean; needs_trade: boolean; notes: string | null }>
    ) => put<CollectionEntryUpdate>(`/collection/${formId}`, data),
    attachCard: (formId: number, card: TcgCardSearchResult) =>
      post<CollectionEntryUpdate>(`/collection/${formId}/attach-card`, card),
    detachCard: (formId: number) => del<CollectionEntryUpdate>(`/collection/${formId}/detach-card`),
  },
  tcgCards: {
    status: () => get<{ configured: boolean }>('/tcg-cards/status'),
    rarities: () => get<string[]>('/tcg-cards/rarities'),
    search: (params: { name?: string; number?: string; rarity?: string }) => {
      const qs = new URLSearchParams();
      if (params.name) qs.set('name', params.name);
      if (params.number) qs.set('number', params.number);
      if (params.rarity) qs.set('rarity', params.rarity);
      return get<TcgCardSearchResult[]>(`/tcg-cards/search?${qs.toString()}`);
    },
  },
  sync: {
    run: () => post<SyncSummary>('/sync/pokemon'),
  },
};
