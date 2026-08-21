import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Generation, Region, FormEntry, SyncSummary } from '../types';
import Toolbar from './Toolbar';
import BinderGrid from './BinderGrid';
import FormDetailPanel from './FormDetailPanel';

export default function BinderPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [generationId, setGenerationId] = useState<number | undefined>(undefined);
  const [regionId, setRegionId] = useState<number | undefined>(undefined);
  const [eligibleOnly, setEligibleOnly] = useState(true);

  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncSummary | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadReference = useCallback(async () => {
    const [gens, regs] = await Promise.all([api.generations.list(), api.regions.list()]);
    setGenerations(gens);
    setRegions(regs);
  }, []);

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.forms.list({ generation_id: generationId, region_id: regionId, eligible_only: eligibleOnly });
      setForms(data);
    } finally {
      setLoading(false);
    }
  }, [generationId, regionId, eligibleOnly]);

  useEffect(() => {
    loadReference();
  }, [loadReference]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const summary = await api.sync.run();
      setSyncResult(summary);
      await loadReference();
      await loadForms();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  };

  const selectedForm = forms.find(f => f.id === selectedFormId) ?? null;

  const handleFormUpdated = (updated: FormEntry) => {
    setForms(prev => prev.map(f => (f.id === updated.id ? updated : f)));
  };

  const handleToggleEligibility = async (formId: number, eligible: boolean) => {
    const result = await api.forms.setEligibility(formId, eligible);
    setForms(prev => {
      const updated = prev.map(f =>
        f.id === formId
          ? {
              ...f,
              living_dex_eligible: result.living_dex_eligible,
              living_dex_eligible_overridden: result.living_dex_eligible_overridden,
            }
          : f
      );
      // Se estamos filtrando só elegíveis e a forma acabou de ser ocultada, some da lista na hora.
      return eligibleOnly && !result.living_dex_eligible ? updated.filter(f => f.id !== formId) : updated;
    });
  };

  return (
    <div className="app">
      <Toolbar
        generations={generations}
        regions={regions}
        generationId={generationId}
        regionId={regionId}
        eligibleOnly={eligibleOnly}
        onGenerationChange={setGenerationId}
        onRegionChange={setRegionId}
        onEligibleOnlyChange={setEligibleOnly}
        onSync={handleSync}
        syncing={syncing}
        syncResult={syncResult}
        syncError={syncError}
      />
      <BinderGrid
        forms={forms}
        loading={loading}
        onSelect={id => setSelectedFormId(id)}
        onToggleEligibility={handleToggleEligibility}
      />
      {selectedForm && (
        <FormDetailPanel
          form={selectedForm}
          onClose={() => setSelectedFormId(null)}
          onUpdated={handleFormUpdated}
        />
      )}
    </div>
  );
}
