import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Plant,
  GardenBed,
  Task,
  JournalEntry,
  AppSettings,
  WeatherInfo,
  BedPlantingCell,
  GardenBackup,
  YardPlan,
  GardenEntity,
  YardLayer,
  convertEntityToBed,
  convertBedToGardenEntity,
  RotationCyclePlan
} from '../types';
import { DEFAULT_PLANTS } from '../data/defaultPlants';
import {
  INITIAL_BEDS,
  INITIAL_TASKS,
  INITIAL_JOURNAL,
  INITIAL_SETTINGS,
  INITIAL_YARD_PLAN,
  buildInitialYardPlan
} from '../data/defaultData';
import { fetchLiveWeather, getFallbackWeather } from '../logic/weatherService';
import { getStoredItem, setStoredItem } from '../logic/storageDb';
import { MicroclimateEngine, MicroclimateProfile } from '../logic/microclimateEngine';
import { migratePlan, importPlan } from '../lib/migrations';
import { useYardStore } from '../stores/yardStore';
import { replaceGardenState, subscribeGardenReplaced } from '../services/gardenState';
import { Language, getTranslation } from '../i18n/translations';

interface GardenContextType {
  plants: Plant[];
  beds: GardenBed[];
  tasks: Task[];
  journal: JournalEntry[];
  settings: AppSettings;
  yardPlan: YardPlan;
  weather: WeatherInfo;
  isWeatherLoading: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  language: 'et' | 'en';
  setLanguage: (lang: 'et' | 'en') => void;
  t: (key: string) => string;
  refreshWeather: (forceRefresh?: boolean) => Promise<void>;
  exportBackup: () => void;
  importBackup: (jsonString: string) => Promise<{ success: boolean; message: string }>;

