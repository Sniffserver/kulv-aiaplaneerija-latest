import React from 'react';
import { RaisedBedIcon, SunIcon, WateringIcon } from '../icons/GardenIcons';
import { Map, ArrowRight } from 'lucide-react';

export type HomeOverviewProps = {
  bedCount: number;
  plantCount: number;
  taskCount: number;
  temperature?: number;
  weatherSummary?: string;
  rainRiskPct?: number;
  frostRiskDays?: number | null;
  onOpenGarden: () => void;
  onOpenTasks: () => void;
  language?: 'et' | 'en';
};

export function HomeOverview({
  bedCount,
  plantCount,
  taskCount,
  temperature,
  weatherSummary,
  rainRiskPct = 0,
  frostRiskDays = null,
  onOpenGarden,
  onOpenTasks,
  language = 'et'
}: HomeOverviewProps) {
  const isEn = language === 'en';

  return (
    <div className="kulv-home-overview grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Tänane fookus */}
      <section
        className="kulv-card kulv-card--focus p-5 rounded-2xl flex flex-col justify-between border-2 border-[var(--kulv-primary,#4F6B45)] bg-[var(--kulv-surface,#FFFDF8)] shadow-sm"
        aria-labelledby="home-focus-title"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2
              id="home-focus-title"
              className="text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display"
            >
              {isEn ? "Today's Focus" : 'Tänane fookus'}
            </h2>
            <span className="kulv-badge kulv-badge--accent px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--kulv-accent-soft,#F4D5C2)] text-[var(--kulv-accent-strong,#9E4C1F)]">
              {taskCount} {isEn ? 'tasks' : 'ülesannet'}
            </span>
          </div>

          <p className="kulv-card__description text-xs text-[var(--kulv-text-muted,#5F675A)] leading-relaxed mb-4">
            {taskCount > 0
              ? isEn
                ? 'Check high-priority tasks and watering advice for your beds.'
                : 'Alusta tähtsaimast aiatoimest.'
              : isEn
              ? 'All daily garden tasks complete. Plan your next succession.'
              : 'Täna pole ühtegi ülesannet. Planeeri järgmist külvit.'}
          </p>
        </div>

        <button
          type="button"
          className="kulv-button kulv-button--primary min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--kulv-primary,#4F6B45)] text-white text-sm font-semibold hover:bg-[var(--kulv-primary-hover,#3D5636)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus,#4F6B45)] cursor-pointer transition-colors"
          onClick={onOpenTasks}
        >
          <WateringIcon size={18} />
          <span>{isEn ? 'Open Tasks' : 'Ava ülesanded'}</span>
        </button>
      </section>

      {/* 2. Aed (Garden Overview with Mini 2D Vector Map) */}
      <section
        className="kulv-card p-5 rounded-2xl flex flex-col justify-between border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface,#FFFDF8)] shadow-sm"
        aria-labelledby="home-garden-title"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2
              id="home-garden-title"
              className="text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display"
            >
              {isEn ? 'Garden Plan' : 'Aed'}
            </h2>
            <RaisedBedIcon className="kulv-icon text-[var(--kulv-primary,#4F6B45)]" size={20} />
          </div>

          <dl className="kulv-stat-grid grid grid-cols-2 gap-2 mb-3">
            <div className="p-2.5 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] text-center">
              <dt className="text-[11px] font-semibold text-[var(--kulv-text-muted,#5F675A)] uppercase tracking-wider">
                {isEn ? 'Beds' : 'Peenrad'}
              </dt>
              <dd className="text-xl font-bold font-mono text-[var(--kulv-text,#2A2E24)] m-0">
                {bedCount}
              </dd>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] text-center">
              <dt className="text-[11px] font-semibold text-[var(--kulv-text-muted,#5F675A)] uppercase tracking-wider">
                {isEn ? 'Plants' : 'Taimed'}
              </dt>
              <dd className="text-xl font-bold font-mono text-[var(--kulv-primary,#4F6B45)] m-0">
                {plantCount}
              </dd>
            </div>
          </dl>

          {/* Mini 2D SVG preview */}
          <div
            className="w-full h-16 rounded-lg bg-[var(--kulv-surface-muted,#EFE6D4)] border border-dashed border-[var(--kulv-border,#C9BFA9)] mb-3 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--kulv-primary,#4F6B45)] transition-colors"
            onClick={onOpenGarden}
            title={isEn ? 'Click to zoom into 2D yard canvas' : 'Klõpsa krundiplaanile suumimiseks'}
            role="img"
            aria-label={isEn ? 'Miniature 2D yard overview map' : 'Miniatuurne 2D aia ülevaatekaart'}
          >
            <svg viewBox="0 0 200 60" className="w-full h-full px-2" aria-hidden="true">
              <rect x="10" y="8" width="50" height="20" rx="3" fill="#79634F" opacity="0.85" />
              <rect x="70" y="8" width="50" height="20" rx="3" fill="#79634F" opacity="0.85" />
              <rect x="130" y="8" width="60" height="42" rx="4" fill="#A9B89A" opacity="0.4" stroke="#4F6B45" strokeDasharray="2 2" />
              <rect x="10" y="34" width="50" height="18" rx="3" fill="#79634F" opacity="0.85" />
              <rect x="70" y="34" width="50" height="18" rx="3" fill="#79634F" opacity="0.85" />
              <circle cx="160" cy="29" r="8" fill="#4F6B45" opacity="0.6" />
            </svg>
          </div>
        </div>

        <button
          type="button"
          className="kulv-button kulv-button--secondary min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] text-[var(--kulv-text,#2A2E24)] text-sm font-semibold hover:bg-[var(--kulv-surface-muted,#EFE6D4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus,#4F6B45)] cursor-pointer transition-colors"
          onClick={onOpenGarden}
        >
          <Map size={16} />
          <span>{isEn ? 'Open Yard Plan' : 'Ava aiaplaan'}</span>
        </button>
      </section>

      {/* 3. Ilma (Weather & Frost Overview) */}
      <section
        className="kulv-card kulv-card--muted p-5 rounded-2xl flex flex-col justify-between border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface,#FFFDF8)] shadow-sm"
        aria-labelledby="home-weather-title"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2
              id="home-weather-title"
              className="text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display"
            >
              {isEn ? 'Weather & Microclimate' : 'Ilma'}
            </h2>
            <SunIcon className="kulv-icon--accent text-[var(--kulv-accent,#E08A3C)]" size={20} />
          </div>

          <div className="my-2">
            <p className="kulv-card__description text-sm font-semibold text-[var(--kulv-text,#2A2E24)] m-0">
              {temperature !== undefined
                ? `${temperature}°C · ${weatherSummary ?? (isEn ? 'No weather data' : 'Ilmaandmed puuduvad')}`
                : isEn
                ? 'Weather data currently unavailable.'
                : 'Ilmaandmed pole veel saadaval.'}
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[var(--kulv-border,#C9BFA9)]">
            <div className="flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
              <span>{isEn ? 'Rain probability' : 'Sadude tõenäosus'}</span>
              <span className="font-mono font-bold text-[var(--kulv-text,#2A2E24)]">
                {rainRiskPct}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
              <span>{isEn ? 'Autumn frost risk' : 'Öökülmaoht'}</span>
              <span className="font-mono font-bold text-[var(--kulv-accent-strong,#9E4C1F)]">
                {frostRiskDays !== null
                  ? isEn
                    ? `In ${frostRiskDays} days`
                    : `${frostRiskDays} päeva pärast`
                  : isEn
                  ? 'Nominal'
                  : 'Madal oht'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-[var(--kulv-text-muted,#5F675A)] italic">
          {isEn
            ? 'Optimal Nordic sowing window monitored'
            : 'Põhjamaine külviaken aktiivselt jälgimisel'}
        </div>
      </section>
    </div>
  );
}
