import { describe, it, expect } from 'vitest';
import { validateYardPlan, validateGardenEntity, isSimplePolygon, dedupePoints, yardPlanSchema } from './yardPlanSchema';
import { YardPlan, GardenEntity, DEFAULT_YARD_LAYERS, Point2D } from '../../types';

describe('Zod YardPlan, GardenEntity Validation & Geometry Cleanliness', () => {
  const validEntity: GardenEntity = {
    id: 'ent-1',
    name: 'Kasvuhoone',
    category: 'bed',
    subType: 'greenhouse',
    x: 4.5,
    y: 10.2,
    rotation: 45,
    shapeType: 'rectangle',
    width: 2.5,
    length: 5.0,
    heightM: 2.4,
    shadowCasting: true,
    zIndex: 10,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z'
  };

  const validPlan: YardPlan = {
    id: 'plan-1',
    name: 'Koduhoov',
    schemaVersion: 3,
    units: 'metric',
    widthM: 30,
    lengthM: 40,
    northAngleDeg: 15,
    entities: [validEntity],
    trash: [],
    layers: DEFAULT_YARD_LAYERS
  };

  it('validates a compliant YardPlan v3 and returns typed data', () => {
    const res = validateYardPlan(validPlan);
    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('Koduhoov');
    expect(res.data?.schemaVersion).toBe(3);
    expect(res.data?.entities.length).toBe(1);
    expect(res.data?.trash).toEqual([]);
  });

  it('rejects infinite or NaN coordinates in GardenEntity', () => {
    const invalidEntity = {
      ...validEntity,
      x: Infinity
    };
    const res = validateGardenEntity(invalidEntity);
    expect(res.success).toBe(false);
    expect(res.errors?.some((e) => e.startsWith('x:') || e.includes('Infinity') || e.includes('X-koordinaat'))).toBe(true);
  });

  it('rejects negative or zero dimensions', () => {
    const invalidEntity = {
      ...validEntity,
      width: -2.5
    };
    const res = validateGardenEntity(invalidEntity);
    expect(res.success).toBe(false);
    expect(res.errors?.some((e) => e.includes('Laius peab olema positiivne'))).toBe(true);
  });

  it('rejects excessive yard dimensions (> 500m)', () => {
    const excessivePlan = {
      ...validPlan,
      widthM: 800
    };
    const res = validateYardPlan(excessivePlan);
    expect(res.success).toBe(false);
    expect(res.errors?.some((e) => e.includes('ei tohi ületada 500 m'))).toBe(true);
  });

  it('rejects invalid entity category enum values', () => {
    const badCategoryEntity = {
      ...validEntity,
      category: 'spaceship'
    };
    const res = validateGardenEntity(badCategoryEntity);
    expect(res.success).toBe(false);
  });

  it('accepts valid non-self-intersecting polygons', () => {
    const square: Point2D[] = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 }
    ];
    expect(isSimplePolygon(square)).toBe(true);
  });

  it('rejects self-intersecting (bowtie/figure-8) polygons', () => {
    const bowtie: Point2D[] = [
      { x: 0, y: 0 },
      { x: 4, y: 4 },
      { x: 4, y: 0 },
      { x: 0, y: 4 }
    ];
    expect(isSimplePolygon(bowtie)).toBe(false);
  });

  it('dedupePoints removes points that are closer than epsilon (0.01m)', () => {
    const noisyPoints: Point2D[] = [
      { x: 1.0, y: 1.0 },
      { x: 1.002, y: 1.003 }, // distance ~0.0036m < 0.01m -> should be dropped
      { x: 5.0, y: 1.0 },
      { x: 3.0, y: 4.0 }
    ];
    const deduped = dedupePoints(noisyPoints, 0.01);
    expect(deduped.length).toBe(3);
    expect(deduped[0]).toEqual({ x: 1.0, y: 1.0 });
    expect(deduped[1]).toEqual({ x: 5.0, y: 1.0 });
    expect(deduped[2]).toEqual({ x: 3.0, y: 4.0 });
  });

  it('kolmnurk, kus kaks punkti on 0.001 m kaugusel, peab olema lihtne (isSimplePolygon)', () => {
    // Triangle with a duplicate/near-collision point 0.001m away from vertex 1
    const nearCoincidentTriangle: Point2D[] = [
      { x: 0.0, y: 0.0 },
      { x: 4.0, y: 0.0 },
      { x: 4.0007, y: 0.0007 }, // exactly ~0.001m away from (4.0, 0.0)
      { x: 2.0, y: 3.0 }
    ];

    // Must dedupe and confirm it is a valid simple triangle
    expect(isSimplePolygon(nearCoincidentTriangle, 0.01)).toBe(true);
  });

  it('rejects collinear degenerate triangles (zero enclosing area)', () => {
    const collinearPoints: Point2D[] = [
      { x: 0.0, y: 0.0 },
      { x: 2.0, y: 2.0 },
      { x: 4.0, y: 4.0 }
    ];
    expect(isSimplePolygon(collinearPoints)).toBe(false);
  });
});
