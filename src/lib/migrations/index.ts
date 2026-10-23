import { YardPlan, GardenEntity, GardenBed, DEFAULT_YARD_LAYERS, convertBedToGardenEntity } from '../../types';
import { yardPlanSchema } from '../validation/yardPlanSchema';

export const CURRENT_SCHEMA_VERSION = 3;

export type Migration = (plan: unknown) => unknown;

/**
 * Migration from v1 to v2:
 * In v1, garden layouts were either:
 * - A raw array of GardenBed[]
 * - An object { beds: GardenBed[] }
 * - An early YardPlan with missing schemaVersion or schemaVersion = 1
 *
 * v2 standardizes:
 * - Canonical YardPlan with schemaVersion: 2
 * - units: 'metric'
 * - entities: GardenEntity[] (all beds mapped with subType, dimensions, 3D heights, deletedAt = null)
 * - layers: YardLayer[]
 * - boundaryPolygon: Point2D[]
 */
export function migrateV1ToV2(raw: unknown): YardPlan {
  const now = new Date().toISOString();

  // Case A: Raw array of GardenBed[]
  if (Array.isArray(raw)) {
    const beds = raw as GardenBed[];
    const entities: GardenEntity[] = beds.map((bed, idx) => {
      const entity = convertBedToGardenEntity(bed);
      entity.zIndex = (idx + 1) * 10;
      entity.deletedAt = null;
      return entity;
    });

    return {
      id: 'yard-plan-migrated',
      name: 'Minu aia krundiplaan',
      schemaVersion: 2,
      units: 'metric',
      widthM: 20,
      lengthM: 30,
      northAngleDeg: 0,
      entities,
      layers: [...DEFAULT_YARD_LAYERS],
      createdAt: now,
      updatedAt: now
    };
  }

  // Case B: Object with legacy structure
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  let entities: GardenEntity[] = [];

  if (Array.isArray(obj.entities)) {
    // Entities array already exists, normalize every entity
    entities = (obj.entities as Array<Partial<GardenEntity>>).map((e, idx) => ({
      id: e.id || `migrated_entity_${idx + 1}`,
      name: e.name || 'Aiaobjekt',
      category: e.category || 'bed',
      subType: e.subType || 'raisedBed',
      icon: e.icon || '🌱',
      x: typeof e.x === 'number' && Number.isFinite(e.x) ? e.x : 2,
      y: typeof e.y === 'number' && Number.isFinite(e.y) ? e.y : 2,
      elevationM: typeof e.elevationM === 'number' ? e.elevationM : 0,
      rotation: typeof e.rotation === 'number' ? e.rotation : 0,
      shapeType: e.shapeType || 'rectangle',
      width: typeof e.width === 'number' && e.width > 0 ? e.width : 1.2,
      length: typeof e.length === 'number' && e.length > 0 ? e.length : 2.5,
      heightM: typeof e.heightM === 'number' && e.heightM >= 0 ? e.heightM : 0.4,
      shadowCasting: typeof e.shadowCasting === 'boolean' ? e.shadowCasting : true,
      materialType: e.materialType || 'wood',
      color: e.color || '#4F6B45',
      zIndex: typeof e.zIndex === 'number' ? e.zIndex : (idx + 1) * 10,
      layerId: e.layerId || 'beds',
      locked: Boolean(e.locked),
      visible: e.visible !== false,
      deletedAt: e.deletedAt || null,
      createdAt: e.createdAt || now,
      updatedAt: now,
      tags: Array.isArray(e.tags) ? e.tags : [],
      bedData: e.bedData,
      botanicalData: e.botanicalData,
      customPolygon: e.customPolygon,
      pathPoints: e.pathPoints
    }));
  } else if (Array.isArray(obj.beds)) {
    // Legacy beds array
    const beds = obj.beds as GardenBed[];
    entities = beds.map((bed, idx) => {
      const entity = convertBedToGardenEntity(bed);
      entity.zIndex = (idx + 1) * 10;
      entity.deletedAt = null;
      return entity;
    });
  }

  const widthM = typeof obj.widthM === 'number' && obj.widthM > 0 ? obj.widthM : 20;
  const lengthM = typeof obj.lengthM === 'number' && obj.lengthM > 0 ? obj.lengthM : 30;
  const northAngleDeg = typeof obj.northAngleDeg === 'number' ? obj.northAngleDeg : 0;

  return {
    id: typeof obj.id === 'string' ? obj.id : 'yard-plan-migrated',
    name: typeof obj.name === 'string' ? obj.name : 'Minu aia krundiplaan',
    schemaVersion: 2,
    units: 'metric',
    widthM,
    lengthM,
    northAngleDeg,
    boundaryPolygon: Array.isArray(obj.boundaryPolygon) ? (obj.boundaryPolygon as any) : undefined,
    entities,
    layers: Array.isArray(obj.layers) && obj.layers.length > 0 ? (obj.layers as any) : [...DEFAULT_YARD_LAYERS],
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : now,
    updatedAt: now
  };
}

/**
 * Migration for v2 to v3:
 * Standardizes:
 * - schemaVersion: 3
 * - Variant B soft-delete: separate trash: GardenEntity[] array
 * - Active entities array only contains entities with deletedAt == null
 */
export function migrateV2ToV3(plan: unknown): YardPlan {
  const p = (plan && typeof plan === 'object' ? plan : {}) as YardPlan;
  const now = new Date().toISOString();
  const existingEntities = Array.isArray(p.entities) ? p.entities : [];
  const existingTrash = Array.isArray(p.trash) ? p.trash : [];

  const activeEntities: GardenEntity[] = [];
  const movedToTrash: GardenEntity[] = [...existingTrash];

  for (const entity of existingEntities) {
    if (entity.deletedAt) {
      movedToTrash.push({ ...entity });
    } else {
      activeEntities.push({ ...entity });
    }
  }

  return {
    ...p,
    schemaVersion: 3,
    entities: activeEntities,
    trash: movedToTrash,
    updatedAt: now
  };
}

export const migrations: Record<number, Migration> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3
};

/**
 * Migrates any raw or legacy plan to the targetVersion (default CURRENT_SCHEMA_VERSION).
 * Pure function with deterministic sequential migration steps.
 */
export function migratePlan(raw: unknown, targetVersion: number = CURRENT_SCHEMA_VERSION): YardPlan {
  if (!raw) {
    const v2Default = migrateV1ToV2([]);
    return targetVersion >= 3 ? (migrateV2ToV3(v2Default) as YardPlan) : v2Default;
  }

  // Detect starting version
  let currentVersion = 1;
  if (typeof raw === 'object' && raw !== null && 'schemaVersion' in raw) {
    const v = (raw as { schemaVersion: unknown }).schemaVersion;
    if (typeof v === 'number' && Number.isInteger(v) && v > 0) {
      currentVersion = v;
    }
  }

  let plan: unknown = raw;

  // If already at or above targetVersion and is a valid plan, normalize and return
  if (currentVersion >= targetVersion) {
    return plan as YardPlan;
  }

  // Sequentially execute migrations
  while (currentVersion < targetVersion) {
    const fn = migrations[currentVersion];
    if (!fn) {
      throw new Error(`KÜLV migratsioonitõrge: Puudub migratsioonifunktsioon versioonilt v${currentVersion} versioonile v${currentVersion + 1}`);
    }
    plan = fn(plan);
    currentVersion += 1;
  }

  return plan as YardPlan;
}

export { importPlan } from '../import/importPlan';

