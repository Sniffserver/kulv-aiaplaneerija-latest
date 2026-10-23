import React, { useState } from 'react';
import { useGarden } from './context/GardenContext';
import { Plant, ColorPalette } from './types';
import { HomeScreen } from './screens/HomeScreen';
import { GardenCanvasScreen } from './screens/GardenCanvasScreen';
import { PlantsCatalogScreen } from './screens/PlantsCatalogScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { JournalScreen } from './screens/JournalScreen';
import { BlogScreen } from './screens/BlogScreen';
import { AddBedDialog } from './components/dialogs/AddBedDialog';
import { AddTaskDialog } from './components/dialogs/AddTaskDialog';
import { AddPlantDialog } from './components/dialogs/AddPlantDialog';
import { AddJournalDialog } from './components/dialogs/AddJournalDialog';
import { PlantDetailDialog } from './components/dialogs/PlantDetailDialog';
import { GrowTentDialog } from './components/dialogs/GrowTentDialog';
import { SoilRecipesDialog } from './components/dialogs/SoilRecipesDialog';
import { SettingsModal, applyPaletteToDOM } from './components/SettingsModal';
import { Home, Grid, Sprout, Calendar, BookOpen, Lightbulb, Settings, FlaskConical, Check, CloudCheck, AlertCircle, Newspaper } from 'lucide-react';

export type NavigationScreen = 'home' | 'garden' | 'plants' | 'calendar' | 'journal' | 'blog';

