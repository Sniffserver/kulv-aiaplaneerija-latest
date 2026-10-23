import { RotationCyclePlan } from './rotation';
export * from './rotation';

export type ColorPalette = 'meadow' | 'kulv' | 'gruvbox' | 'catppuccin';

export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  icon: string;
  varieties: string[];
  optimalSowDateStart: string; // e.g. "03-15" (MM-DD)
  optimalPlantOutDate: string; // e.g. "05-20"
  optimalHarvestDate: string;  // e.g. "08-10"
  spacingCm: number;
  rowSpacingCm: number;
  depthCm: number;
  daysToMaturity: number;
  sunNeed: 'full' | 'partial' | 'shade';
  sunHoursMin: number;
  waterNeed: 'low' | 'medium' | 'high';
  weeksBeforeFrostSowIndoors: number | null;
  weeksAfterFrostPlantOut: number | null;
  greenhouseShiftWeeks: number | null;
  companionsGood: string[];
  companionsBad: string[];
  description: string;
  isNordicSuitable: boolean;
  isCustom?: boolean;
  nameEn?: string;
  hardinessZone?: string;
  targetPh?: string;
  soilPreference?: string;
  botanicalFamilyId?: string;
}

export interface BedPlantingCell {
  id: string;
  bedId: string;
  plantId: string;
  plantName: string;
  plantIcon: string;
  gridX: number;
  gridY: number;
  year: number;
  dateAdded: string;
}

export interface Point2D {
  x: number; // in metres
  y: number; // in metres
}

export type EntityCategory =
  | 'bed'          // Raised beds, in-ground beds, greenhouse beds, pots
  | 'structure'    // Houses, sheds, saunas, greenhouses, pergolas, terraces, compost bins
  | 'tree'         // Fruit trees, deciduous trees, conifers
  | 'shrub'        // Berry bushes, ornamental shrubs, roses
  | 'hedge'        // Hedges, boundary fences, stone walls
  | 'path'         // Stone paths, gravel walkways, wooden decking, lawn paths
  | 'water'        // Ponds, water basins, rain barrels, drainage swales
  | 'furniture';   // Benches, outdoor dining, swings, fire pits

export interface GardenEntity {
  id: string;
  name: string;
  category: EntityCategory;
  subType: string; // e.g. 'raisedBed', 'greenhouse', 'apple_tree', 'dwelling_house', 'gravel_path', 'pond'
  icon?: string;

  // Spatial location in world coordinates (metres from yard origin)
  x: number;
  y: number;
  elevationM?: number; // Elevation from ground level (for terrace pots, raised platforms)
  rotation: number;    // Degrees clockwise (0 - 360°) around centre

  // Dimensions & Shape (metres) - shared geometry contract for 2D and 3D
  shapeType: 'rectangle' | 'circle' | 'polygon' | 'polyline';
  width: number;       // Width in metres
  length: number;      // Length in metres
  heightM: number;     // 3D physical height in metres (critical for solar shadows & 3D mesh extrusion)

  // Custom boundary vertices for irregular shapes
  customPolygon?: Point2D[];
  pathPoints?: Point2D[]; // For pathways / fences
  pathWidthM?: number;    // Width of path or hedge

  // Physics & Optical properties (for solar shadows & 3D rendering)
  shadowCasting: boolean;
  foliageOpacity?: number; // 0.0 - 1.0 (light transparency through tree crowns)
  materialType?: string;   // 'wood' | 'glass' | 'stone' | 'foliage' | 'metal' | 'water' | 'soil'
  color?: string;          // 2D schematic color fallback

  // Association with garden bed & planting data (when category === 'bed')
  bedData?: {
    type: 'raisedBed' | 'inGroundBed' | 'greenhouse' | 'pot';
    coverType: 'none' | 'greenhouse' | 'fleece' | 'coldFrame';
    plantings: BedPlantingCell[];
    calculatedSunHours: number;
    notes?: string;
    rotationPlan?: RotationCyclePlan;
  };

  // Botanical parameters (when category === 'tree' | 'shrub')
  botanicalData?: {
    plantId?: string;       // Linked plant catalog ID
    canopyRadiusM: number;  // Mature canopy radius (metres)
    trunkHeightM: number;   // Height to first branch (metres)
    rootSpreadM?: number;   // Root spread radius (metres)
    isDeciduous?: boolean;  // Winter leaf loss affects winter shadows
  };

  notes?: string;

  // Layering, lock and metadata
  zIndex: number;              // Visual stacking order
  layerId?: string;            // Grouping: 'structures' | 'beds' | 'plants' | 'infrastructure' | 'furniture'
  locked?: boolean;            // Lock to prevent accidental dragging
  visible?: boolean;           // Visibility toggle
  tags?: string[];             // Search & filtering tags
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;   // Soft-delete timestamp: enables undo, redo, and recovery from trash
  metadata?: Record<string, unknown>; // Extensible future fields
}

export interface YardLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export const DEFAULT_YARD_LAYERS: YardLayer[] = [
  { id: 'structures', name: 'Ehitised', visible: true, locked: false },
  { id: 'beds', name: 'Peenrad', visible: true, locked: false },
  { id: 'plants', name: 'Taimestik (puud, põõsad)', visible: true, locked: false },
  { id: 'infrastructure', name: 'Taristu & Vesi', visible: true, locked: false },
  { id: 'furniture', name: 'Mööbel & dekoreer', visible: true, locked: false }
];

