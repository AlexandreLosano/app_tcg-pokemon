import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EligibilityFilter, Generation, Region, FormEntry, SyncSummary } from '../types';
import Toolbar from './Toolbar';
import BinderGrid from './BinderGrid';
import FormDetailPanel from './FormDetailPanel';

function matchesEligibilityFilter(form: FormEntry, eligibility: EligibilityFilter): boolean {
  if (eligibility === 'eligible') return form.living_dex_eligible;
  if (eligibility === 'hidden') return !form.living_dex_eligible;
  return true;
}

export default function BinderPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [generationId, setGenerationId] = useState<number | undefined>(undefined);
  const [regionId, setRegionId] = useState<number | undefined>(undefined);
  const [eligibility, setEligibility] = useState<EligibilityFilter>('eligible');

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
      const data = await api.forms.list({ generation_id: generationId, region_id: regionId, eligibility });
      setForms(data);
    } finally {
      setLoading(false);
    }
  }, [generationId, regionId, eligibility]);

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
    setForms(prev => {
      const next = prev.map(f => (f.id === updated.id ? updated : f));
      return next.filter(f => f.id !== updated.id || matchesEligibilityFilter(f, eligibility));
    });
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
      // Some da lista na hora se a forma deixou de bater com o filtro de elegibilidade atual.
      return updated.filter(f => f.id !== formId || matchesEligibilityFilter(f, eligibility));
    });
  };

  return (
    <div className="app">
      <Toolbar
        generations={generations}
        regions={regions}
        generationId={generationId}
        regionId={regionId}
        eligibility={eligibility}
        onGenerationChange={setGenerationId}
        onRegionChange={setRegionId}
        onEligibilityChange={setEligibility}
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
