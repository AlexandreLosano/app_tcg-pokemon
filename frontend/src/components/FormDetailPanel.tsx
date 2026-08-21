import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { FormEntry, TcgCardSearchResult } from '../types';

interface Props {
  form: FormEntry;
  onClose: () => void;
  onUpdated: (form: FormEntry) => void;
}

export default function FormDetailPanel({ form, onClose, onUpdated }: Props) {
  const [notes, setNotes] = useState(form.notes ?? '');
  const [tcgConfigured, setTcgConfigured] = useState<boolean | null>(null);
  const [query, setQuery] = useState(form.display_name);
  const [results, setResults] = useState<TcgCardSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(form.notes ?? '');
    setQuery(form.display_name);
    setResults([]);
  }, [form.id]);

  useEffect(() => {
    api.tcgCards.status().then(s => setTcgConfigured(s.configured));
  }, []);

  const updateCollection = async (patch: Partial<{ owned: boolean; is_definitive: boolean; needs_trade: boolean }>) => {
    const updated = await api.collection.update(form.id, patch);
    onUpdated({
      ...form,
      owned: updated.owned,
      is_definitive: updated.is_definitive,
      needs_trade: updated.needs_trade,
      notes: updated.notes,
    });
  };

  const handleNotesBlur = async () => {
    if (notes === (form.notes ?? '')) return;
    const updated = await api.collection.update(form.id, { notes });
    onUpdated({ ...form, notes: updated.notes });
  };

  const handleEligibilityToggle = async () => {
    const result = await api.forms.setEligibility(form.id, !form.living_dex_eligible);
    onUpdated({
      ...form,
      living_dex_eligible: result.living_dex_eligible,
      living_dex_eligible_overridden: result.living_dex_eligible_overridden,
    });
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const cards = await api.tcgCards.search(query.trim());
      setResults(cards);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const handleAttach = async (card: TcgCardSearchResult) => {
    const updated = await api.collection.attachCard(form.id, card);
    onUpdated({
      ...form,
      owned: updated.owned,
      is_definitive: updated.is_definitive,
      needs_trade: updated.needs_trade,
      notes: updated.notes,
      tcg_card_id: updated.tcg_card_id,
      tcg_card_name: card.name,
      tcg_card_set_name: card.set?.name ?? null,
      tcg_card_number: card.number ?? null,
      tcg_card_rarity: card.rarity ?? null,
      tcg_card_image_small_url: card.images.small,
      tcg_card_image_large_url: card.images.large ?? null,
    });
  };

  const handleDetach = async () => {
    const updated = await api.collection.detachCard(form.id);
    onUpdated({
      ...form,
      owned: updated.owned,
      is_definitive: updated.is_definitive,
      needs_trade: updated.needs_trade,
      notes: updated.notes,
      tcg_card_id: null,
      tcg_card_name: null,
      tcg_card_set_name: null,
      tcg_card_number: null,
      tcg_card_rarity: null,
      tcg_card_image_small_url: null,
      tcg_card_image_large_url: null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
        <h2>{form.display_name}</h2>
        <div className="subtitle">
          {form.generation_display_name ?? 'Sem geração'} · {form.region_display_name ?? 'Sem região'}
        </div>

        <div className="modal-section">
          <h3>Coleção</h3>
          <div className="toggle-row">
            <input
              type="checkbox"
              checked={form.owned}
              onChange={e => updateCollection({ owned: e.target.checked })}
            />
            Tenho a carta
          </div>
          <div className="toggle-row">
            <input
              type="checkbox"
              checked={form.is_definitive}
              disabled={!form.owned}
              onChange={e => updateCollection({ is_definitive: e.target.checked })}
            />
            Carta definitiva (não pretendo trocar)
          </div>
          <div className="toggle-row">
            <input
              type="checkbox"
              checked={form.needs_trade}
              disabled={!form.owned}
              onChange={e => updateCollection({ needs_trade: e.target.checked })}
            />
            Precisa de troca
          </div>
        </div>

        <div className="modal-section">
          <h3>Notas</h3>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Ex: tenho em duplicidade, procurando versão holo, etc."
          />
        </div>

        <div className="modal-section">
          <h3>Elegibilidade na Living Dex</h3>
          <div className="toggle-row">
            <input type="checkbox" checked={form.living_dex_eligible} onChange={handleEligibilityToggle} />
            Contar esta forma como slot separado
            {form.living_dex_eligible_overridden && <span className="badge">ajustado manualmente</span>}
          </div>
        </div>

        <div className="modal-section">
          <h3>Carta anexada</h3>
          {form.tcg_card_id ? (
            <div className="attached-card">
              {form.tcg_card_image_small_url && <img src={form.tcg_card_image_small_url} alt={form.tcg_card_name ?? ''} />}
              <div className="details">
                <strong>{form.tcg_card_name}</strong>
                {form.tcg_card_set_name} · #{form.tcg_card_number}
                {form.tcg_card_rarity ? ` · ${form.tcg_card_rarity}` : ''}
              </div>
              <button className="btn-small danger" onClick={handleDetach}>
                Remover
              </button>
            </div>
          ) : tcgConfigured === false ? (
            <div className="not-configured-note">
              Busca de cartas desabilitada — configure POKEMON_TCG_API_KEY no .env para habilitar.
            </div>
          ) : (
            <>
              <div className="search-box">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Buscar carta por nome…"
                />
                <button className="btn-small" onClick={handleSearch} disabled={searching}>
                  {searching ? 'Buscando…' : 'Buscar'}
                </button>
              </div>
              {searchError && <div className="sync-summary error">{searchError}</div>}
              <div className="search-results">
                {results.map(card => (
                  <div key={card.id} className="search-result" onClick={() => handleAttach(card)}>
                    <img src={card.images.small} alt={card.name} />
                    {card.name} — {card.set?.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
