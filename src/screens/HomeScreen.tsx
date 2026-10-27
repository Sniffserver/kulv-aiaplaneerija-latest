import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { WeatherWidget } from '../components/WeatherWidget';
import { TaskCard } from '../components/TaskCard';
import { WeatherChart } from '../components/WeatherChart';
import { HomeOverview } from '../components/home/HomeOverview';
import {
  Sprout,
  BookOpen,
  Calendar as CalendarIcon,
  Droplets,
  Plus,
  FlaskConical,
  Lightbulb,
  Check,
  Printer,
  FileText,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SeasonalSowingPrintDialog } from '../components/dialogs/SeasonalSowingPrintDialog';
import { GardenBinderPrintDialog } from '../components/dialogs/GardenBinderPrintDialog';
import { EmptyState } from '../components/common/EmptyState';
import { GardenEmptyIllustration, JournalEmptyIllustration } from '../components/common/EmptyStateIllustrations';

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

      {/* Header Welcome Section */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--kulv-border,#C9BFA9)]">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-[var(--kulv-primary,#4F6B45)] mb-1">
            {formattedDate}
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[var(--kulv-text,#2A2E24)] m-0 tracking-tight">
            {isEn ? 'Welcome to the Garden' : 'Tere tulemast aeda!'}
          </h1>
          <p className="text-sm text-[var(--kulv-text-muted,#5F675A)] mt-1 mb-0">
            {isEn ? 'Nordic botanical field notebook' : 'Põhjamaine aiaplaneerija'} · {weather.locationName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddTask}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--kulv-primary,#4F6B45)] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[var(--kulv-primary-hover,#3D5636)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kulv-focus,#4F6B45)] transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>{isEn ? 'Add Task' : 'Lisa ülesanne'}</span>
          </button>
        </div>
      </header>

      {/* Hero Visual Anchor: HomeOverview (Focus, Garden stats with mini 2D map, Weather summary) */}
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
            className="text-sm sm:text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display"
          >
            {isEn ? 'Quick Actions' : 'Kiirtegevused'}
          </h2>
          <span className="text-xs text-[var(--kulv-text-muted,#5F675A)]">
            {isEn ? 'Care & field workflows' : 'Hooldus & planeerimine'}
          </span>
        </div>

        <div data-testid="quick_actions_section" className="kulv-toolstrip grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
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

      {/* Main Grid: Today's Tasks on Left, Weather & Planting Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Garden Tasks Section */}
        <section
          id="today-tasks-section"
          className="p-5 rounded-2xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shadow-sm flex flex-col gap-4"
          aria-labelledby="tasks-heading"
        >
          <div className="flex items-center justify-between">
            <h2
              id="tasks-heading"
              className="text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display"
            >
              {isEn ? 'Garden Tasks' : 'Aiatööd ja meelespead'}
            </h2>
            <button
              onClick={onOpenAddTask}
              aria-label={isEn ? 'Add new task' : 'Lisa uus aiatöö'}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] bg-[var(--kulv-surface,#FFFDF8)] text-xs font-semibold text-[var(--kulv-text,#2A2E24)] hover:bg-[var(--kulv-surface-muted,#EFE6D4)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{isEn ? 'Add task' : 'Lisa ülesanne'}</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-6 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] text-center text-sm text-[var(--kulv-text-muted,#5F675A)]">
              {isEn ? 'All tasks complete! Enjoy the garden 🌿' : 'Kõik tööd tehtud! Naudi aiarahu 🌿'}
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--kulv-text-muted,#5F675A)] m-0">
                {isEn ? 'Upcoming Sowing Windows' : 'Eelseisvad külviajad'}
              </h3>
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="text-xs text-[var(--kulv-primary,#4F6B45)] font-semibold hover:underline flex items-center gap-1"
              >
                <span>{isEn ? 'Full Calendar' : 'Kogu kalender'}</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {upcomingSowings.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] flex items-center gap-2"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-[var(--kulv-text,#2A2E24)]">{item.name}</div>
                    <div className="text-[10px] text-[var(--kulv-text-muted,#5F675A)] font-mono">
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
          <div className="p-5 rounded-2xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--kulv-text,#2A2E24)] m-0 font-serif-display">
                {isEn ? 'Recent Field Notes' : 'Hiljutised aiamärkmed'}
              </h2>
              <button
                type="button"
                onClick={onNavigateToJournal}
                className="text-xs text-[var(--kulv-primary,#4F6B45)] font-semibold hover:underline flex items-center gap-1"
              >
                <span>{isEn ? 'View Journal' : 'Vaata päevikut'}</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {recentNotes.length === 0 ? (
              <div className="text-center py-4 text-xs text-[var(--kulv-text-muted,#5F675A)] bg-[var(--kulv-surface-muted,#EFE6D4)] rounded-xl p-4">
                {isEn
                  ? 'No journal entries logged yet. Record your first garden observation!'
                  : 'Päevikus pole veel märkmeid. Pane kirja esimene aiavaatlus!'}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentNotes.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-[var(--kulv-surface-muted,#EFE6D4)] border border-[var(--kulv-border,#C9BFA9)] flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[var(--kulv-text,#2A2E24)]">{entry.title}</div>
                      <div className="text-[var(--kulv-text-muted,#5F675A)] line-clamp-1 mt-0.5">
                        {entry.content}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono text-[var(--kulv-text-muted,#5F675A)]">
                      {entry.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Seasonal Sowing Print & Export Dialog */}
      <SeasonalSowingPrintDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        plants={plants}
        beds={beds}
        language={language}
      />

      {/* High-Resolution Printable Garden Binder Dialog */}
      <GardenBinderPrintDialog
        isOpen={showBinderDialog}
        onClose={() => setShowBinderDialog(false)}
        language={language}
      />
    </div>
  );
};
