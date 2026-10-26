import RBush from 'rbush';
import { GardenEntity, Point2D } from '../types';

export interface SpatialEntityItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
  category: string;
  layerId?: string;
  entity: GardenEntity;
}

/**
 * Computes axis-aligned bounding box (AABB) in world metres for any GardenEntity,
 * properly taking into account rotation around its midpoint.
 */
export function computeEntityAABB(entity: GardenEntity): { minX: number; minY: number; maxX: number; maxY: number } {
  const cx = entity.x + entity.width / 2;
  const cy = entity.y + entity.length / 2;

  if (entity.shapeType === 'circle') {
    const radius = Math.max(entity.width, entity.length) / 2;
    return {
      minX: cx - radius,
      minY: cy - radius,
      maxX: cx + radius,
      maxY: cy + radius
    };
  }

  // Rectangle / polygon rotation
  const rad = ((entity.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const hw = entity.width / 2;
  const hl = entity.length / 2;

  // 4 corner offsets relative to center
  const corners: [number, number][] = [
    [-hw, -hl],
    [hw, -hl],
    [hw, hl],
    [-hw, hl]
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [dx, dy] of corners) {
    const rx = cx + dx * cos - dy * sin;
    const ry = cy + dx * sin + dy * cos;
    if (rx < minX) minX = rx;
    if (rx > maxX) maxX = rx;
    if (ry < minY) minY = ry;
    if (ry > maxY) maxY = ry;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * High-performance R-Tree spatial index for garden entities using RBush.
 * Enables O(log N) hit testing, hover detection, viewport culling, and edge snapping.
 */
export class GardenSpatialIndex {
  private tree: RBush<SpatialEntityItem>;
  private entityMap: Map<string, GardenEntity>;

  constructor() {
    this.tree = new RBush<SpatialEntityItem>();
    this.entityMap = new Map();
  }

  /**
   * Rebuilds the R-Tree from active entities (skipping soft-deleted or hidden ones).
   * RBush bulk-loading uses O(N log N) packing which is order of magnitude faster than single inserts.
   */
  public rebuild(entities: GardenEntity[]): void {
    this.tree.clear();
    this.entityMap.clear();

    const items: SpatialEntityItem[] = [];

    for (const entity of entities) {
      // Skip soft-deleted or invisible entities
      if (entity.deletedAt || entity.visible === false) {
        continue;
      }

      this.entityMap.set(entity.id, entity);
      const aabb = computeEntityAABB(entity);
      items.push({
        minX: aabb.minX,
        minY: aabb.minY,
        maxX: aabb.maxX,
        maxY: aabb.maxY,
        id: entity.id,
        category: entity.category,
        layerId: entity.layerId,
        entity
      });
    }

    if (items.length > 0) {
      this.tree.load(items);
    }
  }

  /**
   * Finds candidate entities under or near a specific world coordinate (x, y in metres).
   * @param x World X in metres
   * @param y World Y in metres
   * @param toleranceM Proximity threshold (e.g. 0.3 m)
   */
  public searchPoint(x: number, y: number, toleranceM: number = 0.3): GardenEntity[] {
    const candidates = this.tree.search({
      minX: x - toleranceM,
      minY: y - toleranceM,
      maxX: x + toleranceM,
      maxY: y + toleranceM
    });

    // Precise geometric point-in-entity check
    const hits: GardenEntity[] = [];

    for (const item of candidates) {
      if (this.isPointInsideEntity(x, y, item.entity, toleranceM)) {
        hits.push(item.entity);
      }
    }

    // Sort by zIndex descending (top-most first)
    return hits.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  }

  /**
   * Viewport culling: returns entities that intersect the visible viewport box.
   */
  public searchViewport(minX: number, minY: number, maxX: number, maxY: number): GardenEntity[] {
    const results = this.tree.search({ minX, minY, maxX, maxY });
    return results.map((r) => r.entity).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }

  /**
   * Snapping assistance: finds nearest horizontal and vertical alignment lines (edges / centers)
   * of other entities within snapThresholdM.
   */
  public findSnapCandidates(
    x: number,
    y: number,
    width: number,
    length: number,
    snapThresholdM: number = 0.3,
    excludeId?: string
  ): {
    snapX: number | null;
    snapY: number | null;
    alignLineX: number | null;
    alignLineY: number | null;
    targetEntity: GardenEntity | null;
    alignmentTypeX?: 'left' | 'center' | 'right';
    alignmentTypeY?: 'top' | 'center' | 'bottom';
  } {
    const searchMargin = 5.0; // 5 metres proximity radius
    const searchArea = {
      minX: x - searchMargin,
      minY: y - searchMargin,
      maxX: x + width + searchMargin,
      maxY: y + length + searchMargin
    };

    const nearby = this.tree.search(searchArea).filter((item) => item.id !== excludeId);

    let snapX: number | null = null;
    let snapY: number | null = null;
    let alignLineX: number | null = null;
    let alignLineY: number | null = null;
    let closestDistX = snapThresholdM;
    let closestDistY = snapThresholdM;
    let matchedEntity: GardenEntity | null = null;
    let alignmentTypeX: 'left' | 'center' | 'right' | undefined;
    let alignmentTypeY: 'top' | 'center' | 'bottom' | undefined;

    const myEdgesX: { val: number; type: 'left' | 'center' | 'right' }[] = [
      { val: x, type: 'left' },
      { val: x + width / 2, type: 'center' },
      { val: x + width, type: 'right' }
    ];
    const myEdgesY: { val: number; type: 'top' | 'center' | 'bottom' }[] = [
      { val: y, type: 'top' },
      { val: y + length / 2, type: 'center' },
      { val: y + length, type: 'bottom' }
    ];

    for (const item of nearby) {
      const e = item.entity;
      const aabb = computeEntityAABB(e);
      const targetEdgesX = [aabb.minX, (aabb.minX + aabb.maxX) / 2, aabb.maxX];
      const targetEdgesY = [aabb.minY, (aabb.minY + aabb.maxY) / 2, aabb.maxY];

      // Check X alignment
      for (const myEdge of myEdgesX) {
        for (const targetX of targetEdgesX) {
          const diff = Math.abs(myEdge.val - targetX);
          if (diff <= closestDistX) {
            closestDistX = diff;
            snapX = targetX - (myEdge.val - x);
            alignLineX = targetX;
            alignmentTypeX = myEdge.type;
            matchedEntity = e;
          }
        }
      }

      // Check Y alignment
      for (const myEdge of myEdgesY) {
        for (const targetY of targetEdgesY) {
          const diff = Math.abs(myEdge.val - targetY);
          if (diff <= closestDistY) {
            closestDistY = diff;
            snapY = targetY - (myEdge.val - y);
            alignLineY = targetY;
            alignmentTypeY = myEdge.type;
            matchedEntity = e;
          }
        }
      }
    }

    return {
      snapX,
      snapY,
      alignLineX,
      alignLineY,
      targetEntity: matchedEntity,
      alignmentTypeX,
      alignmentTypeY
    };
  }

  /**
   * Test whether point (px, py) is inside entity geometry (circle or rotated rectangle).
   */
  private isPointInsideEntity(px: number, py: number, entity: GardenEntity, toleranceM: number): boolean {
    const cx = entity.x + entity.width / 2;
    const cy = entity.y + entity.length / 2;

    if (entity.shapeType === 'circle') {
      const radius = Math.max(entity.width, entity.length) / 2 + toleranceM;
      const distSq = Math.pow(px - cx, 2) + Math.pow(py - cy, 2);
      return distSq <= Math.pow(radius, 2);
    }

    // Un-rotate point into local entity coordinates
    const rad = -((entity.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = px - cx;
    const dy = py - cy;

    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const halfW = entity.width / 2 + toleranceM;
    const halfL = entity.length / 2 + toleranceM;

    return Math.abs(localX) <= halfW && Math.abs(localY) <= halfL;
  }
}
