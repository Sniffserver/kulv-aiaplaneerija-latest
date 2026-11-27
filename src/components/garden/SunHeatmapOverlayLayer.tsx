import React, { useMemo } from 'react';
import { SunExposureHeatmap, SOLAR_SEASON_PRESETS, SolarSeasonPresetId } from '../../logic/solarEngine';
import { Sun } from 'lucide-react';

interface SunHeatmapOverlayLayerProps {
  heatmap: SunExposureHeatmap;
  zoom: number;
}

function getBucketColor(sunHours: number): { fill: string; key: string } {
  if (sunHours >= 7.5) {
    return { fill: 'rgba(234, 179, 8, 0.34)', key: 'peak' };
  }
  if (sunHours >= 6.5) {
    return { fill: 'rgba(245, 194, 66, 0.27)', key: 'full' };
  }
  if (sunHours >= 4.5) {
    return { fill: 'rgba(143, 181, 115, 0.28)', key: 'partial' };
  }
  if (sunHours >= 2.5) {
    return { fill: 'rgba(104, 146, 184, 0.30)', key: 'shade' };
  }
  return { fill: 'rgba(65, 82, 108, 0.40)', key: 'deep' };
}

interface MergedHeatmapRun {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

/**
 * Renders the grid-sampled solar exposure heatmap in SVG.
 * Merges horizontally contiguous cells sharing the same color tier to keep SVG DOM tiny and 60 FPS smooth.
 */
export const SunHeatmapOverlayLayer: React.FC<SunHeatmapOverlayLayerProps> = React.memo(({ heatmap, zoom }) => {
  const mergedRuns = useMemo(() => {
    const runs: MergedHeatmapRun[] = [];
    const { cols, rows, cells } = heatmap;

    for (let r = 0; r < rows; r++) {
      let currentRun: (MergedHeatmapRun & { key: string }) | null = null;
      for (let c = 0; c < cols; c++) {
        const cell = cells[r * cols + c];
        if (!cell) continue;
        const bucket = getBucketColor(cell.sunHours);

        if (currentRun && currentRun.key === bucket.key && Math.abs(currentRun.x + currentRun.width - cell.x) < 0.01) {
          currentRun.width += cell.width;
        } else {
          if (currentRun) {
            runs.push({
              x: currentRun.x,
              y: currentRun.y,
              width: currentRun.width,
              height: currentRun.height,
              fill: currentRun.fill
            });
          }
          currentRun = {
            x: cell.x,
            y: cell.y,
            width: cell.width,
            height: cell.height,
            fill: bucket.fill,
            key: bucket.key
          };
        }
      }
      if (currentRun) {
        runs.push({
          x: currentRun.x,
          y: currentRun.y,
          width: currentRun.width,
          height: currentRun.height,
          fill: currentRun.fill
        });
      }
    }

    return runs;
  }, [heatmap]);

  return (
    <g data-testid="sun_heatmap_overlay_layer" pointerEvents="none">
      {mergedRuns.map((run, idx) => (
        <rect
          key={`hm_${idx}`}
          x={run.x * zoom}
          y={run.y * zoom}
          width={run.width * zoom + 0.4}
          height={run.height * zoom + 0.4}
          fill={run.fill}
        />
      ))}
    </g>
  );
});

interface SunHeatmapLegendProps {
  heatmap: SunExposureHeatmap;
  seasonId: SolarSeasonPresetId;
  onSelectSeason: (id: SolarSeasonPresetId) => void;
  hoveredInfo: { x: number; y: number; sunHours: number } | null;
  language: 'et' | 'en';
}

export const SunHeatmapLegend: React.FC<SunHeatmapLegendProps> = ({
  heatmap,
  seasonId,
  onSelectSeason,
  hoveredInfo,
  language
}) => {
  return (
    <div
      data-testid="sun_heatmap_legend"
      role="region"
      aria-label={language === 'en' ? 'Sun exposure heatmap legend' : 'Päikese soojuskaardi legend'}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        backgroundColor: 'rgba(255, 253, 248, 0.96)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '10px',
        padding: '10px 12px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
        zIndex: 14,
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '11px',
        color: 'var(--kulv-text, #2A2E24)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
          <Sun size={14} color="var(--kulv-accent, #D97A3D)" />
          <span>{language === 'en' ? 'Daily Sun Exposure' : 'Päevane päikesevalgus'}</span>
        </div>
        <span className="tabular-nums" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--kulv-text-muted, #5F675A)' }}>
          {language === 'en' ? `Avg ${heatmap.averageYardSunHours}h` : `Keskm. ${heatmap.averageYardSunHours}h`}
        </span>
      </div>

      {/* Season quick selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        {SOLAR_SEASON_PRESETS.map((preset) => {
          const active = preset.id === seasonId;
          const shortLabel =
            language === 'en'
              ? preset.id === 'midsummer'
                ? 'Solstice (Jun)'
                : preset.id === 'late_summer'
                  ? 'Aug 1'
                  : preset.id === 'spring_equinox'
                    ? 'Spring (Mar)'
                    : 'Autumn (Sep)'
              : preset.id === 'midsummer'
                ? 'Jaanipäev (21.06)'
                : preset.id === 'late_summer'
                  ? 'Südasuvi (01.08)'
                  : preset.id === 'spring_equinox'
                    ? 'Kevad (20.03)'
                    : 'Sügis (22.09)';

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectSeason(preset.id)}
              data-testid={`heatmap_season_${preset.id}`}
              style={{
                padding: '4px 6px',
                borderRadius: '6px',
                border: active
                  ? '1px solid var(--kulv-accent, #D97A3D)'
                  : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: active ? 'rgba(217, 122, 61, 0.14)' : 'var(--kulv-surface-muted, #EFE6D4)',
                color: active ? 'var(--kulv-accent-strong, #8F3E14)' : 'var(--kulv-text, #2A2E24)',
                fontSize: '10px',
                fontWeight: active ? 700 : 600,
                cursor: 'pointer',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {shortLabel}
            </button>
          );
        })}
      </div>

      {/* Color ramp legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: 'rgba(234, 179, 8, 0.65)',
              border: '1px solid rgba(180, 130, 8, 0.6)',
              flexShrink: 0
            }}
          />
          <span>{language === 'en' ? 'Full sun (6.5h+)' : 'Täispäike (6.5h+)'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: 'rgba(143, 181, 115, 0.6)',
              border: '1px solid rgba(79, 107, 69, 0.5)',
              flexShrink: 0
            }}
          />
          <span>{language === 'en' ? 'Partial sun (4.5–6.4h)' : 'Poolpäike (4.5–6.4h)'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: 'rgba(104, 146, 184, 0.6)',
              border: '1px solid rgba(65, 102, 138, 0.5)',
              flexShrink: 0
            }}
          />
          <span>{language === 'en' ? 'Partial shade (2.5–4.4h)' : 'Poolvari (2.5–4.4h)'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '3px',
              backgroundColor: 'rgba(65, 82, 108, 0.68)',
              border: '1px solid rgba(45, 58, 78, 0.6)',
              flexShrink: 0
            }}
          />
          <span>{language === 'en' ? 'Deep shade (<2.5h)' : 'Täisvari (<2.5h)'}</span>
        </div>
      </div>

      {/* Live cursor readout */}
      {hoveredInfo && (
        <div
          data-testid="sun_heatmap_cursor_readout"
          className="tabular-nums"
          style={{
            borderTop: '1px solid var(--kulv-border, #C9BFA9)',
            paddingTop: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10.5px',
            fontWeight: 700,
            color: 'var(--kulv-primary, #385A40)'
          }}
        >
          <span>
            {hoveredInfo.x.toFixed(1)}m, {hoveredInfo.y.toFixed(1)}m
          </span>
          <span>
            {hoveredInfo.sunHours.toFixed(1)} h / {heatmap.maxPossibleHours.toFixed(1)} h
          </span>
        </div>
      )}
    </div>
  );
};
