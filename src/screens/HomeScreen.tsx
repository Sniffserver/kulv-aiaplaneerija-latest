import React, { useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { WeatherWidget } from '../components/WeatherWidget';
import { TaskCard } from '../components/TaskCard';
import { WeatherChart } from '../components/WeatherChart';
import { HomeOverview } from '../components/home/HomeOverview';
import {
  Sprout,
  BookOpen,
  Calendar,
  Droplets,
  Plus,
  FlaskConical,
  Lightbulb,
  Check,
  Printer,
  FileText
} from 'lucide-react';
import { SeasonalSowingPrintDialog } from '../components/dialogs/SeasonalSowingPrintDialog';
import { GardenBinderPrintDialog } from '../components/dialogs/GardenBinderPrintDialog';

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
    language,
    toggleTask,
    deleteTask,
    isWeatherLoading,
    refreshWeather,
    quickWaterAllPlants
  } = useGarden();

  const [feedbackToast, setFeedbackToast] = useState<{ title: string; subtitle: string } | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
  const [showBinderDialog, setShowBinderDialog] = useState<boolean>(false);

  const totalPlantings = beds.reduce((sum, b) => sum + b.plantings.length, 0);
  const activeTasks = tasks.filter((t) => !t.completed);

  const handleQuickWater = () => {
    const res = quickWaterAllPlants();
    setFeedbackToast({
      title: language === 'en' ? 'Plants marked as watered' : 'Taimed märgitud kastetuks',
      subtitle: res.message
    });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 24px' }}>
      {/* Toast Notification for Quick Actions */}
      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className="kulv-paper-card"
          style={{
            borderColor: 'var(--kulv-primary)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--kulv-primary-soft)',
              color: 'var(--kulv-primary-strong)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}
          >
            <Check size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--kulv-text)' }}>
              {feedbackToast.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--kulv-text-muted)', marginTop: '2px' }}>
              {feedbackToast.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Header Welcome Section */}
      <header>
        <h1
          style={{
            fontFamily: "var(--kulv-font-display, 'Fraunces', Georgia, serif)",
            fontSize: '1.85rem',
            fontWeight: 700,
            color: 'var(--kulv-text)',
            margin: 0,
            letterSpacing: '-0.02em'
          }}
        >
          {language === 'en' ? 'Welcome to the Garden' : 'Tere tulemast aeda!'}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--kulv-text-muted)', margin: '4px 0 0 0' }}>
          {language === 'en' ? 'Nordic garden planner' : 'Põhjamaine aiaplaneerija'} · {weather.locationName}
        </p>
      </header>

      {/* Hero Visual Anchor: HomeOverview (Focus, Garden stats, Weather summary) */}
      <HomeOverview
        bedCount={beds.length}
        plantCount={totalPlantings}
        taskCount={activeTasks.length}
        temperature={weather.temperature}
        weatherSummary={weather.weatherDescription}
        onOpenGarden={onNavigateToGarden}
        onOpenTasks={() => {
          const el = document.getElementById('today-tasks-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            onOpenAddTask();
          }
        }}
      />

      {/* High-Productivity Quick Actions Toolstrip */}
      <section className="kulv-paper-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--kulv-text)' }}>
            {language === 'en' ? 'Quick Actions' : 'Kiirtegevused'}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--kulv-text-muted)' }}>
            {language === 'en' ? 'Care & planning' : 'Hooldus & planeerimine'}
          </span>
        </div>

        <div data-testid="quick_actions_section" className="kulv-toolstrip">
          <button
            onClick={handleQuickWater}
            data-testid="quick_action_water_plants"
            aria-label={language === 'en' ? 'Water plants' : 'Kasta taimi'}
            className="kulv-toolstrip__button"
          >
            <Droplets size={16} color="var(--kulv-primary)" />
            <span>{language === 'en' ? 'Water Plants' : 'Kasta taimi'}</span>
          </button>

          <button
            onClick={onNavigateToCalendar}
            data-testid="quick_action_check_calendar"
            aria-label={language === 'en' ? 'View sowing calendar' : 'Vaata külvikalendrit'}
            className="kulv-toolstrip__button"
          >
            <Calendar size={16} color="var(--kulv-primary)" />
            <span>{language === 'en' ? 'Sowing Calendar' : 'Külvikalender'}</span>
          </button>

          <button
            onClick={onNavigateToGarden}
            data-testid="quick_action_crop_rotation"
            aria-label={language === 'en' ? 'Crop rotation timeline' : 'Külvikorra ajajoon'}
            className="kulv-toolstrip__button"
          >
            <Sprout size={16} color="var(--kulv-primary)" />
            <span>{language === 'en' ? 'Crop Rotation' : 'Külvikord'}</span>
          </button>

          <button
            onClick={onOpenSoilRecipes}
            data-testid="quick_action_soil_recipes"
            aria-label={language === 'en' ? 'Soil recipes and brews' : 'Mullaretseptid ja leotised'}
            className="kulv-toolstrip__button"
          >
            <FlaskConical size={16} color="var(--kulv-accent)" />
            <span>{language === 'en' ? 'Soil Recipes' : 'Mullaretseptid'}</span>
          </button>

          <button
            onClick={onOpenAddTask}
            data-testid="quick_action_add_task"
            aria-label={language === 'en' ? 'Add garden task' : 'Lisa aiatöö'}
            className="kulv-toolstrip__button"
          >
            <Plus size={16} color="var(--kulv-primary)" />
            <span>{language === 'en' ? 'Add Task' : 'Lisa aiatöö'}</span>
          </button>

          <button
            onClick={onOpenAddJournal}
            data-testid="quick_action_add_journal"
            aria-label={language === 'en' ? 'Add journal entry' : 'Lisa päeviku märge'}
            className="kulv-toolstrip__button"
          >
            <BookOpen size={16} color="var(--kulv-primary)" />
            <span>{language === 'en' ? 'Garden Journal' : 'Aiapäevik'}</span>
          </button>

          <button
            onClick={onOpenGrowTent}
            data-testid="quick_action_grow_tent"
            aria-label={language === 'en' ? 'Indoor pre-grow' : 'Ettekasvatus'}
            className="kulv-toolstrip__button"
          >
            <Lightbulb size={16} color="var(--kulv-accent)" />
            <span>{language === 'en' ? 'Indoor Pre-grow' : 'Ettekasvatus'}</span>
          </button>

          <button
            onClick={() => setShowPrintDialog(true)}
            data-testid="quick_action_print_schedule"
            aria-label={language === 'en' ? 'Print sowing schedule' : 'Külvikava print'}
            className="kulv-toolstrip__button"
          >
            <Printer size={16} color="var(--kulv-primary)" />
            <span>{language === 'en' ? 'Print Schedule' : 'Külvikava print'}</span>
          </button>

          <button
            onClick={() => setShowBinderDialog(true)}
            data-testid="quick_action_garden_binder"
            aria-label={language === 'en' ? 'Garden binder dossier' : 'Aiamapp'}
            className="kulv-toolstrip__button"
          >
            <FileText size={16} color="var(--kulv-primary)" />
            <span>{language === 'en' ? 'Garden Binder' : 'Aiamapp'}</span>
          </button>
        </div>
      </section>

      {/* Main Grid: Today's Tasks on Left, Weather Forecast on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Today's Garden Tasks Section */}
        <section
          id="today-tasks-section"
          className="kulv-paper-card"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--kulv-text)', margin: 0 }}>
              {language === 'en' ? 'Garden Tasks' : 'Aiatööd ja meelespead'}
            </h2>
            <button
              onClick={onOpenAddTask}
              aria-label={language === 'en' ? 'Add new task' : 'Lisa uus aiatöö'}
              className="kulv-button kulv-button--secondary"
              style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <Plus size={14} />
              <span>{language === 'en' ? 'Add task' : 'Lisa ülesanne'}</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--kulv-surface-muted)',
                borderRadius: '12px',
                padding: '28px 20px',
                textAlign: 'center',
                color: 'var(--kulv-text-muted)',
                fontSize: '0.9rem'
              }}
            >
              {language === 'en' ? 'All tasks complete! Enjoy the garden 🌿' : 'Kõik tööd tehtud! Naudi aiarahu 🌿'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </div>
          )}
        </section>

        {/* Weather Forecast Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <WeatherWidget weather={weather} isLoading={isWeatherLoading} onRefresh={() => refreshWeather(true)} />
          <WeatherChart weather={weather} />
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
