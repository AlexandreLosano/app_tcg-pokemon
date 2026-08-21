import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { FormStatus, StatusFilter, Generation, Region, FormEntry, SyncSummary, ViewMode } from '../types';
import Toolbar from './Toolbar';
import BinderGrid from './BinderGrid';
import ListView from './ListView';
import AlbumView from './AlbumView';
import FormDetailPanel from './FormDetailPanel';

function matchesStatusFilter(form: FormEntry, status: StatusFilter): boolean {
  if (status === 'all') return true;
  return form.status === status;
}

export default function BinderPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [generationId, setGenerationId] = useState<number | undefined>(undefined);
  const [regionId, setRegionId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<StatusFilter>('visible');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
      const data = await api.forms.list({ generation_id: generationId, region_id: regionId, status });
      setForms(data);
    } finally {
      setLoading(false);
    }
  }, [generationId, regionId, status]);

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
      return next.filter(f => f.id !== updated.id || matchesStatusFilter(f, status));
    });
  };

  // Ação rápida do card/linha: alterna só entre visível e oculta (o resto das categorias
  // fica no painel de detalhe, que é onde faz sentido decidir com calma).
  const handleToggleHidden = async (formId: number, hide: boolean) => {
    const result = await api.forms.setStatus(formId, hide ? 'hidden' : 'visible');
    setForms(prev => {
      const updated = prev.map(f =>
        f.id === formId ? { ...f, status: result.status, status_overridden: result.status_overridden } : f
      );
      return updated.filter(f => f.id !== formId || matchesStatusFilter(f, status));
    });
  };

  // Ação em lote da Lista: aplica um status a vários ids de uma vez.
  const handleBulkSetStatus = async (formIds: number[], newStatus: FormStatus) => {
    await Promise.all(formIds.map(id => api.forms.setStatus(id, newStatus)));
    setForms(prev => {
      const idSet = new Set(formIds);
      const updated = prev.map(f => (idSet.has(f.id) ? { ...f, status: newStatus, status_overridden: true } : f));
      return updated.filter(f => !idSet.has(f.id) || matchesStatusFilter(f, status));
    });
  };

  return (
    <div className="app">
      <Toolbar
        generations={generations}
        regions={regions}
        generationId={generationId}
        regionId={regionId}
        status={status}
        viewMode={viewMode}
        onGenerationChange={setGenerationId}
        onRegionChange={setRegionId}
        onStatusChange={setStatus}
        onViewModeChange={setViewMode}
        onSync={handleSync}
        syncing={syncing}
        syncResult={syncResult}
        syncError={syncError}
      />
      {viewMode === 'grid' && (
        <BinderGrid
          forms={forms}
          loading={loading}
          onSelect={id => setSelectedFormId(id)}
          onToggleHidden={handleToggleHidden}
        />
      )}
      {viewMode === 'list' && (
        <ListView
          forms={forms}
          loading={loading}
          onSelect={id => setSelectedFormId(id)}
          onToggleHidden={handleToggleHidden}
          onBulkSetStatus={handleBulkSetStatus}
        />
      )}
      {viewMode === 'album' && !loading && (
        <AlbumView
          key={`${generationId}-${regionId}-${status}`}
          forms={forms}
          onSelect={id => setSelectedFormId(id)}
          onToggleHidden={handleToggleHidden}
        />
      )}
      {viewMode === 'album' && loading && <div className="empty-state">Carregando…</div>}
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
