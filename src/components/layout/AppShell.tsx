import React, { useState, useEffect } from 'react';
import { useGarden } from '../../context/GardenContext';
import { Plant, ColorPalette } from '../../types';
import { HomeScreen } from '../../screens/HomeScreen';
import { GardenCanvasScreen } from '../../screens/GardenCanvasScreen';
import { PlantsCatalogScreen } from '../../screens/PlantsCatalogScreen';
import { CalendarScreen } from '../../screens/CalendarScreen';
import { JournalScreen } from '../../screens/JournalScreen';
import { BlogScreen } from '../../screens/BlogScreen';
import { AddBedDialog } from '../dialogs/AddBedDialog';
import { AddTaskDialog } from '../dialogs/AddTaskDialog';
import { AddPlantDialog } from '../dialogs/AddPlantDialog';
import { AddJournalDialog } from '../dialogs/AddJournalDialog';
import { PlantDetailDialog } from '../dialogs/PlantDetailDialog';
import { GardenBinderPrintDialog } from '../dialogs/GardenBinderPrintDialog';
import { SoilRecipesDialog } from '../dialogs/SoilRecipesDialog';
import { GrowTentDialog } from '../dialogs/GrowTentDialog';
import { SettingsModal, applyPaletteToDOM } from '../SettingsModal';
import appIconUrl from '../../assets/images/kulv_app_icon_1793083974365.jpg';
import {
  Home,
  Grid,
  Sprout,
  Calendar,
  BookOpen,
  Settings,
  FlaskConical,
  Newspaper,
  Printer
} from 'lucide-react';

export type NavigationScreen = 'home' | 'garden' | 'plants' | 'calendar' | 'journal' | 'blog';

