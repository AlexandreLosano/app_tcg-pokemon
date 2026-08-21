import type { FormEntry } from '../types';
import { statusClass, statusLabel, imageUrl, formStatusLabel } from '../utils/formDisplay';

interface Props {
  forms: FormEntry[];
  loading: boolean;
  onSelect: (formId: number) => void;
  onToggleHidden: (formId: number, hide: boolean) => void;
}

export default function ListView({ forms, loading, onSelect, onToggleHidden }: Props) {
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
            <th>Categoria</th>
            <th>Carta anexada</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {forms.map(form => {
            const img = imageUrl(form);
            const isVisible = form.status === 'visible';
            return (
              <tr key={form.id} className={`${statusClass(form)} ${isVisible ? '' : 'not-eligible'}`} onClick={() => onSelect(form.id)}>
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
