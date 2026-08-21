import type { FormEntry } from '../types';
import { statusClass, imageUrl } from '../utils/formDisplay';

interface Props {
  forms: FormEntry[];
  loading: boolean;
  onSelect: (formId: number) => void;
  onToggleEligibility: (formId: number, eligible: boolean) => void;
}

export default function BinderGrid({ forms, loading, onSelect, onToggleEligibility }: Props) {
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

  return (
    <div className="binder-grid">
      {forms.map(form => {
        const img = imageUrl(form);
        return (
          <div
            key={form.id}
            className={`form-card ${statusClass(form)} ${form.living_dex_eligible ? '' : 'not-eligible'}`}
            onClick={() => onSelect(form.id)}
            role="button"
          >
            <button
              className="hide-btn"
              title={form.living_dex_eligible ? 'Ocultar da listagem (não conto esta forma)' : 'Voltar a considerar esta forma'}
              onClick={e => {
                e.stopPropagation();
                onToggleEligibility(form.id, !form.living_dex_eligible);
              }}
            >
              {form.living_dex_eligible ? '✕' : '↺'}
            </button>
            {img ? <img src={img} alt={form.display_name} /> : <div className="form-card-placeholder" />}
            <div className="name">{form.display_name}</div>
            <div className="meta">
              {form.generation_display_name ?? '—'} · {form.region_display_name ?? '—'}
            </div>
            {form.tcg_card_set_name && <span className="badge">{form.tcg_card_set_name}</span>}
          </div>
        );
      })}
    </div>
  );
}
