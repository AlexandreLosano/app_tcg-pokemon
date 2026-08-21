import type { EligibilityFilter, Generation, Region, SyncSummary } from '../types';

interface Props {
  generations: Generation[];
  regions: Region[];
  generationId: number | undefined;
  regionId: number | undefined;
  eligibility: EligibilityFilter;
  onGenerationChange: (id: number | undefined) => void;
  onRegionChange: (id: number | undefined) => void;
  onEligibilityChange: (value: EligibilityFilter) => void;
  onSync: () => void;
  syncing: boolean;
  syncResult: SyncSummary | null;
  syncError: string | null;
}

export default function Toolbar({
  generations,
  regions,
  generationId,
  regionId,
  eligibility,
  onGenerationChange,
  onRegionChange,
  onEligibilityChange,
  onSync,
  syncing,
  syncResult,
  syncError,
}: Props) {
  return (
    <div className="toolbar">
      <h1>Living Dex — TCG Pokémon</h1>

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
        Elegibilidade
        <select value={eligibility} onChange={e => onEligibilityChange(e.target.value as EligibilityFilter)}>
          <option value="eligible">Elegíveis</option>
          <option value="all">Todas</option>
          <option value="hidden">Ocultas</option>
        </select>
      </label>

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
