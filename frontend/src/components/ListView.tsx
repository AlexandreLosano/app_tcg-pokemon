import type { FormEntry } from '../types';
import { statusClass, statusLabel, imageUrl } from '../utils/formDisplay';

interface Props {
  forms: FormEntry[];
  loading: boolean;
  onSelect: (formId: number) => void;
  onToggleEligibility: (formId: number, eligible: boolean) => void;
}

export default function ListView({ forms, loading, onSelect, onToggleEligibility }: Props) {
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
    <div className="list-view">
      <table className="forms-table">
        <thead>
          <tr>
            <th></th>
            <th>Pokémon</th>
            <th>Geração</th>
            <th>Região</th>
            <th>Status</th>
            <th>Carta anexada</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {forms.map(form => {
            const img = imageUrl(form);
            return (
              <tr
                key={form.id}
                className={`${statusClass(form)} ${form.living_dex_eligible ? '' : 'not-eligible'}`}
                onClick={() => onSelect(form.id)}
              >
                <td className="list-thumb">
                  {img ? <img src={img} alt={form.display_name} /> : <div className="form-card-placeholder" />}
                </td>
                <td>{form.display_name}</td>
                <td>{form.generation_display_name ?? '—'}</td>
                <td>{form.region_display_name ?? '—'}</td>
                <td>
                  <span className={`status-pill ${statusClass(form)}`}>{statusLabel(form)}</span>
                </td>
                <td>
                  {form.tcg_card_name
                    ? `${form.tcg_card_name} — ${form.tcg_card_set_name ?? '?'} #${form.tcg_card_number ?? '?'}`
                    : '—'}
                </td>
                <td>
                  <button
                    className="hide-btn static"
                    title={form.living_dex_eligible ? 'Ocultar da listagem' : 'Voltar a considerar esta forma'}
                    onClick={e => {
                      e.stopPropagation();
                      onToggleEligibility(form.id, !form.living_dex_eligible);
                    }}
                  >
                    {form.living_dex_eligible ? '✕' : '↺'}
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
