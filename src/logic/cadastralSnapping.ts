import { Point2D } from '../types';

export interface BoundarySegmentSnapResult {
  isSnapped: boolean;
  snappedPoint: Point2D;
  segmentStart: Point2D;
  segmentEnd: Point2D;
  distanceM: number;
  edgeAngleDeg: number;
  segmentIndex: number;
}

/**
 * Calculates the Euclidean distance between two 2D points in metres.
 */
export function pointDistance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Projects a point onto a line segment defined by (start, end).
 * Clamps to the segment endpoints.
 */
export function projectPointOntoSegment(
  p: Point2D,
  start: Point2D,
  end: Point2D
): { projected: Point2D; distance: number; t: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return { projected: { ...start }, distance: pointDistance(p, start), t: 0 };
  }

  let t = ((p.x - start.x) * dx + (p.y - start.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projected: Point2D = {
    x: start.x + t * dx,
    y: start.y + t * dy
  };

  return {
    projected,
    distance: pointDistance(p, projected),
    t
  };
}

/**
 * Finds the nearest edge on a polygon boundary to a given point.
 * If the distance is within thresholdM, returns a snap result.
 */
export function findNearestBoundarySegment(
  point: Point2D,
  polygon: Point2D[],
  thresholdM: number = 0.8
): BoundarySegmentSnapResult | null {
  if (!polygon || polygon.length < 2) return null;

  let bestDist = Infinity;
  let bestSnap: BoundarySegmentSnapResult | null = null;

  const count = polygon.length;
  for (let i = 0; i < count; i++) {
    const start = polygon[i];
    const end = polygon[(i + 1) % count];

    const { projected, distance } = projectPointOntoSegment(point, start, end);

    if (distance < bestDist) {
      bestDist = distance;
      const angleRad = Math.atan2(end.y - start.y, end.x - start.x);
      const edgeAngleDeg = (angleRad * 180) / Math.PI;

      bestSnap = {
        isSnapped: distance <= thresholdM,
        snappedPoint: projected,
        segmentStart: start,
        segmentEnd: end,
        distanceM: Math.round(distance * 100) / 100,
        edgeAngleDeg: (edgeAngleDeg + 360) % 360,
        segmentIndex: i
      };
    }
  }

  return bestSnap && bestSnap.distanceM <= thresholdM ? bestSnap : null;
}

/**
 * Tests whether a 2D point is strictly inside a closed polygon (Ray-casting algorithm).
 */
export function isPointInsidePolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (!polygon || polygon.length < 3) return true;

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Checks whether an axis-aligned bounding box (representing a garden bed or structure)
 * is fully inside, partially intersecting, or outside a boundary polygon.
 */
export function checkEntityBoundaryContainment(
  x: number,
  y: number,
  width: number,
  length: number,
  polygon?: Point2D[]
): { isFullyInside: boolean; isPartiallyOutside: boolean } {
  if (!polygon || polygon.length < 3) {
    return { isFullyInside: true, isPartiallyOutside: false };
  }

  const corners: Point2D[] = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + length },
    { x, y: y + length }
  ];

  const insideCount = corners.filter((c) => isPointInsidePolygon(c, polygon)).length;

  return {
    isFullyInside: insideCount === 4,
    isPartiallyOutside: insideCount < 4
  };
}
