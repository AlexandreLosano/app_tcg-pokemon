import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { FormEntry, FormStatus, TcgCardSearchResult } from '../types';

interface Props {
  form: FormEntry;
  onClose: () => void;
  onUpdated: (form: FormEntry) => void;
}

const STATUS_OPTIONS: { value: FormStatus; label: string; description: string }[] = [
  { value: 'visible', label: 'Visível', description: 'Conta como slot ativo da Living Dex.' },
  {
    value: 'no_need',
    label: 'Sem necessidade',
    description: 'Existe carta, mas não é prioridade comprar agora.',
  },
  {
    value: 'card_unavailable',
    label: 'Sem carta ainda',
    description: 'Quero ter, mas ainda não existe carta impressa para essa forma.',
  },
  { value: 'hidden', label: 'Oculta', description: 'Não conta como slot separado (ex: forma cosmética).' },
];

// A Pokémon TCG API tem dezenas de raridades distintas (Common, Rare Holo GX, Rare Secret, ...).
// Agrupamos visualmente com um símbolo, mas o filtro em si usa a string exata da API.
function raritySymbol(rarity: string): string {
  const r = rarity.toLowerCase();
  if (r.includes('promo')) return '🎟';
  if (r === 'common') return '●';
  if (r === 'uncommon') return '◆';
  if (r === 'rare') return '★';
  return '✦'; // holo, ex, gx, v, vmax, secret, ultra, rainbow, amazing, shiny, prime, ace, legend...
}

export default function FormDetailPanel({ form, onClose, onUpdated }: Props) {
  const [notes, setNotes] = useState(form.notes ?? '');
  const [tcgConfigured, setTcgConfigured] = useState<boolean | null>(null);
  const [query, setQuery] = useState(form.display_name);
  const [numberQuery, setNumberQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [rarities, setRarities] = useState<string[]>([]);
  const [results, setResults] = useState<TcgCardSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setNotes(form.notes ?? '');
    setQuery(form.display_name);
    setNumberQuery('');
    setRarityFilter('');
    setResults([]);
    setHasSearched(false);
  }, [form.id]);

  useEffect(() => {
    api.tcgCards.status().then(s => {
      setTcgConfigured(s.configured);
      if (s.configured) api.tcgCards.rarities().then(setRarities).catch(() => setRarities([]));
    });
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

  const handleStatusChange = async (status: FormStatus) => {
    const result = await api.forms.setStatus(form.id, status);
    onUpdated({ ...form, status: result.status, status_overridden: result.status_overridden });
  };

  const handleSearch = async () => {
    if (!query.trim() && !numberQuery.trim() && !rarityFilter) return;
    setSearching(true);
    setSearchError(null);
    try {
      const cards = await api.tcgCards.search({
        name: query.trim(),
        number: numberQuery.trim(),
        rarity: rarityFilter,
      });
      setResults(cards);
      setHasSearched(true);
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
          <h3>
            Status na Living Dex
            {form.status_overridden && <span className="badge">ajustado manualmente</span>}
          </h3>
          <div className="status-options">
            {STATUS_OPTIONS.map(opt => (
              <label key={opt.value} className="status-option">
                <input
                  type="radio"
                  name="form-status"
                  checked={form.status === opt.value}
                  onChange={() => handleStatusChange(opt.value)}
                />
                <div>
                  <div className="status-option-label">{opt.label}</div>
                  <div className="status-option-desc">{opt.description}</div>
                </div>
              </label>
            ))}
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
                {form.tcg_card_rarity ? ` · ${raritySymbol(form.tcg_card_rarity)} ${form.tcg_card_rarity}` : ''}
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
                  placeholder="Nome da carta…"
                />
                <input
                  className="search-number-input"
                  value={numberQuery}
                  onChange={e => setNumberQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Número (ex: 58)"
                />
                <button
                  className="btn-small"
                  onClick={handleSearch}
                  disabled={searching || (!query.trim() && !numberQuery.trim() && !rarityFilter)}
                >
                  {searching ? 'Buscando…' : 'Buscar'}
                </button>
              </div>
              {rarities.length > 0 && (
                <div className="search-filter-row">
                  <label>
                    Raridade
                    <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)}>
                      <option value="">Todas</option>
                      {rarities.map(r => (
                        <option key={r} value={r}>
                          {raritySymbol(r)} {r}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <div className="search-hint">
                Não achou a carta que você tem? Apague o nome e busque só pelo número impresso na carta, filtre
                por raridade, ou combine os três para achar o print exato.
              </div>
              {searchError && <div className="sync-summary error">{searchError}</div>}
              {!searching && hasSearched && results.length === 0 && !searchError && (
                <div className="search-hint">
                  Nenhum resultado. Tente um nome mais curto, só o número, ou confira a grafia.
                </div>
              )}
              <div className="search-results">
                {results.map(card => (
                  <div key={card.id} className="search-result" onClick={() => handleAttach(card)}>
                    <img src={card.images.small} alt={card.name} />
                    {card.rarity && <span className="rarity-tag">{raritySymbol(card.rarity)}</span>} {card.name} —{' '}
                    {card.set?.name} #{card.number}
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
