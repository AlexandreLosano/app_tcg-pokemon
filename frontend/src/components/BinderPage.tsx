import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type {
  FormStatus,
  StatusFilter,
  Generation,
  Region,
  Binder,
  BinderFilter,
  CollectionStatusFilter,
  FormEntry,
  SyncSummary,
  ViewMode,
} from '../types';
import { hasNoRegistration } from '../utils/formDisplay';
import Toolbar from './Toolbar';
import BinderGrid from './BinderGrid';
import ListView from './ListView';
import AlbumView from './AlbumView';
import FormDetailPanel from './FormDetailPanel';
import BinderManagerModal from './BinderManagerModal';
import CustomFormManagerModal from './CustomFormManagerModal';

function matchesStatusFilter(form: FormEntry, status: StatusFilter): boolean {
  if (status === 'all') return true;
  return form.status === status;
}

export default function BinderPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [binders, setBinders] = useState<Binder[]>([]);
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [generationId, setGenerationId] = useState<number | undefined>(undefined);
  const [regionId, setRegionId] = useState<number | undefined>(undefined);
  const [binderId, setBinderId] = useState<BinderFilter | undefined>(undefined);
  const [status, setStatus] = useState<StatusFilter>('visible');
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatusFilter | undefined>(undefined);
  const [onlyBlank, setOnlyBlank] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [managingBinders, setManagingBinders] = useState(false);
  const [managingCustomForms, setManagingCustomForms] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncSummary | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadReference = useCallback(async () => {
    const [gens, regs, binds] = await Promise.all([api.generations.list(), api.regions.list(), api.binders.list()]);
    setGenerations(gens);
    setRegions(regs);
    setBinders(binds);
  }, []);

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.forms.list({
        generation_id: generationId,
        region_id: regionId,
        binder_id: binderId,
        status,
        collection_status: collectionStatus,
      });
      setForms(data);
    } finally {
      setLoading(false);
    }
  }, [generationId, regionId, binderId, status, collectionStatus]);

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
  const visibleForms = onlyBlank ? forms.filter(hasNoRegistration) : forms;

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

  // Ação em lote da Lista: marca vários ids como guardados no mesmo fichário físico de uma vez
  // (ex: as 3 formas de clima do Castform que não ficam no fichário "principal" da geração).
  const handleBulkSetBinder = async (formIds: number[], newBinderId: number | null) => {
    await Promise.all(formIds.map(id => api.collection.update(id, { binder_id: newBinderId })));
    const binderName = binders.find(b => b.id === newBinderId)?.name ?? null;
    setForms(prev => {
      const idSet = new Set(formIds);
      const updated = prev.map(f =>
        idSet.has(f.id)
          ? { ...f, binder_id: newBinderId, binder_name: binderName, binder_page: null, binder_slot: null }
          : f
      );
      const matchesBinderFilter =
        binderId === undefined || (binderId === 'none' ? newBinderId === null : newBinderId === binderId);
      return updated.filter(f => !idSet.has(f.id) || matchesBinderFilter);
    });
  };

  // Uma forma manual nova/removida entra em qualquer posição da lista carregada (ordenada
  // por sp.id, f.id no servidor) -- mais simples recarregar do que tentar inserir localmente.
  const handleCustomFormsChanged = async () => {
    await loadForms();
  };

  const handleBindersChanged = async () => {
    const binds = await api.binders.list();
    setBinders(binds);
    if (typeof binderId === 'number' && !binds.some(b => b.id === binderId)) {
      setBinderId(undefined);
    } else {
      await loadForms();
    }
  };

  return (
    <div className="app">
      <Toolbar
        generations={generations}
        regions={regions}
        binders={binders}
        generationId={generationId}
        regionId={regionId}
        binderId={binderId}
        status={status}
        collectionStatus={collectionStatus}
        onlyBlank={onlyBlank}
        viewMode={viewMode}
        onGenerationChange={setGenerationId}
        onRegionChange={setRegionId}
        onBinderChange={setBinderId}
        onStatusChange={setStatus}
        onCollectionStatusChange={setCollectionStatus}
        onOnlyBlankChange={setOnlyBlank}
        onViewModeChange={setViewMode}
        onManageBinders={() => setManagingBinders(true)}
        onManageCustomForms={() => setManagingCustomForms(true)}
        onSync={handleSync}
        syncing={syncing}
        syncResult={syncResult}
        syncError={syncError}
      />
      {viewMode === 'grid' && (
        <BinderGrid
          forms={visibleForms}
          loading={loading}
          onSelect={id => setSelectedFormId(id)}
          onToggleHidden={handleToggleHidden}
        />
      )}
      {viewMode === 'list' && (
        <ListView
          forms={visibleForms}
          binders={binders}
          loading={loading}
          onSelect={id => setSelectedFormId(id)}
          onToggleHidden={handleToggleHidden}
          onBulkSetStatus={handleBulkSetStatus}
          onBulkSetBinder={handleBulkSetBinder}
        />
      )}
      {viewMode === 'album' && !loading && (
        <AlbumView
          key={`${generationId}-${regionId}-${binderId}-${status}-${collectionStatus}-${onlyBlank}`}
          forms={visibleForms}
          binderId={binderId}
          onSelect={id => setSelectedFormId(id)}
          onToggleHidden={handleToggleHidden}
        />
      )}
      {viewMode === 'album' && loading && <div className="empty-state">Carregando…</div>}
      {selectedForm && (
        <FormDetailPanel
          form={selectedForm}
          binders={binders}
          onClose={() => setSelectedFormId(null)}
          onUpdated={handleFormUpdated}
        />
      )}
      {managingBinders && (
        <BinderManagerModal
          binders={binders}
          onClose={() => setManagingBinders(false)}
          onChanged={handleBindersChanged}
        />
      )}
      {managingCustomForms && (
        <CustomFormManagerModal
          onClose={() => setManagingCustomForms(false)}
          onChanged={handleCustomFormsChanged}
        />
      )}
    </div>
  );
}