export const AppShell: React.FC = () => {
  const { addBed, addTask, addPlant, addJournalEntry, settings, updateSettings, saveStatus, language, setLanguage, t } =
    useGarden();

  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as NavigationScreen;
      if (['home', 'garden', 'plants', 'calendar', 'journal', 'blog'].includes(hash)) {
        return hash;
      }
    }
    return 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavigationScreen;
      if (['home', 'garden', 'plants', 'calendar', 'journal', 'blog'].includes(hash)) {
        setCurrentScreen(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (screen: NavigationScreen) => {
    setCurrentScreen(screen);
    window.location.hash = `#${screen}`;
  };

  // Modals state
  const [showAddBed, setShowAddBed] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [showGrowTent, setShowGrowTent] = useState(false);
  const [showSoilRecipes, setShowSoilRecipes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBinderDialog, setShowBinderDialog] = useState(false);
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

  const navItems = [
    { id: 'home', label: t('nav_home'), icon: <Home size={18} /> },
    { id: 'garden', label: t('nav_garden'), icon: <Grid size={18} /> },
    { id: 'plants', label: t('nav_plants'), icon: <Sprout size={18} /> },
    { id: 'calendar', label: t('nav_calendar'), icon: <Calendar size={18} /> },
    { id: 'journal', label: t('nav_journal'), icon: <BookOpen size={18} /> },
    { id: 'blog', label: t('nav_blog'), icon: <Newspaper size={18} /> }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100vh',
        backgroundColor: 'var(--kulv-bg, #F9F6F0)',
        color: 'var(--kulv-text, #2A2E24)'
      }}
    >
      {/* Sidebar Navigation (Desktop) */}
      <aside
        data-testid="desktop_sidebar"
        aria-label="Külgriba menüü"
        className="hidden md:flex flex-col border-r shrink-0"
        style={{
          width: '240px',
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          borderColor: 'var(--kulv-border, #C9BFA9)'
        }}
      >
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={appIconUrl}
            alt="KÜLV"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--kulv-border, #C9BFA9)'
            }}
            referrerPolicy="no-referrer"
          />
          <div>
            <h1
              className="font-serif-display"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--kulv-primary, #4F6B45)',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              KÜLV
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', margin: 0 }}>Aiaplaneerija</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((tab) => {
            const active = currentScreen === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id as NavigationScreen)}
                data-testid={`desktop_nav_item_${tab.id}`}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: active ? 'var(--kulv-surface-muted, #EFE6D4)' : 'transparent',
                  color: active ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--kulv-border, #C9BFA9)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
              {saveStatus === 'saved' && (language === 'en' ? 'Saved offline' : 'Salvestatud')}
              {saveStatus === 'saving' && (language === 'en' ? 'Saving...' : 'Salvestan...')}
              {saveStatus === 'error' && (language === 'en' ? 'Sync alert' : 'Sünk vead')}
            </span>

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'et' ? 'en' : 'et')}
              aria-label="Keel / Language"
              style={{
                background: 'none',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              {language === 'et' ? 'ET' : 'EN'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Mobile Header */}
        <header
          className="app-header"
          style={{
            height: '56px',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--kulv-border, #958B79)',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)'
          }}
        >
          <div className="flex md:hidden items-center gap-2">
            <img
              src={appIconUrl}
              alt="KÜLV"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                objectFit: 'cover'
              }}
              referrerPolicy="no-referrer"
            />
            <span
              className="font-serif-display"
              style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kulv-primary, #4F6B45)' }}
            >
              KÜLV
            </span>
          </div>

          <div className="hidden md:block">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--kulv-text-muted, #5F675A)' }}>
              {settings.locationName || 'Tallinn, Eesti'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Garden Binder Print Action */}
            <button
              onClick={() => setShowBinderDialog(true)}
              data-testid="action_print_binder"
              title={language === 'en' ? 'Print Garden Binder' : 'Prindi aia kaust & välipass'}
              aria-label={language === 'en' ? 'Print Garden Binder' : 'Prindi aia kaust'}
              className="touch-target"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #958B79)',
                backgroundColor: 'var(--kulv-surface-muted, #F1EBDD)',
                cursor: 'pointer',
                color: 'var(--kulv-primary, #4F6B45)',
                transition: 'all 0.15s ease'
              }}
            >
              <Printer size={18} />
            </button>

            {/* Soil Recipes Dialog Trigger */}
            <button
              onClick={() => setShowSoilRecipes(true)}
              data-testid="action_soil_recipes"
              title={language === 'en' ? 'Soil Recipes' : 'Mullaretseptid'}
              aria-label={language === 'en' ? 'Soil Recipes' : 'Mullaretseptid'}
              className="touch-target"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #958B79)',
                backgroundColor: 'var(--kulv-surface-muted, #F1EBDD)',
                cursor: 'pointer',
                color: 'var(--kulv-primary, #4F6B45)',
                transition: 'all 0.15s ease'
              }}
            >
              <FlaskConical size={18} />
            </button>

            {/* Settings Trigger */}
            <button
              onClick={() => setShowSettings(true)}
              data-testid="action_settings"
              title={t('settings_title')}
              aria-label={t('settings_title')}
              className="touch-target"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
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
        <main className="app-main-content" style={{ flex: 1 }}>
          {currentScreen === 'home' && (
            <HomeScreen
              onNavigateToGarden={() => navigateTo('garden')}
              onNavigateToPlants={() => navigateTo('plants')}
              onNavigateToJournal={() => navigateTo('journal')}
              onNavigateToCalendar={() => navigateTo('calendar')}
              onOpenAddTask={() => setShowAddTask(true)}
              onOpenAddJournal={() => setShowAddJournal(true)}
              onOpenSoilRecipes={() => setShowSoilRecipes(true)}
              onOpenGrowTent={() => setShowGrowTent(true)}
            />
          )}

          {currentScreen === 'garden' && <GardenCanvasScreen onOpenAddBed={() => setShowAddBed(true)} />}

          {currentScreen === 'plants' && (
            <PlantsCatalogScreen
              onSelectPlant={(plant) => setSelectedPlantDetail(plant)}
              onOpenAddCustomPlant={() => setShowAddPlant(true)}
            />
          )}

          {currentScreen === 'calendar' && <CalendarScreen />}

          {currentScreen === 'journal' && <JournalScreen onOpenAddEntry={() => setShowAddJournal(true)} />}

          {currentScreen === 'blog' && <BlogScreen />}
        </main>

        {/* Bottom Navigation Bar (Mobile) */}
        <nav data-testid="bottom_nav_bar" aria-label="Peamenüü" className="bottom-nav-bar">
          {navItems.map((tab) => {
            const active = currentScreen === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id as NavigationScreen)}
                data-testid={`nav_item_${tab.id}`}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  cursor: 'pointer',
                  color: active ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
                  padding: '6px 12px',
                  minWidth: '48px',
                  minHeight: '48px'
                }}
              >
                {tab.icon}
                <span style={{ fontSize: '11px', fontWeight: active ? 700 : 500 }}>{tab.label}</span>
              </button>
            );
          })}
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

      {showGrowTent && <GrowTentDialog isOpen={showGrowTent} onDismiss={() => setShowGrowTent(false)} />}
      {showSoilRecipes && <SoilRecipesDialog isOpen={showSoilRecipes} onDismiss={() => setShowSoilRecipes(false)} />}
      {selectedPlantDetail && (
        <PlantDetailDialog plant={selectedPlantDetail} onDismiss={() => setSelectedPlantDetail(null)} />
      )}
      {showBinderDialog && (
        <GardenBinderPrintDialog
          isOpen={showBinderDialog}
          onClose={() => setShowBinderDialog(false)}
          language={language}
        />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        locationName={settings.locationName}
        springFrostDate={settings.springFrostDate}
        autumnFrostDate={settings.autumnFrostDate}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
};
