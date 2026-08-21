import type { Generation, Region, SyncSummary } from '../types';

interface Props {
  generations: Generation[];
  regions: Region[];
  generationId: number | undefined;
  regionId: number | undefined;
  eligibleOnly: boolean;
  onGenerationChange: (id: number | undefined) => void;
  onRegionChange: (id: number | undefined) => void;
  onEligibleOnlyChange: (value: boolean) => void;
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
  eligibleOnly,
  onGenerationChange,
  onRegionChange,
  onEligibleOnlyChange,
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
        <input
          type="checkbox"
          checked={eligibleOnly}
          onChange={e => onEligibleOnlyChange(e.target.checked)}
        />
        Somente elegíveis
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