export interface YardPlan {
  id: string;
  name: string;
  schemaVersion: number;       // Schema version (e.g. 2)
  units: 'metric';             // Metric units strictly
  widthM: number;
  lengthM: number;
  northAngleDeg: number;       // North azimuth angle (0° = top/north)
  boundaryPolygon?: Point2D[];
  cadastralCode?: string;      // Official Estonian cadastral code (e.g. "79501:027:0011")
  cadastralAreaM2?: number;    // Official area in m²
  address?: string;            // Official address (e.g. "Männiku tee 14, Kohila vald")
  entities: GardenEntity[];
  trash?: GardenEntity[];      // Soft-deleted entities (trash bin) for atomic undo/recovery
  layers: YardLayer[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GardenBed {
  id: string;
  name: string;
  type: 'raisedBed' | 'inGroundBed' | 'greenhouse' | 'pot';
  x: number; // metres
  y: number; // metres
  width: number; // metres
  length: number; // metres
  height: number; // metres
  rotation: number;
  coverType: 'none' | 'greenhouse' | 'fleece' | 'coldFrame';
  notes: string;
  plantings: BedPlantingCell[];
  calculatedSunHours: number;
  rotationPlan?: RotationCyclePlan;
}

// Seamless bidirectional compatibility adapters
export function convertBedToGardenEntity(bed: GardenBed): GardenEntity {
  const now = new Date().toISOString();
  return {
    id: bed.id,
    name: bed.name,
    category: 'bed',
    subType: bed.type,
    icon: bed.type === 'greenhouse' ? '🏡' : bed.type === 'pot' ? '🪴' : '🪵',
    x: bed.x,
    y: bed.y,
    elevationM: 0,
    rotation: bed.rotation || 0,
    shapeType: 'rectangle',
    width: bed.width,
    length: bed.length,
    heightM: bed.height || 0.4,
    shadowCasting: bed.type === 'greenhouse' || (bed.height || 0.4) > 0.8,
    materialType: bed.type === 'greenhouse' ? 'glass' : 'wood',
    color: '#4F6B45',
    zIndex: 10,
    layerId: 'beds',
    locked: false,
    visible: true,
    tags: ['peenar', bed.type],
    createdAt: now,
    updatedAt: now,
    bedData: {
      type: bed.type,
      coverType: bed.coverType,
      plantings: bed.plantings,
      calculatedSunHours: bed.calculatedSunHours,
      notes: bed.notes,
      rotationPlan: bed.rotationPlan
    },
    notes: bed.notes
  };
}

export function convertEntityToBed(entity: GardenEntity): GardenBed | null {
  if (entity.category !== 'bed' || !entity.bedData) return null;
  return {
    id: entity.id,
    name: entity.name,
    type: entity.bedData.type,
    x: entity.x,
    y: entity.y,
    width: entity.width,
    length: entity.length,
    height: entity.heightM,
    rotation: entity.rotation,
    coverType: entity.bedData.coverType,
    notes: entity.notes || entity.bedData.notes || '',
    plantings: entity.bedData.plantings || [],
    calculatedSunHours: entity.bedData.calculatedSunHours || 7.5,
    rotationPlan: entity.bedData.rotationPlan
  };
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  category: 'sow' | 'water' | 'plant' | 'feed' | 'harvest' | 'general';
  plantId?: string | null;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  category: 'observation' | 'harvest' | 'problem' | 'weather';
  date: string;
  photoUrl?: string | null;
  plantId?: string | null;
  plantName?: string | null;
  yieldAmount?: number | null;
  yieldUnit?: 'kg' | 'g' | 'tk' | null;
  growthStage?: 'germination' | 'vegetative' | 'flowering' | 'ripening' | 'harvest' | string | null;
  growthProgressPct?: number | null;
}

export interface AppSettings {
  locationName: string;
  lat: number;
  lng: number;
  springFrostDate: string; // MM-DD
  autumnFrostDate: string; // MM-DD
  yardWidthM: number;
  yardLengthM: number;
  northAngle: number;
  themeMode: string;
  soilType?: 'sandy' | 'loam' | 'clay';
  microclimateOffset?: number; // e.g. -2.0 for frost pockets, +1.5 for warm slope
  language?: 'et' | 'en';
  nordicRegion?: 'north_coast' | 'central' | 'southeast' | 'islands';
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: string;
  advice: string;
  affectedCrops: string;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  weatherDescription: string;
  icon: string;
  precipitationSum: number;
  precipitationProbability?: number;
  apparentTempMin?: number;
  frostRisk?: 'none' | 'light' | 'moderate' | 'severe';
}

export interface HourlyForecastPoint {
  time: string;
  hour: string;
  temp: number;
}

export interface WeatherInfo {
  locationName: string;
  lat: number;
  lng: number;
  temperature: number;
  apparentTemperature?: number;
  tempMax: number;
  tempMin: number;
  relativeHumidity?: number;
  precipitation: number;
  windSpeed: number;
  weatherCode?: number;
  weatherDescription: string;
  icon: string;
  alerts: WeatherAlert[];
  tips: string[];
  dailyForecast?: DailyForecastItem[];
  hourlyForecast?: HourlyForecastPoint[];
  frostRiskDaysCount?: number;
  lowestUpcomingNightTemp?: number;
  isLive?: boolean;
  lastUpdated?: string;
}

export interface GardenBackup {
  version: string;
  exportedAt: string;
  appName: string;
  settings: AppSettings;
  beds: GardenBed[];
  journal: JournalEntry[];
  tasks: Task[];
  customPlants?: Plant[];
  yardPlan?: YardPlan;
}
