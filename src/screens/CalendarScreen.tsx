import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { PlantingCalendar, PlantTimeline } from '../logic/plantingCalendar';
import { PlantDetailDialog } from '../components/dialogs/PlantDetailDialog';
import { SeasonalSowingPrintDialog } from '../components/dialogs/SeasonalSowingPrintDialog';
import { Plant } from '../types';
import {
  CalendarRange,
  LayoutGrid,
  Search,
  Filter,
  Info,
  Calendar as CalendarIcon,
  Snowflake,
  Sun,
  Sprout,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CloudSun,
  Droplets,
  Thermometer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Printer
} from 'lucide-react';
import { GddEngine } from '../logic/gddEngine';

const MONTH_NAMES = ['Jaan', 'Veebr', 'Märts', 'Apr', 'Mai', 'Juuni', 'Juuli', 'Aug', 'Sept', 'Okt', 'Nov', 'Dets'];

const DAYS_IN_MONTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function dateToDayOfYear(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('-').map(Number);
  const m = parts.length === 3 ? parts[1] : parts[0] || 1;
  const d = parts.length === 3 ? parts[2] : parts[1] || 1;

  let total = 0;
  for (let i = 0; i < m - 1; i++) {
    total += DAYS_IN_MONTHS[i] || 30;
  }
  return total + d;
}

