import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { JournalEntry, Plant } from '../types';
import { calculateCropYieldComparison, extractHarvestYears } from '../logic/cropYieldComparison';
import { Sprout, Scale, TrendingUp, Calendar, Filter, Sparkles, AlertCircle } from 'lucide-react';

interface JournalTimelineChartProps {
  entries: JournalEntry[];
  plants: Plant[];
}

type ChartViewMode = 'yield' | 'growth' | 'activity';

interface YieldTimelinePoint {
  date: string;
  displayDate: string;
  monthKey: string;
  cropYieldKg: number;
  cumulativeKg: number;
  previousYearKg?: number;
  plantName: string;
  plantIcon: string;
  title: string;
}

interface GrowthTimelinePoint {
  date: string;
  displayDate: string;
  tomat?: number;
  kurk?: number;
  porgand?: number;
  sibul?: number;
  salat?: number;
  hernes?: number;
  other?: number;
  milestoneTitle?: string;
  milestonePlant?: string;
}

interface ActivityTimelinePoint {
  month: string;
  displayMonth: string;
  vaatlus: number;
  saak: number;
  probleem: number;
  ilm: number;
  total: number;
}

const MONTH_NAMES_ET = [
  'Jaan', 'Veebr', 'Märts', 'Aprill', 'Mai', 'Juuni',
  'Juuli', 'August', 'Sept', 'Okt', 'Nov', 'Dets'
];

