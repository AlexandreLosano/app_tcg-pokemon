import type {
  FormStatus,
  StatusFilter,
  Generation,
  Region,
  Binder,
  BinderFilter,
  CollectionStatusFilter,
  FormEntry,
  TcgCardSearchResult,
  SyncSummary,
  CollectionEntryUpdate,
} from '../types';

const BASE = '/api';

// As rotas do backend respondem erro como { error: "mensagem amigável" }. Sem isso, toda
// falha aparecia na UI só como "PUT /collection/1 failed: 409" — sem dizer o quê.
async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === 'string') return body.error;
  } catch {
    // resposta sem corpo JSON válido — usa o fallback
  }
  return fallback;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await errorMessage(res, `GET ${path} failed: ${res.status}`));
  return res.json();
}

async function put<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `PUT ${path} failed: ${res.status}`));
  return res.json();
}

async function patch<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `PATCH ${path} failed: ${res.status}`));
  return res.json();
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await errorMessage(res, `POST ${path} failed: ${res.status}`));
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await errorMessage(res, `DELETE ${path} failed: ${res.status}`));
  return res.json();
}

export const api = {
  generations: {
    list: () => get<Generation[]>('/generations'),
  },
  regions: {
    list: () => get<Region[]>('/regions'),
  },
  binders: {
    list: () => get<Binder[]>('/binders'),
    create: (name: string) => post<Binder>('/binders', { name }),
    rename: (id: number, name: string) => patch<Binder>(`/binders/${id}`, { name }),
    remove: (id: number) => del<{ id: number }>(`/binders/${id}`),
  },
  forms: {
    list: (params: {
      generation_id?: number;
      region_id?: number;
      binder_id?: BinderFilter;
      status?: StatusFilter;
      collection_status?: CollectionStatusFilter;
    }) => {
      const qs = new URLSearchParams();
      if (params.generation_id) qs.set('generation_id', String(params.generation_id));
      if (params.region_id) qs.set('region_id', String(params.region_id));
      if (params.binder_id) qs.set('binder_id', String(params.binder_id));
      if (params.status) qs.set('status', params.status);
      if (params.collection_status) qs.set('collection_status', params.collection_status);
      const q = qs.toString();
      return get<FormEntry[]>(`/forms${q ? '?' + q : ''}`);
    },
    setStatus: (formId: number, status: FormStatus) =>
      patch<{ id: number; status: FormStatus; status_overridden: boolean }>(`/forms/${formId}/status`, {
        status,
      }),
    setDisplayName: (formId: number, displayName: string) =>
      patch<{ id: number; display_name: string; display_name_overridden: boolean }>(
        `/forms/${formId}/display-name`,
        { display_name: displayName }
      ),
    createCustom: (basedOnFormId: number, displayName: string) =>
      post<FormEntry>('/forms/custom', { based_on_form_id: basedOnFormId, display_name: displayName }),
    removeCustom: (formId: number) => del<{ id: number }>(`/forms/${formId}/custom`),
  },
  collection: {
    update: (
      formId: number,
      data: Partial<{
        owned: boolean;
        is_definitive: boolean;
        needs_trade: boolean;
        notes: string | null;
        binder_id: number | null;
        binder_page: number | null;
        binder_slot: number | null;
      }>
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
