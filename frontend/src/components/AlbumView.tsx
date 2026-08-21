import { useState } from 'react';
import type { FormEntry } from '../types';
import { statusClass, imageUrl } from '../utils/formDisplay';

interface Props {
  forms: FormEntry[];
  onSelect: (formId: number) => void;
  onToggleEligibility: (formId: number, eligible: boolean) => void;
}

const PAGE_SIZE = 9;

export default function AlbumView({ forms, onSelect, onToggleEligibility }: Props) {
  const [page, setPage] = useState(0);

  if (forms.length === 0) {
    return (
      <div className="empty-state">
        Nenhuma forma encontrada para os filtros selecionados. Se o banco estiver vazio, clique em
        &ldquo;Atualizar&rdquo;.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(forms.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const pageForms = forms.slice(start, start + PAGE_SIZE);
  const slots: (FormEntry | null)[] = [...pageForms, ...Array(PAGE_SIZE - pageForms.length).fill(null)];

  return (
    <div className="album-view">
      <div className="album-grid">
        {slots.map((form, i) =>
          form ? (
            <div
              key={form.id}
              className={`form-card album-slot ${statusClass(form)} ${form.living_dex_eligible ? '' : 'not-eligible'}`}
              onClick={() => onSelect(form.id)}
              role="button"
            >
              <button
                className="hide-btn"
                title={form.living_dex_eligible ? 'Ocultar da listagem' : 'Voltar a considerar esta forma'}
                onClick={e => {
                  e.stopPropagation();
                  onToggleEligibility(form.id, !form.living_dex_eligible);
                }}
              >
                {form.living_dex_eligible ? '✕' : '↺'}
              </button>
              {imageUrl(form) ? (
                <img src={imageUrl(form)!} alt={form.display_name} />
              ) : (
                <div className="form-card-placeholder" />
              )}
              <div className="name">{form.display_name}</div>
              <div className="meta">
                {form.generation_display_name ?? '—'} · {form.region_display_name ?? '—'}
              </div>
              {form.tcg_card_set_name && <span className="badge">{form.tcg_card_set_name}</span>}
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
