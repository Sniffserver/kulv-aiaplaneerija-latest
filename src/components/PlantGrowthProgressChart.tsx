import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { BedPlantingCell, Plant } from '../types';
import { Calendar, Sprout, CheckCircle2, Clock, Info, ShieldCheck } from 'lucide-react';

export interface PlantGrowthProgressChartProps {
  planting: BedPlantingCell;
  plant: Plant;
  referenceDate?: string; // Optional reference date, defaults to today
}

interface StageMilestone {
  key: string;
  name: string;
  pctRange: [number, number];
  dayRange: [number, number];
  dateRange: [string, string];
  tip: string;
  icon: string;
}

function addDaysToDate(baseDateStr: string, days: number): Date {
  const parts = baseDateStr.split('-');
  const y = parseInt(parts[0], 10) || new Date().getFullYear();
  const m = (parseInt(parts[1], 10) || 5) - 1;
  const d = parseInt(parts[2], 10) || 1;
  const date = new Date(y, m, d);
  date.setDate(date.getDate() + days);
  return date;
}

function formatDateEst(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${d}.${m}`;
}

export const PlantGrowthProgressChart: React.FC<PlantGrowthProgressChartProps> = ({
  planting,
  plant,
  referenceDate
}) => {
  const totalDays = Math.max(20, plant.daysToMaturity || 70);
  const plantDateStr = planting.dateAdded || '2026-05-15';

  const { chartData, daysElapsed, progressPct, daysRemaining, currentStage, stages, todayLabel } = useMemo(() => {
    const today = referenceDate ? new Date(referenceDate) : new Date();
    const parts = plantDateStr.split('-');
    const pYear = parseInt(parts[0], 10) || today.getFullYear();
    const pMonth = (parseInt(parts[1], 10) || 5) - 1;
    const pDay = parseInt(parts[2], 10) || 1;
    const plantDate = new Date(pYear, pMonth, pDay);

    const diffMs = today.getTime() - plantDate.getTime();
    const elapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const pct = Math.min(100, Math.round((elapsed / totalDays) * 100));
    const remaining = Math.max(0, totalDays - elapsed);

    // Stages definitions
    const stageDefs: StageMilestone[] = [
      {
        key: 'germination',
        name: 'Idanemine',
        pctRange: [0, 15],
        dayRange: [0, Math.round(totalDays * 0.15)],
        dateRange: [formatDateEst(plantDate), formatDateEst(addDaysToDate(plantDateStr, Math.round(totalDays * 0.15)))],
        tip: 'Hoia muld pidevalt niiske ja kaitse öökülma eest.',
        icon: '🌱'
      },
      {
        key: 'vegetative',
        name: 'Taimetõus & lehemass',
        pctRange: [15, 45],
        dayRange: [Math.round(totalDays * 0.15), Math.round(totalDays * 0.45)],
        dateRange: [
          formatDateEst(addDaysToDate(plantDateStr, Math.round(totalDays * 0.15))),
          formatDateEst(addDaysToDate(plantDateStr, Math.round(totalDays * 0.45)))
        ],
        tip: 'Kasta sügavalt ja taga vähemalt 6h päikest.',
        icon: '🌿'
      },
      {
        key: 'flowering',
        name: 'Õitsemine & viljumine',
        pctRange: [45, 75],
        dayRange: [Math.round(totalDays * 0.45), Math.round(totalDays * 0.75)],
        dateRange: [
          formatDateEst(addDaysToDate(plantDateStr, Math.round(totalDays * 0.45))),
          formatDateEst(addDaysToDate(plantDateStr, Math.round(totalDays * 0.75)))
        ],
        tip: 'Suurenda kaaliumirikka komposti/väetise lisamist, tolmeldajad!',
        icon: '🌸'
      },
      {
        key: 'ripening',
        name: 'Valmimine',
        pctRange: [75, 100],
        dayRange: [Math.round(totalDays * 0.75), totalDays],
        dateRange: [
          formatDateEst(addDaysToDate(plantDateStr, Math.round(totalDays * 0.75))),
          formatDateEst(addDaysToDate(plantDateStr, totalDays))
        ],
        tip: 'Vähenda liigset kastmist, et maitsed kontsentreeruksid.',
        icon: '☀️'
      },
      {
        key: 'harvest',
        name: 'Saagikoristus',
        pctRange: [100, 115],
        dayRange: [totalDays, Math.round(totalDays * 1.15)],
        dateRange: [
          formatDateEst(addDaysToDate(plantDateStr, totalDays)),
          formatDateEst(addDaysToDate(plantDateStr, Math.round(totalDays * 1.15)))
        ],
        tip: 'Korista hommikul pärast kaste kuivamist parima maitse tagamiseks.',
        icon: '🧺'
      }
    ];

    let activeStage = stageDefs[0];
    for (const s of stageDefs) {
      if (pct >= s.pctRange[0]) {
        activeStage = s;
      }
    }

    // Generate curve samples
    const numPoints = 14;
    const maxDay = Math.round(totalDays * 1.12);
    const step = maxDay / (numPoints - 1);
    const clampedElapsed = Math.min(maxDay, elapsed);

    const dayPoints = new Set<number>();
    for (let i = 0; i < numPoints; i++) {
      dayPoints.add(Math.round(i * step));
    }
    dayPoints.add(clampedElapsed);
    const sortedDays = Array.from(dayPoints).sort((a, b) => a - b);

    const data = sortedDays.map((d) => {
      const curDate = addDaysToDate(plantDateStr, d);
      // S-curve logistic formula
      const xNorm = (d / totalDays) * 6 - 3; // range -3 to +3
      const sigmoid = 1 / (1 + Math.exp(-xNorm));
      const calculatedPct = Math.min(100, Math.max(0, Math.round(sigmoid * 100)));

      let stageName = 'Idanemine';
      if (d >= totalDays) stageName = 'Saak';
      else if (d >= totalDays * 0.75) stageName = 'Valmimine';
      else if (d >= totalDays * 0.45) stageName = 'Õitsemine';
      else if (d >= totalDays * 0.15) stageName = 'Lehekasv';

      return {
        day: d,
        displayLabel: `P${d}`,
        dateStr: formatDateEst(curDate),
        maturityPct: calculatedPct,
        stage: stageName
      };
    });

    const todayLabelString = `P${clampedElapsed}`;

    return {
      chartData: data,
      daysElapsed: elapsed,
      clampedElapsed,
      maxDay,
      progressPct: pct,
      daysRemaining: remaining,
      currentStage: activeStage,
      stages: stageDefs,
      todayLabel: todayLabelString
    };
  }, [plantDateStr, totalDays, referenceDate]);

  return (
    <div
      data-testid="plant_growth_progress_chart"
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '14px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.06))'
      }}
    >
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '20px' }}>{plant.icon}</span>
            <span
              className="font-serif-display"
              style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
            >
              {plant.name} – Kasvu edenemine
            </span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--kulv-text-muted, #5F675A)',
              marginTop: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>
              Istutatud: <strong>{plantDateStr}</strong>
            </span>
            <span>·</span>
            <span>
              Täisküpsus: <strong>{totalDays} päeva</strong>
            </span>
          </div>
        </div>

        {/* Current status badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: progressPct >= 100 ? 'rgba(217, 122, 61, 0.15)' : 'rgba(79, 107, 69, 0.15)',
            border: `1px solid ${progressPct >= 100 ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-primary, #4F6B45)'}`,
            padding: '6px 10px',
            borderRadius: '8px'
          }}
        >
          <span style={{ fontSize: '14px' }}>{currentStage.icon}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
              Hetkestaadium
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: progressPct >= 100 ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-primary, #4F6B45)'
              }}
            >
              {currentStage.name} ({progressPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Progress metrics row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '8px',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          borderRadius: '10px',
          padding: '10px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Möödunud</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
            {daysElapsed} päeva
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Saagikoristuseni</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: daysRemaining === 0 ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-primary, #4F6B45)'
            }}
          >
            {daysRemaining === 0 ? 'Valmis korjamiseks!' : `~${daysRemaining} päeva`}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Küpsusaste</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>{progressPct}%</span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div style={{ width: '100%', height: 180, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4F6B45" stopOpacity={0.8} />
                <stop offset="70%" stopColor="#70856A" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#D97A3D" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(201, 191, 169, 0.4)" />
            <XAxis
              dataKey="displayLabel"
              tickLine={false}
              axisLine={{ stroke: 'var(--kulv-border, #C9BFA9)' }}
              tick={{ fontSize: 10, fill: 'var(--kulv-text-muted, #5F675A)' }}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              unit="%"
              tick={{ fontSize: 10, fill: 'var(--kulv-text-muted, #5F675A)' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div
                      style={{
                        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                        border: '1px solid var(--kulv-border, #C9BFA9)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        fontSize: '11px'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                        Päev {data.day} · {data.dateStr}
                      </div>
                      <div style={{ color: 'var(--kulv-primary, #4F6B45)', fontWeight: 600, marginTop: '2px' }}>
                        Staadium: {data.stage}
                      </div>
                      <div style={{ color: 'var(--kulv-accent, #D97A3D)', fontWeight: 700, marginTop: '2px' }}>
                        Küpsus: {data.maturityPct}%
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="maturityPct"
              stroke="var(--kulv-primary, #4F6B45)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#growthGradient)"
            />
            {/* Today reference line */}
            <ReferenceLine
              x={todayLabel}
              stroke="var(--kulv-accent, #D97A3D)"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: `Täna (${progressPct}%)`,
                position: 'top',
                fill: 'var(--kulv-accent, #D97A3D)',
                fontSize: 10,
                fontWeight: 700
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stage milestones pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>Taime arenguetapid:</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
          {stages.map((stg) => {
            const isCurrent = stg.key === currentStage.key;
            const isPast = progressPct > stg.pctRange[1];

            return (
              <div
                key={stg.key}
                style={{
                  backgroundColor: isCurrent
                    ? 'var(--kulv-accent-soft, #F3D8C2)'
                    : isPast
                      ? 'rgba(79, 107, 69, 0.1)'
                      : 'var(--kulv-surface-muted, #EFE6D4)',
                  border: isCurrent
                    ? '1.5px solid var(--kulv-accent, #D97A3D)'
                    : isPast
                      ? '1px solid rgba(79, 107, 69, 0.3)'
                      : '1px solid var(--kulv-border, #C9BFA9)',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                    {stg.icon} {stg.name}
                  </span>
                  {isPast && <CheckCircle2 size={12} color="var(--kulv-primary, #4F6B45)" />}
                  {isCurrent && <Clock size={12} color="var(--kulv-accent, #D97A3D)" />}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                  {stg.dateRange[0]} – {stg.dateRange[1]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current phase care advice */}
        <div
          style={{
            backgroundColor: 'rgba(79, 107, 69, 0.08)',
            border: '1px solid rgba(79, 107, 69, 0.25)',
            borderRadius: '8px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--kulv-text, #2A2E24)',
            marginTop: '2px'
          }}
        >
          <Info size={14} color="var(--kulv-primary, #4F6B45)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Põhjamaine soovitus praeguseks etapiks:</strong> {currentStage.tip}
          </span>
        </div>
      </div>
    </div>
  );
};