  isDarkMode: boolean;
  toggleDarkMode: () => void;
  resetToDefaults: () => void;
  quickWaterAllPlants: () => { wateredCount: number; message: string };
  addBed: (
    name: string,
    type: 'raisedBed' | 'inGroundBed' | 'greenhouse' | 'pot',
    width: number,
    length: number,
    coverType: 'none' | 'greenhouse' | 'fleece' | 'coldFrame',
    notes: string
  ) => void;
  deleteBed: (bedId: string) => void;
  updateBedRotationPlan: (bedId: string, plan: RotationCyclePlan) => void;
  plantInBed: (bedId: string, plant: Plant, gridX: number, gridY: number) => void;
  removePlantFromBed: (bedId: string, gridX: number, gridY: number) => void;
  addPlant: (
    name: string,
    family: string,
    icon: string,
    daysToMaturity: number,
    spacingCm: number,
    depthCm: number,
    description: string
  ) => void;
  addTask: (
    title: string,
    dueDate: string,
    category: 'sow' | 'water' | 'plant' | 'feed' | 'harvest' | 'general'
  ) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  addJournalEntry: (
    title: string,
    content: string,
    category: 'observation' | 'harvest' | 'problem' | 'weather',
    date: string,
    photoUrl?: string | null,
    plantId?: string | null,
    plantName?: string | null,
    yieldAmount?: number | null,
    yieldUnit?: 'kg' | 'g' | 'tk' | null,
    growthStage?: string | null,
    growthProgressPct?: number | null
  ) => void;
  deleteJournalEntry: (entryId: string) => void;
  scheduleFrostProtectionTask: (dueDate?: string, tempMin?: number) => void;
  soilType: 'sandy' | 'loam' | 'clay';
  setSoilType: (soil: 'sandy' | 'loam' | 'clay') => void;
  microclimateProfile: any;
  updateMicroclimateOffset: (offset: number, name?: string) => void;
  updateSettings: (
    locationName: string,
    lat: number,
    lng: number,
    springFrostDate: string,
    autumnFrostDate: string,
    themeMode?: string,
    soilType?: 'sandy' | 'loam' | 'clay',
    microclimateOffset?: number
  ) => void;
  addYardEntity: (preset: any, x?: number, y?: number) => string;
  updateYardEntity: (id: string, updates: Partial<GardenEntity>) => void;
  deleteYardEntity: (id: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  updateYardDimensions: (widthM: number, lengthM: number, northAngleDeg?: number) => void;
  showWarnings: boolean;
  toggleShowWarnings: () => void;
}

export function generateSafeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

const GardenContext = createContext<GardenContextType | null>(null);

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(`kulv_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export const GardenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plants, setPlants] = useState<Plant[]>(() => loadFromStorage('plants', DEFAULT_PLANTS));
  const [beds, setBeds] = useState<GardenBed[]>(() => loadFromStorage('beds', INITIAL_BEDS));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('tasks', INITIAL_TASKS));
  const [journal, setJournal] = useState<JournalEntry[]>(() => loadFromStorage('journal', INITIAL_JOURNAL));
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage('settings', INITIAL_SETTINGS));
  const [yardPlan, setYardPlan] = useState<YardPlan>(() => loadFromStorage('yard_plan', INITIAL_YARD_PLAN));
  const [weather, setWeather] = useState<WeatherInfo>(() =>
    getFallbackWeather(settings.lat || 59.437, settings.lng || 24.754, settings.locationName || 'Tallinn')
  );
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem('kulv-lang') as Language;
        if (cached === 'et' || cached === 'en') return cached;
      }
    } catch {}
    return settings.language || 'et';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    setSettings((prev) => ({ ...prev, language: lang }));
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kulv-lang', lang);
      }
    } catch {}
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getTranslation(key, language);
    },
    [language]
  );

  // Asynchronously load from IndexedDB with localStorage fallback
  useEffect(() => {
    let isMounted = true;
    async function initFromDatabase() {
      try {
        const [loadedPlants, loadedBeds, loadedTasks, loadedJournal, loadedSettings, loadedYardPlan] =
          await Promise.all([
            getStoredItem('plants', DEFAULT_PLANTS),
            getStoredItem('beds', INITIAL_BEDS),
            getStoredItem('tasks', INITIAL_TASKS),
            getStoredItem('journal', INITIAL_JOURNAL),
            getStoredItem('settings', INITIAL_SETTINGS),
            getStoredItem('yard_plan', INITIAL_YARD_PLAN)
          ]);

        if (isMounted) {
          if (loadedPlants && loadedPlants.length > 0) setPlants(loadedPlants);
          if (loadedBeds && loadedBeds.length > 0) setBeds(loadedBeds);
          if (loadedTasks && loadedTasks.length > 0) setTasks(loadedTasks);
          if (loadedJournal && loadedJournal.length > 0) setJournal(loadedJournal);
          if (loadedSettings) setSettings(loadedSettings);
          if (loadedYardPlan && loadedYardPlan.entities) {
            const migrated = migratePlan(loadedYardPlan);
            setYardPlan(migrated);
            useYardStore.getState().setPlan(migrated);
          } else if (loadedBeds && loadedBeds.length > 0) {
            const migrated = migratePlan(loadedBeds);
            setYardPlan(migrated);
            useYardStore.getState().setPlan(migrated);
          }
        }
      } catch {
        // Fall back to current memory state
      }
    }

    initFromDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveToStorage = useCallback(async <T,>(key: string, value: T): Promise<void> => {
    try {
      setSaveStatus('saving');
      await setStoredItem(key, value);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, []);

  useEffect(() => {
    saveToStorage('plants', plants);
  }, [plants, saveToStorage]);

  useEffect(() => {
    saveToStorage('beds', beds);
  }, [beds, saveToStorage]);

  useEffect(() => {
    saveToStorage('tasks', tasks);
  }, [tasks, saveToStorage]);

  useEffect(() => {
    saveToStorage('journal', journal);
  }, [journal, saveToStorage]);

  useEffect(() => {
    saveToStorage('settings', settings);
  }, [settings, saveToStorage]);

  useEffect(() => {
    saveToStorage('yard_plan', yardPlan);
  }, [yardPlan, saveToStorage]);

  // Load live weather when settings latitude or longitude change (supports forceRefresh)
  const refreshWeather = useCallback(
    async (forceRefresh = false) => {
      setIsWeatherLoading(true);
      try {
        const data = await fetchLiveWeather(settings.lat, settings.lng, settings.locationName, forceRefresh);
        setWeather(data);
      } catch {
        setWeather(getFallbackWeather(settings.lat, settings.lng, settings.locationName));
      } finally {
        setIsWeatherLoading(false);
      }
    },
    [settings.lat, settings.lng, settings.locationName]
  );

  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  const [soilType, setSoilTypeState] = useState<'sandy' | 'loam' | 'clay'>(() => settings.soilType || 'loam');
  const [showWarnings, setShowWarnings] = useState<boolean>(false);
  const [microclimateProfile, setMicroclimateProfile] = useState<MicroclimateProfile>(() =>
    MicroclimateEngine.loadProfile()
  );

  const toggleShowWarnings = useCallback(() => {
    setShowWarnings((prev) => !prev);
  }, []);

  const setSoilType = (type: 'sandy' | 'loam' | 'clay') => {
    setSoilTypeState(type);
    setSettings((prev) => ({ ...prev, soilType: type }));
  };

  const updateMicroclimateOffset = (offset: number, name?: string) => {
    const newProfile = MicroclimateEngine.calculateProfile([
      {
        id: generateSafeId('sample'),
        date: new Date().toISOString().split('T')[0],
        forecastMin: 0,
        measuredMin: offset,
        offset,
        environment: 'open_bed'
      }
    ]);
    if (name) newProfile.name = name;
    setMicroclimateProfile(newProfile);
    MicroclimateEngine.saveProfile(newProfile);
    setSettings((prev) => ({ ...prev, microclimateOffset: offset }));
  };

  // Automatic actionable frost protection task when night frost or <= 3°C is forecast
  useEffect(() => {
    if (!weather.dailyForecast || weather.dailyForecast.length === 0) return;

    const upcomingNights = weather.dailyForecast.slice(0, 3);
    const coldNight = upcomingNights.find(
      (d) => d.tempMin <= 3 || d.frostRisk === 'light' || d.frostRisk === 'moderate' || d.frostRisk === 'severe'
    );

    if (coldNight) {
      const taskTitle = `Kata tundlikud taimed kattelooriga / Sule kasvuhoone! (${coldNight.dayName} öösel ${coldNight.tempMin > 0 ? '+' : ''}${coldNight.tempMin}°C)`;

      setTasks((prevTasks) => {
        const existing = prevTasks.find(
          (t) =>
            t.dueDate === coldNight.date && t.title.includes('Kata tundlikud taimed kattelooriga / Sule kasvuhoone')
        );
        if (existing) return prevTasks;

        const newTask: Task = {
          id: generateSafeId('task_frost'),
          title: taskTitle,
          completed: false,
          dueDate: coldNight.date,
          category: 'general',
          createdAt: new Date().toISOString().split('T')[0]
        };
        return [newTask, ...prevTasks];
      });
    }
  }, [weather]);

  const scheduleFrostProtectionTask = useCallback(
    (dueDate?: string, tempMin?: number) => {
      const targetDate = dueDate || weather.dailyForecast?.[0]?.date || new Date().toISOString().split('T')[0];
      const tempStr = tempMin !== undefined ? `${tempMin > 0 ? '+' : ''}${tempMin}°C` : 'öökülm';
      const taskTitle = `Kata tundlikud taimed kattelooriga / Sule kasvuhoone! (${tempStr})`;

      setTasks((prev) => {
        const exists = prev.find(
          (t) => t.dueDate === targetDate && t.title.includes('Kata tundlikud taimed kattelooriga / Sule kasvuhoone')
        );
        if (exists) return prev;

        const newTask: Task = {
          id: generateSafeId('task_frost'),
          title: taskTitle,
          completed: false,
          dueDate: targetDate,
          category: 'general',
          createdAt: new Date().toISOString().split('T')[0]
        };
        return [newTask, ...prev];
      });
    },
    [weather]
  );

  // JSON Export for garden configuration, yard plan and journal entries
  const exportBackup = useCallback(() => {
    const currentYardPlan = useYardStore.getState().plan;
    const backupData: GardenBackup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'KÜLV – Aia- ja taimekasvatuse planeerija',
      settings,
      beds,
      journal,
      tasks,
      customPlants: plants.filter((p) => p.isCustom),
      yardPlan: currentYardPlan
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `kulv_varukoopia_${(settings.locationName || 'aed').toLowerCase()}_${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [settings, beds, journal, tasks, plants]);

  // Subscribe to atomic garden replacements (from import, sync-pull, or restore)
  useEffect(() => {
    const unsubscribe = subscribeGardenReplaced(({ snapshot }) => {
      setBeds(snapshot.beds);
      setTasks(snapshot.tasks);
      setJournal(snapshot.journal);
      setSettings(snapshot.settings);
      setPlants((prev) => {
        const defaultList = prev.filter((p) => !p.isCustom);
        return [...(snapshot.customPlants || []), ...defaultList];
      });
      setYardPlan(snapshot.yardPlan);
      useYardStore.getState().setPlan(snapshot.yardPlan);
    });
    return unsubscribe;
  }, []);

  // Atomic JSON Import using replaceGardenState
  const importBackup = useCallback(async (jsonString: string): Promise<{ success: boolean; message: string }> => {
    const result = await replaceGardenState(jsonString, { source: 'import' });
    if (result.ok) {
      return {
        success: true,
        message: `Varukoopia edukalt valideeritud ja aatomiliselt taastatud! (${result.snapshot.beds.length} peenart, ${result.snapshot.tasks.length} aiatööd, ${result.snapshot.journal.length} päevikukirjet)`
      };
    }
    return {
      success: false,
      message: result.error.message
    };
  }, []);

  const addBed = (
    name: string,
    type: 'raisedBed' | 'inGroundBed' | 'greenhouse' | 'pot',
    width: number,
    length: number,
    coverType: 'none' | 'greenhouse' | 'fleece' | 'coldFrame',
    notes: string
  ) => {
    const newBed: GardenBed = {
      id: generateSafeId('bed'),
      name,
      type,
      x: Math.floor(Math.random() * 8) + 1,
      y: Math.floor(Math.random() * 8) + 1,
      width,
      length,
      height: 0.3,
      rotation: 0,
      coverType,
      notes,
      plantings: [],
      calculatedSunHours: 7.5
    };
    setBeds((prev) => [...prev, newBed]);
    setYardPlan((prev) => ({
      ...prev,
      entities: [...prev.entities, convertBedToGardenEntity(newBed)],
      updatedAt: new Date().toISOString()
    }));
  };

  const deleteBed = (bedId: string) => {
    setBeds((prev) => prev.filter((b) => b.id !== bedId));
    setYardPlan((prev) => ({
      ...prev,
      entities: prev.entities.filter((e) => e.id !== bedId),
      updatedAt: new Date().toISOString()
    }));
  };

  const updateBedRotationPlan = useCallback((bedId: string, plan: RotationCyclePlan) => {
    setBeds((prev) => prev.map((b) => (b.id === bedId ? { ...b, rotationPlan: plan } : b)));
    setYardPlan((prev) => ({
      ...prev,
      entities: prev.entities.map((e) => {
        if (e.id === bedId && e.bedData) {
          return {
            ...e,
            bedData: {
              ...e.bedData,
              rotationPlan: plan
            }
          };
        }
        return e;
      }),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const addYardEntity = (preset: any, x?: number, y?: number): string => {
    const newId = generateSafeId('entity');
    const now = new Date().toISOString();
    const rawX = x !== undefined ? x : Math.floor(Math.random() * 8) + 2;
    const rawY = y !== undefined ? y : Math.floor(Math.random() * 8) + 2;
    const posX = Math.round(rawX * 2) / 2;
    const posY = Math.round(rawY * 2) / 2;

    const layerMapping: Record<string, string> = {
      structure: 'structures',
      bed: 'beds',
      tree: 'plants',
      shrub: 'plants',
      hedge: 'plants',
      path: 'infrastructure',
      water: 'infrastructure',
      furniture: 'furniture'
    };

    const newEntity: GardenEntity = {
      id: newId,
      name: preset.name,
      category: preset.category,
      subType: preset.subType,
      icon: preset.icon,
      x: posX,
      y: posY,
      elevationM: 0,
      rotation: 0,
      shapeType: preset.shapeType || 'rectangle',
      width: preset.defaultWidth,
      length: preset.defaultLength,
      heightM: preset.defaultHeight,
      shadowCasting: preset.shadowCasting ?? true,
      foliageOpacity: preset.foliageOpacity,
      materialType: preset.materialType || 'wood',
      color: preset.color || '#4F6B45',
      zIndex:
        preset.category === 'structure' ? 20 : preset.category === 'tree' ? 15 : preset.category === 'bed' ? 10 : 5,
      layerId: layerMapping[preset.category] || 'structures',
      locked: false,
      visible: true,
      tags: [preset.category, preset.subType],
      createdAt: now,
      updatedAt: now,
      bedData:
        preset.category === 'bed'
          ? {
              type: preset.subType === 'greenhouse' ? 'greenhouse' : preset.subType === 'pot' ? 'pot' : 'raisedBed',
              coverType: preset.subType === 'greenhouse' ? 'greenhouse' : 'none',
              plantings: [],
              calculatedSunHours: 8.0,
              notes: preset.description
            }
          : undefined,
      botanicalData: preset.botanicalData
    };

    setYardPlan((prev) => ({
      ...prev,
      entities: [...prev.entities, newEntity],
      updatedAt: now
    }));

    // If category is bed, also register in beds array
    if (newEntity.category === 'bed') {
      const newBed = convertEntityToBed(newEntity);
      if (newBed) {
        setBeds((prev) => [...prev, newBed]);
      }
    }

    return newId;
  };

  const updateYardEntity = (id: string, updates: Partial<GardenEntity>) => {
    const now = new Date().toISOString();
    setYardPlan((prev) => {
      const updatedEntities = prev.entities.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...updates, updatedAt: now };

        // Keep beds in sync
        if (updated.category === 'bed') {
          setBeds((prevBeds) =>
            prevBeds.map((b) => {
              if (b.id !== id) return b;
              return {
                ...b,
                name: updated.name,
                x: updated.x,
                y: updated.y,
                width: updated.width,
                length: updated.length,
                height: updated.heightM,
                rotation: updated.rotation
              };
            })
          );
        }
        return updated;
      });

      return {
        ...prev,
        entities: updatedEntities,
        updatedAt: now
      };
    });
  };

  const deleteYardEntity = (id: string) => {
    setYardPlan((prev) => ({
      ...prev,
      entities: prev.entities.filter((e) => e.id !== id),
      updatedAt: new Date().toISOString()
    }));
    setBeds((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleLayerVisibility = (layerId: string) => {
    setYardPlan((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    }));
  };

  const toggleLayerLock = (layerId: string) => {
    setYardPlan((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l))
    }));
  };

  const updateYardDimensions = (widthM: number, lengthM: number, northAngleDeg?: number) => {
    const now = new Date().toISOString();
    setYardPlan((prev) => ({
      ...prev,
      widthM,
      lengthM,
      northAngleDeg: northAngleDeg !== undefined ? northAngleDeg : prev.northAngleDeg,
      updatedAt: now
    }));
    setSettings((prev) => ({
      ...prev,
      yardWidthM: widthM,
      yardLengthM: lengthM,
      northAngle: northAngleDeg !== undefined ? northAngleDeg : prev.northAngle
    }));
  };

  const plantInBed = (bedId: string, plant: Plant, gridX: number, gridY: number) => {
    setBeds((prev) =>
      prev.map((bed) => {
        if (bed.id !== bedId) return bed;
        const newCell: BedPlantingCell = {
          id: generateSafeId(`cell_${gridX}_${gridY}`),
          bedId,
          plantId: plant.id,
          plantName: plant.name,
          plantIcon: plant.icon,
          gridX,
          gridY,
          year: new Date().getFullYear(),
          dateAdded: new Date().toISOString().split('T')[0]
        };
        const filtered = bed.plantings.filter((c) => !(c.gridX === gridX && c.gridY === gridY));
        return {
          ...bed,
          plantings: [...filtered, newCell]
        };
      })
    );
  };

  const removePlantFromBed = (bedId: string, gridX: number, gridY: number) => {
    setBeds((prev) =>
      prev.map((bed) => {
        if (bed.id !== bedId) return bed;
        return {
          ...bed,
          plantings: bed.plantings.filter((c) => !(c.gridX === gridX && c.gridY === gridY))
        };
      })
    );
  };

  const addPlant = (
    name: string,
    family: string,
    icon: string,
    daysToMaturity: number,
    spacingCm: number,
    depthCm: number,
    description: string
  ) => {
    const newPlant: Plant = {
      id: generateSafeId('custom_plant'),
      name,
      scientificName: '',
      family,
      icon: icon.trim() || '🌱',
      varieties: [],
      optimalSowDateStart: '04-15',
      optimalPlantOutDate: '05-20',
      optimalHarvestDate: '08-10',
      sunNeed: 'full',
      sunHoursMin: 6,
      waterNeed: 'medium',
      spacingCm,
      rowSpacingCm: spacingCm + 15,
      depthCm,
      daysToMaturity,
      weeksBeforeFrostSowIndoors: null,
      weeksAfterFrostPlantOut: null,
      greenhouseShiftWeeks: null,
      companionsGood: [],
      companionsBad: [],
      description,
      isNordicSuitable: true,
      isCustom: true
    };
    setPlants((prev) => [newPlant, ...prev]);
  };

  const addTask = (
    title: string,
    dueDate: string,
    category: 'sow' | 'water' | 'plant' | 'feed' | 'harvest' | 'general'
  ) => {
    const newTask: Task = {
      id: generateSafeId('task'),
      title,
      completed: false,
      dueDate,
      category,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const addJournalEntry = (
    title: string,
    content: string,
    category: 'observation' | 'harvest' | 'problem' | 'weather',
    date: string,
    photoUrl?: string | null,
    plantId?: string | null,
    plantName?: string | null,
    yieldAmount?: number | null,
    yieldUnit?: 'kg' | 'g' | 'tk' | null,
    growthStage?: string | null,
    growthProgressPct?: number | null
  ) => {
    const newEntry: JournalEntry = {
      id: generateSafeId('journal'),
      title,
      content,
      category,
      date,
      photoUrl: photoUrl || null,
      plantId: plantId || null,
      plantName: plantName || null,
      yieldAmount: yieldAmount !== undefined ? yieldAmount : null,
      yieldUnit: yieldUnit || null,
      growthStage: growthStage || null,
      growthProgressPct: growthProgressPct !== undefined ? growthProgressPct : null
    };
    setJournal((prev) => [newEntry, ...prev]);
  };

  const quickWaterAllPlants = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' });

    // Mark pending water tasks as completed
    setTasks((prev) => prev.map((t) => (t.category === 'water' && !t.completed ? { ...t, completed: true } : t)));

    const totalPlantings = beds.reduce((sum, b) => sum + b.plantings.length, 0);

    // Record action into journal
    const newEntry: JournalEntry = {
      id: generateSafeId('journal'),
      title: `Aia ja peenarde kastmine (${timeNow})`,
      content: `Kastetud ${beds.length} peenart ja taimekasti (${totalPlantings} taime). Muld põhjalikult niisutatud.`,
      category: 'observation',
      date: today,
      photoUrl: null
    };
    setJournal((prev) => [newEntry, ...prev]);

    return {
      wateredCount: beds.length,
      message: `Kastetud ${beds.length} peenart (${totalPlantings} taime)! Sissekanne lisatud aia-päevikusse.`
    };
  }, [beds]);

  const updateSettings = (
    locationName: string,
    lat: number,
    lng: number,
    springFrostDate: string,
    autumnFrostDate: string,
    themeMode?: string,
    newSoilType?: 'sandy' | 'loam' | 'clay',
    newMicroclimateOffset?: number
  ) => {
    if (newSoilType) setSoilTypeState(newSoilType);
    setSettings((prev) => ({
      ...prev,
      locationName,
      lat,
      lng,
      springFrostDate,
      autumnFrostDate,
      themeMode: themeMode || prev.themeMode,
      soilType: newSoilType || prev.soilType,
      microclimateOffset: newMicroclimateOffset !== undefined ? newMicroclimateOffset : prev.microclimateOffset
    }));
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next);
        try {
          localStorage.setItem('kulv-theme', next ? 'dark' : 'light');
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const deleteJournalEntry = (entryId: string) => {
    setJournal((prev) => prev.filter((j) => j.id !== entryId));
  };

  const resetToDefaults = () => {
    const defaultBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'KÜLV',
      settings: INITIAL_SETTINGS,
      beds: INITIAL_BEDS,
      journal: INITIAL_JOURNAL,
      tasks: INITIAL_TASKS,
      customPlants: [],
      yardPlan: INITIAL_YARD_PLAN
    };
    replaceGardenState(defaultBackup, { source: 'restore' }).catch(() => {});
  };

  return (
    <GardenContext.Provider
      value={{
        plants,
        beds,
        tasks,
        journal,
        settings,
        yardPlan,
        weather,
        isWeatherLoading,
        saveStatus,
        language,
        setLanguage,
        t,
        refreshWeather,
        exportBackup,
        importBackup,
        isDarkMode,
        toggleDarkMode,
        resetToDefaults,
        quickWaterAllPlants,
        scheduleFrostProtectionTask,
        soilType,
        setSoilType,
        microclimateProfile,
        updateMicroclimateOffset,
        addBed,
        deleteBed,
        updateBedRotationPlan,
        plantInBed,
        removePlantFromBed,
        addPlant,
        addTask,
        toggleTask,
        deleteTask,
        addJournalEntry,
        deleteJournalEntry,
        updateSettings,
        addYardEntity,
        updateYardEntity,
        deleteYardEntity,
        toggleLayerVisibility,
        toggleLayerLock,
        updateYardDimensions,
        showWarnings,
        toggleShowWarnings
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};

export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) {
    throw new Error('useGarden must be used within a GardenProvider');
  }
  return context;
};
