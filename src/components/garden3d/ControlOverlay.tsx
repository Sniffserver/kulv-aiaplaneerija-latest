import React, { useState } from 'react';
import {
  PanelTopClose,
  PanelTopOpen,
  Sun,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Compass,
  Clock,
  Check,
  Maximize2,
  Minimize2,
  Zap,
  Gauge
} from 'lucide-react';
import { useYardStore } from '../../stores/yardStore';
import { useGarden } from '../../context/GardenContext';
import { SOLAR_SEASON_PRESETS, SolarSeasonPresetId } from '../../logic/solarEngine';
import { Camera, Sprout } from 'lucide-react';

interface ControlOverlayProps {
  onBackTo2D: () => void;
  solarHour: number;
  setSolarHour: (h: number) => void;
  hourDisplay: string;
  solarAltitude: number;
  solarAzimuth: number;
  daylightHours: number;
  shadowsEnabled: boolean;
  onToggleShadows: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  performanceMode?: boolean;
  onTogglePerformance?: () => void;
  cameraPreset?: 'top' | 'iso' | 'ground';
  onSelectCameraPreset?: (preset: 'top' | 'iso' | 'ground') => void;
  showCompanionPins?: boolean;
  onToggleCompanionPins?: () => void;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  onBackTo2D,
  solarHour,
  setSolarHour,
  hourDisplay,
  solarAltitude,
  solarAzimuth,
  daylightHours,
  shadowsEnabled,
  onToggleShadows,
  isFullScreen = false,
  onToggleFullScreen,
  performanceMode = false,
  onTogglePerformance,
  cameraPreset = 'iso',
  onSelectCameraPreset,
  showCompanionPins = true,
  onToggleCompanionPins
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { language } = useGarden();

  const solarSeasonId = useYardStore((s) => s.solarSeasonId);
  const setSolarSeasonId = useYardStore((s) => s.setSolarSeasonId);

  const activeSeason = SOLAR_SEASON_PRESETS.find((s) => s.id === solarSeasonId) || SOLAR_SEASON_PRESETS[0];

