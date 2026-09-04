import { useEffect, useState } from 'react';
import type { Binder, FormEntry, FormStatus } from '../types';
import { statusClass, statusLabel, imageUrl, formStatusLabel } from '../utils/formDisplay';

interface Props {
  forms: FormEntry[];
  binders: Binder[];
  loading: boolean;
  onSelect: (formId: number) => void;
  onToggleHidden: (formId: number, hide: boolean) => void;
  onBulkSetStatus: (formIds: number[], status: FormStatus) => Promise<void>;
  onBulkSetBinder: (formIds: number[], binderId: number | null) => Promise<void>;
}

const BULK_STATUS_OPTIONS: { value: FormStatus; label: string }[] = [
  { value: 'visible', label: 'Visível' },
  { value: 'no_need', label: 'Sem necessidade' },
  { value: 'card_unavailable', label: 'Sem carta ainda' },
  { value: 'hidden', label: 'Oculta' },
];

export default function ListView({
  forms,
  binders,
  loading,
  onSelect,
  onToggleHidden,
  onBulkSetStatus,
  onBulkSetBinder,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [bulkBinderId, setBulkBinderId] = useState('');

  // Um novo carregamento (troca de filtro) invalida a seleção; edições pontuais no painel
  // de detalhe (que não passam por "loading") não devem mexer na seleção do usuário.
  useEffect(() => {
    if (loading) setSelectedIds(new Set());
  }, [loading]);

  if (loading) {
    return <div className="empty-state">Carregando…</div>;
  }

  if (forms.length === 0) {
    return (
      <div className="empty-state">
        Nenhuma forma encontrada para os filtros selecionados. Se o banco estiver vazio, clique em
        &ldquo;Atualizar&rdquo;.
      </div>
    );
  }

  const allSelected = forms.length > 0 && forms.every(f => selectedIds.has(f.id));

  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(prev => (allSelected ? new Set() : new Set(forms.map(f => f.id))));
  };

  const applyBulkStatus = async (status: FormStatus) => {
    setApplying(true);
    try {
      await onBulkSetStatus([...selectedIds], status);
      setSelectedIds(new Set());
    } finally {
      setApplying(false);
    }
  };

  const applyBulkBinder = async () => {
    setApplying(true);
    try {
      await onBulkSetBinder([...selectedIds], bulkBinderId ? Number(bulkBinderId) : null);
      setSelectedIds(new Set());
      setBulkBinderId('');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="list-view">
      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <div className="bulk-bar-row">
            <span>{selectedIds.size} selecionada(s)</span>
            <span className="bulk-bar-label">Marcar como:</span>
            <div className="bulk-actions">
              {BULK_STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className="btn-small"
                  disabled={applying}
                  onClick={() => applyBulkStatus(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="spacer" />
            <button className="btn-small" disabled={applying} onClick={() => setSelectedIds(new Set())}>
              Limpar seleção
            </button>
          </div>
          <div className="bulk-bar-row">
            <span className="bulk-bar-label">Fichário:</span>
            <select value={bulkBinderId} onChange={e => setBulkBinderId(e.target.value)} disabled={applying}>
              <option value="">Nenhum</option>
              {binders.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button className="btn-small" disabled={applying} onClick={applyBulkBinder}>
              Aplicar
            </button>
          </div>
        </div>
      )}
      <table className="forms-table">
        <thead>
          <tr>
            <th className="list-checkbox-col">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            </th>
            <th></th>
            <th>Pokémon</th>
            <th>Geração</th>
            <th>Região</th>
            <th>Status</th>
            <th>Categoria</th>
            <th>Carta anexada</th>
            <th>Fichário</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {forms.map(form => {
            const img = imageUrl(form);
            const isVisible = form.status === 'visible';
            return (
              <tr
                key={form.id}
                className={`${statusClass(form)} ${isVisible ? '' : 'not-eligible'} ${
                  selectedIds.has(form.id) ? 'row-selected' : ''
                }`}
                onClick={() => onSelect(form.id)}
              >
                <td className="list-checkbox-col" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(form.id)} onChange={() => toggleOne(form.id)} />
                </td>
                <td className="list-thumb">
                  {img ? <img src={img} alt={form.display_name} /> : <div className="form-card-placeholder" />}
                </td>
                <td>{form.display_name}</td>
                <td>{form.generation_display_name ?? '—'}</td>
                <td>{form.region_display_name ?? '—'}</td>
                <td>
                  <span className={`status-pill ${statusClass(form)}`}>{statusLabel(form)}</span>
                </td>
                <td>{isVisible ? '—' : <span className="badge form-status-badge">{formStatusLabel(form.status)}</span>}</td>
                <td>
                  {form.tcg_card_name
                    ? `${form.tcg_card_name} — ${form.tcg_card_set_name ?? '?'} #${form.tcg_card_number ?? '?'}`
                    : '—'}
                </td>
                <td>{form.binder_name ?? '—'}</td>
                <td>
                  <button
                    className="hide-btn static"
                    title={isVisible ? 'Ocultar da listagem' : 'Voltar para visível'}
                    onClick={e => {
                      e.stopPropagation();
                      onToggleHidden(form.id, isVisible);
                    }}
                  >
                    {isVisible ? '✕' : '↺'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
