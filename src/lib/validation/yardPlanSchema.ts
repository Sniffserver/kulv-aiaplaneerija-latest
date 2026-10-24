import { z } from 'zod';
import { YardPlan, GardenEntity, Point2D } from '../../types';

export const point2DSchema = z.object({
  x: z.number().finite('Punkti X-koordinaat peab olema lõplik number'),
  y: z.number().finite('Punkti Y-koordinaat peab olema lõplik number')
});

export const entityCategorySchema = z.enum([
  'bed',
  'structure',
  'tree',
  'shrub',
  'hedge',
  'path',
  'water',
  'furniture'
]);

export const shapeTypeSchema = z.enum(['rectangle', 'circle', 'polygon', 'polyline']);

export const bedPlantingCellSchema = z.object({
  id: z.string(),
  bedId: z.string(),
  plantId: z.string(),
  plantName: z.string(),
  plantIcon: z.string(),
  gridX: z.number().int().min(0),
  gridY: z.number().int().min(0),
  year: z.number().int(),
  dateAdded: z.string()
});

export const bedDataSchema = z.object({
  type: z.enum(['raisedBed', 'inGroundBed', 'greenhouse', 'pot']),
  coverType: z.enum(['none', 'greenhouse', 'fleece', 'coldFrame']),
  plantings: z.array(bedPlantingCellSchema),
  calculatedSunHours: z.number().min(0).max(24),
  notes: z.string().optional()
});

export const botanicalDataSchema = z.object({
  plantId: z.string().optional(),
  canopyRadiusM: z.number().positive(),
  trunkHeightM: z.number().min(0),
  rootSpreadM: z.number().positive().optional(),
  isDeciduous: z.boolean().optional()
});

export const gardenEntitySchema = z.object({
  id: z.string().min(1, 'Objekti ID on kohustuslik'),
  name: z.string().min(1, 'Nimi peab olema vähemalt 1 tähemärk').max(120, 'Nimi ei tohi ületada 120 märki'),
  category: entityCategorySchema,
  subType: z.string().min(1),
  icon: z.string().optional(),
  x: z.number().finite('X-koordinaat peab olema lõplik number'),
  y: z.number().finite('Y-koordinaat peab olema lõplik number'),
  elevationM: z.number().finite('Kõrguspunkt peab olema lõplik number').optional(),
  rotation: z.number().min(0).max(360),
  shapeType: shapeTypeSchema,
  width: z.number().positive('Laius peab olema positiivne arv').max(200, 'Laius ei tohi ületada 200 m'),
  length: z.number().positive('Pikkus peab olema positiivne arv').max(200, 'Pikkus ei tohi ületada 200 m'),
  heightM: z.number().min(0, 'Kõrgus ei saa olla negatiivne').max(50, 'Kõrgus ei tohi ületada 50 m'),
  customPolygon: z.array(point2DSchema).optional(),
  pathPoints: z.array(point2DSchema).optional(),
  pathWidthM: z.number().positive().optional(),
  shadowCasting: z.boolean(),
  foliageOpacity: z.number().min(0).max(1).optional(),
  materialType: z.string().optional(),
  color: z.string().optional(),
  bedData: bedDataSchema.optional(),
  botanicalData: botanicalDataSchema.optional(),
  notes: z.string().optional(),
  zIndex: z.number().int(),
  layerId: z.string().optional(),
  locked: z.boolean().optional(),
  visible: z.boolean().optional(),
  deletedAt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const yardLayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  visible: z.boolean(),
  locked: z.boolean()
});

export const yardPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  schemaVersion: z.number().int().min(2),
  units: z.literal('metric'),
  widthM: z.number().positive('Krundi laius peab olema positiivne').max(500, 'Krundi laius ei tohi ületada 500 m'),
  lengthM: z.number().positive('Krundi pikkus peab olema positiivne').max(500, 'Krundi pikkus ei tohi ületada 500 m'),
  northAngleDeg: z.number().min(0).max(360),
  boundaryPolygon: z.array(point2DSchema).optional(),
  entities: z.array(gardenEntitySchema).max(2000, 'Krundi objektide arv ei tohi ületada 2000'),
  trash: z.array(gardenEntitySchema).optional().default([]),
  layers: z.array(yardLayerSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

/**
 * Validates unknown data against the YardPlan schema.
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateYardPlan(raw: unknown): {
  success: boolean;
  data?: YardPlan;
  errors?: string[];
} {
  const result = yardPlanSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data as YardPlan };
  }

  const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}

/**
 * Validates an individual GardenEntity.
 */
export function validateGardenEntity(raw: unknown): {
  success: boolean;
  data?: GardenEntity;
  errors?: string[];
} {
  const result = gardenEntitySchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data as GardenEntity };
  }
  const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}

/**
 * Removes duplicate and nearly coincident points within epsilon (metres)
 * before polygon simplicity and geometry calculations.
 */
export function dedupePoints(points: Point2D[], eps = 0.01): Point2D[] {
  if (!points || points.length === 0) return [];
  const result: Point2D[] = [];

  for (const pt of points) {
    if (result.length === 0) {
      result.push(pt);
      continue;
    }
    const last = result[result.length - 1];
    const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
    if (dist >= eps) {
      result.push(pt);
    }
  }

  // Remove trailing point if it duplicates the first point
  if (result.length > 2) {
    const first = result[0];
    const last = result[result.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < eps) {
      result.pop();
    }
  }

  return result;
}

/**
 * Computes polygon signed area via shoelace formula.
 */
export function computePolygonArea(points: Point2D[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Determines whether three 2D points are listed in counter-clockwise order.
 */
function ccw(p1: Point2D, p2: Point2D, p3: Point2D): number {
  return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
}

/**
 * Checks whether two line segments (a1-a2) and (b1-b2) strictly intersect.
 */
function segmentsIntersect(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): boolean {
  const d1 = ccw(b1, b2, a1);
  const d2 = ccw(b1, b2, a2);
  const d3 = ccw(a1, a2, b1);
  const d4 = ccw(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

/**
 * Validates that a polygon is simple (no self-intersecting edges).
 * Deduplicates coincident points using eps to avoid false collinear intersections.
 */
export function isSimplePolygon(points: Point2D[], eps = 0.01): boolean {
  const cleanPoints = dedupePoints(points, eps);
  if (!cleanPoints || cleanPoints.length < 3) return false;

  // Check for non-collinear valid enclosing area
  if (computePolygonArea(cleanPoints) < 1e-5) {
    return false;
  }

  const n = cleanPoints.length;

  for (let i = 0; i < n; i++) {
    const a1 = cleanPoints[i];
    const a2 = cleanPoints[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) {
        continue;
      }
      const b1 = cleanPoints[j];
      const b2 = cleanPoints[(j + 1) % n];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return false;
      }
    }
  }

  return true;
}
