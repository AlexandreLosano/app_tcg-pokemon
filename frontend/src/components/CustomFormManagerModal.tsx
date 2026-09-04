import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { FormEntry } from '../types';
import { isCustomForm } from '../utils/formDisplay';

interface Props {
  onClose: () => void;
  onChanged: () => void;
}

export default function CustomFormManagerModal({ onClose, onChanged }: Props) {
  const [allForms, setAllForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [baseForm, setBaseForm] = useState<FormEntry | null>(null);
  const [variantName, setVariantName] = useState('');
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadForms = async () => {
    setLoading(true);
    try {
      const data = await api.forms.list({ status: 'all' });
      setAllForms(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const customForms = useMemo(() => allForms.filter(isCustomForm), [allForms]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allForms
      .filter(f => !isCustomForm(f))
      .filter(
        f => f.display_name.toLowerCase().includes(q) || f.species_display_name.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [allForms, query]);

  const handleCreate = async () => {
    const name = variantName.trim();
    if (!baseForm || !name) return;
    setCreating(true);
    setError(null);
    try {
      await api.forms.createCustom(baseForm.id, name);
      setVariantName('');
      setBaseForm(null);
      setQuery('');
      await loadForms();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (formId: number) => {
    setRemovingId(formId);
    setError(null);
    try {
      await api.forms.removeCustom(formId);
      await loadForms();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <h2>Formas manuais</h2>
        <div className="subtitle">
          Variantes cadastradas à mão (ex: diferença grande entre macho e fêmea) — não vêm do sync da PokéAPI.
        </div>

        <div className="modal-section">
          <h3>Adicionar</h3>
          <div className="search-box">
            <input
              className="search-name-input"
              value={baseForm ? baseForm.display_name : query}
              onChange={e => {
                setBaseForm(null);
                setQuery(e.target.value);
              }}
              placeholder="Buscar Pokémon base (ex: Pyroar)…"
            />
          </div>
          {!baseForm && searchResults.length > 0 && (
            <ul className="binder-list">
              {searchResults.map(f => (
                <li
                  key={f.id}
                  className="binder-list-item binder-list-item-clickable"
                  onClick={() => {
                    setBaseForm(f);
                    setQuery('');
                  }}
                  role="button"
                >
                  <span className="binder-list-name">
                    {f.display_name}{' '}
                    <span className="search-hint">
                      — {f.generation_display_name ?? '—'} · {f.region_display_name ?? '—'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {baseForm && (
            <>
              <div className="search-hint">
                Base: {baseForm.display_name} ({baseForm.generation_display_name ?? '—'} ·{' '}
                {baseForm.region_display_name ?? '—'})
              </div>
              <div className="search-box">
                <input
                  className="search-name-input"
                  value={variantName}
                  onChange={e => setVariantName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder={`Nome da variante (ex: ${baseForm.display_name} Fêmea)…`}
                  autoFocus
                />
                <button className="search-button" onClick={handleCreate} disabled={creating || !variantName.trim()}>
                  {creating ? 'Criando…' : 'Adicionar'}
                </button>
              </div>
            </>
          )}
          {error && <div className="sync-summary error">{error}</div>}
        </div>

        <div className="modal-section">
          <h3>Cadastradas ({customForms.length})</h3>
          {loading && <div className="search-hint">Carregando…</div>}
          {!loading && customForms.length === 0 && (
            <div className="search-hint">Nenhuma forma manual cadastrada ainda.</div>
          )}
          <ul className="binder-list">
            {customForms.map(f => (
              <li key={f.id} className="binder-list-item">
                <span className="binder-list-name">
                  {f.display_name}{' '}
                  <span className="search-hint">
                    — {f.generation_display_name ?? '—'} · {f.region_display_name ?? '—'}
                  </span>
                </span>
                <button className="btn-small danger" disabled={removingId === f.id} onClick={() => handleRemove(f.id)}>
                  {removingId === f.id ? 'Removendo…' : 'Remover'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
