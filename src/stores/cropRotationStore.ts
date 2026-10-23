import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BedSuccessionSlot,
  BedYearHistoryRecord,
  EstonianRegionId,
  CropProtectionType
} from '../types/rotation';

export interface CropRotationState {
  selectedYear: number;
  selectedRegion: EstonianRegionId;
  defaultProtection: CropProtectionType;
  successionSlots: BedSuccessionSlot[];
  historyRecords: BedYearHistoryRecord[];

  setSelectedYear: (year: number) => void;
  setSelectedRegion: (region: EstonianRegionId) => void;
  setDefaultProtection: (prot: CropProtectionType) => void;
  addSuccessionSlot: (slot: Omit<BedSuccessionSlot, 'id'>) => string;
  updateSuccessionSlot: (id: string, patch: Partial<BedSuccessionSlot>) => void;
  deleteSuccessionSlot: (id: string) => void;
  setBedYearHistory: (bedId: string, year: number, plantings: BedYearHistoryRecord['plantings']) => void;
  duplicateYearToNext: (fromYear: number, toYear: number) => void;
  resetToDemoHistory: () => void;
}

export const INITIAL_SUCCESSION_SLOTS: BedSuccessionSlot[] = [
  // Bed 1 - Rich 3-stage succession
  {
    id: 'succ-b1-1',
    bedId: 'bed_1',
    year: 2026,
    seasonSlot: 'early_spring',
    plantId: 'spinat',
    plantName: 'Aedspinat & Redis',
    plantNameEn: 'Spinach & Radish',
    plantIcon: '🥬',
    botanicalFamily: 'Amaranthaceae',
    guild: 'light_feeder',
    sowDate: '04-10',
    harvestDate: '05-18',
    daysToMaturity: 38,
    protectionType: 'fleece',
    notes: 'Katteloori all varajane vitamiinisaak'
  },
  {
    id: 'succ-b1-2',
    bedId: 'bed_1',
    year: 2026,
    seasonSlot: 'main_crop',
    plantId: 'porgand',
    plantName: 'Aedporgand & Mugulsibul',
    plantNameEn: 'Carrot & Yellow Onion',
    plantIcon: '🥕',
    botanicalFamily: 'Apiaceae',
    guild: 'light_feeder',
    sowDate: '05-22',
    harvestDate: '08-28',
    daysToMaturity: 98,
    protectionType: 'none',
    notes: 'Klassikaline porgandi ja sibula segiviljelus'
  },
  {
    id: 'succ-b1-3',
    bedId: 'bed_1',
    year: 2026,
    seasonSlot: 'autumn_late',
    plantId: 'kuuslauk',
    plantName: 'Taliküüslauk & Salatimuhud',
    plantNameEn: 'Winter Garlic & Winter Greens',
    plantIcon: '🧄',
    botanicalFamily: 'Allioideae',
    guild: 'light_feeder',
    sowDate: '09-05',
    harvestDate: '10-25',
    daysToMaturity: 50,
    protectionType: 'fleece',
    notes: 'Taliküüslaugu mahapanek ja hiline lehtsalat'
  },

  // Bed 2 - Greenhouse high yield
  {
    id: 'succ-b2-1',
    bedId: 'bed_2',
    year: 2026,
    seasonSlot: 'early_spring',
    plantId: 'rukola',
    plantName: 'Rukola & Varajane salat',
    plantNameEn: 'Arugula & Early Greens',
    plantIcon: '🌱',
    botanicalFamily: 'Brassicaceae',
    guild: 'light_feeder',
    sowDate: '03-25',
    harvestDate: '05-05',
    daysToMaturity: 41,
    protectionType: 'greenhouse',
    notes: 'Kasvuhoone kevadine kiirsaak enne tomateid'
  },
  {
    id: 'succ-b2-2',
    bedId: 'bed_2',
    year: 2026,
    seasonSlot: 'main_crop',
    plantId: 'tomat',
    plantName: 'Põhjamaine kirsstomat & Basiilik',
    plantNameEn: 'Nordic Cherry Tomato & Basil',
    plantIcon: '🍅',
    botanicalFamily: 'Solanaceae',
    guild: 'heavy_feeder',
    sowDate: '05-10',
    harvestDate: '09-20',
    daysToMaturity: 85,
    protectionType: 'greenhouse',
    notes: 'Põhisaak kasvuhoones'
  },

  // Bed 3 - Patio Herbs / Terrace box
  {
    id: 'succ-b3-1',
    bedId: 'bed_3',
    year: 2026,
    seasonSlot: 'main_crop',
    plantId: 'aeduba',
    plantName: 'Põõsasaeduba & Till',
    plantNameEn: 'Bush Bean & Dill',
    plantIcon: '🫘',
    botanicalFamily: 'Fabaceae',
    guild: 'nitrogen_fixer',
    sowDate: '05-25',
    harvestDate: '08-15',
    daysToMaturity: 82,
    protectionType: 'none',
    notes: 'Lämmastikku siduv konteinerikasvatus'
  }
];

