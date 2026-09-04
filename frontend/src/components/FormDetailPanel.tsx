import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Binder, FormEntry, FormStatus, TcgCardSearchResult } from '../types';

interface Props {
  form: FormEntry;
  binders: Binder[];
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

// crypto.randomUUID() exige contexto seguro (HTTPS ou localhost) — acessando o app por IP na
// rede local, por exemplo, ele não existe. Gera um id só com Math.random/Date.now, sem depender da Crypto API.
function generateManualCardId(): string {
  return `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function FormDetailPanel({ form, binders, onClose, onUpdated }: Props) {
  const [notes, setNotes] = useState(form.notes ?? '');
  const [nameDraft, setNameDraft] = useState(form.display_name);
  const [statusDraft, setStatusDraft] = useState<FormStatus>(form.status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [tcgConfigured, setTcgConfigured] = useState<boolean | null>(null);
  const [query, setQuery] = useState(form.display_name);
  const [numberQuery, setNumberQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [rarities, setRarities] = useState<string[]>([]);
  const [results, setResults] = useState<TcgCardSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualSet, setManualSet] = useState('');
  const [manualNumber, setManualNumber] = useState('');
  const [manualRarity, setManualRarity] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [attachingManual, setAttachingManual] = useState(false);
  const [pageDraft, setPageDraft] = useState(form.binder_page != null ? String(form.binder_page) : '');
  const [slotDraft, setSlotDraft] = useState(form.binder_slot != null ? String(form.binder_slot) : '');
  const [positionError, setPositionError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(form.notes ?? '');
    setQuery(form.display_name);
    setNumberQuery('');
    setRarityFilter('');
    setResults([]);
    setHasSearched(false);
    setManualMode(false);
    setManualName('');
    setManualSet('');
    setManualNumber('');
    setManualRarity('');
    setManualImageUrl('');
    setManualError(null);
  }, [form.id]);

  useEffect(() => {
    setNameDraft(form.display_name);
  }, [form.id, form.display_name]);

  useEffect(() => {
    setStatusDraft(form.status);
  }, [form.id, form.status]);

  useEffect(() => {
    setPageDraft(form.binder_page != null ? String(form.binder_page) : '');
    setSlotDraft(form.binder_slot != null ? String(form.binder_slot) : '');
    setPositionError(null);
  }, [form.id, form.binder_id, form.binder_page, form.binder_slot]);

  useEffect(() => {
    api.tcgCards.status().then(s => {
      setTcgConfigured(s.configured);
      if (s.configured) api.tcgCards.rarities().then(setRarities).catch(() => setRarities([]));
    });
  }, []);

  const updateCollection = async (
    patch: Partial<{
      owned: boolean;
      is_definitive: boolean;
      needs_trade: boolean;
      binder_id: number | null;
      binder_page: number | null;
      binder_slot: number | null;
    }>
  ) => {
    const updated = await api.collection.update(form.id, patch);
    const binderName = updated.binder_id != null ? binders.find(b => b.id === updated.binder_id)?.name ?? null : null;
    onUpdated({
      ...form,
      owned: updated.owned,
      is_definitive: updated.is_definitive,
      needs_trade: updated.needs_trade,
      notes: updated.notes,
      binder_id: updated.binder_id,
      binder_name: binderName,
      binder_page: updated.binder_page,
      binder_slot: updated.binder_slot,
    });
  };

  const handlePositionBlur = async () => {
    const page = pageDraft.trim() ? Number(pageDraft) : null;
    const slot = slotDraft.trim() ? Number(slotDraft) : null;
    if (page === form.binder_page && slot === form.binder_slot) return;
    if (slot !== null && (slot < 1 || slot > 9)) {
      setPositionError('Posição deve ser entre 1 e 9.');
      setSlotDraft(form.binder_slot != null ? String(form.binder_slot) : '');
      return;
    }
    setPositionError(null);
    try {
      await updateCollection({ binder_page: page, binder_slot: slot });
    } catch (err) {
      setPositionError(err instanceof Error ? err.message : String(err));
      setPageDraft(form.binder_page != null ? String(form.binder_page) : '');
      setSlotDraft(form.binder_slot != null ? String(form.binder_slot) : '');
    }
  };

  const handleNameBlur = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(form.display_name);
      return;
    }
    if (trimmed === form.display_name) return;
    const result = await api.forms.setDisplayName(form.id, trimmed);
    onUpdated({ ...form, display_name: result.display_name, display_name_overridden: result.display_name_overridden });
  };

  const handleNotesBlur = async () => {
    if (notes === (form.notes ?? '')) return;
    const updated = await api.collection.update(form.id, { notes });
    onUpdated({ ...form, notes: updated.notes });
  };

  const handleSaveStatus = async () => {
    if (statusDraft === form.status) {
      onClose();
      return;
    }
    setSavingStatus(true);
    try {
      const result = await api.forms.setStatus(form.id, statusDraft);
      onUpdated({ ...form, status: result.status, status_overridden: result.status_overridden });
      onClose();
    } finally {
      setSavingStatus(false);
    }
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

  const openManualMode = () => {
    setManualName(query.trim() || form.display_name);
    setManualNumber(numberQuery.trim());
    setManualRarity(rarityFilter);
    setManualImageUrl('');
    setManualError(null);
    setManualMode(true);
  };

  const handleAttachManual = async () => {
    const name = manualName.trim();
    const imageUrl = manualImageUrl.trim();
    if (!name || !imageUrl) {
      setManualError('Nome e URL da imagem são obrigatórios.');
      return;
    }
    setAttachingManual(true);
    setManualError(null);
    try {
      const card: TcgCardSearchResult = {
        id: generateManualCardId(),
        name,
        number: manualNumber.trim() || undefined,
        rarity: manualRarity.trim() || undefined,
        set: manualSet.trim() ? { id: 'manual', name: manualSet.trim(), series: '', releaseDate: '' } : undefined,
        images: { small: imageUrl, large: imageUrl },
      };
      await handleAttach(card);
      setManualMode(false);
    } catch (err) {
      setManualError(err instanceof Error ? err.message : String(err));
    } finally {
      setAttachingManual(false);
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
        <div className="form-title-row">
          <input
            className="form-title-input"
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
          {form.display_name_overridden && <span className="badge">nome editado</span>}
        </div>
        <div className="subtitle">
          {form.generation_display_name ?? 'Sem geração'} · {form.region_display_name ?? 'Sem região'}
        </div>

        <div className="modal-section">
          <h3>Coleção</h3>
          <label className="binder-field-label">
            Fichário onde está guardada
            <select
              className="status-select"
              value={form.binder_id ?? ''}
              onChange={e => updateCollection({ binder_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Nenhum</option>
              {binders.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          {form.binder_id !== null && (
            <div className="binder-position-row">
              <label>
                Página
                <input
                  type="number"
                  min={1}
                  className="binder-position-input"
                  value={pageDraft}
                  onChange={e => setPageDraft(e.target.value)}
                  onBlur={handlePositionBlur}
                />
              </label>
              <label>
                Posição (1-9)
                <input
                  type="number"
                  min={1}
                  max={9}
                  className="binder-position-input"
                  value={slotDraft}
                  onChange={e => setSlotDraft(e.target.value)}
                  onBlur={handlePositionBlur}
                />
              </label>
            </div>
          )}
          {positionError && <div className="sync-summary error">{positionError}</div>}
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
          <select
            className="status-select"
            value={statusDraft}
            onChange={e => setStatusDraft(e.target.value as FormStatus)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="status-select-desc">
            {STATUS_OPTIONS.find(opt => opt.value === statusDraft)?.description}
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
                {form.tcg_card_id.startsWith('manual-') && <span className="badge">cadastrada manualmente</span>}
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
                  className="search-name-input"
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
                  placeholder="Número"
                />
                {rarities.length > 0 && (
                  <select
                    className="search-rarity-select"
                    value={rarityFilter}
                    onChange={e => setRarityFilter(e.target.value)}
                  >
                    <option value="">Raridade</option>
                    {rarities.map(r => (
                      <option key={r} value={r}>
                        {raritySymbol(r)} {r}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className="search-button"
                  onClick={handleSearch}
                  disabled={searching || (!query.trim() && !numberQuery.trim() && !rarityFilter)}
                >
                  {searching ? 'Buscando…' : 'Buscar'}
                </button>
              </div>
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

              {!manualMode ? (
                <button className="btn-small" onClick={openManualMode}>
                  Carta não está na API — cadastrar manualmente
                </button>
              ) : (
                <div className="manual-card-form">
                  <div className="search-hint">
                    A busca usa a Pokémon TCG API, que às vezes não tem certos prints (ex: sets regionais). Preencha
                    à mão — a URL da imagem pode vir de qualquer site que mostre a carta (ex: Liga Pokémon).
                  </div>
                  <div className="search-box">
                    <input
                      className="search-name-input"
                      value={manualName}
                      onChange={e => setManualName(e.target.value)}
                      placeholder="Nome da carta…"
                    />
                    <input
                      className="search-number-input"
                      value={manualNumber}
                      onChange={e => setManualNumber(e.target.value)}
                      placeholder="Número"
                    />
                  </div>
                  <div className="search-box">
                    <input
                      className="search-name-input"
                      value={manualSet}
                      onChange={e => setManualSet(e.target.value)}
                      placeholder="Coleção/set (ex: XY8)…"
                    />
                    {rarities.length > 0 ? (
                      <select
                        className="search-rarity-select"
                        value={manualRarity}
                        onChange={e => setManualRarity(e.target.value)}
                      >
                        <option value="">Raridade</option>
                        {rarities.map(r => (
                          <option key={r} value={r}>
                            {raritySymbol(r)} {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="search-number-input"
                        value={manualRarity}
                        onChange={e => setManualRarity(e.target.value)}
                        placeholder="Raridade"
                      />
                    )}
                  </div>
                  <div className="search-box">
                    <input
                      className="search-name-input"
                      value={manualImageUrl}
                      onChange={e => setManualImageUrl(e.target.value)}
                      placeholder="URL da imagem…"
                    />
                    <button
                      className="search-button"
                      onClick={handleAttachManual}
                      disabled={attachingManual || !manualName.trim() || !manualImageUrl.trim()}
                    >
                      {attachingManual ? 'Anexando…' : 'Anexar'}
                    </button>
                  </div>
                  {manualError && <div className="sync-summary error">{manualError}</div>}
                  <button className="btn-small" onClick={() => setManualMode(false)}>
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="sync-button" onClick={handleSaveStatus} disabled={savingStatus}>
            {savingStatus ? 'Salvando…' : 'Salvar e fechar'}
          </button>
        </div>
      </div>
    </div>
  );
}