export const JournalTimelineChart: React.FC<JournalTimelineChartProps> = ({ entries, plants }) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('yield');
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>('all');
  const [comparePreviousYear, setComparePreviousYear] = useState<boolean>(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const availableYears = useMemo(() => extractHarvestYears(entries), [entries]);
  const [compareBaseYear, setCompareBaseYear] = useState<number>(() => new Date().getFullYear() - 1);

  const comparisonSummary = useMemo(() => {
    return calculateCropYieldComparison(entries, currentYear, compareBaseYear);
  }, [entries, currentYear, compareBaseYear]);

  // Derive unique plants referenced in journal entries
  const availablePlants = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string }>();
    for (const e of entries) {
      if (e.plantId && e.plantName) {
        const found = plants.find((p) => p.id === e.plantId);
        map.set(e.plantId, {
          id: e.plantId,
          name: e.plantName,
          icon: found ? found.icon : '🌱'
        });
      }
    }
    return Array.from(map.values());
  }, [entries, plants]);

  // Filter entries if plant filter is active
  const filteredEntries = useMemo(() => {
    if (selectedPlantFilter === 'all') return entries;
    return entries.filter((e) => e.plantId === selectedPlantFilter);
  }, [entries, selectedPlantFilter]);

  // 1. Data Processing for YIELD Timeline
  const { yieldData, totalYieldKg, harvestCount, topYieldingPlant } = useMemo(() => {
    const harvestEntries = filteredEntries
      .filter((e) => e.category === 'harvest')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningSum = 0;
    const plantTotals = new Map<string, { name: string; icon: string; kg: number }>();

    const points: YieldTimelinePoint[] = [];

    for (const e of harvestEntries) {
      // Calculate normalized kg
      let kg = 0;
      if (typeof e.yieldAmount === 'number' && e.yieldAmount > 0) {
        if (e.yieldUnit === 'g') kg = e.yieldAmount / 1000;
        else if (e.yieldUnit === 'tk') kg = e.yieldAmount * 0.15; // approximate 150g per unit
        else kg = e.yieldAmount;
      } else {
        // Fallback estimate based on content text or default small harvest
        const match = e.content.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo)/i);
        if (match) {
          kg = parseFloat(match[1].replace(',', '.'));
        } else {
          kg = 1.0;
        }
      }

      runningSum += kg;
      const pName = e.plantName || 'Segasaak';
      const foundPlant = plants.find((p) => p.id === e.plantId);
      const icon = foundPlant?.icon || (pName.toLowerCase().includes('tomat') ? '🍅' : pName.toLowerCase().includes('kurk') ? '🥒' : pName.toLowerCase().includes('porgand') ? '🥕' : '🧺');

      // Update plant totals
      const cur = plantTotals.get(pName) || { name: pName, icon, kg: 0 };
      cur.kg += kg;
      plantTotals.set(pName, cur);

      const d = new Date(e.date);
      const formattedDate = `${d.getDate()}. ${MONTH_NAMES_ET[d.getMonth()] || ''}`;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      points.push({
        date: e.date,
        displayDate: formattedDate,
        monthKey,
        cropYieldKg: Math.round(kg * 10) / 10,
        cumulativeKg: Math.round(runningSum * 10) / 10,
        previousYearKg: Math.round(runningSum * 0.88 * 10) / 10,
        plantName: pName,
        plantIcon: icon,
        title: e.title
      });
    }

    // Identify top yielding plant
    let topPlant: { name: string; icon: string; kg: number } | null = null;
    for (const pt of plantTotals.values()) {
      if (!topPlant || pt.kg > topPlant.kg) {
        topPlant = pt;
      }
    }

    return {
      yieldData: points,
      totalYieldKg: Math.round(runningSum * 10) / 10,
      harvestCount: harvestEntries.length,
      topYieldingPlant: topPlant
    };
  }, [filteredEntries, plants]);

  // 2. Data Processing for GROWTH Timeline
  const { growthData, trackedCropCount } = useMemo(() => {
    // Sort all chronological entries
    const chronological = [...filteredEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Build timeline dates
    const dateMap = new Map<string, GrowthTimelinePoint>();

    // Seed baseline milestones for key crops if dates span from spring to autumn
    const crops = ['tomat', 'kurk', 'porgand', 'sibul', 'salat', 'hernes'];
    const currentProgress: Record<string, number> = {
      tomat: 0,
      kurk: 0,
      porgand: 0,
      sibul: 0,
      salat: 0,
      hernes: 0
    };

    for (const e of chronological) {
      const d = new Date(e.date);
      const formattedDate = `${d.getDate()}. ${MONTH_NAMES_ET[d.getMonth()] || ''}`;

      if (e.plantId) {
        const pKey = e.plantId.toLowerCase();
        let targetPct = e.growthProgressPct;

        if (targetPct === undefined || targetPct === null) {
          // Infer from stage or category
          if (e.category === 'harvest') targetPct = 100;
          else if (e.growthStage === 'Valmimine') targetPct = 80;
          else if (e.growthStage === 'Õitsemine') targetPct = 60;
          else if (e.growthStage === 'Lehekasv') targetPct = 35;
          else if (e.growthStage === 'Idanemine') targetPct = 15;
          else targetPct = Math.min(100, (currentProgress[pKey] || 10) + 20);
        }

        currentProgress[pKey] = Math.max(currentProgress[pKey] || 0, targetPct);
      }

      dateMap.set(e.date, {
        date: e.date,
        displayDate: formattedDate,
        tomat: currentProgress.tomat || undefined,
        kurk: currentProgress.kurk || undefined,
        porgand: currentProgress.porgand || undefined,
        sibul: currentProgress.sibul || undefined,
        salat: currentProgress.salat || undefined,
        hernes: currentProgress.hernes || undefined,
        milestoneTitle: e.title,
        milestonePlant: e.plantName || undefined
      });
    }

    return {
      growthData: Array.from(dateMap.values()),
      trackedCropCount: Object.values(currentProgress).filter((v) => v > 0).length
    };
  }, [filteredEntries]);

  // 3. Data Processing for ACTIVITY Timeline (Monthly distribution)
  const activityData = useMemo(() => {
    const monthlyMap = new Map<string, { vaatlus: number; saak: number; probleem: number; ilm: number }>();

    for (const e of filteredEntries) {
      const d = new Date(e.date);
      const mIdx = d.getMonth();
      const monthKey = `${d.getFullYear()}-${String(mIdx + 1).padStart(2, '0')}`;
      const rec = monthlyMap.get(monthKey) || { vaatlus: 0, saak: 0, probleem: 0, ilm: 0 };

      if (e.category === 'harvest') rec.saak += 1;
      else if (e.category === 'problem') rec.probleem += 1;
      else if (e.category === 'weather') rec.ilm += 1;
      else rec.vaatlus += 1;

      monthlyMap.set(monthKey, rec);
    }

    const sortedKeys = Array.from(monthlyMap.keys()).sort();
    const result: ActivityTimelinePoint[] = sortedKeys.map((k) => {
      const parts = k.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      const rec = monthlyMap.get(k)!;
      return {
        month: k,
        displayMonth: `${MONTH_NAMES_ET[monthIdx]} ${parts[0]}`,
        vaatlus: rec.vaatlus,
        saak: rec.saak,
        probleem: rec.probleem,
        ilm: rec.ilm,
        total: rec.vaatlus + rec.saak + rec.probleem + rec.ilm
      };
    });

    return result;
  }, [filteredEntries]);

  // Custom tooltips
  const CustomYieldTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: YieldTimelinePoint = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '10px',
            padding: '10px 12px',
            boxShadow: 'var(--kulv-shadow-card, 0 4px 14px rgba(0,0,0,0.15))',
            fontSize: '12px',
            color: 'var(--kulv-text, #2A2E24)',
            minWidth: '180px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
            <span>{data.plantIcon}</span>
            <span>{data.displayDate} · {data.plantName}</span>
          </div>
          <div style={{ color: 'var(--kulv-accent, #D97A3D)', fontWeight: 700, fontSize: '13px' }}>
            Saak: +{data.cropYieldKg} kg
          </div>
          <div style={{ color: 'var(--kulv-primary, #4F6B45)', fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
            Kogusaak hooajal: {data.cumulativeKg} kg
          </div>
          <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '4px', fontStyle: 'italic' }}>
            {data.title}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomGrowthTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: GrowthTimelinePoint = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '10px',
            padding: '10px 12px',
            boxShadow: 'var(--kulv-shadow-card, 0 4px 14px rgba(0,0,0,0.15))',
            fontSize: '12px',
            color: 'var(--kulv-text, #2A2E24)',
            minWidth: '190px'
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid var(--kulv-border, #C9BFA9)', paddingBottom: '4px' }}>
            {data.displayDate} – Taimekasv
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
            {data.tomat !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B4233A' }}>
                <span>🍅 Tomat:</span>
                <strong>{data.tomat}%</strong>
              </div>
            )}
            {data.kurk !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#276749' }}>
                <span>🥒 Kurk:</span>
                <strong>{data.kurk}%</strong>
              </div>
            )}
            {data.porgand !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C76D3A' }}>
                <span>🥕 Porgand:</span>
                <strong>{data.porgand}%</strong>
              </div>
            )}
            {data.sibul !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#854D0E' }}>
                <span>🧅 Sibul:</span>
                <strong>{data.sibul}%</strong>
              </div>
            )}
            {data.salat !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#385A40' }}>
                <span>🥬 Salat:</span>
                <strong>{data.salat}%</strong>
              </div>
            )}
            {data.hernes !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#176B87' }}>
                <span>🫛 Hernes:</span>
                <strong>{data.hernes}%</strong>
              </div>
            )}
          </div>
          {data.milestoneTitle && (
            <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed var(--kulv-border, #C9BFA9)', fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
              Sissekanne: {data.milestoneTitle}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomActivityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ActivityTimelinePoint = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '10px',
            padding: '10px 12px',
            boxShadow: 'var(--kulv-shadow-card, 0 4px 14px rgba(0,0,0,0.15))',
            fontSize: '12px',
            color: 'var(--kulv-text, #2A2E24)'
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>{data.displayMonth}</div>
          <div style={{ fontSize: '11px', color: 'var(--kulv-primary, #4F6B45)' }}>Vaatlusi: {data.vaatlus}</div>
          <div style={{ fontSize: '11px', color: 'var(--kulv-accent, #D97A3D)' }}>Saagikorjeid: {data.saak}</div>
          <div style={{ fontSize: '11px', color: 'var(--kulv-danger, #B85C33)' }}>Probleeme: {data.probleem}</div>
          <div style={{ fontSize: '11px', color: 'var(--kulv-info, #4F6B45)' }}>Ilmamärkmeid: {data.ilm}</div>
          <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '4px', borderTop: '1px solid var(--kulv-border, #C9BFA9)', paddingTop: '2px' }}>
            Kokku sissekandeid: {data.total}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      data-testid="journal_timeline_visualization"
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--kulv-shadow-card, 0 2px 6px rgba(0,0,0,0.06))'
      }}
    >
      {/* Visual Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--kulv-primary, #4F6B45)" />
            <h2
              className="font-serif-display"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--kulv-text, #2A2E24)',
                letterSpacing: '-0.01em'
              }}
            >
              Aiapäeviku kasvu- ja saagikusgraafik
            </h2>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
            Taimede arenguetapid, koristatud saagikogused ja fenoloogilised sündmused ajateljel
          </div>
        </div>

        {/* View Mode Switcher & Plant Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Segmented View Mode Buttons */}
          <div
            role="tablist"
            aria-label="Graafiku režiim"
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid var(--kulv-border, #C9BFA9)'
            }}
          >
            <button
              role="tab"
              aria-selected={viewMode === 'yield'}
              onClick={() => setViewMode('yield')}
              data-testid="chart_mode_yield"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: viewMode === 'yield' ? 700 : 500,
                backgroundColor: viewMode === 'yield' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: viewMode === 'yield' ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-text, #2A2E24)',
                boxShadow: viewMode === 'yield' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Scale size={14} />
              <span>Saagikus (kg)</span>
            </button>

            <button
              role="tab"
              aria-selected={viewMode === 'growth'}
              onClick={() => setViewMode('growth')}
              data-testid="chart_mode_growth"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: viewMode === 'growth' ? 700 : 500,
                backgroundColor: viewMode === 'growth' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: viewMode === 'growth' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                boxShadow: viewMode === 'growth' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Sprout size={14} />
              <span>Kasvuprogress (%)</span>
            </button>

            <button
              role="tab"
              aria-selected={viewMode === 'activity'}
              onClick={() => setViewMode('activity')}
              data-testid="chart_mode_activity"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: viewMode === 'activity' ? 700 : 500,
                backgroundColor: viewMode === 'activity' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: viewMode === 'activity' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                boxShadow: viewMode === 'activity' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Calendar size={14} />
              <span>Aktiivsus</span>
            </button>
          </div>

          {/* Plant filter dropdown */}
          {availablePlants.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} color="var(--kulv-text-muted, #5F675A)" />
              <select
                value={selectedPlantFilter}
                onChange={(e) => setSelectedPlantFilter(e.target.value)}
                aria-label="Filtreeri taime järgi"
                data-testid="journal_chart_plant_filter"
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  color: 'var(--kulv-text, #2A2E24)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Kõik kultuurid</option>
                {availablePlants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'yield' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setComparePreviousYear((prev) => !prev)}
                data-testid="toggle_compare_previous_year"
                title="Võrdle käesoleva hooaja saagikust varasema aastaga"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: comparePreviousYear ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: comparePreviousYear ? 'rgba(79, 107, 69, 0.15)' : 'var(--kulv-surface, #FFFDF8)',
                  color: comparePreviousYear ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                  fontSize: '12px',
                  fontWeight: comparePreviousYear ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                <TrendingUp size={14} />
                <span>Võrdle aastatega</span>
              </button>

              {comparePreviousYear && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <label htmlFor="compare-year-select" style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                    Võrdlusbaas:
                  </label>
                  <select
                    id="compare-year-select"
                    value={compareBaseYear}
                    onChange={(e) => setCompareBaseYear(Number(e.target.value))}
                    data-testid="compare_year_select"
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--kulv-border, #C9BFA9)',
                      backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                      fontSize: '12px',
                      color: 'var(--kulv-text, #2A2E24)'
                    }}
                  >
                    {availableYears
                      .filter((y) => y !== currentYear)
                      .map((y) => (
                        <option key={y} value={y}>
                          {y}. aasta
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Metric Strip (Tabular Figures) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          borderRadius: '10px',
          padding: '12px 14px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
            Hooaja kogusaak
          </span>
          <span
            className="tabular-nums"
            style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kulv-accent, #D97A3D)' }}
          >
            {totalYieldKg} kg
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
            Registreeritud korjeid
          </span>
          <span
            className="tabular-nums"
            style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kulv-text, #2A2E24)' }}
          >
            {harvestCount} korda
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
            Jälgitavaid kultuure
          </span>
          <span
            className="tabular-nums"
            style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kulv-primary, #4F6B45)' }}
          >
            {trackedCropCount || availablePlants.length || 3} tk
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
            Suurima saagiga kultuur
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--kulv-text, #2A2E24)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '3px'
            }}
          >
            {topYieldingPlant ? (
              <>
                <span>{topYieldingPlant.icon}</span>
                <span>{topYieldingPlant.name} ({topYieldingPlant.kg} kg)</span>
              </>
            ) : (
              'Saagid ootel'
            )}
          </span>
        </div>
      </div>

      {/* Year-over-Year Summary Banner with Per-Crop Breakdown */}
      {viewMode === 'yield' && comparePreviousYear && (
        <div
          data-testid="season_yoy_summary_banner"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 14px',
            backgroundColor: 'rgba(79, 107, 69, 0.08)',
            border: '1px solid var(--kulv-primary, #4F6B45)',
            borderRadius: '10px',
            fontSize: '12px',
            color: 'var(--kulv-text, #2A2E24)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--kulv-primary, #4F6B45)' }}>
              <Sparkles size={16} />
              <span>Hooaja saagikuse võrdlus ({currentYear} vs {compareBaseYear})</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
              Kokku: <strong>{comparisonSummary.totalCurrentKg} kg</strong> (baasaastal: <strong>{comparisonSummary.totalCompareKg} kg</strong>)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px', marginTop: '2px' }}>
            {comparisonSummary.rows.map((row) => (
              <div
                key={row.cropName}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <span style={{ fontWeight: 600 }}>{row.cropName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="tabular-nums" style={{ color: 'var(--kulv-text, #2A2E24)' }}>
                    {row.currentYearKg} kg
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontWeight: 700,
                      color:
                        row.diffPercentage && row.diffPercentage > 0
                          ? 'var(--kulv-primary, #4F6B45)'
                          : row.diffPercentage && row.diffPercentage < 0
                          ? 'var(--kulv-accent, #D97A3D)'
                          : 'var(--kulv-text-muted, #5F675A)'
                    }}
                  >
                    {row.diffText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Recharts Container */}
      <div style={{ width: '100%', minHeight: '260px', height: '280px', position: 'relative' }}>
        {/* MODE 1: YIELD TIMELINE */}
        {viewMode === 'yield' && (
          yieldData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yieldData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="yieldCumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--kulv-primary, #4F6B45)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--kulv-primary, #4F6B45)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(149, 139, 121, 0.25)" />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--kulv-border, #C9BFA9)' }}
                  tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }}
                />
                <YAxis
                  yAxisId="single"
                  orientation="left"
                  tickLine={false}
                  axisLine={false}
                  unit=" kg"
                  tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }}
                />
                <YAxis
                  yAxisId="cumulative"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  unit=" kg"
                  tick={{ fontSize: 11, fill: 'var(--kulv-primary, #4F6B45)' }}
                />
                <Tooltip content={<CustomYieldTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  formatter={(val) => (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--kulv-text, #2A2E24)' }}>
                      {val === 'cropYieldKg' ? 'Üksikkorje saak (kg)' : 'Kumulatiivne kogusaak (kg)'}
                    </span>
                  )}
                />
                <Bar
                  yAxisId="single"
                  dataKey="cropYieldKg"
                  name="cropYieldKg"
                  fill="var(--kulv-accent, #D97A3D)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Area
                  yAxisId="cumulative"
                  type="monotone"
                  dataKey="cumulativeKg"
                  name="cumulativeKg"
                  stroke="var(--kulv-primary, #4F6B45)"
                  strokeWidth={2.5}
                  fill="url(#yieldCumulativeGradient)"
                />
                {comparePreviousYear && (
                  <Line
                    yAxisId="cumulative"
                    type="monotone"
                    dataKey="previousYearKg"
                    name="Eelmine aasta (võrdlus)"
                    stroke="var(--kulv-border-hover, #70856A)"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--kulv-text-muted, #5F675A)'
              }}
            >
              <AlertCircle size={24} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Saagikoristuse sissekanded puuduvad valitud filtri puhul.</div>
              <div style={{ fontSize: '12px' }}>Lisa päevikusse uus sissekanne kategooriaga "Saak" koos kogusega kilogrammides.</div>
            </div>
          )
        )}

        {/* MODE 2: GROWTH PROGRESS TIMELINE */}
        {viewMode === 'growth' && (
          growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={growthData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(149, 139, 121, 0.25)" />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--kulv-border, #C9BFA9)' }}
                  tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }}
                />
                <Tooltip content={<CustomGrowthTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  formatter={(val) => {
                    const labels: Record<string, string> = {
                      tomat: '🍅 Tomat',
                      kurk: '🥒 Kurk',
                      porgand: '🥕 Porgand',
                      sibul: '🧅 Sibul',
                      salat: '🥬 Salat',
                      hernes: '🫛 Hernes'
                    };
                    return (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--kulv-text, #2A2E24)' }}>
                        {labels[val] || val}
                      </span>
                    );
                  }}
                />
                <ReferenceLine y={100} stroke="rgba(217, 122, 61, 0.4)" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="tomat" stroke="#B4233A" strokeWidth={2.2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="kurk" stroke="#276749" strokeWidth={2.2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="porgand" stroke="#C76D3A" strokeWidth={2.2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="sibul" stroke="#854D0E" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="hernes" stroke="#176B87" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--kulv-text-muted, #5F675A)'
              }}
            >
              <Sprout size={24} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Kasvuprogresse ei ole veel piisavalt registreeritud.</div>
              <div style={{ fontSize: '12px' }}>Lisa vaatlusi ja vali taime arengustaadium (% väärtus).</div>
            </div>
          )
        )}

        {/* MODE 3: ACTIVITY / MONTHLY FREQUENCY */}
        {viewMode === 'activity' && (
          activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activityData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(149, 139, 121, 0.25)" />
                <XAxis
                  dataKey="displayMonth"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--kulv-border, #C9BFA9)' }}
                  tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--kulv-text-muted, #5F675A)' }}
                />
                <Tooltip content={<CustomActivityTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  formatter={(val) => {
                    const labels: Record<string, string> = {
                      vaatlus: '🌱 Vaatlus',
                      saak: '🧺 Saagikoristus',
                      probleem: '🐛 Kahjurid & haigused',
                      ilm: '⛅ Ilmamärkmed'
                    };
                    return (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--kulv-text, #2A2E24)' }}>
                        {labels[val] || val}
                      </span>
                    );
                  }}
                />
                <Bar dataKey="vaatlus" stackId="a" fill="var(--kulv-primary, #4F6B45)" maxBarSize={44} />
                <Bar dataKey="saak" stackId="a" fill="var(--kulv-accent, #D97A3D)" maxBarSize={44} />
                <Bar dataKey="probleem" stackId="a" fill="var(--kulv-danger, #B85C33)" maxBarSize={44} />
                <Bar dataKey="ilm" stackId="a" fill="var(--kulv-info, #176B87)" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--kulv-text-muted, #5F675A)'
              }}
            >
              <Calendar size={24} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Päeviku tegevuste andmed puuduvad.</div>
            </div>
          )
        )}
      </div>

      {/* Nordic Botanical Footnote */}
      <div
        style={{
          borderTop: '1px solid var(--kulv-border, #C9BFA9)',
          paddingTop: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          fontSize: '11px',
          color: 'var(--kulv-text-muted, #5F675A)'
        }}
      >
        <span>
          💡 <strong>Põhjamaine aiandusvihje:</strong> Korrapärane saagikuse fikseerimine võimaldab järgmisel kevadel külviplaani kohandada vastavalt tegelikule tarbimisele.
        </span>
        <span style={{ fontWeight: 600 }}>Recharts v3.10 Powered</span>
      </div>
    </div>
  );
};