function dayToPercent(day: number): number {
  return Math.min(100, Math.max(0, (day / 365) * 100));
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}`;
  }
  return `${parts[1]}.${parts[0]}`;
}

const isPlantColdHardy = (plant: Plant): boolean => {
  const hardyIds = [
    'porgand',
    'hernes',
    'redis',
    'spinat',
    'lehtpeet',
    'lehtkapsas',
    'sibul',
    'till',
    'küüslauk',
    'pastinaak',
    'naeris'
  ];
  if (hardyIds.some((id) => plant.id.toLowerCase().includes(id))) return true;
  if (
    plant.family.includes('Sarikalised') ||
    plant.family.includes('Rebasheinalised') ||
    plant.family.includes('Lauklised') ||
    plant.family.includes('Ristõielised')
  ) {
    return true;
  }
  return plant.weeksAfterFrostPlantOut == null || plant.weeksAfterFrostPlantOut <= 0;
};

const isPlantWarmDemanding = (plant: Plant): boolean => {
  const tenderIds = [
    'tomat',
    'kurk',
    'basiilik',
    'suvikõrvits',
    'kõrvits',
    'paprika',
    'melon',
    'arbuus',
    'baklažaan',
    'uba'
  ];
  if (tenderIds.some((id) => plant.id.toLowerCase().includes(id))) return true;
  if (plant.family.includes('Maavitsalised') || plant.family.includes('Kõrvitsalised')) return true;
  return plant.weeksAfterFrostPlantOut != null && plant.weeksAfterFrostPlantOut > 0;
};

export const CalendarScreen: React.FC = () => {
  const { plants, beds, settings, weather, isWeatherLoading, refreshWeather, language } = useGarden();

  const [viewMode, setViewMode] = useState<'gantt' | 'cards'>('gantt');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFrostFilter, setSelectedFrostFilter] = useState<'all' | 'safe_now' | 'fleece_needed' | 'warm_only'>(
    'all'
  );
  const [selectedForecastDayIndex, setSelectedForecastDayIndex] = useState<number | null>(null);
  const [showForecastDetails, setShowForecastDetails] = useState(true);
  const [inspectingPlant, setInspectingPlant] = useState<Plant | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);

  // Frost day calculations
  const springFrostDay = useMemo(() => dateToDayOfYear(settings.springFrostDate), [settings.springFrostDate]);
  const autumnFrostDay = useMemo(() => dateToDayOfYear(settings.autumnFrostDate), [settings.autumnFrostDate]);
  const springFrostPct = dayToPercent(springFrostDay);
  const autumnFrostPct = dayToPercent(autumnFrostDay);

  // Current date calculations for Gantt marker
  const now = new Date();
  const todayDayOfYear = useMemo(() => {
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, []);
  const todayPct = dayToPercent(todayDayOfYear);
  const forecast7DaysPct = dayToPercent(todayDayOfYear + 7);

  // Current month (0-indexed)
  const currentMonthIdx = new Date().getMonth();

  // Forecast metrics
  const dailyForecast = weather.dailyForecast || [];
  const lowestNightTemp =
    weather.lowestUpcomingNightTemp ??
    (dailyForecast.length > 0 ? Math.min(...dailyForecast.map((d) => d.tempMin)) : weather.tempMin);
  const severeFrostDays = dailyForecast.filter((d) => d.tempMin <= 0);
  const lightFrostDays = dailyForecast.filter((d) => d.tempMin > 0 && d.tempMin <= 3);
  const hasSevereFrost = severeFrostDays.length > 0;
  const hasLightFrost = lightFrostDays.length > 0;
  const totalRain7Days = dailyForecast.reduce((acc, d) => acc + (d.precipitationSum || 0), 0);

  const selectedDay = selectedForecastDayIndex !== null ? dailyForecast[selectedForecastDayIndex] : null;

  // Growing Degree Days (GDD) thermal evaluation
  const gddEvaluation = useMemo(() => {
    return GddEngine.evaluate7DayThermalGrowth(dailyForecast);
  }, [dailyForecast]);

  // Calculate timelines
  const allTimelines: PlantTimeline[] = useMemo(() => {
    return plants.map((plant) => PlantingCalendar.calculateTimeline(plant, settings.springFrostDate, 2026));
  }, [plants, settings.springFrostDate]);

  // Filtered timelines
  const filteredTimelines = useMemo(() => {
    return allTimelines.filter(({ plant }) => {
      const matchesSearch =
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.family.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory === 'greenhouse' && plant.greenhouseShiftWeeks == null) return false;
      if (
        selectedCategory === 'root' &&
        !(
          plant.family.includes('Sarikalised') ||
          plant.family.includes('Rebasheinalised') ||
          plant.family.includes('Lauklised')
        )
      )
        return false;
      if (
        selectedCategory === 'herbs' &&
        !(plant.family.includes('Huulõielised') || plant.id === 'basiilik' || plant.id === 'till')
      )
        return false;

      // Frost readiness filter
      if (selectedFrostFilter === 'safe_now') {
        return isPlantColdHardy(plant);
      }
      if (selectedFrostFilter === 'fleece_needed') {
        return plant.greenhouseShiftWeeks != null || !isPlantWarmDemanding(plant);
      }
      if (selectedFrostFilter === 'warm_only') {
        return isPlantWarmDemanding(plant);
      }

      return true;
    });
  }, [allTimelines, searchQuery, selectedCategory, selectedFrostFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1
            className="font-serif-display"
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--kulv-text, #2A2E24)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}
          >
            Põhjamaine külvikalender & 7p ilmaprognoos
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--kulv-text-muted, #5F675A)', margin: '4px 0 0 0' }}>
            Külvikalender koos kevadise öökülmapiiri ({settings.springFrostDate}) ja reaalajas 7-päevase
            öökülmaradariga.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPrintDialog(true)}
            data-testid="open_sowing_print_dialog_btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              minHeight: '38px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={15} />
            <span>{language === 'en' ? 'Print Schedule & CSV' : 'Külvikava print & CSV'}</span>
          </button>

          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid var(--kulv-border, #C9BFA9)'
            }}
          >
            <button
              onClick={() => setViewMode('gantt')}
              className="touch-target"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: viewMode === 'gantt' ? 'var(--kulv-primary, #4F6B45)' : 'transparent',
                color: viewMode === 'gantt' ? 'white' : 'var(--kulv-text, #2A2E24)',
                transition: 'all 0.15s ease'
              }}
            >
              <CalendarRange size={15} />
              <span>Gantt ajatelg</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className="touch-target"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: viewMode === 'cards' ? 'var(--kulv-primary, #4F6B45)' : 'transparent',
                color: viewMode === 'cards' ? 'white' : 'var(--kulv-text, #2A2E24)',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={15} />
              <span>Kaardid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7-DAY WEATHER FORECAST & FROST RADAR CARD */}
      <section
        data-testid="weather_calendar_section"
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Forecast Header & Meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudSun size={20} color="var(--kulv-primary, #4F6B45)" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
              7-päevane ilmaprognoos & öökülma radar
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600,
                backgroundColor: weather.isLive ? 'rgba(79, 107, 69, 0.15)' : 'rgba(217, 122, 61, 0.15)',
                color: weather.isLive ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-accent, #D97A3D)'
              }}
            >
              {weather.isLive ? 'Open-Meteo otseallikas' : 'Kohalik aiaprognoos'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
              {weather.locationName} ({weather.lat.toFixed(1)}°N) · Uuendatud {weather.lastUpdated || 'täna'}
            </span>
            <button
              onClick={() => refreshWeather(true)}
              disabled={isWeatherLoading}
              title="Värskenda 7-päevast prognoosi"
              aria-label="Värskenda 7-päevast prognoosi"
              className="touch-target"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                color: 'var(--kulv-primary, #4F6B45)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isWeatherLoading ? 'wait' : 'pointer'
              }}
            >
              <RefreshCw size={12} style={{ animation: isWeatherLoading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Värskenda</span>
            </button>
            <button
              onClick={() => setShowForecastDetails(!showForecastDetails)}
              title={showForecastDetails ? 'Peida detailne ilmapaneel' : 'Näita detailset ilmapaneeli'}
              className="touch-target"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--kulv-text-muted, #5F675A)'
              }}
            >
              {showForecastDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Agricultural Night Frost Alert Banner */}
        {hasSevereFrost ? (
          <div
            style={{
              backgroundColor: 'rgba(184, 92, 51, 0.12)',
              border: '1px solid var(--kulv-danger, #B85C33)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <ShieldAlert size={20} color="var(--kulv-danger, #B85C33)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-danger, #B85C33)' }}>
                ❄️ Tähelepanu: eelseisva 7 päeva jooksul on tuvastatud öökülmaoht! (
                {severeFrostDays.map((d) => `${d.dayName} ${d.tempMin}°C`).join(', ')})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--kulv-text, #2A2E24)', marginTop: '4px', lineHeight: 1.4 }}>
                <strong>Külvisoovitus:</strong> Ära istuta avamaale soojust armastavaid taimi (tomat, kurk, kõrvits,
                basiilik, paprika). Sulge kindlasti kasvuhoone uksed ja luugid õhtul ning kata tärkavad varajased
                peenrad kahekordse kattelooriga.
              </div>
            </div>
          </div>
        ) : hasLightFrost ? (
          <div
            style={{
              backgroundColor: 'rgba(217, 122, 61, 0.12)',
              border: '1px solid var(--kulv-accent, #D97A3D)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <AlertTriangle size={20} color="var(--kulv-accent, #D97A3D)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-accent, #D97A3D)' }}>
                ⚠️ Hallaoht maapinnal: öised miinimumid langevad +1..+3°C juurde (
                {lightFrostDays.map((d) => `${d.dayName} ${d.tempMin}°C`).join(', ')})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--kulv-text, #2A2E24)', marginTop: '4px', lineHeight: 1.4 }}>
                <strong>Külvisoovitus:</strong> Maapinna lähedal võib tekkida kerge halla. Külmakindlad kultuurid
                (hernes, porgand, redis, lehtpeet) saavad hakkama; õrnemad istikud vajavad katteloori kaitset.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'rgba(79, 107, 69, 0.1)',
              border: '1px solid var(--kulv-primary, #4F6B45)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <ShieldCheck size={20} color="var(--kulv-primary, #4F6B45)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-primary, #4F6B45)' }}>
                🌱 Soodne öökülmavaba nädal (madalaim öö +{lowestNightTemp}°C, sademeid {totalRain7Days.toFixed(1)}mm)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--kulv-text, #2A2E24)', marginTop: '4px', lineHeight: 1.4 }}>
                <strong>Külvisoovitus:</strong> Järgmised 7 ööd püsivad soodsalt soojad. Hea aeg taimede karastamiseks
                õues ja jahedamate kultuuride avamaale viimiseks.
              </div>
            </div>
          </div>
        )}

        {/* GDD Thermal Energy Sum Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            borderRadius: '10px',
            padding: '10px 12px',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            fontSize: '11px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontWeight: 700,
                color: 'var(--kulv-primary, #4F6B45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={13} /> 7p soojussumma (GDD):
            </span>
            <span>
              Külmakindlad (baas 5°C): <strong>+{gddEvaluation.gdd5} °d</strong>
            </span>
            <span aria-hidden="true" style={{ color: 'var(--kulv-border, #C9BFA9)' }}>
              ·
            </span>
            <span>
              Soojanõudlikud (baas 10°C): <strong>+{gddEvaluation.gdd10} °d</strong>
            </span>
          </div>
          <span style={{ color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}>{gddEvaluation.summary}</span>
        </div>

        {/* 7-DAY HORIZONTAL FORECAST STRIP */}
        {showForecastDetails && dailyForecast.length > 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '8px' }}>
              {dailyForecast.map((day, idx) => {
                const isSelected = selectedForecastDayIndex === idx;
                const isFreezing = day.tempMin <= 0;
                const isChilly = day.tempMin > 0 && day.tempMin <= 3;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedForecastDayIndex(isSelected ? null : idx)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: isSelected
                        ? '2px solid var(--kulv-primary, #4F6B45)'
                        : isFreezing
                          ? '1px solid var(--kulv-danger, #B85C33)'
                          : isChilly
                            ? '1px solid var(--kulv-accent, #D97A3D)'
                            : '1px solid var(--kulv-border, #C9BFA9)',
                      backgroundColor: isSelected
                        ? 'var(--kulv-surface-muted, #EFE6D4)'
                        : isFreezing
                          ? 'rgba(184, 92, 51, 0.08)'
                          : isChilly
                            ? 'rgba(217, 122, 61, 0.06)'
                            : 'var(--kulv-surface, #FFFDF8)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                      {day.dayName}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                      {formatDateDisplay(day.date)}
                    </div>
                    <div style={{ fontSize: '22px', margin: '2px 0' }}>{day.icon}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--kulv-text, #2A2E24)' }}>
                        {day.tempMax}°
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isFreezing
                            ? 'var(--kulv-danger, #B85C33)'
                            : isChilly
                              ? 'var(--kulv-accent, #D97A3D)'
                              : 'var(--kulv-text-muted, #5F675A)'
                        }}
                      >
                        {day.tempMin}°
                      </span>
                    </div>

                    {/* Night status pill */}
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        backgroundColor: isFreezing
                          ? 'var(--kulv-danger, #B85C33)'
                          : isChilly
                            ? 'var(--kulv-accent, #D97A3D)'
                            : 'rgba(79, 107, 69, 0.15)',
                        color: isFreezing || isChilly ? 'white' : 'var(--kulv-primary, #4F6B45)'
                      }}
                    >
                      {isFreezing ? '❄️ Öökülm' : isChilly ? '⚠️ Hallaoht' : '🌙 Ohutu'}
                    </span>

                    {/* Precipitation info */}
                    {day.precipitationProbability !== undefined && day.precipitationProbability > 20 ? (
                      <span style={{ fontSize: '9px', color: '#176B87', fontWeight: 600 }}>
                        🌧️ {day.precipitationProbability}%
                      </span>
                    ) : day.precipitationSum > 0 ? (
                      <span style={{ fontSize: '9px', color: '#176B87', fontWeight: 600 }}>
                        {day.precipitationSum} mm
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', color: 'var(--kulv-text-muted, #5F675A)' }}>0 mm</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Actionable Advice Drawer */}
            {selectedDay && (
              <div
                style={{
                  marginTop: '10px',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                    📅 {selectedDay.dayName} ({formatDateDisplay(selectedDay.date)}) ilmastikutingimused aias:
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--kulv-primary, #4F6B45)' }}>
                    {selectedDay.weatherDescription}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '8px',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    🌡️ <strong>Temperatuur:</strong> Päeval kuni {selectedDay.tempMax}°C · Öösel min{' '}
                    {selectedDay.tempMin}°C
                    {selectedDay.apparentTempMin != null && ` (tajutav öösel ${selectedDay.apparentTempMin}°C)`}
                  </div>
                  <div>
                    💧 <strong>Sademed:</strong> {selectedDay.precipitationSum} mm
                    {selectedDay.precipitationProbability
                      ? ` (${selectedDay.precipitationProbability}% tõenäosus)`
                      : ''}
                  </div>
                </div>
                <div
                  style={{ fontSize: '12px', color: 'var(--kulv-text, #2A2E24)', marginTop: '2px', lineHeight: 1.4 }}
                >
                  <strong>Aiatööde soovitus:</strong>{' '}
                  {selectedDay.tempMin <= 0 ? (
                    <span style={{ color: 'var(--kulv-danger, #B85C33)' }}>
                      Öökülmaoht! Ära istuta välja soojanõudlikke taimi. Kata avamaa varajased saagid ja sulge
                      kasvuhoone uksed.
                    </span>
                  ) : selectedDay.tempMin <= 3 ? (
                    <span style={{ color: 'var(--kulv-accent, #D97A3D)' }}>
                      Jahe öö ja hallaoht maapinnal. Külmakindlad juurikad ja herned sobivad külvamiseks, õrnad istikud
                      kata kattelooriga.
                    </span>
                  ) : selectedDay.precipitationSum > 5 ? (
                    <span style={{ color: '#176B87' }}>
                      Märgatav vihmasadu. Hea päev vihmavee kogumiseks ja toas ettekasvatuseks; peenramuld võib olla
                      töötlemiseks liiga märg.
                    </span>
                  ) : (
                    <span style={{ color: 'var(--kulv-primary, #4F6B45)' }}>
                      Väga soodsad aiatööde tingimused! Sobib peenarde harimiseks, rohimiseks ja istikute karastamiseks.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Filter and Search Bar with Frost Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '12px',
          padding: '10px 14px'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--kulv-text-muted, #5F675A)'
            }}
          />
          <input
            type="text"
            placeholder="Otsi taime või sugukonda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 34px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-bg, #FAF6ED)',
              color: 'var(--kulv-text, #2A2E24)',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>

        {/* Frost-based Quick Filter */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
          {[
            { id: 'all', label: 'Kõik taimed' },
            { id: 'safe_now', label: '🟢 Külmakindlad (ohutu külvata)' },
            { id: 'fleece_needed', label: '🟡 Kasvuhoone / katteloor' },
            { id: 'warm_only', label: '🔴 Öökülmatundlikud' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFrostFilter(f.id as any)}
              className="touch-target"
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border:
                  selectedFrostFilter === f.id
                    ? '1px solid var(--kulv-primary, #4F6B45)'
                    : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor:
                  selectedFrostFilter === f.id ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface-muted, #EFE6D4)',
                color: selectedFrostFilter === f.id ? 'white' : 'var(--kulv-text, #2A2E24)',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Frost Markers */}
      <div
        style={{
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          border: '1px solid var(--kulv-border, #C9BFA9)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#2E5A36' }} />
            <span>Külv toas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#70856A' }} />
            <span>Kasvuhoone</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: 'var(--kulv-primary, #4F6B45)'
              }}
            />
            <span>Avamaale istutus</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600 }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: 'var(--kulv-accent, #D97A3D)'
              }}
            />
            <span>Saagikoristus</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px',
            color: 'var(--kulv-text-muted, #5F675A)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Snowflake size={13} color="#2A6F97" />
            <span>
              Öökülmavaba: <strong>{settings.springFrostDate}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Snowflake size={13} color="#D97A3D" />
            <span>
              Sügiskülm: <strong>{settings.autumnFrostDate}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: GANTT VISUAL TIMELINE */}
      {viewMode === 'gantt' && (
        <div
          data-testid="gantt_calendar_view"
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.06))'
          }}
        >
          {/* Scrollable Container */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div style={{ minWidth: '760px' }}>
              {/* Timeline Month Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '200px repeat(12, 1fr)',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  borderBottom: '2px solid var(--kulv-border, #C9BFA9)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--kulv-text, #2A2E24)',
                  textAlign: 'center',
                  padding: '8px 0'
                }}
              >
                <div style={{ textAlign: 'left', paddingLeft: '14px' }}>Taim & sort</div>
                {MONTH_NAMES.map((mName, i) => (
                  <div
                    key={mName}
                    style={{
                      backgroundColor: i === currentMonthIdx ? 'rgba(79, 107, 69, 0.2)' : 'transparent',
                      borderRadius: '4px',
                      padding: '2px 0'
                    }}
                  >
                    {mName}
                  </div>
                ))}
              </div>

              {/* Plant Rows */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredTimelines.map((timeline, idx) => {
                  const { plant, indoorSowStart, greenhousePlantStart, outdoorPlantStart, harvestStart } = timeline;

                  // Calculate pixel/percentage zones along 365-day year
                  const indoorDay = indoorSowStart ? dateToDayOfYear(indoorSowStart) : null;
                  const ghDay = greenhousePlantStart ? dateToDayOfYear(greenhousePlantStart) : null;
                  const outdoorDay = dateToDayOfYear(outdoorPlantStart);
                  const harvestDay = dateToDayOfYear(harvestStart);
                  const harvestEndDay = Math.min(365, harvestDay + 28); // 4-week harvest window

                  const indoorStartPct = indoorDay ? dayToPercent(indoorDay) : 0;
                  const ghStartPct = ghDay ? dayToPercent(ghDay) : 0;
                  const outdoorStartPct = dayToPercent(outdoorDay);
                  const harvestStartPct = dayToPercent(harvestDay);
                  const harvestEndPct = dayToPercent(harvestEndDay);

                  return (
                    <div
                      key={plant.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '200px 1fr',
                        borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
                        backgroundColor: idx % 2 === 0 ? 'var(--kulv-surface, #FFFDF8)' : 'rgba(239, 230, 212, 0.25)',
                        alignItems: 'center',
                        minHeight: '44px',
                        position: 'relative'
                      }}
                    >
                      {/* Left: Plant Name & Metadata (Clickable) */}
                      <div
                        onClick={() => setInspectingPlant(plant)}
                        title={`Klõpsa ${plant.name} detailide avamiseks`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>{plant.icon}</span>
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: 'var(--kulv-text, #2A2E24)',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }}
                          >
                            {plant.name}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                            {plant.family} · ~{plant.daysToMaturity}p
                          </div>
                        </div>
                      </div>

                      {/* Right: Gantt Track Bar Container */}
                      <div
                        style={{
                          position: 'relative',
                          height: '24px',
                          margin: '0 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(201, 191, 169, 0.15)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {/* Month grid column markers */}
                        {MONTH_NAMES.map((_, i) => (
                          <div
                            key={i}
                            style={{
                              position: 'absolute',
                              left: `${(i / 12) * 100}%`,
                              top: 0,
                              bottom: 0,
                              width: '1px',
                              backgroundColor: 'rgba(201, 191, 169, 0.35)',
                              pointerEvents: 'none'
                            }}
                          />
                        ))}

                        {/* Spring Frost Guideline */}
                        <div
                          title={`Kevadine öökülmavaba piir (${settings.springFrostDate})`}
                          style={{
                            position: 'absolute',
                            left: `${springFrostPct}%`,
                            top: '-4px',
                            bottom: '-4px',
                            width: '2px',
                            backgroundColor: '#2A6F97',
                            borderLeft: '1px dashed #2A6F97',
                            zIndex: 10,
                            pointerEvents: 'none'
                          }}
                        />

                        {/* Autumn Frost Guideline */}
                        <div
                          title={`Sügisene öökülm (${settings.autumnFrostDate})`}
                          style={{
                            position: 'absolute',
                            left: `${autumnFrostPct}%`,
                            top: '-4px',
                            bottom: '-4px',
                            width: '2px',
                            backgroundColor: '#D97A3D',
                            borderLeft: '1px dashed #D97A3D',
                            zIndex: 10,
                            pointerEvents: 'none'
                          }}
                        />

                        {/* Live 7-day Forecast Window on Gantt */}
                        <div
                          title={`Praegune 7-päevane ilmaprognoosi aken (min öösel ${lowestNightTemp}°C)`}
                          style={{
                            position: 'absolute',
                            left: `${todayPct}%`,
                            width: `${Math.max(1.8, forecast7DaysPct - todayPct)}%`,
                            top: '-2px',
                            bottom: '-2px',
                            backgroundColor: hasSevereFrost
                              ? 'rgba(184, 92, 51, 0.22)'
                              : hasLightFrost
                                ? 'rgba(217, 122, 61, 0.2)'
                                : 'rgba(79, 107, 69, 0.18)',
                            borderLeft: `2px solid ${
                              hasSevereFrost
                                ? 'var(--kulv-danger, #B85C33)'
                                : hasLightFrost
                                  ? 'var(--kulv-accent, #D97A3D)'
                                  : 'var(--kulv-primary, #4F6B45)'
                            }`,
                            zIndex: 8,
                            pointerEvents: 'none'
                          }}
                        />

                        {/* Phase 1: Indoor Sowing Bar */}
                        {indoorDay && (
                          <div
                            title={`Ettekülv toas: ${formatDateDisplay(indoorSowStart!)} kuni ${formatDateDisplay(ghDay ? greenhousePlantStart! : outdoorPlantStart)}`}
                            style={{
                              position: 'absolute',
                              left: `${indoorStartPct}%`,
                              width: `${Math.max(1.5, (ghDay ? ghStartPct : outdoorStartPct) - indoorStartPct)}%`,
                              height: '16px',
                              backgroundColor: '#2E5A36',
                              borderRadius: '4px 0 0 4px',
                              cursor: 'pointer',
                              zIndex: 2,
                              transition: 'opacity 0.15s ease'
                            }}
                          />
                        )}

                        {/* Phase 2: Greenhouse Shift Bar */}
                        {ghDay && (
                          <div
                            title={`Kasvuhoonesse: ${formatDateDisplay(greenhousePlantStart!)} kuni ${formatDateDisplay(outdoorPlantStart)}`}
                            style={{
                              position: 'absolute',
                              left: `${ghStartPct}%`,
                              width: `${Math.max(1.5, outdoorStartPct - ghStartPct)}%`,
                              height: '16px',
                              backgroundColor: '#70856A',
                              cursor: 'pointer',
                              zIndex: 3
                            }}
                          />
                        )}

                        {/* Phase 3: Outdoor Vegetative Growth Bar */}
                        <div
                          title={`Avamaale istutus: ${formatDateDisplay(outdoorPlantStart)} kuni valmimiseni ${formatDateDisplay(harvestStart)}`}
                          style={{
                            position: 'absolute',
                            left: `${outdoorStartPct}%`,
                            width: `${Math.max(2, harvestStartPct - outdoorStartPct)}%`,
                            height: '16px',
                            backgroundColor: 'var(--kulv-primary, #4F6B45)',
                            borderRadius: !indoorDay && !ghDay ? '4px 0 0 4px' : '0',
                            cursor: 'pointer',
                            zIndex: 4
                          }}
                        />

                        {/* Phase 4: Harvest Period Bar */}
                        <div
                          title={`Saagikoristuse periood: alates ${formatDateDisplay(harvestStart)} (~${plant.daysToMaturity}p külvist)`}
                          style={{
                            position: 'absolute',
                            left: `${harvestStartPct}%`,
                            width: `${Math.max(2.5, harvestEndPct - harvestStartPct)}%`,
                            height: '16px',
                            backgroundColor: 'var(--kulv-accent, #D97A3D)',
                            borderRadius: '0 4px 4px 0',
                            cursor: 'pointer',
                            zIndex: 5
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CARDS LIST */}
      {viewMode === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTimelines.map((timeline) => (
            <div
              key={timeline.plant.id}
              onClick={() => setInspectingPlant(timeline.plant)}
              style={{
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: 'var(--kulv-shadow-card, 0 1px 2px rgba(0,0,0,0.05))',
                cursor: 'pointer'
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{timeline.plant.icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                        {timeline.plant.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                        ({timeline.plant.family})
                      </span>
                    </div>
                    <div style={{ marginTop: '2px' }}>
                      {isPlantColdHardy(timeline.plant) ? (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(79, 107, 69, 0.15)',
                            color: 'var(--kulv-primary, #4F6B45)',
                            fontWeight: 600
                          }}
                        >
                          🟢 Külmakindel (ohutu jahedaga)
                        </span>
                      ) : isPlantWarmDemanding(timeline.plant) ? (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: hasSevereFrost ? 'rgba(184, 92, 51, 0.15)' : 'rgba(217, 122, 61, 0.15)',
                            color: hasSevereFrost ? 'var(--kulv-danger, #B85C33)' : 'var(--kulv-accent, #D97A3D)',
                            fontWeight: 600
                          }}
                        >
                          {hasSevereFrost ? '❄️ Öökülmaoht! Hoia toas/kasvuhoones' : '⚠️ Soojanõudlik kultuur'}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                            color: 'var(--kulv-text-muted, #5F675A)',
                            fontWeight: 600
                          }}
                        >
                          Mõõdukas külmataluvus
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
                  ~{timeline.plant.daysToMaturity}p
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                {timeline.indoorSowStart && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Ettekülv toas:</span>
                    <span style={{ fontWeight: 600, color: '#2E5A36' }}>{timeline.indoorSowStart}</span>
                  </div>
                )}
                {timeline.greenhousePlantStart && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Kasvuhoonesse:</span>
                    <span style={{ fontWeight: 600, color: '#70856A' }}>{timeline.greenhousePlantStart}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Avamaale istutus:</span>
                  <span style={{ fontWeight: 600, color: 'var(--kulv-primary, #4F6B45)' }}>
                    {timeline.outdoorPlantStart}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Oodatav saak:</span>
                  <span style={{ fontWeight: 600, color: 'var(--kulv-accent, #D97A3D)' }}>{timeline.harvestStart}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plant Details Dialog */}
      <PlantDetailDialog plant={inspectingPlant} onDismiss={() => setInspectingPlant(null)} />

      {/* Seasonal Sowing Print & Export Dialog */}
      <SeasonalSowingPrintDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        plants={plants}
        beds={beds}
        language={language}
      />
    </div>
  );
};