export const App: React.FC = () => {
  const { addBed, addTask, addPlant, addJournalEntry, settings, updateSettings, saveStatus, language, setLanguage, t } = useGarden();

  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>('home');

  // Modals state
  const [showAddBed, setShowAddBed] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [showGrowTent, setShowGrowTent] = useState(false);
  const [showSoilRecipes, setShowSoilRecipes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPlantDetail, setSelectedPlantDetail] = useState<Plant | null>(null);

  const handleSaveSettings = (newSettings: {
    palette: ColorPalette;
    location: string;
    lat: number;
    lng: number;
    springFrost: string;
    autumnFrost: string;
  }) => {
    updateSettings(
      newSettings.location,
      newSettings.lat,
      newSettings.lng,
      newSettings.springFrost,
      newSettings.autumnFrost,
      newSettings.palette
    );
    applyPaletteToDOM(newSettings.palette);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--kulv-bg, #FAF6ED)',
        color: 'var(--kulv-text, #252A22)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}
    >
      <div
        className="app-container"
        style={{
          width: '100%',
          maxWidth: '1440px',
          minHeight: '100vh',
          backgroundColor: 'var(--kulv-bg, #FAF6ED)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          borderLeft: '1px solid var(--kulv-border, #C9BFA9)',
          borderRight: '1px solid var(--kulv-border, #C9BFA9)'
        }}
      >
        {/* Top App Bar - Nordic Botanical Field Notebook Header */}
        <header
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            zIndex: 20,
            position: 'sticky',
            top: 0
          }}
        >
          {/* Brand & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className="font-serif-display"
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: 'var(--kulv-primary, #385A40)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1
                  }}
                >
                  KÜLV
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: saveStatus === 'saved' ? 'var(--kulv-primary, #385A40)' : 'var(--kulv-danger, #B4233A)'
                  }}
                  title={language === 'en' ? 'Local storage status' : 'Andmete kohalik salvestusseisund seadmes'}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: saveStatus === 'saved' ? 'var(--kulv-primary, #385A40)' : 'var(--kulv-danger, #B4233A)'
                    }}
                  />
                  <span>{saveStatus === 'saved' ? t('status_saved') : saveStatus === 'saving' ? t('status_saving') : t('status_error')}</span>
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #52594D)', marginTop: '2px', letterSpacing: '0.01em' }}>
                {t('app_subtitle')}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links (Tablet & Desktop >= 768px) */}
          <nav className="desktop-nav-tabs" aria-label="Navigatsioon" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[
              { id: 'home', label: t('nav_home'), icon: <Home size={15} /> },
              { id: 'garden', label: t('nav_garden'), icon: <Grid size={15} /> },
              { id: 'plants', label: t('nav_plants'), icon: <Sprout size={15} /> },
              { id: 'calendar', label: t('nav_calendar'), icon: <Calendar size={15} /> },
              { id: 'journal', label: t('nav_journal'), icon: <BookOpen size={15} /> },
              { id: 'blog', label: t('nav_blog'), icon: <Newspaper size={15} /> }
            ].map((tab) => {
              const active = currentScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentScreen(tab.id as NavigationScreen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    minHeight: '40px',
                    backgroundColor: active ? 'var(--kulv-surface-muted, #F1EBDD)' : 'transparent',
                    color: active ? 'var(--kulv-primary, #385A40)' : 'var(--kulv-text, #252A22)',
                    boxShadow: active ? 'inset 0 -2px 0 var(--kulv-primary, #385A40)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Header Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Language Switcher ET / EN */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'var(--kulv-surface-muted, #F1EBDD)',
                borderRadius: '8px',
                padding: '2px',
                border: '1px solid var(--kulv-border, #958B79)'
              }}
              role="group"
              aria-label="Keele valik / Language select"
            >
              <button
                onClick={() => setLanguage('et')}
                title="Eesti keel"
                aria-label="Vali eesti keel"
                style={{
                  border: 'none',
                  backgroundColor: language === 'et' ? 'var(--kulv-primary, #385A40)' : 'transparent',
                  color: language === 'et' ? '#FFFFFF' : 'var(--kulv-text, #252A22)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                ET
              </button>
              <button
                onClick={() => setLanguage('en')}
                title="English"
                aria-label="Select English"
                style={{
                  border: 'none',
                  backgroundColor: language === 'en' ? 'var(--kulv-primary, #385A40)' : 'transparent',
                  color: language === 'en' ? '#FFFFFF' : 'var(--kulv-text, #252A22)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                EN
              </button>
            </div>

            {/* Quick Action Dialog Triggers with Consistent Padding & Hover */}
            <button
              onClick={() => setShowSoilRecipes(true)}
              data-testid="action_soil_recipes"
              title={t('action_soil_recipes')}
              aria-label={t('action_soil_recipes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #958B79)',
                backgroundColor: 'var(--kulv-surface-muted, #F1EBDD)',
                cursor: 'pointer',
                color: 'var(--kulv-accent, #C76D3A)',
                transition: 'all 0.15s ease'
              }}
            >
              <FlaskConical size={18} />
            </button>

            <button
              onClick={() => setShowGrowTent(true)}
              data-testid="action_grow_tent"
              title={t('action_grow_tent')}
              aria-label={t('action_grow_tent')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #958B79)',
                backgroundColor: 'var(--kulv-surface-muted, #F1EBDD)',
                cursor: 'pointer',
                color: 'var(--kulv-primary, #385A40)',
                transition: 'all 0.15s ease'
              }}
            >
              <Lightbulb size={18} />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              data-testid="action_settings"
              title={t('action_settings')}
              aria-label={t('action_settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #958B79)',
                backgroundColor: 'var(--kulv-surface-muted, #F1EBDD)',
                cursor: 'pointer',
                color: 'var(--kulv-text-muted, #52594D)',
                transition: 'all 0.15s ease'
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="app-main-content">
          {currentScreen === 'home' && (
            <HomeScreen
              onNavigateToGarden={() => setCurrentScreen('garden')}
              onNavigateToPlants={() => setCurrentScreen('plants')}
              onNavigateToJournal={() => setCurrentScreen('journal')}
              onNavigateToCalendar={() => setCurrentScreen('calendar')}
              onOpenAddTask={() => setShowAddTask(true)}
              onOpenAddJournal={() => setShowAddJournal(true)}
              onOpenSoilRecipes={() => setShowSoilRecipes(true)}
              onOpenGrowTent={() => setShowGrowTent(true)}
            />
          )}

          {currentScreen === 'garden' && (
            <GardenCanvasScreen onOpenAddBed={() => setShowAddBed(true)} />
          )}

          {currentScreen === 'plants' && (
            <PlantsCatalogScreen
              onSelectPlant={(plant) => setSelectedPlantDetail(plant)}
              onOpenAddCustomPlant={() => setShowAddPlant(true)}
            />
          )}

          {currentScreen === 'calendar' && <CalendarScreen />}

          {currentScreen === 'journal' && (
            <JournalScreen onOpenAddEntry={() => setShowAddJournal(true)} />
          )}

          {currentScreen === 'blog' && <BlogScreen />}
        </main>

        {/* Bottom Navigation Bar (strictly mobile < 768px) */}
        <nav
          data-testid="bottom_nav_bar"
          aria-label="Peamenüü"
          className="bottom-nav-bar"
        >
          <button
            onClick={() => setCurrentScreen('home')}
            data-testid="nav_item_home"
            aria-label="Kodu"
            aria-current={currentScreen === 'home' ? 'page' : undefined}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: currentScreen === 'home' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
              padding: '6px 12px',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <Home size={19} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'home' ? 700 : 500 }}>{t('nav_home')}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('garden')}
            data-testid="nav_item_garden"
            aria-label={t('nav_garden')}
            aria-current={currentScreen === 'garden' ? 'page' : undefined}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: currentScreen === 'garden' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
              padding: '6px 12px',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <Grid size={19} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'garden' ? 700 : 500 }}>{t('nav_garden')}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('plants')}
            data-testid="nav_item_plants"
            aria-label={t('nav_plants')}
            aria-current={currentScreen === 'plants' ? 'page' : undefined}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: currentScreen === 'plants' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
              padding: '6px 12px',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <Sprout size={19} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'plants' ? 700 : 500 }}>{t('nav_plants')}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('calendar')}
            data-testid="nav_item_calendar"
            aria-label={t('nav_calendar')}
            aria-current={currentScreen === 'calendar' ? 'page' : undefined}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: currentScreen === 'calendar' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
              padding: '6px 12px',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <Calendar size={19} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'calendar' ? 700 : 500 }}>{t('nav_calendar')}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('journal')}
            data-testid="nav_item_journal"
            aria-label={t('nav_journal')}
            aria-current={currentScreen === 'journal' ? 'page' : undefined}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: currentScreen === 'journal' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
              padding: '6px 12px',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <BookOpen size={19} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'journal' ? 700 : 500 }}>{t('nav_journal')}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('blog')}
            data-testid="nav_item_blog"
            aria-label={t('nav_blog')}
            aria-current={currentScreen === 'blog' ? 'page' : undefined}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer',
              color: currentScreen === 'blog' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
              padding: '6px 12px',
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <Newspaper size={19} />
            <span style={{ fontSize: '11px', fontWeight: currentScreen === 'blog' ? 700 : 500 }}>{t('nav_blog')}</span>
          </button>
        </nav>
      </div>

      {/* Active Modals */}
      <AddBedDialog
        isOpen={showAddBed}
        onDismiss={() => setShowAddBed(false)}
        onConfirm={(name, type, w, l, cover, notes) => {
          addBed(name, type, w, l, cover, notes);
          setShowAddBed(false);
        }}
      />

      <AddTaskDialog
        isOpen={showAddTask}
        onDismiss={() => setShowAddTask(false)}
        onConfirm={(title, dueDate, category) => {
          addTask(title, dueDate, category);
          setShowAddTask(false);
        }}
      />

      <AddPlantDialog
        isOpen={showAddPlant}
        onDismiss={() => setShowAddPlant(false)}
        onConfirm={(name, fam, icon, days, space, depth, desc) => {
          addPlant(name, fam, icon, days, space, depth, desc);
          setShowAddPlant(false);
        }}
      />

      <AddJournalDialog
        isOpen={showAddJournal}
        onDismiss={() => setShowAddJournal(false)}
        onConfirm={(
          title,
          content,
          category,
          date,
          photoUrl,
          plantId,
          plantName,
          yieldAmount,
          yieldUnit,
          growthStage,
          growthProgressPct
        ) => {
          addJournalEntry(
            title,
            content,
            category,
            date,
            photoUrl,
            plantId,
            plantName,
            yieldAmount,
            yieldUnit,
            growthStage,
            growthProgressPct
          );
          setShowAddJournal(false);
        }}
      />

      <GrowTentDialog
        isOpen={showGrowTent}
        onDismiss={() => setShowGrowTent(false)}
      />

      <SoilRecipesDialog
        isOpen={showSoilRecipes}
        onDismiss={() => setShowSoilRecipes(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        locationName={settings.locationName}
        springFrostDate={settings.springFrostDate}
        autumnFrostDate={settings.autumnFrostDate}
        onSaveSettings={handleSaveSettings}
      />

      <PlantDetailDialog
        plant={selectedPlantDetail}
        onDismiss={() => setSelectedPlantDetail(null)}
      />
    </div>
  );
};