export const INITIAL_BED_HISTORY: BedYearHistoryRecord[] = [
  // Bed 1 past history (Demonstrating optimal 4-year cycle)
  {
    bedId: 'bed_1',
    year: 2025,
    plantings: [
      {
        plantId: 'hernes',
        plantName: 'Aedhernes (Valma)',
        plantNameEn: 'Garden Pea',
        plantIcon: '🫛',
        family: 'Fabaceae',
        guild: 'nitrogen_fixer'
      }
    ]
  },
  {
    bedId: 'bed_1',
    year: 2024,
    plantings: [
      {
        plantId: 'kapsas',
        plantName: 'Peakapsas & Brokoli',
        plantNameEn: 'Cabbage & Broccoli',
        plantIcon: '🥬',
        family: 'Brassicaceae',
        guild: 'heavy_feeder'
      }
    ]
  },
  {
    bedId: 'bed_1',
    year: 2023,
    plantings: [
      {
        plantId: 'kartul',
        plantName: 'Varajane kartul (Maret)',
        plantNameEn: 'Early Potato',
        plantIcon: '🥔',
        family: 'Solanaceae',
        guild: 'heavy_feeder'
      }
    ]
  },

  // Bed 2 past history (Demonstrating greenhouse Solanaceae repetition alert)
  {
    bedId: 'bed_2',
    year: 2025,
    plantings: [
      {
        plantId: 'tomat',
        plantName: 'Pihktomat (Vilja)',
        plantNameEn: 'Tomato',
        plantIcon: '🍅',
        family: 'Solanaceae',
        guild: 'heavy_feeder'
      }
    ]
  },
  {
    bedId: 'bed_2',
    year: 2024,
    plantings: [
      {
        plantId: 'paprika',
        plantName: 'Magus paprika',
        plantNameEn: 'Sweet Pepper',
        plantIcon: '🫑',
        family: 'Solanaceae',
        guild: 'heavy_feeder'
      }
    ]
  }
];

export const useCropRotationStore = create<CropRotationState>()(
  persist(
    (set) => ({
      selectedYear: 2026,
      selectedRegion: 'central',
      defaultProtection: 'none',
      successionSlots: INITIAL_SUCCESSION_SLOTS,
      historyRecords: INITIAL_BED_HISTORY,

      setSelectedYear: (year) => set({ selectedYear: year }),

      setSelectedRegion: (region) => set({ selectedRegion: region }),

      setDefaultProtection: (prot) => set({ defaultProtection: prot }),

      addSuccessionSlot: (slotData) => {
        const id = `succ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        set((state) => ({
          successionSlots: [...state.successionSlots, { ...slotData, id }]
        }));
        return id;
      },

      updateSuccessionSlot: (id, patch) => {
        set((state) => ({
          successionSlots: state.successionSlots.map((s) => (s.id === id ? { ...s, ...patch } : s))
        }));
      },

      deleteSuccessionSlot: (id) => {
        set((state) => ({
          successionSlots: state.successionSlots.filter((s) => s.id !== id)
        }));
      },

      setBedYearHistory: (bedId, year, plantings) => {
        set((state) => {
          const filtered = state.historyRecords.filter(
            (r) => !(r.bedId === bedId && r.year === year)
          );
          return {
            historyRecords: [...filtered, { bedId, year, plantings }]
          };
        });
      },

      duplicateYearToNext: (fromYear, toYear) => {
        set((state) => {
          const fromSlots = state.successionSlots.filter((s) => s.year === fromYear);
          const newSlots = fromSlots.map((s) => ({
            ...s,
            id: `succ-${toYear}-${Math.random().toString(36).substring(2, 7)}`,
            year: toYear
          }));
          return {
            successionSlots: [...state.successionSlots.filter((s) => s.year !== toYear), ...newSlots]
          };
        });
      },

      resetToDemoHistory: () => {
        set({
          successionSlots: INITIAL_SUCCESSION_SLOTS,
          historyRecords: INITIAL_BED_HISTORY,
          selectedYear: 2026
        });
      }
    }),
    {
      name: 'kulv-crop-rotation-store'
    }
  )
);
