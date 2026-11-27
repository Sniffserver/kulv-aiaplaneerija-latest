import React from 'react';
import {
  Undo2,
  Redo2,
  LayoutTemplate,
  MapPin,
  Printer,
  ZoomIn,
  ZoomOut,
  Magnet,
  MousePointer,
  Pentagon,
  Spline,
  ArchiveRestore,
  Leaf,
  Sun,
  Flame
} from 'lucide-react';
import { SOLAR_SEASON_PRESETS, SolarSeasonPresetId } from '../../logic/solarEngine';

interface YardPlanToolbarProps {
  language: 'et' | 'en';
  t: (key: string) => string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showShortcutsModal: boolean;
  onOpenShortcuts: () => void;
  showPresetsModal: boolean;
  onOpenPresets: () => void;
  cadastralCode?: string;
  onOpenCadastral: () => void;
  onOpenBinder: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  toolMode: 'select' | 'polygon' | 'polyline';
  onSelectTool: (tool: 'select' | 'polygon' | 'polyline') => void;
  deletedCount: number;
  showTrashDrawer: boolean;
  onToggleTrash: () => void;
  showSunHeatmap: boolean;
  onToggleSunHeatmap: () => void;
  showCompanionOverlay: boolean;
  onToggleCompanionOverlay: () => void;
  solarHour: number;
  onChangeSolarHour: (hour: number) => void;
  solarAltitude: number;
  solarSeasonId: SolarSeasonPresetId;
  onChangeSolarSeason: (seasonId: SolarSeasonPresetId) => void;
}

