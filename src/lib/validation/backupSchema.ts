import { z } from 'zod';
import { yardPlanSchema } from './yardPlanSchema';
import { GardenBackup } from '../../types';

export const bedPlantingCellSchema = z.object({
  id: z.string(),
  bedId: z.string(),
  plantId: z.string(),
  plantName: z.string(),
  plantIcon: z.string(),
  gridX: z.number().int(),
  gridY: z.number().int(),
  year: z.number().int(),
  dateAdded: z.string()
});

export const gardenBedSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['raisedBed', 'inGroundBed', 'greenhouse', 'pot']),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  length: z.number().positive(),
  height: z.number().min(0),
  rotation: z.number().min(0).max(360),
  coverType: z.enum(['none', 'greenhouse', 'fleece', 'coldFrame']),
  notes: z.string(),
  plantings: z.array(bedPlantingCellSchema),
  calculatedSunHours: z.number().min(0).max(24)
});

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  completed: z.boolean(),
  dueDate: z.string(),
  category: z.enum(['sow', 'water', 'plant', 'feed', 'harvest', 'general']),
  plantId: z.string().nullable().optional(),
  createdAt: z.string()
});

export const journalEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string(),
  category: z.enum(['observation', 'harvest', 'problem', 'weather']),
  date: z.string(),
  photoUrl: z.string().nullable().optional(),
  plantId: z.string().nullable().optional(),
  plantName: z.string().nullable().optional(),
  yieldAmount: z.number().nullable().optional(),
  yieldUnit: z.enum(['kg', 'g', 'tk']).nullable().optional(),
  growthStage: z.string().nullable().optional(),
  growthProgressPct: z.number().nullable().optional()
});

export const appSettingsSchema = z.object({
  locationName: z.string(),
  lat: z.number().finite(),
  lng: z.number().finite(),
  springFrostDate: z.string(),
  autumnFrostDate: z.string(),
  yardWidthM: z.number().positive(),
  yardLengthM: z.number().positive(),
  northAngle: z.number().min(0).max(360),
  themeMode: z.string(),
  soilType: z.enum(['sandy', 'loam', 'clay']).optional(),
  microclimateOffset: z.number().finite().optional()
});

export const gardenBackupSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  appName: z.string(),
  settings: appSettingsSchema,
  beds: z.array(gardenBedSchema),
  journal: z.array(journalEntrySchema),
  tasks: z.array(taskSchema),
  customPlants: z.array(z.any()).optional(),
  yardPlan: z.unknown().optional()
});

export function validateGardenBackup(jsonString: string): {
  success: boolean;
  data?: GardenBackup;
  errorMessage?: string;
} {
  // Security guardrail: Enforce 5 MB maximum size limit to prevent memory exhaustion
  if (!jsonString || jsonString.length > 5 * 1024 * 1024) {
    return {
      success: false,
      errorMessage: !jsonString ? 'Tühi fail.' : 'Varukoopia faili suurus ületab lubatud 5 MB limiidi.'
    };
  }

  try {
    const parsed = JSON.parse(jsonString);
    const result = gardenBackupSchema.safeParse(parsed);
    if (result.success) {
      return { success: true, data: result.data as GardenBackup };
    }
    const firstIssue = result.error.issues[0];
    const path = firstIssue.path.join('.');
    return {
      success: false,
      errorMessage: `Varukoopia valideerimistõrge (${path}): ${firstIssue.message}`
    };
  } catch (err) {
    return {
      success: false,
      errorMessage: 'Vigane JSON formaat: faili ei õnnestunud lugeda.'
    };
  }
}
