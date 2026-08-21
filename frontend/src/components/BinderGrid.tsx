import type { FormEntry } from '../types';

interface Props {
  forms: FormEntry[];
  loading: boolean;
  onSelect: (formId: number) => void;
}

function statusClass(form: FormEntry): string {
  if (!form.owned) return 'status-missing';
  if (form.is_definitive) return 'status-definitive';
  if (form.needs_trade) return 'status-trade';
  return 'status-owned';
}

function imageUrl(form: FormEntry): string | null {
  return form.tcg_card_image_small_url ?? form.sprite_url ?? form.species_sprite_default_url ?? null;
}

export default function BinderGrid({ forms, loading, onSelect }: Props) {
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
            className={`form-card ${statusClass(form)}`}
            onClick={() => onSelect(form.id)}
            role="button"
          >
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
