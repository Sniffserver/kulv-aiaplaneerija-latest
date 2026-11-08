import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { WeatherWidget } from '../components/WeatherWidget';
import { TaskCard } from '../components/TaskCard';
import { WeatherChart } from '../components/WeatherChart';
import { HomeOverview } from '../components/home/HomeOverview';
import { BotanicalImage } from '../components/common/BotanicalImage';
import {
  Sprout,
  BookOpen,
  Calendar as CalendarIcon,
  Droplets,
  Plus,
  FlaskConical,
  Check,
  Printer,
  FileText,
  ArrowRight,
  ShieldAlert,
  CalendarClock
} from 'lucide-react';

const SeasonalSowingPrintDialog = React.lazy(() =>
  import('../components/dialogs/SeasonalSowingPrintDialog').then((m) => ({ default: m.SeasonalSowingPrintDialog }))
);
const GardenBinderPrintDialog = React.lazy(() =>
  import('../components/dialogs/GardenBinderPrintDialog').then((m) => ({ default: m.GardenBinderPrintDialog }))
);

interface HomeScreenProps {
  onNavigateToGarden: () => void;
  onNavigateToPlants: () => void;
  onNavigateToJournal: () => void;
  onNavigateToCalendar: () => void;
  onOpenAddTask: () => void;
  onOpenAddJournal: () => void;
  onOpenSoilRecipes: () => void;
  onOpenGrowTent: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToGarden,
  onNavigateToPlants,
  onNavigateToJournal,
  onNavigateToCalendar,
  onOpenAddTask,
  onOpenAddJournal,
  onOpenSoilRecipes,
  onOpenGrowTent
}) => {
  const {
    weather,
    tasks,
    beds,
    plants,
    journal,
    language,
    settings,
    toggleTask,
    deleteTask,
    isWeatherLoading,
    refreshWeather,
    quickWaterAllPlants
  } = useGarden();

  const [feedbackToast, setFeedbackToast] = useState<{ title: string; subtitle: string } | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
  const [showBinderDialog, setShowBinderDialog] = useState<boolean>(false);

  const isEn = language === 'en';
  const totalPlantings = beds.reduce((sum, b) => sum + b.plantings.length, 0);
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Formatted current date
  const formattedDate = useMemo(() => {
    const now = new Date();
    if (isEn) {
      return now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return now.toLocaleDateString('et-EE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [isEn]);

  // Autumn frost days countdown estimation
  const frostDays = useMemo(() => {
    if (!settings?.autumnFrostDate) return null;
    const [month, day] = settings.autumnFrostDate.split('-').map(Number);
    const now = new Date();
    const frostDate = new Date(now.getFullYear(), month - 1, day);
    if (frostDate.getTime() < now.getTime()) {
      frostDate.setFullYear(now.getFullYear() + 1);
    }
    const diffDays = Math.ceil((frostDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [settings?.autumnFrostDate]);

  const recentNotes = journal || [];

  // Upcoming sowing calendar preview
  const upcomingSowings = useMemo(() => {
    return plants.slice(0, 3).map((p) => ({
      name: isEn && p.nameEn ? p.nameEn : p.name,
      icon: p.icon || '🌱',
      date: p.optimalSowDateStart || '04-15',
      family: p.family
    }));
  }, [plants, isEn]);

  const handleQuickWater = () => {
    const res = quickWaterAllPlants();
    setFeedbackToast({
      title: isEn ? 'Plants marked as watered' : 'Taimed märgitud kastetuks',
      subtitle: res.message
    });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Toast Notification for Quick Actions */}
      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 px-4 rounded-xl border border-[var(--kulv-primary,#4F6B45)] bg-[var(--kulv-surface,#FFFDF8)] shadow-md flex items-center gap-3 animate-in fade-in duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--kulv-primary-soft,#E2ECE3)] text-[var(--kulv-primary-strong,#243D2B)] flex items-center justify-center shrink-0">
            <Check size={18} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-[var(--kulv-text,#2A2E24)]">
              {feedbackToast.title}
            </div>
            <div className="text-xs text-[var(--kulv-text-muted,#5F675A)] mt-0.5">
              {feedbackToast.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Illustrated Welcome Hero Banner */}
      <header className="p-5 sm:p-7 rounded-2xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 overflow-hidden">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--kulv-primary,#4F6B45)] mb-2">
            <CalendarIcon size={14} className="text-[var(--kulv-primary,#4F6B45)] shrink-0" />
            <span>{formattedDate}</span>
            <span aria-hidden="true" className="text-[var(--kulv-border,#C9BFA9)]">·</span>
            <span className="text-[var(--kulv-text-muted,#5F675A)] font-normal normal-case">{weather.locationName}</span>
          </div>

          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--kulv-text,#2A2E24)] m-0 tracking-tight text-balance">
            {isEn ? 'Welcome to the Garden' : 'Tere tulemast aeda!'}
          </h1>
          <p className="text-sm text-[var(--kulv-text-muted,#5F675A)] mt-2 mb-5 max-w-xl leading-relaxed">
            {isEn
              ? 'Nordic botanical field notebook · Local-first cockpit for raised beds, microclimate tracking, and crop succession.'
              : 'Põhjamaine aiaplaneerija ja märkmik · Kohalik abiline peenarde, mikrokliima ja külvikorra planeerimisel.'}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenAddTask}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--kulv-primary,#4F6B45)] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[var(--kulv-primary-hover,#3D5636)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus,#4F6B45)] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus size={16} />
              <span>{isEn ? 'Add Task' : 'Lisa ülesanne'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBinderDialog(true)}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs sm:text-sm font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface,#FFFDF8)] hover:border-[var(--kulv-primary,#4F6B45)] flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer size={16} className="text-[var(--kulv-primary,#4F6B45)]" />
              <span>{isEn ? 'Garden Binder Sheet' : 'Prindi aiavihik'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintDialog(true)}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs sm:text-sm font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface,#FFFDF8)] hover:border-[var(--kulv-primary,#4F6B45)] flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText size={16} className="text-[var(--kulv-accent,#E08A3C)]" />
              <span>{isEn ? 'Sowing Sheet' : 'Külvileht'}</span>
            </button>
          </div>
        </div>

        {/* Compact Editorial Artwork Container */}
        <div className="flex items-center justify-center shrink-0">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 p-2 rounded-2xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] shadow-xs flex items-center justify-center">
            <BotanicalImage
              src="/assets/aistudio/lisa-p_evik-kanne-m_rkmik-notebook-garden-aiaplaneerija_9c90ce5a.jpeg"
              alt={isEn ? "Botanical field notebook" : "Aiaplaneerija ja märkmik"}
              aspectRatio="1/1"
              objectFit="contain"
              className="w-full h-full rounded-xl"
              imageClassName="object-contain"
            />
          </div>
        </div>
      </header>

      {/* Operational Cockpit Alerts: Frost Warning & Weather Alert Strip */}
      {frostDays !== null && frostDays <= 30 && (
        <aside
          role="note"
          aria-label={isEn ? "Nordic frost warning" : "Põhjamaine öökülma teade"}
          className="p-3.5 px-4 rounded-xl border border-[var(--kulv-accent,#E08A3C)]/40 bg-[var(--kulv-surface-muted,#EFE6D4)] flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert size={18} className="text-[var(--kulv-accent-strong,#9E4C1F)] shrink-0" />
            <span className="font-semibold text-[var(--kulv-text,#2A2E24)]">
              {isEn
                ? `Nordic frost window alert: First expected frost in ~${frostDays} days.`
                : `Põhjamaine öökülmaoht: Esimene oodatav öökülm umbes ${frostDays} päeva pärast.`}
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToCalendar}
            className="text-[var(--kulv-primary,#4F6B45)] font-semibold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>{isEn ? 'Review schedule' : 'Vaata graafikut'}</span>
            <ArrowRight size={13} />
          </button>
        </aside>
      )}

      {/* Hero Visual Anchor: HomeOverview (3 Editorial Cards with Artwork Headers) */}
      <HomeOverview
        bedCount={beds.length}
        plantCount={totalPlantings}
        taskCount={activeTasks.length}
        temperature={weather.temperature}
        weatherSummary={weather.weatherDescription}
        rainRiskPct={weather.precipitation > 0 ? 60 : 15}
        frostRiskDays={frostDays}
        onOpenGarden={onNavigateToGarden}
        onOpenTasks={() => {
          const el = document.getElementById('today-tasks-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            onOpenAddTask();
          }
        }}
        language={language}
      />

      {/* High-Productivity Quick Actions Toolstrip */}
      <section
        className="p-4 sm:p-5 rounded-2xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shadow-sm"
        aria-labelledby="quick-actions-title"
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            id="quick-actions-title"
            className="text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display"
          >
            {isEn ? 'Quick Actions' : 'Kiirtegevused'}
          </h2>
          <span className="text-xs text-[var(--kulv-text-muted,#5F675A)]">
            {isEn ? 'Care & field workflows' : 'Hooldus & planeerimine'}
          </span>
        </div>

        <div data-testid="quick_actions_section" className="kulv-toolstrip grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <button
            onClick={handleQuickWater}
            data-testid="quick_action_water_plants"
            aria-label={isEn ? 'Water plants' : 'Kasta taimi'}
            className="kulv-toolstrip__button min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface,#FFFDF8)] hover:border-[var(--kulv-primary,#4F6B45)] transition-colors cursor-pointer"
          >
            <Droplets size={16} className="text-[var(--kulv-primary,#4F6B45)]" />
            <span>{isEn ? 'Water Plants' : 'Kasta taimi'}</span>
          </button>

          <button
            onClick={onNavigateToCalendar}
            data-testid="quick_action_check_calendar"
            aria-label={isEn ? 'View sowing calendar' : 'Vaata külvikalendrit'}
            className="kulv-toolstrip__button min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface,#FFFDF8)] hover:border-[var(--kulv-primary,#4F6B45)] transition-colors cursor-pointer"
          >
            <CalendarIcon size={16} className="text-[var(--kulv-primary,#4F6B45)]" />
            <span>{isEn ? 'Sowing Calendar' : 'Külvikalender'}</span>
          </button>

          <button
            onClick={onNavigateToGarden}
            data-testid="quick_action_crop_rotation"
            aria-label={isEn ? 'Crop rotation timeline' : 'Külvikorra ajajoon'}
            className="kulv-toolstrip__button min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface,#FFFDF8)] hover:border-[var(--kulv-primary,#4F6B45)] transition-colors cursor-pointer"
          >
            <Sprout size={16} className="text-[var(--kulv-primary,#4F6B45)]" />
            <span>{isEn ? 'Crop Rotation' : 'Külvikord'}</span>
          </button>

          <button
            onClick={onOpenSoilRecipes}
            data-testid="quick_action_soil_recipes"
            aria-label={isEn ? 'Soil recipes and brews' : 'Mullaretseptid ja leotised'}
            className="kulv-toolstrip__button min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface,#FFFDF8)] hover:border-[var(--kulv-primary,#4F6B45)] transition-colors cursor-pointer"
          >
            <FlaskConical size={16} className="text-[var(--kulv-accent,#E08A3C)]" />
            <span>{isEn ? 'Soil Recipes' : 'Mullaretseptid'}</span>
          </button>

          <button
            onClick={onOpenAddTask}
            data-testid="quick_action_add_task"
            aria-label={isEn ? 'Add garden task' : 'Lisa aiatöö'}
            className="kulv-toolstrip__button min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface,#FFFDF8)] hover:border-[var(--kulv-primary,#4F6B45)] transition-colors cursor-pointer"
          >
            <Plus size={16} className="text-[var(--kulv-primary,#4F6B45)]" />
            <span>{isEn ? 'Add Task' : 'Lisa aiatöö'}</span>
          </button>

          <button
            onClick={onOpenAddJournal}
            data-testid="quick_action_add_journal"
            aria-label={isEn ? 'Add journal entry' : 'Lisa päeviku märge'}
            className="kulv-toolstrip__button min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface,#FFFDF8)] hover:border-[var(--kulv-primary,#4F6B45)] transition-colors cursor-pointer"
          >
            <BookOpen size={16} className="text-[var(--kulv-primary,#4F6B45)]" />
            <span>{isEn ? 'Garden Journal' : 'Aiapäevik'}</span>
          </button>
        </div>
      </section>

      {/* Main Cockpit Grid: Prioritized Tasks on Left, Weather & Planting on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Garden Tasks Section */}
        <section
          id="today-tasks-section"
          className="p-5 rounded-2xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shadow-sm flex flex-col gap-4"
          aria-labelledby="tasks-heading"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                id="tasks-heading"
                className="text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display"
              >
                {isEn ? 'Garden Tasks' : 'Aiatööd ja meelespead'}
              </h2>
              <p className="text-xs text-[var(--kulv-text-muted,#5F675A)] m-0 mt-0.5">
                {activeTasks.length > 0
                  ? isEn
                    ? `${activeTasks.length} pending · ${completedTasks.length} done`
                    : `${activeTasks.length} tegemisel · ${completedTasks.length} tehtud`
                  : isEn
                  ? 'All tasks completed'
                  : 'Kõik ülesanded tehtud'}
              </p>
            </div>
            <button
              onClick={onOpenAddTask}
              aria-label={isEn ? 'Add new task' : 'Lisa uus aiatöö'}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface,#FFFDF8)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface-muted,#EFE6D4)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{isEn ? 'Add task' : 'Lisa ülesanne'}</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[var(--kulv-surface-muted,#EFE6D4)] text-center text-sm text-[var(--kulv-text-muted,#5F675A)] flex flex-col items-center justify-center gap-3">
              <div className="w-36 h-28 rounded-xl overflow-hidden bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shadow-xs">
                <BotanicalImage
                  src="/assets/aistudio/sucess-illustration_364d8287.jpeg"
                  alt=""
                  aspectRatio="4/3"
                  objectFit="contain"
                  className="w-full h-full p-2"
                />
              </div>
              <p className="font-medium text-sm text-[var(--kulv-text,#2A2E24)] m-0 font-serif">
                {isEn ? 'All tasks complete! Enjoy the garden peace 🌿' : 'Kõik tööd tehtud! Naudi aiarahu 🌿'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </div>
          )}

          {/* Sowing Calendar Preview */}
          <div className="mt-2 pt-4 border-t border-[var(--kulv-border,#C9BFA9)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-[var(--kulv-accent,#E08A3C)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--kulv-text-muted,#5F675A)] m-0">
                  {isEn ? 'Upcoming Sowing Windows' : 'Eelseisvad külviajad'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="text-xs text-[var(--kulv-primary,#4F6B45)] font-semibold hover:underline flex items-center gap-1"
              >
                <span>{isEn ? 'Full Calendar' : 'Kogu kalender'}</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {upcomingSowings.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] flex items-center gap-2.5 hover:border-[var(--kulv-primary,#4F6B45)] transition-colors"
                >
                  <span className="text-xl p-1.5 rounded-lg bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[var(--kulv-text,#2A2E24)] truncate">{item.name}</div>
                    <div className="text-[10px] text-[var(--kulv-text-muted,#5F675A)] font-mono tabular-nums truncate mt-0.5">
                      {item.date} · {item.family}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Weather Forecast & Recent Journal Activity */}
        <section className="flex flex-col gap-6">
          <WeatherWidget weather={weather} isLoading={isWeatherLoading} onRefresh={() => refreshWeather(true)} />
          <WeatherChart weather={weather} />

          {/* Recent Journal Activity */}
          <div className="p-5 rounded-2xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display truncate">
                    {isEn ? 'Recent Field Notes' : 'Hiljutised aiamärkmed'}
                  </h2>
                  <button
                    type="button"
                    onClick={onNavigateToJournal}
                    className="text-xs text-[var(--kulv-primary,#4F6B45)] font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{isEn ? 'View Journal' : 'Vaata päevikut'}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
                <p className="text-xs text-[var(--kulv-text-muted,#5F675A)] m-0 mt-0.5 truncate">
                  {isEn ? 'Garden observations & field log' : 'Aiavaatlused, töövõtted ja märkmed'}
                </p>
              </div>
            </div>

            {recentNotes.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--kulv-text-muted,#5F675A)] bg-[var(--kulv-surface-muted,#EFE6D4)] rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                <div className="w-32 h-24 rounded-xl overflow-hidden bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shadow-xs">
                  <BotanicalImage
                    src="/assets/aistudio/empty-state-p_evik_600dc83a.jpeg"
                    alt=""
                    aspectRatio="4/3"
                    objectFit="contain"
                    className="w-full h-full p-2"
                  />
                </div>
                <p className="m-0 font-serif text-xs max-w-xs">
                  {isEn
                    ? 'No journal entries logged yet. Record your first garden observation!'
                    : 'Päevikus pole veel märkmeid. Pane kirja esimene aiavaatlus!'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentNotes.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] flex items-start justify-between gap-3 text-xs transition-colors hover:border-[var(--kulv-primary,#4F6B45)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-serif font-bold text-sm text-[var(--kulv-text,#2A2E24)] leading-snug">
                        {entry.title}
                      </div>
                      <div className="font-serif text-xs text-[var(--kulv-text-muted,#5F675A)] line-clamp-2 mt-1 leading-relaxed">
                        {entry.content}
                      </div>
                    </div>
                    {entry.photoUrl && (
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-[var(--kulv-border,#C9BFA9)] shrink-0">
                        <img
                          src={entry.photoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <span className="shrink-0 text-[10px] font-mono text-[var(--kulv-text-muted,#5F675A)] bg-[var(--kulv-surface,#FFFDF8)] px-2 py-0.5 rounded border border-[var(--kulv-border,#C9BFA9)]">
                      {entry.date}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onOpenAddJournal}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface-muted,#EFE6D4)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:border-[var(--kulv-primary,#4F6B45)] hover:bg-[var(--kulv-surface,#FFFDF8)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus size={14} className="text-[var(--kulv-primary,#4F6B45)]" />
              <span>{isEn ? 'Add Field Note' : 'Lisa uus aiamärge'}</span>
            </button>
          </div>
        </section>
      </div>

      {/* Lazy Printable Dialogs */}
      <React.Suspense fallback={null}>
        {showPrintDialog && (
          <SeasonalSowingPrintDialog
            isOpen={showPrintDialog}
            onClose={() => setShowPrintDialog(false)}
            plants={plants}
            beds={beds}
            language={language}
          />
        )}

        {showBinderDialog && (
          <GardenBinderPrintDialog
            isOpen={showBinderDialog}
            onClose={() => setShowBinderDialog(false)}
            language={language}
          />
        )}
      </React.Suspense>
    </div>
  );
};
