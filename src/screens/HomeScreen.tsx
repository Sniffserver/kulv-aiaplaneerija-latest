import React, { useState, Suspense, lazy } from 'react';
import { useGarden } from '../context/GardenContext';
import { WeatherOverview } from '../components/WeatherOverview';
import { TaskCard } from '../components/TaskCard';
import {
  Grid,
  Sprout,
  BookOpen,
  Calendar,
  Droplets,
  Plus,
  FlaskConical,
  CheckCircle,
  Lightbulb,
  Check,
  Zap,
  RefreshCw,
  Printer,
  FileText
} from 'lucide-react';
import { SeasonalSowingPrintDialog } from '../components/dialogs/SeasonalSowingPrintDialog';
import { GardenBinderPrintDialog } from '../components/dialogs/GardenBinderPrintDialog';

// Code-split heavy Recharts visualization bundle
const WeatherChart = lazy(() => import('../components/WeatherChart').then((m) => ({ default: m.WeatherChart })));

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

  const handleQuickWater = () => {
    const res = quickWaterAllPlants();
    setFeedbackToast({
      title: 'Taimed märgitud kastetuks',
      subtitle: res.message
    });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px' }}>
      {/* Toast Notification for Quick Actions */}
      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1.5px solid var(--kulv-primary, #4F6B45)',
            boxShadow: 'var(--kulv-shadow-card, 0 4px 16px rgba(0,0,0,0.12))',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(79, 107, 69, 0.15)',
              color: 'var(--kulv-primary, #4F6B45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Check size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
              {feedbackToast.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
              {feedbackToast.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Welcome & Tagline */}
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
          <h1
            className="font-serif-display"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--kulv-text, #2A2E24)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}
          >
            Tere tulemast aeda!
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--kulv-text-muted, #5F675A)', margin: '4px 0 0 0' }}>
            Põhjamaine aiaplaneerija · {weather.locationName}
          </p>
        </div>
      </div>

      {/* Real-time Weather Forecast Widget */}
      <WeatherOverview />

      {/* 5-Day Recharts Temperature Visualization (Lazy Loaded) */}
      <Suspense
        fallback={
          <div className="weather-chart-skeleton">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <RefreshCw size={16} className="spin-animation" />
              <span>Laadin ilmagraafikut...</span>
            </div>
          </div>
        }
      >
        <WeatherChart weather={weather} />
      </Suspense>

      {/* High-Productivity Quick Actions Section */}
      <div
        data-testid="quick_actions_section"
        style={{
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid var(--kulv-border, #C9BFA9)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--kulv-text, #2A2E24)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            <Zap size={15} color="var(--kulv-accent, #D97A3D)" />
            <span>Kiirtegevused</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>Hooldus & planeerimine</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px'
          }}
        >
          {/* 1. Water Plants Action */}
          <button
            onClick={handleQuickWater}
            data-testid="quick_action_water_plants"
            aria-label="Kasta taimi"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1.5px solid var(--kulv-info, #4F6B45)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(23, 107, 135, 0.12)',
                color: 'var(--kulv-info, #4F6B45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Droplets size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Kasta taimi</div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Märgi kastetuks</div>
            </div>
          </button>

          {/* 2. Check Calendar Action */}
          <button
            onClick={onNavigateToCalendar}
            data-testid="quick_action_check_calendar"
            aria-label="Vaata külvikalendrit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                color: 'var(--kulv-primary, #4F6B45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Calendar size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Külvikalender</div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Ajastused & saak</div>
            </div>
          </button>

          {/* Quick Action: Crop Rotation & Succession */}
          <button
            onClick={onNavigateToGarden}
            data-testid="quick_action_crop_rotation"
            aria-label="Külvikorra ja järjestikülvi ajajoon"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(52, 117, 89, 0.12)',
                color: '#347559',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sprout size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Külvikord</div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Järjestikülv & haigused</div>
            </div>
          </button>

          {/* 3. Soil Recipes & Brews */}
          <button
            onClick={onOpenSoilRecipes}
            data-testid="quick_action_soil_recipes"
            aria-label="Mullaretseptid ja väetised"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(217, 122, 61, 0.12)',
                color: 'var(--kulv-accent, #D97A3D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FlaskConical size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Mullaretseptid</div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Elav muld & leotised</div>
            </div>
          </button>

          {/* 4. Add Task */}
          <button
            onClick={onOpenAddTask}
            data-testid="quick_action_add_task"
            aria-label="Lisa aiatöö"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                color: 'var(--kulv-primary, #4F6B45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Plus size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Lisa aiatöö</div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Uus ülesanne</div>
            </div>
          </button>

          {/* 5. Add Journal Entry */}
          <button
            onClick={onOpenAddJournal}
            data-testid="quick_action_add_journal"
            aria-label="Lisa päeviku märge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                color: 'var(--kulv-primary, #4F6B45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BookOpen size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Aiapäevik</div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Märge / saagikus</div>
            </div>
          </button>

          {/* 6. Grow Tent & Ettekasvatus */}
          <button
            onClick={onOpenGrowTent}
            data-testid="quick_action_grow_tent"
            aria-label="Ettekasvatus ja mikrokliima"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(217, 122, 61, 0.12)',
                color: 'var(--kulv-accent, #D97A3D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Lightbulb size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Ettekasvatus</div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>VPD & mikrokliima</div>
            </div>
          </button>

          {/* 7. Print Sowing Schedule & CSV Export */}
          <button
            onClick={() => setShowPrintDialog(true)}
            data-testid="quick_action_print_schedule"
            aria-label="Külvikava print ja CSV eksport"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                color: 'var(--kulv-primary, #4F6B45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Printer size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>
                {language === 'en' ? 'Print Schedule' : 'Külvikava print'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                {language === 'en' ? 'PDF & CSV Export' : 'PDF & CSV eksport'}
              </div>
            </div>
          </button>

          {/* 8. Printable High-Resolution Garden Binder */}
          <button
            onClick={() => setShowBinderDialog(true)}
            data-testid="quick_action_garden_binder"
            aria-label="Aia täisköide ja krundipass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 107, 69, 0.15)',
                color: 'var(--kulv-primary, #4F6B45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileText size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>{language === 'en' ? 'Garden Binder' : 'Aiamapp'}</div>
              <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                {language === 'en' ? 'Full Dossier & Map' : 'Krundipass & seltsilised'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Garden Summary Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div
          onClick={onNavigateToGarden}
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: 'var(--kulv-shadow-card, 0 4px 12px rgba(0,0,0,0.08))',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--kulv-shadow-card, 0 4px 12px rgba(0,0,0,0.08))';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--kulv-text-muted, #5F675A)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Peenrad & kastid
            </span>
            <Grid size={18} color="var(--kulv-primary, #4F6B45)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--kulv-text, #2A2E24)', marginTop: '8px' }}>
            {beds.length}
          </div>
        </div>

        <div
          onClick={onNavigateToPlants}
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: 'var(--kulv-shadow-card, 0 4px 12px rgba(0,0,0,0.08))',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--kulv-shadow-card, 0 4px 12px rgba(0,0,0,0.08))';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--kulv-text-muted, #5F675A)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Istutatud taimi
            </span>
            <Sprout size={18} color="var(--kulv-primary, #4F6B45)" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--kulv-primary, #4F6B45)', marginTop: '8px' }}>
            {totalPlantings}
          </div>
        </div>
      </div>

      {/* Today's Garden Tasks */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)', margin: 0 }}>
            Aiatööd ja meelespead
          </h2>
          <button
            onClick={onOpenAddTask}
            aria-label="Lisa uus aiatöö"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: 'var(--kulv-primary, #4F6B45)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '4px 6px'
            }}
          >
            <Plus size={14} />
            <span>Lisa ülesanne</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              color: 'var(--kulv-text-muted, #5F675A)',
              fontSize: '13px'
            }}
          >
            Kõik tööd tehtud! Naudi aiarahu 🌿
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
            ))}
          </div>
        )}
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
