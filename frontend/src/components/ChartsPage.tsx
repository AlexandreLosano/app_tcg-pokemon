import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { Binder, BinderFilter, FormEntry, Generation, Region } from '../types';
import { statusClass } from '../utils/formDisplay';
import DonutChart, { type DonutSegment } from './DonutChart';

type GroupAxis = 'generation' | 'region' | 'binder';

interface GroupBucket {
  key: string;
  label: string;
  forms: FormEntry[];
}

// Mesma paleta usada em statusClass/statusLabel no resto do app (grade, lista, fichário).
const STATUS_COLORS: Record<string, string> = {
  'status-definitive': 'var(--green)',
  'status-trade': 'var(--orange)',
  'status-owned': 'var(--gray)',
  'status-missing': 'var(--red)',
};

const STATUS_LABELS: Record<string, string> = {
  'status-definitive': 'Definitiva',
  'status-trade': 'Precisa de troca',
  'status-owned': 'Tenho',
  'status-missing': 'Não tenho',
};

const GROUP_AXIS_OPTIONS: { value: GroupAxis; label: string }[] = [
  { value: 'generation', label: 'Geração' },
  { value: 'region', label: 'Região' },
  { value: 'binder', label: 'Fichário' },
];

function buildStatusSegments(forms: FormEntry[]): DonutSegment[] {
  const counts: Record<string, number> = {
    'status-definitive': 0,
    'status-trade': 0,
    'status-owned': 0,
    'status-missing': 0,
  };
  for (const form of forms) {
    counts[statusClass(form)] += 1;
  }
  return Object.keys(STATUS_LABELS).map(key => ({
    label: STATUS_LABELS[key],
    value: counts[key],
    color: STATUS_COLORS[key],
  }));
}

function groupBy(forms: FormEntry[], axis: GroupAxis): GroupBucket[] {
  const buckets = new Map<string, GroupBucket>();
  for (const form of forms) {
    let id: number | null;
    let label: string;
    if (axis === 'generation') {
      id = form.generation_id;
      label = form.generation_display_name ?? 'Sem geração';
    } else if (axis === 'region') {
      id = form.region_id;
      label = form.region_display_name ?? 'Sem região';
    } else {
      id = form.binder_id;
      label = form.binder_name ?? 'Sem fichário';
    }
    const key = id === null ? `none-${label}` : String(id);
    if (!buckets.has(key)) buckets.set(key, { key, label, forms: [] });
    buckets.get(key)!.forms.push(form);
  }
  return Array.from(buckets.values()).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export default function ChartsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [binders, setBinders] = useState<Binder[]>([]);
  const [forms, setForms] = useState<FormEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [generationId, setGenerationId] = useState<number | undefined>(undefined);
  const [regionId, setRegionId] = useState<number | undefined>(undefined);
  const [binderId, setBinderId] = useState<BinderFilter | undefined>(undefined);
  const [groupAxis, setGroupAxis] = useState<GroupAxis>('generation');

  useEffect(() => {
    Promise.all([api.generations.list(), api.regions.list(), api.binders.list()]).then(([gens, regs, binds]) => {
      setGenerations(gens);
      setRegions(regs);
      setBinders(binds);
    });
  }, []);

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      // Sem "status" no filtro -> backend aplica o padrão "visible", ou seja, formas
      // ocultas (e as marcadas sem necessidade/sem carta ainda) já ficam fora da contagem.
      const data = await api.forms.list({ generation_id: generationId, region_id: regionId, binder_id: binderId });
      setForms(data);
    } finally {
      setLoading(false);
    }
  }, [generationId, regionId, binderId]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const overallSegments = useMemo(() => buildStatusSegments(forms), [forms]);
  const ownedCount = forms.filter(f => f.owned).length;
  const totalCount = forms.length;
  const ownedPct = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  const groups = useMemo(() => groupBy(forms, groupAxis), [forms, groupAxis]);

  const selectedGenerationLabel = generations.find(g => g.id === generationId)?.display_name;
  const selectedRegionLabel = regions.find(r => r.id === regionId)?.display_name;
  const selectedBinderLabel =
    binderId === 'none' ? 'Sem fichário' : binders.find(b => b.id === binderId)?.name;
  const scopeLabel =
    [selectedGenerationLabel, selectedRegionLabel, selectedBinderLabel].filter(Boolean).join(' · ') ||
    'Todas as formas';

  return (
    <div className="charts-page">
      <div className="charts-filters">
        <label>
          Geração
          <select
            value={generationId ?? ''}
            onChange={e => setGenerationId(e.target.value ? Number(e.target.value) : undefined)}
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
            onChange={e => setRegionId(e.target.value ? Number(e.target.value) : undefined)}
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
              setBinderId(
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

        <label>
          Agrupar por
          <select value={groupAxis} onChange={e => setGroupAxis(e.target.value as GroupAxis)}>
            {GROUP_AXIS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <div className="empty-state">Carregando…</div>}

      {!loading && totalCount === 0 && (
        <div className="empty-state">Nenhuma forma encontrada para os filtros selecionados.</div>
      )}

      {!loading && totalCount > 0 && (
        <>
          <section className="chart-section">
            <h2>{scopeLabel}</h2>
            <DonutChart
              segments={overallSegments}
              size={220}
              strokeWidth={28}
              centerPrimary={`${ownedPct}%`}
              centerSecondary={`${ownedCount}/${totalCount}`}
            />
          </section>

          {groups.length > 1 && (
            <section className="chart-section">
              <h2>Por {GROUP_AXIS_OPTIONS.find(opt => opt.value === groupAxis)?.label.toLowerCase()}</h2>
              <div className="donut-grid">
                {groups.map(g => {
                  const owned = g.forms.filter(f => f.owned).length;
                  const total = g.forms.length;
                  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
                  return (
                    <div key={g.key} className="donut-grid-item">
                      <DonutChart
                        segments={[
                          { label: 'Tenho', value: owned, color: 'var(--green)' },
                          { label: 'Não tenho', value: total - owned, color: 'var(--red)' },
                        ]}
                        size={110}
                        strokeWidth={14}
                        centerPrimary={`${pct}%`}
                        showLegend={false}
                      />
                      <div className="donut-grid-item-label">{g.label}</div>
                      <div className="donut-grid-item-count">
                        {owned}/{total}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
