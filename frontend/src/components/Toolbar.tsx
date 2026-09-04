import type {
  StatusFilter,
  Generation,
  Region,
  Binder,
  BinderFilter,
  CollectionStatusFilter,
  SyncSummary,
  ViewMode,
} from '../types';

interface Props {
  generations: Generation[];
  regions: Region[];
  binders: Binder[];
  generationId: number | undefined;
  regionId: number | undefined;
  binderId: BinderFilter | undefined;
  status: StatusFilter;
  collectionStatus: CollectionStatusFilter | undefined;
  onlyBlank: boolean;
  viewMode: ViewMode;
  onGenerationChange: (id: number | undefined) => void;
  onRegionChange: (id: number | undefined) => void;
  onBinderChange: (id: BinderFilter | undefined) => void;
  onStatusChange: (value: StatusFilter) => void;
  onCollectionStatusChange: (value: CollectionStatusFilter | undefined) => void;
  onOnlyBlankChange: (value: boolean) => void;
  onViewModeChange: (value: ViewMode) => void;
  onManageBinders: () => void;
  onManageCustomForms: () => void;
  onSync: () => void;
  syncing: boolean;
  syncResult: SyncSummary | null;
  syncError: string | null;
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'grid', label: 'Grade' },
  { value: 'list', label: 'Lista' },
  { value: 'album', label: 'Fichário' },
];

export default function Toolbar({
  generations,
  regions,
  binders,
  generationId,
  regionId,
  binderId,
  status,
  collectionStatus,
  onlyBlank,
  viewMode,
  onGenerationChange,
  onRegionChange,
  onBinderChange,
  onStatusChange,
  onCollectionStatusChange,
  onOnlyBlankChange,
  onViewModeChange,
  onManageBinders,
  onManageCustomForms,
  onSync,
  syncing,
  syncResult,
  syncError,
}: Props) {
  return (
    <div className="toolbar">
      <label>
        Geração
        <select
          value={generationId ?? ''}
          onChange={e => onGenerationChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Todas</option>
          {generations.map(g => (
            <option key={g.id} value={g.id}>
              {g.display_name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Região
        <select
          value={regionId ?? ''}
          onChange={e => onRegionChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Todas</option>
          {regions.map(r => (
            <option key={r.id} value={r.id}>
              {r.display_name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Fichário
        <select
          value={binderId ?? ''}
          onChange={e =>
            onBinderChange(
              e.target.value === '' ? undefined : e.target.value === 'none' ? 'none' : Number(e.target.value)
            )
          }
        >
          <option value="">Todos</option>
          <option value="none">Sem fichário</option>
          {binders.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <button className="btn-small" onClick={onManageBinders}>
        Gerenciar fichários
      </button>

      <button className="btn-small" onClick={onManageCustomForms}>
        Formas manuais
      </button>

      <label>
        Status
        <select value={status} onChange={e => onStatusChange(e.target.value as StatusFilter)}>
          <option value="visible">Visíveis</option>
          <option value="all">Todas</option>
          <option value="hidden">Ocultas</option>
          <option value="no_need">Sem necessidade</option>
          <option value="card_unavailable">Sem carta ainda</option>
        </select>
      </label>

      <label>
        Coleção
        <select
          value={collectionStatus ?? ''}
          onChange={e => onCollectionStatusChange(e.target.value ? (e.target.value as CollectionStatusFilter) : undefined)}
        >
          <option value="">Todas</option>
          <option value="owned">Tenho</option>
          <option value="definitive">Definitiva</option>
          <option value="trade">Precisa de troca</option>
          <option value="missing">Não tenho</option>
        </select>
      </label>

      <label>
        <input type="checkbox" checked={onlyBlank} onChange={e => onOnlyBlankChange(e.target.checked)} />
        Sem cadastro
      </label>

      <div className="view-switch">
        {VIEW_MODES.map(v => (
          <button
            key={v.value}
            className={`view-switch-btn ${viewMode === v.value ? 'active' : ''}`}
            onClick={() => onViewModeChange(v.value)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="spacer" />

      {syncResult && !syncing && (
        <span className="sync-summary">
          {syncResult.species_upserted} espécies · {syncResult.forms_upserted} formas
          {syncResult.forms_skipped > 0 ? ` · ${syncResult.forms_skipped} ignoradas` : ''}
        </span>
      )}
      {syncError && !syncing && <span className="sync-summary error">Falha ao atualizar: {syncError}</span>}

      <button className="sync-button" onClick={onSync} disabled={syncing}>
        {syncing ? 'Atualizando…' : 'Atualizar'}
      </button>
    </div>
  );
}
