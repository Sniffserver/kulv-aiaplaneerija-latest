import { describe, it, expect } from 'vitest';
import { GardenSpatialIndex, computeEntityAABB } from './spatialIndex';
import { GardenEntity } from '../types';

describe('GardenSpatialIndex with RBush', () => {
  const entities: GardenEntity[] = [
    {
      id: 'bed-1',
      name: 'Peenar 1',
      category: 'bed',
      subType: 'raisedBed',
      x: 2.0,
      y: 2.0,
      width: 1.0,
      length: 2.0,
      heightM: 0.4,
      rotation: 0,
      shapeType: 'rectangle',
      shadowCasting: true,
      zIndex: 10,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    },
    {
      id: 'tree-1',
      name: 'Õunapuu',
      category: 'tree',
      subType: 'apple_tree',
      x: 10.0,
      y: 10.0,
      width: 4.0,
      length: 4.0,
      heightM: 3.5,
      rotation: 0,
      shapeType: 'circle',
      shadowCasting: true,
      zIndex: 20,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    },
    {
      id: 'shed-1',
      name: 'Kuur',
      category: 'structure',
      subType: 'shed',
      x: 15.0,
      y: 2.0,
      width: 3.0,
      length: 4.0,
      heightM: 2.5,
      rotation: 90, // Rotated 90 degrees
      shapeType: 'rectangle',
      shadowCasting: true,
      zIndex: 15,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    },
    {
      id: 'deleted-1',
      name: 'Vana pink',
      category: 'furniture',
      subType: 'bench',
      x: 5.0,
      y: 5.0,
      width: 1.0,
      length: 0.5,
      heightM: 0.5,
      rotation: 0,
      shapeType: 'rectangle',
      shadowCasting: false,
      zIndex: 5,
      deletedAt: '2026-05-01', // Soft-deleted!
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    }
  ];

  it('computes correct AABB for unrotated and rotated entities', () => {
    const unrotatedAABB = computeEntityAABB(entities[0]);
    expect(unrotatedAABB.minX).toBe(2.0);
    expect(unrotatedAABB.minY).toBe(2.0);
    expect(unrotatedAABB.maxX).toBe(3.0);
    expect(unrotatedAABB.maxY).toBe(4.0);

    const circleAABB = computeEntityAABB(entities[1]);
    expect(circleAABB.minX).toBe(10.0);
    expect(circleAABB.maxX).toBe(14.0);

    const rotatedAABB = computeEntityAABB(entities[2]);
    // Width 3 and length 4 rotated 90 degrees around center
    // Center is (15 + 1.5, 2 + 2) = (16.5, 4)
    // Rotated extents will be 4 in X and 3 in Y
    expect(Math.abs(rotatedAABB.maxX - rotatedAABB.minX - 4.0)).toBeLessThan(0.01);
    expect(Math.abs(rotatedAABB.maxY - rotatedAABB.minY - 3.0)).toBeLessThan(0.01);
  });

  it('indexes entities and ignores soft-deleted entities', () => {
    const spatialIndex = new GardenSpatialIndex();
    spatialIndex.rebuild(entities);

    // Point on the soft-deleted bench (5.5, 5.25)
    const hitsDeleted = spatialIndex.searchPoint(5.5, 5.25);
    expect(hitsDeleted.length).toBe(0);

    // Point inside peenar 1 (2.5, 3.0)
    const hitsBed = spatialIndex.searchPoint(2.5, 3.0);
    expect(hitsBed.length).toBe(1);
    expect(hitsBed[0].id).toBe('bed-1');

    // Point inside apple tree (12.0, 12.0)
    const hitsTree = spatialIndex.searchPoint(12.0, 12.0);
    expect(hitsTree.length).toBe(1);
    expect(hitsTree[0].id).toBe('tree-1');
  });

  it('returns empty array when searching points in empty space', () => {
    const spatialIndex = new GardenSpatialIndex();
    spatialIndex.rebuild(entities);

    const hits = spatialIndex.searchPoint(0.5, 0.5);
    expect(hits).toEqual([]);
  });

  it('culls entities outside the viewport box', () => {
    const spatialIndex = new GardenSpatialIndex();
    spatialIndex.rebuild(entities);

    // Viewport looking only at (0, 0) to (5, 5)
    const inView = spatialIndex.searchViewport(0, 0, 5, 5);
    expect(inView.length).toBe(1);
    expect(inView[0].id).toBe('bed-1');

    // Viewport looking at (8, 0) to (20, 20) containing tree-1 and shed-1
    const largeView = spatialIndex.searchViewport(8, 0, 20, 20);
    const ids = largeView.map((e) => e.id);
    expect(ids).toContain('tree-1');
    expect(ids).toContain('shed-1');
    expect(ids).not.toContain('bed-1');
  });

  it('finds snap targets for edge alignment', () => {
    const spatialIndex = new GardenSpatialIndex();
    spatialIndex.rebuild(entities);

    // Placing a new bed at x = 2.1, y = 6.0 (close to bed-1 at x = 2.0)
    const snapResult = spatialIndex.findSnapCandidates(2.1, 6.0, 1.0, 2.0, 0.25, 'new-bed');
    expect(snapResult.snapX).toBe(2.0);
    expect(snapResult.targetEntity?.id).toBe('bed-1');
  });
});
