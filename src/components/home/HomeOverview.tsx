import React from 'react';
import { WateringIcon } from '../icons/GardenIcons';
import { Map } from 'lucide-react';
import { BotanicalImage } from '../common/BotanicalImage';

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
    <div className="kulv-home-overview grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Tänane fookus / Today's Focus */}
      <section
        className="kulv-card kulv-card--focus rounded-2xl flex flex-col justify-between border-2 border-[var(--kulv-primary,#4F6B45)] bg-[var(--kulv-surface,#FFFDF8)] shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
        aria-labelledby="home-focus-title"
      >
        <div>
          {/* Compact Editorial Artwork Header */}
          <div className="relative w-full h-20 sm:h-24 bg-[var(--kulv-surface-muted,#EFE6D4)] border-b border-[var(--kulv-border,#C9BFA9)] overflow-hidden flex items-center justify-center p-2">
            <BotanicalImage
              src="/assets/aistudio/kastmine-illustration_541cc1f3.jpeg"
              alt={isEn ? "Garden watering illustration" : "Peenarde kastmise illustratsioon"}
              aspectRatio="auto"
              objectFit="contain"
              className="w-full h-full"
              imageClassName="object-contain group-hover:scale-[1.03] transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-[var(--kulv-surface,#FFFDF8)]/90 backdrop-blur-xs border border-[var(--kulv-border,#C9BFA9)] text-[10px] font-semibold text-[var(--kulv-primary-strong,#243D2B)] shadow-xs">
              {taskCount > 0
                ? isEn
                  ? `${taskCount} to-do`
                  : `${taskCount} ootel`
                : isEn
                ? 'Complete'
                : 'Tehtud'}
            </div>
          </div>

          <div className="p-4 sm:p-5 pb-2">
            <h2
              id="home-focus-title"
              className="text-lg font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display leading-tight"
            >
              {isEn ? "Today's Focus" : 'Tänane fookus'}
            </h2>
            <p className="text-xs text-[var(--kulv-text-muted,#5F675A)] m-0 mt-1">
              {taskCount > 0
                ? isEn
                  ? `${taskCount} tasks awaiting attention`
                  : `${taskCount} ülesannet ootab tegemist`
                : isEn
                ? 'All tasks completed'
                : 'Kõik ülesanded tehtud'}
            </p>

            <div className="mt-3 p-3 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)]">
              <p className="kulv-card__description text-xs text-[var(--kulv-text,#2A2E24)] leading-relaxed m-0">
                {taskCount > 0
                  ? isEn
                    ? 'Check high-priority tasks and watering advice for your beds.'
                    : 'Alusta tähtsaimast aiatoimest ja peenarde kastmisest.'
                  : isEn
                  ? 'All daily garden tasks complete. Plan your next succession.'
                  : 'Täna pole ühtegi ülesannet. Planeeri järgmist külvi.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 pt-3">
          <button
            type="button"
            className="kulv-button kulv-button--primary min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--kulv-primary,#4F6B45)] text-white text-sm font-semibold hover:bg-[var(--kulv-primary-hover,#3D5636)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus,#4F6B45)] cursor-pointer transition-colors shadow-xs"
            onClick={onOpenTasks}
          >
            <WateringIcon size={18} />
            <span>{isEn ? 'Open Tasks' : 'Ava ülesanded'}</span>
          </button>
        </div>
      </section>

      {/* 2. Aed / Garden Overview */}
      <section
        className="kulv-card rounded-2xl flex flex-col justify-between border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface,#FFFDF8)] shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
        aria-labelledby="home-garden-title"
      >
        <div>
          {/* Compact Editorial Artwork Header */}
          <div className="relative w-full h-20 sm:h-24 bg-[var(--kulv-surface-muted,#EFE6D4)] border-b border-[var(--kulv-border,#C9BFA9)] overflow-hidden flex items-center justify-center p-2">
            <BotanicalImage
              src="/assets/aistudio/lisa-peenar-seemned_fcd909da.jpeg"
              alt={isEn ? "Garden beds and seeds illustration" : "Aiapeenarde ja seemnete illustratsioon"}
              aspectRatio="auto"
              objectFit="contain"
              className="w-full h-full"
              imageClassName="object-contain group-hover:scale-[1.03] transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-[var(--kulv-surface,#FFFDF8)]/90 backdrop-blur-xs border border-[var(--kulv-border,#C9BFA9)] text-[10px] font-mono tabular-nums font-semibold text-[var(--kulv-text,#2A2E24)] shadow-xs">
              {bedCount} {isEn ? 'beds' : 'peenart'}
            </div>
          </div>

          <div className="p-4 sm:p-5 pb-2">
            <h2
              id="home-garden-title"
              className="text-lg font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display leading-tight"
            >
              {isEn ? 'Garden Plan' : 'Aed'}
            </h2>
            <p className="text-xs text-[var(--kulv-text-muted,#5F675A)] m-0 mt-1">
              {isEn ? '2D yard layout & succession' : '2D krundiplaan ja peenrad'}
            </p>

            <dl className="kulv-stat-grid grid grid-cols-2 gap-2 mt-3 mb-3">
              <div className="p-2.5 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] text-center">
                <dt className="text-[11px] font-semibold text-[var(--kulv-text-muted,#5F675A)] uppercase tracking-wider">
                  {isEn ? 'Beds' : 'Peenrad'}
                </dt>
                <dd className="text-xl font-bold font-mono tabular-nums text-[var(--kulv-text,#2A2E24)] m-0">
                  {bedCount}
                </dd>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] text-center">
                <dt className="text-[11px] font-semibold text-[var(--kulv-text-muted,#5F675A)] uppercase tracking-wider">
                  {isEn ? 'Plants' : 'Taimed'}
                </dt>
                <dd className="text-xl font-bold font-mono tabular-nums text-[var(--kulv-primary,#4F6B45)] m-0">
                  {plantCount}
                </dd>
              </div>
            </dl>

            {/* Mini 2D SVG preview */}
            <div
              className="w-full h-14 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-dashed border-[var(--kulv-border,#C9BFA9)] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[var(--kulv-primary,#4F6B45)] transition-colors"
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
        </div>

        <div className="p-4 sm:p-5 pt-3">
          <button
            type="button"
            className="kulv-button kulv-button--secondary min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] text-[var(--kulv-text,#2A2E24)] text-sm font-semibold hover:bg-[var(--kulv-surface-muted,#EFE6D4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus,#4F6B45)] cursor-pointer transition-colors"
            onClick={onOpenGarden}
          >
            <Map size={16} />
            <span>{isEn ? 'Open Yard Plan' : 'Ava aiaplaan'}</span>
          </button>
        </div>
      </section>

      {/* 3. Ilma / Weather & Microclimate */}
      <section
        className="kulv-card kulv-card--muted rounded-2xl flex flex-col justify-between border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface,#FFFDF8)] shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
        aria-labelledby="home-weather-title"
      >
        <div>
          {/* Compact Editorial Artwork Header */}
          <div className="relative w-full h-20 sm:h-24 bg-[var(--kulv-surface-muted,#EFE6D4)] border-b border-[var(--kulv-border,#C9BFA9)] overflow-hidden flex items-center justify-center p-2">
            <BotanicalImage
              src="/assets/aistudio/ilmad_640480a6.jpeg"
              alt={isEn ? "Weather and microclimate illustration" : "Ilma ja mikrokliima illustratsioon"}
              aspectRatio="auto"
              objectFit="contain"
              className="w-full h-full"
              imageClassName="object-contain group-hover:scale-[1.03] transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-[var(--kulv-surface,#FFFDF8)]/90 backdrop-blur-xs border border-[var(--kulv-border,#C9BFA9)] text-[10px] font-mono tabular-nums font-semibold text-[var(--kulv-accent-strong,#9E4C1F)] shadow-xs">
              {frostRiskDays !== null
                ? isEn
                  ? `Frost: ${frostRiskDays}d`
                  : `Külmaoht: ${frostRiskDays}p`
                : isEn
                ? 'Frost: Low'
                : 'Külm: Madal'}
            </div>
          </div>

          <div className="p-4 sm:p-5 pb-2">
            <h2
              id="home-weather-title"
              className="text-lg font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display leading-tight"
            >
              {isEn ? 'Weather & Microclimate' : 'Ilma'}
            </h2>
            <p className="text-xs text-[var(--kulv-text-muted,#5F675A)] m-0 mt-1">
              {isEn ? 'Nordic frost & rain tracking' : 'Öökülmaoht ja sademete seire'}
            </p>

            <div className="mt-3 p-3 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] mb-3">
              <p className="kulv-card__description text-sm font-semibold text-[var(--kulv-text,#2A2E24)] m-0">
                {temperature !== undefined
                  ? `${temperature}°C · ${weatherSummary ?? (isEn ? 'No weather data' : 'Ilmaandmed puuduvad')}`
                  : isEn
                  ? 'Weather data currently unavailable.'
                  : 'Ilmaandmed pole veel saadaval.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--kulv-border,#C9BFA9)]">
              <div className="flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
                <span>{isEn ? 'Rain probability' : 'Sadude tõenäosus'}</span>
                <span className="font-mono tabular-nums font-bold text-[var(--kulv-text,#2A2E24)]">
                  {rainRiskPct}%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
                <span>{isEn ? 'Autumn frost risk' : 'Öökülmaoht'}</span>
                <span className="font-mono tabular-nums font-bold text-[var(--kulv-accent-strong,#9E4C1F)]">
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
        </div>

        <div className="p-4 sm:p-5 pt-3">
          <div className="p-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
            <span className="italic">
              {isEn ? 'Nordic window monitored' : 'Põhjamaine aken jälgimisel'}
            </span>
            <span className="font-mono font-semibold text-[var(--kulv-primary,#4F6B45)]">
              {isEn ? 'Active' : 'Aktiivne'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