  return (
    <div
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 w-[95vw] max-w-[720px] z-20 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-all duration-300 ease-in-out ${
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-42px)]'
      }`}
    >
      <div className="bg-[#182319]/95 backdrop-blur-md rounded-2xl border border-[#3E5A35]/70 shadow-2xl overflow-hidden text-[#FAF6ED]">
        {/* Top Drawer Handle & Collapse/Expand Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2.5 px-4 flex items-center justify-between text-xs font-medium text-[#C9BFA9] hover:text-[#FAF6ED] bg-[#121B13]/70 border-b border-[#2D3E2F]/80 transition-colors min-h-[44px]"
          title={isExpanded ? 'Peida juhtpaneel' : 'Ava juhtpaneel'}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white tracking-wide">
              {language === 'en' ? '3D Sun & Yard Simulation' : '3D Päikese & Krundi Simulatsioon'}
            </span>
            <span className="text-[11px] text-[#A3B899] font-mono ml-1 hidden xs:inline">
              · {activeSeason.dateStr} {hourDisplay}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#C9BFA9]">
            <span>
              {isExpanded
                ? language === 'en'
                  ? 'Collapse'
                  : 'Ahenda'
                : language === 'en'
                  ? 'Expand controls'
                  : 'Ava juhtnupud'}
            </span>
            {isExpanded ? <PanelTopClose size={16} /> : <PanelTopOpen size={16} />}
          </div>
        </button>

        {/* Inner Controls Grid */}
        <div className="p-3 sm:p-4 flex flex-col gap-3">
          {/* Row 1: 2D Switcher, Fullscreen Toggle, Performance Mode, Shadow Toggle, Realtime Solar Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={onBackTo2D}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FAF6ED] bg-[#2D3E2F] hover:bg-[#385A40] rounded-lg transition-colors border border-[#4F6B45]/60 min-h-[40px]"
                title={language === 'en' ? 'Switch back to 2D master plan' : 'Lülitu tagasi 2D krundiplaanile'}
              >
                <Eye size={15} className="text-emerald-300" />
                <span>{language === 'en' ? '2D Plan' : '2D Plaan'}</span>
              </button>

              {onToggleFullScreen && (
                <button
                  onClick={onToggleFullScreen}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border min-h-[40px] ${
                    isFullScreen
                      ? 'bg-amber-600/30 text-amber-200 border-amber-500/70'
                      : 'bg-[#2D3E2F] text-[#FAF6ED] hover:bg-[#385A40] border-[#4F6B45]/60'
                  }`}
                  title={
                    isFullScreen
                      ? language === 'en'
                        ? 'Exit full screen (Esc)'
                        : 'Välju täisekraanilt (Esc)'
                      : language === 'en'
                        ? 'Expand 3D viewport to full screen'
                        : 'Laienda 3D vaade täisekraanile'
                  }
                >
                  {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  <span className="hidden sm:inline">
                    {isFullScreen
                      ? language === 'en'
                        ? 'Exit Full'
                        : 'Välju'
                      : language === 'en'
                        ? 'Full Screen'
                        : 'Täisekraan'}
                  </span>
                </button>
              )}

              {onTogglePerformance && (
                <button
                  onClick={onTogglePerformance}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border min-h-[40px] ${
                    performanceMode
                      ? 'bg-emerald-700/40 text-emerald-300 border-emerald-500/60'
                      : 'bg-[#222E23] text-[#A3B899] border-[#3E5A35]/50 hover:bg-[#2D3E2F]'
                  }`}
                  title={
                    language === 'en'
                      ? 'Toggle battery/performance mode (caps resolution to 1x for smoother FPS on mobile)'
                      : 'Lülita jõudluse/aku säästurežiim sisse (1x resolutsioon sujuvamaks kaadrisageduseks mobiilis)'
                  }
                >
                  <Zap size={14} className={performanceMode ? 'text-emerald-400' : 'text-[#7A8E72]'} />
                  <span>{performanceMode ? 'FPS Boost' : 'Kõrglahutus'}</span>
                </button>
              )}

              <button
                onClick={onToggleShadows}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors border min-h-[40px] ${
                  shadowsEnabled
                    ? 'bg-[#385A40] text-white border-emerald-400/60 shadow-inner'
                    : 'bg-[#222E23] text-[#A3B899] border-[#3E5A35]/50 hover:bg-[#2D3E2F]'
                }`}
                title={language === 'en' ? 'Toggle dynamic shadows' : 'Lülita dünaamilised varjud sisse/välja'}
              >
                <Layers size={14} />
                <span className="hidden xs:inline">
                  {shadowsEnabled
                    ? language === 'en'
                      ? 'Shadows: ON'
                      : 'Varjud: SEES'
                    : language === 'en'
                      ? 'Shadows: OFF'
                      : 'Varjud: VÄLJAS'}
                </span>
              </button>

              {/* 3D Camera Presets */}
              {onSelectCameraPreset && (
                <div className="flex items-center gap-1 bg-[#101711]/80 p-1 rounded-lg border border-[#2D3E2F] min-h-[40px]">
                  <Camera size={13} className="text-[#A7C080] ml-1" />
                  <button
                    onClick={() => onSelectCameraPreset('top')}
                    className={`px-2 py-1 text-[11px] font-semibold tracking-wide rounded transition-all ${
                      cameraPreset === 'top'
                        ? 'bg-[#385A40] text-white border border-[#A7C080] shadow-[0_0_8px_rgba(167,192,128,0.35)]'
                        : 'text-[#D2DACB] hover:text-white'
                    }`}
                    title={language === 'en' ? 'Top-down bird eye view (90°)' : 'Plaaniline linnulennuvaade (90°)'}
                  >
                    {language === 'en' ? 'Top' : 'Plaan'}
                  </button>
                  <button
                    onClick={() => onSelectCameraPreset('iso')}
                    className={`px-2 py-1 text-[11px] font-semibold tracking-wide rounded transition-all ${
                      cameraPreset === 'iso'
                        ? 'bg-[#385A40] text-white border border-[#A7C080] shadow-[0_0_8px_rgba(167,192,128,0.35)]'
                        : 'text-[#D2DACB] hover:text-white'
                    }`}
                    title={language === 'en' ? 'Isometric 45° view' : 'Isomeetriline vaade (45°)'}
                  >
                    {language === 'en' ? 'Iso' : 'Isomeetria'}
                  </button>
                  <button
                    onClick={() => onSelectCameraPreset('ground')}
                    className={`px-2 py-1 text-[11px] font-semibold tracking-wide rounded transition-all ${
                      cameraPreset === 'ground'
                        ? 'bg-[#385A40] text-white border border-[#A7C080] shadow-[0_0_8px_rgba(167,192,128,0.35)]'
                        : 'text-[#D2DACB] hover:text-white'
                    }`}
                    title={language === 'en' ? 'Ground level pedestrian view' : 'Maapinnalt jalakäija vaade'}
                  >
                    {language === 'en' ? 'Ground' : 'Maapind'}
                  </button>
                </div>
              )}

              {/* 3D Companion Harmony Pins Toggle */}
              {onToggleCompanionPins && (
                <button
                  onClick={onToggleCompanionPins}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold tracking-wide rounded-lg transition-all border min-h-[40px] ${
                    showCompanionPins
                      ? 'bg-[#385A40] text-white border-[#A7C080] shadow-[0_0_8px_rgba(167,192,128,0.35)]'
                      : 'bg-[#222E23] text-[#D2DACB] border-[#3E5A35]/50 hover:bg-[#2D3E2F]'
                  }`}
                  title={language === 'en' ? 'Toggle companion planting harmony pins' : 'Lülita kaaslaste harmoonia märgid sisse/välja'}
                >
                  <Sprout size={14} className={showCompanionPins ? 'text-[#CDE6A8]' : 'text-[#8EA883]'} />
                  <span className="hidden sm:inline">{language === 'en' ? 'Companions' : 'Kaaslased'}</span>
                </button>
              )}
            </div>

            {/* Solar Elevation & Azimuth Badges */}
            <div className="flex items-center gap-2 bg-[#101711]/70 px-2.5 py-1.5 rounded-lg border border-[#2D3E2F] text-[11px] font-mono text-[#C9BFA9] min-h-[40px]">
              <div className="flex items-center gap-1">
                <Sun size={13} className="text-amber-400" />
                <span>{Math.round(solarAltitude)}°</span>
                <span className="text-[10px] text-[#7A8E72]">{language === 'en' ? 'alt' : 'kõrgus'}</span>
              </div>
              <span className="text-[#3E5A35]">|</span>
              <div className="flex items-center gap-1">
                <Compass size={13} className="text-sky-400" />
                <span>{Math.round(solarAzimuth)}°</span>
                <span className="text-[10px] text-[#7A8E72]">{language === 'en' ? 'az' : 'asimuut'}</span>
              </div>
              <span className="text-[#3E5A35]">|</span>
              <div className="flex items-center gap-1 text-[#E2E8F0]">
                <span>{daylightHours.toFixed(1)}h</span>
                <span className="text-[10px] text-[#7A8E72]">{language === 'en' ? 'day' : 'päev'}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Seasonal Presets (Midsummer, Late Summer, Spring, Autumn) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#A3B899]">
              <span className="flex items-center gap-1 font-semibold text-[#FAF6ED]">
                <Calendar size={13} className="text-emerald-400" />
                <span>{language === 'en' ? 'Seasonal Solar Angle:' : 'Aastaaja päikesenurk:'}</span>
              </span>
              <span className="text-[10px] text-[#C9BFA9] italic hidden sm:inline">
                {language === 'en' ? activeSeason.descriptionEn : activeSeason.descriptionEt}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {SOLAR_SEASON_PRESETS.map((season) => {
                const isSelected = season.id === solarSeasonId;
                return (
                  <button
                    key={season.id}
                    onClick={() => setSolarSeasonId(season.id as SolarSeasonPresetId)}
                    className={`px-2.5 py-2 rounded-lg text-left text-xs transition-all border flex flex-col justify-between gap-0.5 min-h-[44px] ${
                      isSelected
                        ? 'bg-[#385A40] text-white border-emerald-400 shadow-sm font-semibold'
                        : 'bg-[#212C22] text-[#C9BFA9] border-[#344835] hover:bg-[#2A372B] hover:text-[#FAF6ED]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[11px]">
                        {season.id === 'midsummer'
                          ? language === 'en'
                            ? 'Midsummer'
                            : 'Jaanipäev'
                          : season.id === 'late_summer'
                            ? language === 'en'
                              ? 'Late Summer'
                              : 'Südasuvi'
                            : season.id === 'spring_equinox'
                              ? language === 'en'
                                ? 'Spring Equinox'
                                : 'Kevad'
                              : language === 'en'
                                ? 'Autumn'
                                : 'Sügis'}
                      </span>
                      {isSelected && <Check size={12} className="text-emerald-300 flex-shrink-0" />}
                    </div>
                    <span className="text-[10px] text-[#A3B899] font-mono">{season.dateStr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Solar Hour Slider & Quick Buttons */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-[#2D3E2F]/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-400" />
                <span className="text-xs font-bold text-white font-mono bg-[#121B13] px-2 py-0.5 rounded border border-[#2D3E2F]">
                  {hourDisplay}
                </span>
                <span className="text-[11px] text-[#A3B899] hidden sm:inline">
                  {solarHour < 11
                    ? language === 'en'
                      ? 'Morning light'
                      : 'Hommikuvalgus'
                    : solarHour < 16
                      ? language === 'en'
                        ? 'Midday zenith'
                        : 'Keskpäeva seniit'
                      : language === 'en'
                        ? 'Golden evening'
                        : 'Õhtune kuldne tund'}
                </span>
              </div>

              {/* Quick Time Presets */}
              <div className="flex items-center gap-1">
                {[
                  { label: '09:00', val: 9.0 },
                  { label: '13:00', val: 13.0 },
                  { label: '18:00', val: 18.0 }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setSolarHour(item.val)}
                    className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                      Math.abs(solarHour - item.val) < 0.25
                        ? 'bg-[#385A40] text-white border-emerald-400'
                        : 'bg-[#212C22] text-[#A3B899] border-[#344835] hover:bg-[#2A372B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="range"
              min="5.5"
              max="22.5"
              step="0.25"
              value={solarHour}
              onChange={(e) => setSolarHour(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-[#212C22] rounded-lg appearance-none cursor-pointer accent-[#D97A3D]"
              title={
                language === 'en' ? `Change solar time (${hourDisplay})` : `Muuda päikese kellaaega (${hourDisplay})`
              }
              aria-label={language === 'en' ? 'Solar time in 3D view' : 'Päikese kellaaeg 3D vaates'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
