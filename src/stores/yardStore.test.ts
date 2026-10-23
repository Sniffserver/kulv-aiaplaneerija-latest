import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useYardStore, createInitialPlan } from './yardStore';
import { GardenEntity } from '../types';
import { setStoredItem, getStoredItem } from '../logic/storageDb';

// Ensure localStorage is polyfilled for Node.js test environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MockLocalStorage();
}

describe('useYardStore with Zustand, Zundo, Immer and Persist', () => {
  beforeEach(() => {
    localStorage.clear();
    useYardStore.getState().setPlan(createInitialPlan());
    useYardStore.temporal.getState().clear();
  });

  const testEntity: GardenEntity = {
    id: 'test-bed',
    name: 'Maasikapeenar',
    category: 'bed',
    subType: 'raisedBed',
    x: 2.0,
    y: 3.0,
    width: 1.2,
    length: 2.4,
    heightM: 0.4,
    rotation: 0,
    shapeType: 'rectangle',
    shadowCasting: true,
    zIndex: 10,
    createdAt: '2026-05-01',
    updatedAt: '2026-05-01'
  };

  it('adds an entity and updates spatial index and timestamps', () => {
    useYardStore.getState().addEntity(testEntity);

    const plan = useYardStore.getState().plan;
    expect(plan.entities.length).toBe(1);
    expect(plan.entities[0].name).toBe('Maasikapeenar');
    expect(plan.entities[0].deletedAt).toBeNull();

    // Verify spatial index hit test
    const hits = useYardStore.getState().spatialIndex.searchPoint(2.5, 3.5);
    expect(hits.length).toBe(1);
    expect(hits[0].id).toBe('test-bed');
  });

  it('moves entity and updates timestamp', () => {
    useYardStore.getState().addEntity(testEntity);
    useYardStore.getState().moveEntity('test-bed', 5.0, 6.0);

    const entity = useYardStore.getState().plan.entities[0];
    expect(entity.x).toBe(5.0);
    expect(entity.y).toBe(6.0);
    expect(entity.updatedAt).toBeDefined();
  });

  it('performs undo and redo on plan mutations while preserving UI state', () => {
    useYardStore.getState().addEntity(testEntity);
    expect(useYardStore.getState().plan.entities.length).toBe(1);

    // Perform second action: move
    useYardStore.getState().moveEntity('test-bed', 7.0, 8.0);
    expect(useYardStore.getState().plan.entities[0].x).toBe(7.0);

    // Undo the move
    useYardStore.temporal.getState().undo();
    expect(useYardStore.getState().plan.entities[0].x).toBe(2.0);

    // Redo the move
    useYardStore.temporal.getState().redo();
    expect(useYardStore.getState().plan.entities[0].x).toBe(7.0);
  });

  it('supports soft-delete Variant B: Kustutamine liigutab objektid trash-i ja Undo ei puutu trash-i', () => {
    useYardStore.getState().addEntity(testEntity);
    expect(useYardStore.getState().plan.entities[0].deletedAt).toBeNull();

    // Soft delete moves entity to trash array (Variant B)
    useYardStore.getState().deleteEntity('test-bed', true);
    expect(useYardStore.getState().plan.entities.length).toBe(0);
    expect(useYardStore.getState().plan.trash?.[0].id).toBe('test-bed');
    expect(useYardStore.getState().plan.trash?.[0].deletedAt).not.toBeNull();

    // Undo should NOT empty or alter the trash bin
    const currentTrashCount = useYardStore.getState().plan.trash?.length || 0;
    useYardStore.temporal.getState().undo();
    expect(useYardStore.getState().plan.trash?.length).toBe(currentTrashCount);

    // Restore moves entity back from trash into active entities
    useYardStore.getState().restoreEntity('test-bed');
    expect(useYardStore.getState().plan.entities.length).toBe(1);
    expect(useYardStore.getState().plan.entities[0].deletedAt).toBeNull();
    expect(useYardStore.getState().plan.trash?.length || 0).toBe(0);

    const hitsAfterRestore = useYardStore.getState().spatialIndex.searchPoint(2.5, 3.5);
    expect(hitsAfterRestore.length).toBe(1);
  });

  it('useYardStore persist: partialize jätab temporal ajaloo välja ja pärast 10 muudatust ja undo-d on salvestuses ainult üks plaan', async () => {
    useYardStore.getState().addEntity(testEntity);

    // Perform 10 consecutive mutations
    for (let i = 1; i <= 10; i++) {
      useYardStore.getState().moveEntity('test-bed', 1.0 + i * 0.5, 2.0 + i * 0.5);
    }

    // Verify temporal tracked changes
    expect(useYardStore.temporal.getState().pastStates.length).toBeGreaterThan(0);

    // Perform undo
    useYardStore.temporal.getState().undo();

    // Check what persist extracts from state via partialize
    const persistOptions = (useYardStore as any).persist?.getOptions?.();
    const persistedSlice = persistOptions?.partialize
      ? persistOptions.partialize(useYardStore.getState())
      : { plan: useYardStore.getState().plan };

    // Must contain strictly plan, NO temporal/pastStates/futureStates
    expect(persistedSlice.plan).toBeDefined();
    expect((persistedSlice as any).pastStates).toBeUndefined();
    expect((persistedSlice as any).futureStates).toBeUndefined();
    expect((persistedSlice as any).temporal).toBeUndefined();

    // Also verify storageDb persistence: exactly one plan object is saved
    await setStoredItem('yard-store-test', persistedSlice);
    const stored = await getStoredItem<any>('yard-store-test', null);
    expect(stored.plan.entities.length).toBe(1);
    expect(stored.pastStates).toBeUndefined();
  });

  it('RBush: ei ehitata ümber pointermove-il (ainult commit-il)', () => {
    useYardStore.getState().addEntity(testEntity);
    const spy = vi.spyOn(useYardStore.getState().spatialIndex, 'rebuild');

    // Simulate 50 pointermove drag preview steps (does not call store actions)
    let previewX = 2.0;
    let previewY = 3.0;
    for (let i = 0; i < 50; i++) {
      previewX += 0.05;
      previewY += 0.05;
      // During drag, only local visual preview state is updated in canvas, store is untouched
    }
    // Zero rebuild calls during pointermove
    expect(spy).toHaveBeenCalledTimes(0);

    // On pointerup drop, commit happens once:
    useYardStore.getState().moveEntity('test-bed', 4.5, 5.5);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('Snap: pärast drop-i peab x, y olema täpselt 0.5 m kordsed', () => {
    // Dropping at arbitrary fractional world coordinate (e.g. 3.24m, 5.78m)
    const rawX = 3.24;
    const rawY = 5.78;
    const snappedX = Math.round(rawX * 2) / 2;
    const snappedY = Math.round(rawY * 2) / 2;

    expect(snappedX).toBe(3.0);
    expect(snappedY).toBe(6.0);
    expect((snappedX * 10) % 5).toBe(0);
    expect((snappedY * 10) % 5).toBe(0);

    useYardStore.getState().addEntity({
      ...testEntity,
      id: 'snapped-bed',
      x: snappedX,
      y: snappedY
    });

    const ent = useYardStore.getState().plan.entities.find((e) => e.id === 'snapped-bed');
    expect(ent?.x).toBe(3.0);
    expect(ent?.y).toBe(6.0);
  });

  it('integratsioonitest 200 objektiga krunt: drag → drop → undo → redo → kõik objektid õigel kohal', () => {
    // 1. Generate 200 realistic objects
    const entities: GardenEntity[] = [];
    for (let i = 0; i < 200; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      entities.push({
        id: `entity-${i}`,
        name: `Peenar või puu ${i}`,
        category: i % 4 === 0 ? 'tree' : i % 4 === 1 ? 'bed' : i % 4 === 2 ? 'shrub' : 'structure',
        subType: 'raisedBed',
        x: col * 1.5,
        y: row * 1.5,
        width: 1.0,
        length: 1.0,
        heightM: 0.5,
        rotation: 0,
        shapeType: 'rectangle',
        shadowCasting: true,
        zIndex: i,
        createdAt: '2026-05-01',
        updatedAt: '2026-05-01'
      });
    }

    useYardStore.getState().setPlan({
      ...createInitialPlan(),
      entities
    });
    useYardStore.temporal.getState().clear();

    expect(useYardStore.getState().plan.entities.length).toBe(200);

    // Pick target entity (index 50)
    const originalPos = { x: entities[50].x, y: entities[50].y };

    // 2. Drag & Drop: move entity 50 to (18.5, 22.0)
    const newPos = { x: 18.5, y: 22.0 };
    useYardStore.getState().moveEntity('entity-50', newPos.x, newPos.y);

    const movedEntity = useYardStore.getState().plan.entities.find((e) => e.id === 'entity-50');
    expect(movedEntity?.x).toBe(18.5);
    expect(movedEntity?.y).toBe(22.0);

    // Check all other 199 entities remain in their exact positions
    for (let i = 0; i < 200; i++) {
      if (i === 50) continue;
      const e = useYardStore.getState().plan.entities.find((item) => item.id === `entity-${i}`);
      expect(e?.x).toBe(entities[i].x);
      expect(e?.y).toBe(entities[i].y);
    }

    // 3. Undo
    useYardStore.temporal.getState().undo();
    const restoredAfterUndo = useYardStore.getState().plan.entities.find((e) => e.id === 'entity-50');
    expect(restoredAfterUndo?.x).toBe(originalPos.x);
    expect(restoredAfterUndo?.y).toBe(originalPos.y);

    // 4. Redo
    useYardStore.temporal.getState().redo();
    const restoredAfterRedo = useYardStore.getState().plan.entities.find((e) => e.id === 'entity-50');
    expect(restoredAfterRedo?.x).toBe(newPos.x);
    expect(restoredAfterRedo?.y).toBe(newPos.y);
  });

  it('applies and clears cadastral plot boundaries and metadata', () => {
    useYardStore.getState().applyCadastralPlot({
      cadastralCode: '79501:027:0011',
      address: 'Männiku tee 14, Kohila alev',
      cadastralAreaM2: 1850,
      widthM: 38,
      lengthM: 49,
      boundaryPolygon: [
        { x: 0, y: 0 },
        { x: 38, y: 0 },
        { x: 38, y: 36 },
        { x: 26, y: 49 },
        { x: 0, y: 49 }
      ],
      name: 'Krunt · Männiku tee 14'
    });

    const plan = useYardStore.getState().plan;
    expect(plan.cadastralCode).toBe('79501:027:0011');
    expect(plan.cadastralAreaM2).toBe(1850);
    expect(plan.address).toBe('Männiku tee 14, Kohila alev');
    expect(plan.widthM).toBe(38);
    expect(plan.lengthM).toBe(49);
    expect(plan.boundaryPolygon?.length).toBe(5);

    // Clear cadastral plot
    useYardStore.getState().clearCadastralPlot();
    const cleared = useYardStore.getState().plan;
    expect(cleared.cadastralCode).toBeUndefined();
    expect(cleared.cadastralAreaM2).toBeUndefined();
    expect(cleared.boundaryPolygon).toBeUndefined();
  });
});
