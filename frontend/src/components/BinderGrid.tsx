import type { FormEntry } from '../types';
import { statusClass, imageUrl, formStatusLabel } from '../utils/formDisplay';

interface Props {
  forms: FormEntry[];
  loading: boolean;
  onSelect: (formId: number) => void;
  onToggleHidden: (formId: number, hide: boolean) => void;
}

export default function BinderGrid({ forms, loading, onSelect, onToggleHidden }: Props) {
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
        const isVisible = form.status === 'visible';
        return (
          <div
            key={form.id}
            className={`form-card ${statusClass(form)} ${isVisible ? '' : 'not-eligible'}`}
            onClick={() => onSelect(form.id)}
            role="button"
          >
            <button
              className="hide-btn"
              title={isVisible ? 'Ocultar da listagem (não conto esta forma)' : 'Voltar para visível'}
              onClick={e => {
                e.stopPropagation();
                onToggleHidden(form.id, isVisible);
              }}
            >
              {isVisible ? '✕' : '↺'}
            </button>
            {img ? <img src={img} alt={form.display_name} /> : <div className="form-card-placeholder" />}
            <div className="name">{form.display_name}</div>
            <div className="meta">
              {form.generation_display_name ?? '—'} · {form.region_display_name ?? '—'}
            </div>
            {!isVisible && <span className="badge form-status-badge">{formStatusLabel(form.status)}</span>}
            {isVisible && form.tcg_card_set_name && <span className="badge">{form.tcg_card_set_name}</span>}
          </div>
        );
      })}
    </div>
  );
}