export const YardPlanToolbar: React.FC<YardPlanToolbarProps> = ({
  language,
  t,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showShortcutsModal,
  onOpenShortcuts,
  showPresetsModal,
  onOpenPresets,
  cadastralCode,
  onOpenCadastral,
  onOpenBinder,
  onZoomIn,
  onZoomOut,
  onFitView,
  snapToGrid,
  onToggleSnap,
  toolMode,
  onSelectTool,
  deletedCount,
  showTrashDrawer,
  onToggleTrash,
  showSunHeatmap,
  onToggleSunHeatmap,
  showCompanionOverlay,
  onToggleCompanionOverlay,
  solarHour,
  onChangeSolarHour,
  solarAltitude,
  solarSeasonId,
  onChangeSolarSeason
}) => {
  const btnBase: React.CSSProperties = {
    minHeight: '40px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid var(--kulv-border, #C9BFA9)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  };

  return (
    <div
      data-testid="yard_plan_toolbar"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--kulv-border, #C9BFA9)'
      }}
    >
      {/* Left: History, Plot Actions, Viewport, Drawing Tools & Overlays */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          data-testid="yard_undo_btn"
          title={`${t('action_undo')} (Ctrl+Z)`}
          aria-label={t('action_undo')}
          style={{
            ...btnBase,
            backgroundColor: canUndo ? 'var(--kulv-surface-muted, #EFE6D4)' : 'transparent',
            color: canUndo ? 'var(--kulv-text, #2A2E24)' : 'var(--kulv-text-muted, #8A8E85)',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            opacity: canUndo ? 1 : 0.45
          }}
        >
          <Undo2 size={14} />
          <span>{t('action_undo')}</span>
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          data-testid="yard_redo_btn"
          title={`${t('action_redo')} (Ctrl+Y)`}
          aria-label={t('action_redo')}
          style={{
            ...btnBase,
            backgroundColor: canRedo ? 'var(--kulv-surface-muted, #EFE6D4)' : 'transparent',
            color: canRedo ? 'var(--kulv-text, #2A2E24)' : 'var(--kulv-text-muted, #8A8E85)',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            opacity: canRedo ? 1 : 0.45
          }}
        >
          <Redo2 size={14} />
          <span>{t('action_redo')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenPresets}
          data-testid="starter_presets_btn"
          title={t('action_templates')}
          aria-label={t('action_templates')}
          style={{
            ...btnBase,
            border: '1.5px solid var(--kulv-primary, #4F6B45)',
            backgroundColor: showPresetsModal ? 'var(--kulv-primary, #4F6B45)' : 'rgba(79, 107, 69, 0.1)',
            color: showPresetsModal ? '#FFFFFF' : 'var(--kulv-primary, #385A40)',
            fontWeight: 700
          }}
        >
          <LayoutTemplate size={14} />
          <span>{t('action_templates')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenCadastral}
          data-testid="yard_open_cadastral_search_btn"
          title={
            language === 'en'
              ? 'Find your parcel by cadastral ID and official boundaries'
              : 'Leia oma krunt (katastritunnus ja ametlikud krundipiirid)'
          }
          aria-label={t('action_find_parcel')}
          style={{
            ...btnBase,
            border: cadastralCode
              ? '1px solid var(--kulv-primary, #4F6B45)'
              : '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: cadastralCode ? 'rgba(79, 107, 69, 0.12)' : 'var(--kulv-surface-muted, #EFE6D4)',
            color: cadastralCode ? 'var(--kulv-primary, #385A40)' : 'var(--kulv-text, #2A2E24)',
            fontWeight: 700
          }}
        >
          <MapPin size={14} />
          <span>{cadastralCode ? `${cadastralCode}` : t('action_find_parcel')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenBinder}
          data-testid="yard_open_binder_dialog_btn"
          title={
            language === 'en'
              ? 'Open and print full garden binder'
              : 'Ava ja trüki aia täisköide (krundipass, peenrad, seltsilised ja kalender)'
          }
          aria-label={t('action_binder')}
          style={{
            ...btnBase,
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            color: 'var(--kulv-text, #2A2E24)',
            fontWeight: 700
          }}
        >
          <Printer size={14} />
          <span>{t('action_binder')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenShortcuts}
          data-testid="keyboard_shortcuts_btn"
          title={language === 'en' ? 'Keyboard shortcuts (?)' : 'Klaviatuuri kiirklahvid (?)'}
          aria-label={t('action_shortcuts')}
          style={{
            ...btnBase,
            backgroundColor: showShortcutsModal ? 'rgba(79, 107, 69, 0.15)' : 'var(--kulv-surface-muted, #EFE6D4)',
            color: 'var(--kulv-text, #2A2E24)',
            fontWeight: 700
          }}
        >
          <span>?</span>
          <span className="hidden xl:inline">{t('action_shortcuts')}</span>
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--kulv-border, #C9BFA9)', margin: '0 2px' }} />

        <button
          type="button"
          onClick={onZoomIn}
          title={t('action_zoom_in')}
          aria-label={t('action_zoom_in')}
          style={{
            ...btnBase,
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            color: 'var(--kulv-text, #2A2E24)'
          }}
        >
          <ZoomIn size={14} />
          <span className="hidden 2xl:inline">{t('action_zoom_in')}</span>
        </button>

        <button
          type="button"
          onClick={onZoomOut}
          title={t('action_zoom_out')}
          aria-label={t('action_zoom_out')}
          style={{
            ...btnBase,
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            color: 'var(--kulv-text, #2A2E24)'
          }}
        >
          <ZoomOut size={14} />
          <span className="hidden 2xl:inline">{t('action_zoom_out')}</span>
        </button>

        <button
          type="button"
          onClick={onFitView}
          title={t('action_fit_view')}
          aria-label={t('action_fit_view')}
          style={{
            ...btnBase,
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            color: 'var(--kulv-text, #2A2E24)'
          }}
        >
          <span>{t('action_fit_view')}</span>
        </button>

        <button
          type="button"
          onClick={onToggleSnap}
          aria-pressed={snapToGrid}
          title={t('action_snap')}
          style={{
            ...btnBase,
            border: snapToGrid ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: snapToGrid ? 'rgba(79, 107, 69, 0.14)' : 'transparent',
            color: snapToGrid ? 'var(--kulv-primary, #385A40)' : 'var(--kulv-text-muted, #5F675A)',
            fontWeight: snapToGrid ? 700 : 500
          }}
        >
          <Magnet size={14} />
          <span>{t('action_snap')}</span>
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--kulv-border, #C9BFA9)', margin: '0 2px' }} />

        {/* Drawing Tools */}
        <button
          type="button"
          onClick={() => onSelectTool('select')}
          data-testid="tool_select_btn"
          aria-pressed={toolMode === 'select'}
          title={t('action_select_tool')}
          style={{
            ...btnBase,
            border:
              toolMode === 'select'
                ? '1px solid var(--kulv-primary, #4F6B45)'
                : '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: toolMode === 'select' ? 'var(--kulv-surface-muted, #EFE6D4)' : 'transparent',
            color: toolMode === 'select' ? 'var(--kulv-primary, #385A40)' : 'var(--kulv-text, #2A2E24)',
            fontWeight: toolMode === 'select' ? 700 : 500
          }}
        >
          <MousePointer size={14} />
          <span>{t('action_select_tool')}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('polygon')}
          data-testid="tool_polygon_btn"
          aria-pressed={toolMode === 'polygon'}
          title={language === 'en' ? 'Draw custom polygon bed (P)' : 'Vabakujuline polügoon-peenar (P)'}
          style={{
            ...btnBase,
            border:
              toolMode === 'polygon'
                ? '1px solid var(--kulv-accent, #D97A3D)'
                : '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: toolMode === 'polygon' ? 'rgba(217, 122, 61, 0.14)' : 'transparent',
            color: toolMode === 'polygon' ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-text, #2A2E24)',
            fontWeight: toolMode === 'polygon' ? 700 : 500
          }}
        >
          <Pentagon size={14} />
          <span>{t('action_polygon_tool')}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('polyline')}
          data-testid="tool_polyline_btn"
          aria-pressed={toolMode === 'polyline'}
          title={language === 'en' ? 'Draw path or linear hedge' : 'Aiarada / jooneline hekk'}
          style={{
            ...btnBase,
            border:
              toolMode === 'polyline'
                ? '1px solid var(--kulv-accent, #D97A3D)'
                : '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: toolMode === 'polyline' ? 'rgba(217, 122, 61, 0.14)' : 'transparent',
            color: toolMode === 'polyline' ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-text, #2A2E24)',
            fontWeight: toolMode === 'polyline' ? 700 : 500
          }}
        >
          <Spline size={14} />
          <span>{t('action_polyline_tool')}</span>
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--kulv-border, #C9BFA9)', margin: '0 2px' }} />

        {/* 2D Agronomy Overlays: Sun-Exposure Heatmap + Companion Harmony */}
        <button
          type="button"
          onClick={onToggleSunHeatmap}
          data-testid="sun_heatmap_toggle_btn"
          aria-pressed={showSunHeatmap}
          title={
            language === 'en'
              ? 'Show cumulative seasonal sun-exposure heatmap across the yard'
              : 'Kuva krundi hooajaline päikesevalguse soojuskaart'
          }
          style={{
            ...btnBase,
            border: showSunHeatmap
              ? '1px solid var(--kulv-accent, #D97A3D)'
              : '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: showSunHeatmap ? 'var(--kulv-accent, #D97A3D)' : 'rgba(217, 122, 61, 0.08)',
            color: showSunHeatmap ? '#FFFDF8' : 'var(--kulv-text, #2A2E24)',
            fontWeight: 700
          }}
        >
          <Flame size={14} />
          <span>{t('action_sun_heatmap')}</span>
        </button>

        <button
          type="button"
          onClick={onToggleCompanionOverlay}
          data-testid="companion_overlay_toggle_btn"
          aria-pressed={showCompanionOverlay}
          title={
            showCompanionOverlay
              ? language === 'en'
                ? 'Hide Companion Intelligence Overlay'
                : 'Peida kaaslastaimede kiht'
              : language === 'en'
                ? 'Show Companion Intelligence'
                : 'Kaaslastaimede sünergia ja seosed'
          }
          style={{
            ...btnBase,
            border: showCompanionOverlay
              ? '1px solid var(--kulv-primary, #4F6B45)'
              : '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: showCompanionOverlay ? 'var(--kulv-primary, #4F6B45)' : 'rgba(79, 107, 69, 0.08)',
            color: showCompanionOverlay ? '#FFFDF8' : 'var(--kulv-text, #2A2E24)',
            fontWeight: 700
          }}
        >
          <Leaf size={14} />
          <span>{t('action_companions_overlay')}</span>
        </button>

        {/* Soft-deleted Trash recovery button */}
        {deletedCount > 0 && (
          <button
            type="button"
            onClick={onToggleTrash}
            data-testid="trash_drawer_toggle_btn"
            aria-pressed={showTrashDrawer}
            title={language === 'en' ? 'View and restore deleted objects' : 'Vaata ja taasta kustutatud objektid'}
            style={{
              ...btnBase,
              border: '1px solid var(--kulv-accent, #D97A3D)',
              backgroundColor: showTrashDrawer ? 'rgba(217, 122, 61, 0.15)' : 'transparent',
              color: 'var(--kulv-accent, #D97A3D)',
              fontWeight: 700
            }}
          >
            <ArchiveRestore size={14} />
            <span>
              {language === 'en' ? 'Trash' : 'Prügikast'} ({deletedCount})
            </span>
          </button>
        )}
      </div>

      {/* Right: Real-time Sun Simulation Slider & Season Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          padding: '5px 10px',
          borderRadius: '8px',
          fontSize: '11.5px',
          minHeight: '38px'
        }}
      >
        <Sun size={15} color="var(--kulv-accent, #D97A3D)" />
        <span style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>{t('action_sun_simulation')}:</span>
        <select
          aria-label={language === 'en' ? 'Solar season preset' : 'Päikese hooaeg'}
          value={solarSeasonId}
          onChange={(e) => onChangeSolarSeason(e.target.value as SolarSeasonPresetId)}
          data-testid="solar_season_select"
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '6px',
            padding: '3px 6px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--kulv-text, #2A2E24)',
            cursor: 'pointer'
          }}
        >
          {SOLAR_SEASON_PRESETS.map((s) => (
            <option key={s.id} value={s.id}>
              {language === 'en' ? s.labelEn.split(' (')[0] : s.labelEt.split(' (')[0]}
            </option>
          ))}
        </select>
        <input
          type="range"
          min="7"
          max="21"
          step="0.5"
          aria-label={t('solar_hour')}
          value={solarHour}
          onChange={(e) => onChangeSolarHour(parseFloat(e.target.value))}
          style={{ width: '86px', accentColor: 'var(--kulv-accent, #D97A3D)', cursor: 'pointer' }}
        />
        <span className="tabular-nums" style={{ fontWeight: 800, color: 'var(--kulv-accent, #D97A3D)' }}>
          {Math.floor(solarHour)}:{solarHour % 1 !== 0 ? '30' : '00'}
        </span>
        <span className="tabular-nums" style={{ color: 'var(--kulv-text-muted, #5F675A)', fontSize: '10.5px' }}>
          ({Math.round(solarAltitude)}°)
        </span>
      </div>
    </div>
  );
};
