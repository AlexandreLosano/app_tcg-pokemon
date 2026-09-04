import { useState } from 'react';
import type { BinderFilter, FormEntry } from '../types';
import { statusClass, statusLabel, imageUrl, formStatusLabel } from '../utils/formDisplay';

interface Props {
  forms: FormEntry[];
  binderId: BinderFilter | undefined;
  onSelect: (formId: number) => void;
  onToggleHidden: (formId: number, hide: boolean) => void;
}

const PAGE_SIZE = 9;

function chunkIntoPages(forms: FormEntry[]): (FormEntry | null)[][] {
  const pages: (FormEntry | null)[][] = [];
  for (let i = 0; i < forms.length; i += PAGE_SIZE) {
    const chunk = forms.slice(i, i + PAGE_SIZE);
    pages.push([...chunk, ...Array(PAGE_SIZE - chunk.length).fill(null)]);
  }
  return pages.length ? pages : [Array(PAGE_SIZE).fill(null)];
}

// Só entra em jogo quando a visão está filtrada por um único fichário específico e pelo menos
// uma forma dele tem página/posição definida manualmente (ver painel de detalhe, campo
// "Fichário onde está guardada" -> Página/Posição). Formas desse fichário sem posição definida
// não somem: entram em páginas extras logo depois das páginas numeradas manualmente, na ordem
// padrão (paginação sequencial de 9 em 9), então nada fica escondido por falta de posição.
function buildPages(forms: FormEntry[], binderId: BinderFilter | undefined): (FormEntry | null)[][] {
  const manualPositioning =
    typeof binderId === 'number' && forms.some(f => f.binder_page != null && f.binder_slot != null);
  if (!manualPositioning) return chunkIntoPages(forms);

  const positioned = forms.filter(f => f.binder_page != null && f.binder_slot != null);
  const unpositioned = forms.filter(f => f.binder_page == null || f.binder_slot == null);
  const maxPage = positioned.reduce((max, f) => Math.max(max, f.binder_page!), 0);

  const pages: (FormEntry | null)[][] = [];
  for (let p = 1; p <= maxPage; p++) {
    const slots: (FormEntry | null)[] = Array(PAGE_SIZE).fill(null);
    positioned
      .filter(f => f.binder_page === p)
      .forEach(f => {
        const idx = f.binder_slot! - 1;
        if (idx >= 0 && idx < PAGE_SIZE) slots[idx] = f;
      });
    pages.push(slots);
  }
  if (unpositioned.length > 0) pages.push(...chunkIntoPages(unpositioned));
  return pages.length ? pages : [Array(PAGE_SIZE).fill(null)];
}

export default function AlbumView({ forms, binderId, onSelect, onToggleHidden }: Props) {
  const [page, setPage] = useState(0);

  if (forms.length === 0) {
    return (
      <div className="empty-state">
        Nenhuma forma encontrada para os filtros selecionados. Se o banco estiver vazio, clique em
        &ldquo;Atualizar&rdquo;.
      </div>
    );
  }

  const pages = buildPages(forms, binderId);
  const totalPages = pages.length;
  const safePage = Math.min(page, totalPages - 1);
  const slots = pages[safePage];

  return (
    <div className="album-view">
      <div className="album-grid">
        {slots.map((form, i) =>
          form ? (
            <div
              key={form.id}
              className={`form-card album-slot ${statusClass(form)} ${form.status === 'visible' ? '' : 'not-eligible'}`}
              onClick={() => onSelect(form.id)}
              role="button"
            >
              <button
                className="hide-btn"
                title={form.status === 'visible' ? 'Ocultar da listagem' : 'Voltar para visível'}
                onClick={e => {
                  e.stopPropagation();
                  onToggleHidden(form.id, form.status === 'visible');
                }}
              >
                {form.status === 'visible' ? '✕' : '↺'}
              </button>
              <div className="album-slot-art">
                {imageUrl(form) ? (
                  <img src={imageUrl(form)!} alt={form.display_name} />
                ) : (
                  <div className="form-card-placeholder">sem arte</div>
                )}
              </div>
              <div className="album-slot-details">
                <div className="name">{form.display_name}</div>
                <div className="meta">
                  {form.generation_display_name ?? '—'} · {form.region_display_name ?? '—'}
                </div>
                {form.tcg_card_set_name && (
                  <div className="album-slot-set">
                    {form.tcg_card_set_name}
                    {form.tcg_card_number ? ` #${form.tcg_card_number}` : ''}
                  </div>
                )}
                <span className={`status-pill ${statusClass(form)}`}>{statusLabel(form)}</span>
                {form.status !== 'visible' && (
                  <span className="badge form-status-badge">{formStatusLabel(form.status)}</span>
                )}
              </div>
            </div>
          ) : (
            <div key={`empty-${i}`} className="album-slot album-slot-empty" />
          )
        )}
      </div>
      <div className="album-nav">
        <button className="btn-small" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}>
          ← Anterior
        </button>
        <span>
          Página {safePage + 1} de {totalPages} · {forms.length} formas
        </span>
        <button
          className="btn-small"
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={safePage >= totalPages - 1}
        >
          Próxima →
        </button>
      </div>
    </div>
  );
}
