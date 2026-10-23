import { describe, it, expect } from 'vitest';
import {
  pointDistance,
  projectPointOntoSegment,
  findNearestBoundarySegment,
  isPointInsidePolygon,
  checkEntityBoundaryContainment
} from './cadastralSnapping';
import { Point2D } from '../types';

describe('cadastralSnapping logic', () => {
  const samplePolygon: Point2D[] = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 30 },
    { x: 0, y: 30 }
  ];

  it('calculates point distance accurately', () => {
    expect(pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('projects a point onto a line segment correctly', () => {
    const start = { x: 0, y: 0 };
    const end = { x: 10, y: 0 };

    // Point above segment middle
    const p1 = { x: 5, y: 2 };
    const res1 = projectPointOntoSegment(p1, start, end);
    expect(res1.projected.x).toBe(5);
    expect(res1.projected.y).toBe(0);
    expect(res1.distance).toBe(2);

    // Point beyond segment end (should clamp to end)
    const p2 = { x: 14, y: 0 };
    const res2 = projectPointOntoSegment(p2, start, end);
    expect(res2.projected.x).toBe(10);
    expect(res2.projected.y).toBe(0);
    expect(res2.distance).toBe(4);
  });

  it('finds the nearest boundary segment and snaps if within threshold', () => {
    // Point near top boundary edge (x=10, y=0.4) within 0.8m threshold
    const pNear = { x: 10, y: 0.4 };
    const snap = findNearestBoundarySegment(pNear, samplePolygon, 0.8);

    expect(snap).not.toBeNull();
    expect(snap?.isSnapped).toBe(true);
    expect(snap?.snappedPoint.x).toBe(10);
    expect(snap?.snappedPoint.y).toBe(0);
    expect(snap?.distanceM).toBeCloseTo(0.4, 1);

    // Point far from boundary (x=10, y=15)
    const pFar = { x: 10, y: 15 };
    const snapFar = findNearestBoundarySegment(pFar, samplePolygon, 0.8);
    expect(snapFar).toBeNull();
  });

  it('tests point containment in polygon correctly', () => {
    expect(isPointInsidePolygon({ x: 10, y: 10 }, samplePolygon)).toBe(true);
    expect(isPointInsidePolygon({ x: -1, y: 10 }, samplePolygon)).toBe(false);
    expect(isPointInsidePolygon({ x: 25, y: 10 }, samplePolygon)).toBe(false);
  });

  it('checks entity boundary containment', () => {
    // Bed fully inside
    const inside = checkEntityBoundaryContainment(2, 2, 2, 4, samplePolygon);
    expect(inside.isFullyInside).toBe(true);
    expect(inside.isPartiallyOutside).toBe(false);

    // Bed crossing boundary (x=19, width=3 extends to x=22 outside x=20)
    const crossing = checkEntityBoundaryContainment(19, 5, 3, 2, samplePolygon);
    expect(crossing.isFullyInside).toBe(false);
    expect(crossing.isPartiallyOutside).toBe(true);
  });
});
