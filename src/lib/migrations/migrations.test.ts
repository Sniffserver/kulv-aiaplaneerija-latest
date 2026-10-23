import { describe, it, expect } from 'vitest';
import { migratePlan, migrateV1ToV2, migrateV2ToV3, importPlan, CURRENT_SCHEMA_VERSION } from './index';
import { GardenBed } from '../../types';
import { yardPlanSchema } from '../validation/yardPlanSchema';

describe('YardPlan Migrations Engine', () => {
  const legacyBeds: GardenBed[] = [
    {
      id: 'bed-1',
      name: 'Kurgipeenar',
      type: 'raisedBed',
      x: 3.5,
      y: 4.2,
      width: 1.2,
      length: 3.0,
      height: 0.45,
      rotation: 90,
      coverType: 'fleece',
      notes: 'Hästi väetatud kompostmuld',
      calculatedSunHours: 8.5,
      plantings: [
        {
          id: 'cell_0_0',
          bedId: 'bed-1',
          plantId: 'p2',
          plantName: 'Kurk',
          plantIcon: '🥒',
          gridX: 0,
          gridY: 0,
          year: 2026,
          dateAdded: '2026-05-10'
        }
      ]
    }
  ];

  it('migrates raw GardenBed[] array (v1) to valid YardPlan v2', () => {
    const migrated = migrateV1ToV2(legacyBeds);

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.units).toBe('metric');
    expect(migrated.entities.length).toBe(1);

    const entity = migrated.entities[0];
    expect(entity.id).toBe('bed-1');
    expect(entity.name).toBe('Kurgipeenar');
    expect(entity.category).toBe('bed');
    expect(entity.subType).toBe('raisedBed');
    expect(entity.x).toBe(3.5);
    expect(entity.y).toBe(4.2);
    expect(entity.width).toBe(1.2);
    expect(entity.length).toBe(3.0);
    expect(entity.rotation).toBe(90);
    expect(entity.deletedAt).toBeNull();
    expect(entity.bedData?.plantings.length).toBe(1);
    expect(entity.bedData?.coverType).toBe('fleece');

    expect(migrated.layers.length).toBeGreaterThan(0);
  });

  it('migrates legacy object with beds: GardenBed[] using migratePlan to v3', () => {
    const rawLegacy = {
      beds: legacyBeds,
      widthM: 25,
      lengthM: 35
    };

    const plan = migratePlan(rawLegacy);

    expect(plan.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(plan.schemaVersion).toBe(3);
    expect(plan.widthM).toBe(25);
    expect(plan.lengthM).toBe(35);
    expect(plan.entities.length).toBe(1);
    expect(plan.entities[0].name).toBe('Kurgipeenar');
    expect(plan.trash).toBeDefined();
  });

  it('runs migrateV2ToV3 separating soft-deleted entities into trash array (Variant B)', () => {
    const v2Plan = {
      ...migrateV1ToV2(legacyBeds),
      entities: [
        {
          ...migrateV1ToV2(legacyBeds).entities[0],
          id: 'active-1',
          name: 'Aktiivne peenar',
          deletedAt: null
        },
        {
          ...migrateV1ToV2(legacyBeds).entities[0],
          id: 'deleted-1',
          name: 'Kustutatud peenar',
          deletedAt: '2026-06-01T12:00:00.000Z'
        }
      ]
    };

    const v3Plan = migrateV2ToV3(v2Plan);
    expect(v3Plan.schemaVersion).toBe(3);
    // Active entities only contains non-deleted
    expect(v3Plan.entities.length).toBe(1);
    expect(v3Plan.entities[0].id).toBe('active-1');
    // Deleted entity is moved into trash array
    expect(v3Plan.trash?.length).toBe(1);
    expect(v3Plan.trash?.[0].id).toBe('deleted-1');
  });

  it('handles empty input gracefully by returning a clean default v3 plan', () => {
    const plan = migratePlan(null);
    expect(plan.schemaVersion).toBe(3);
    expect(plan.entities).toEqual([]);
    expect(plan.trash).toEqual([]);
    expect(plan.widthM).toBe(20);
    expect(plan.lengthM).toBe(30);
  });

  it('executes multi-step migration chain sequentially from v1 to v3', () => {
    const plan = migratePlan(legacyBeds, 3);
    expect((plan as any).schemaVersion).toBe(3);
    expect(plan.entities.length).toBe(1);
    expect(plan.trash).toBeDefined();
  });

  it('throws a descriptive error when no migration function exists for a schema version', () => {
    const unknownVersionPlan = {
      schemaVersion: 99,
      entities: []
    };
    expect(() => migratePlan(unknownVersionPlan, 100)).toThrow(/KÜLV migratsioonitõrge/);
  });

  it('v1 fail läbib impordi edukalt ja tulemus vastab v3 skeemile', () => {
    // Legacy v1 raw payload without schemaVersion or v2/v3 fields
    const legacyRaw = [
      {
        id: 'legacy-bed-99',
        name: 'Vana maapeenar',
        type: 'inGroundBed',
        x: 2,
        y: 3,
        width: 1.0,
        length: 2.0,
        height: 0.2,
        rotation: 0,
        coverType: 'none',
        notes: 'Vana formaat',
        calculatedSunHours: 6.0,
        plantings: []
      }
    ];

    // importPlan must migrate first, then validate with yardPlanSchema
    const imported = importPlan(legacyRaw);

    expect(imported.schemaVersion).toBe(3);
    expect(imported.units).toBe('metric');
    expect(imported.entities.length).toBe(1);
    expect(imported.entities[0].name).toBe('Vana maapeenar');
    expect(imported.entities[0].heightM).toBe(0.2);
    expect(imported.trash).toBeDefined();

    // Verify it strictly validates against the latest canonical Zod schema
    const validation = yardPlanSchema.safeParse(imported);
    expect(validation.success).toBe(true);
  });

  it('impordiprotsess on idempotentne: topeltimport ei muuda tulemust', () => {
    const legacyRaw = [
      {
        id: 'legacy-bed-1',
        name: 'Peenar 1',
        type: 'raisedBed',
        x: 4,
        y: 5,
        width: 1.2,
        length: 2.4,
        height: 0.3,
        rotation: 90,
        coverType: 'none',
        notes: '',
        calculatedSunHours: 7.0,
        plantings: []
      }
    ];

    const firstImport = importPlan(legacyRaw);
    const secondImport = importPlan(firstImport);

    expect(secondImport.schemaVersion).toBe(firstImport.schemaVersion);
    expect(secondImport.units).toBe(firstImport.units);
    expect(secondImport.widthM).toBe(firstImport.widthM);
    expect(secondImport.lengthM).toBe(firstImport.lengthM);
    expect(secondImport.entities.length).toBe(firstImport.entities.length);
    expect(secondImport.entities[0].id).toBe(firstImport.entities[0].id);
    expect(secondImport.entities[0].x).toBe(firstImport.entities[0].x);
    expect(secondImport.entities[0].y).toBe(firstImport.entities[0].y);
    expect(secondImport.entities[0].width).toBe(firstImport.entities[0].width);
    expect(secondImport.entities[0].length).toBe(firstImport.entities[0].length);
    expect(secondImport.trash).toEqual(firstImport.trash);
  });
});
