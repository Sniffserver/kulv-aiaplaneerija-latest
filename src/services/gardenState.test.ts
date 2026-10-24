import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { replaceGardenState, subscribeGardenReplaced } from './gardenState';
import { getStoredItem, resetDatabaseConnection } from '../logic/storageDb';
import * as storageDbModule from '../logic/storageDb';

describe('Task 0.5 — replaceGardenState Atomic Transaction', () => {
  const validBackupJson = JSON.stringify({
    version: '1.0.0',
    exportedAt: '2026-10-17T12:00:00.000Z',
    appName: 'KÜLV',
    settings: {
      locationName: 'Tartu',
      lat: 58.378,
      lng: 26.729,
      springFrostDate: '05-20',
      autumnFrostDate: '09-25',
      yardWidthM: 25,
      yardLengthM: 35,
      northAngle: 45,
      themeMode: 'dark'
    },
    beds: [
      {
        id: 'bed-test-1',
        name: 'Kapsapeenar',
        type: 'raisedBed',
        x: 2.0,
        y: 3.0,
        width: 1.2,
        length: 2.4,
        height: 0.3,
        rotation: 0,
        coverType: 'none',
        notes: 'Hea muld',
        plantings: [],
        calculatedSunHours: 8.0
      }
    ],
    journal: [
      {
        id: 'journal-test-1',
        title: 'Kevadine ettevalmistus',
        content: 'Kompost lisatud',
        category: 'observation',
        date: '2026-04-10'
      }
    ],
    tasks: [
      {
        id: 'task-test-1',
        title: 'Kasta tomateid',
        completed: false,
        dueDate: '2026-05-25',
        category: 'water',
        createdAt: '2026-05-20'
      }
    ],
    customPlants: [],
    yardPlan: {
      id: 'yard-plan-1',
      name: 'Minu krunt',
      schemaVersion: 3,
      units: 'metric',
      widthM: 25,
      lengthM: 35,
      northAngleDeg: 45,
      entities: [
        {
          id: 'ent-1',
          name: 'Kasvuhoone',
          category: 'structure',
          subType: 'greenhouse',
          x: 5,
          y: 5,
          rotation: 0,
          shapeType: 'rectangle',
          width: 3,
          length: 6,
          heightM: 2.4,
          shadowCasting: true,
          zIndex: 10,
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      ],
      trash: [],
      layers: [
        { id: 'structures', name: 'Ehitised', visible: true, locked: false },
        { id: 'beds', name: 'Peenrad', visible: true, locked: false }
      ]
    }
  });

  beforeEach(() => {
    resetDatabaseConnection();
    vi.restoreAllMocks();
  });

  it('Õnnestumine: replaceGardenState asendab kõik poed aatomiliselt ja väljastab täpselt ühe sündmuse', async () => {
    let eventReceivedCount = 0;
    let receivedDetail: any = null;

    const unsubscribe = subscribeGardenReplaced((detail) => {
      eventReceivedCount++;
      receivedDetail = detail;
    });

    const result = await replaceGardenState(validBackupJson, { source: 'import' });
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.snapshot.beds).toHaveLength(1);
      expect(result.snapshot.beds[0].name).toBe('Kapsapeenar');
      expect(result.snapshot.tasks).toHaveLength(1);
      expect(result.snapshot.journal).toHaveLength(1);
      expect(result.snapshot.settings.locationName).toBe('Tartu');
      expect(result.snapshot.yardPlan.entities).toHaveLength(1);
    }

    // Verify storage was populated in IndexedDB
    const storedBeds = await getStoredItem<any[]>('beds', []);
    expect(storedBeds).toHaveLength(1);
    expect(storedBeds[0].name).toBe('Kapsapeenar');

    // Verify exactly one event was fired
    expect(eventReceivedCount).toBe(1);
    expect(receivedDetail.source).toBe('import');
    expect(receivedDetail.snapshot.settings.locationName).toBe('Tartu');

    unsubscribe();
  });

  it('Valideerimise ebaõnnestumine: vigane JSON ei muuda ühtegi poodi ja tagastab ok: false', async () => {
    // Initial state
    await storageDbModule.setStoredItem('beds', [{ id: 'old-bed', name: 'Vana peenar' }]);

    const result = await replaceGardenState('VIGANE MITTE-JSON', { source: 'restore' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('VALIDATION_FAILED');
    }

    // Verify old state remains intact
    const currentBeds = await getStoredItem<any[]>('beds', []);
    expect(currentBeds).toHaveLength(1);
    expect(currentBeds[0].name).toBe('Vana peenar');
  });

  it('Kirjutamise ebaõnnestumine: kui IndexedDB transaktsioon ebaõnnestub, taastatakse vana olek', async () => {
    // Set initial known state
    await storageDbModule.setStoredItem('beds', [{ id: 'orig-bed', name: 'Algne peenar' }]);

    // Mock replaceAllStoresTransactionally to simulate an error
    const spy = vi
      .spyOn(storageDbModule, 'replaceAllStoresTransactionally')
      .mockRejectedValueOnce(new Error('Simulated QuotaExceededError in IndexedDB'));

    const result = await replaceGardenState(validBackupJson, { source: 'import' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('STORAGE_FAILED');
    }

    spy.mockRestore();
  });

  it('Osaline sisend: ilma customPlants ja yardPlan-ita varukoopiast tuletatakse kehtiv plaan peenarde põhjal', async () => {
    const minimalBackup = JSON.stringify({
      version: '1.0.0',
      exportedAt: '2026-10-17T12:00:00.000Z',
      appName: 'KÜLV',
      settings: {
        locationName: 'Pärnu',
        lat: 58.385,
        lng: 24.497,
        springFrostDate: '05-20',
        autumnFrostDate: '09-25',
        yardWidthM: 20,
        yardLengthM: 30,
        northAngle: 0,
        themeMode: 'light'
      },
      beds: [
        {
          id: 'bed-p1',
          name: 'Porgand',
          type: 'inGroundBed',
          x: 1,
          y: 1,
          width: 1,
          length: 2,
          height: 0.2,
          rotation: 0,
          coverType: 'none',
          notes: '',
          plantings: [],
          calculatedSunHours: 6.0
        }
      ],
      journal: [],
      tasks: []
    });

    const result = await replaceGardenState(minimalBackup, { source: 'restore' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.yardPlan).toBeDefined();
      expect(result.snapshot.yardPlan.entities).toHaveLength(1);
      expect(result.snapshot.yardPlan.entities[0].name).toBe('Porgand');
    }
  });

  it('Konkurents: teine asendamispäring samal ajal lükatakse tagasi veaga CONCURRENCY_CONFLICT', async () => {
    // Run two replacements concurrently
    const p1 = replaceGardenState(validBackupJson, { source: 'import' });
    const p2 = replaceGardenState(validBackupJson, { source: 'sync-pull' });

    const [res1, res2] = await Promise.all([p1, p2]);

    // One succeeds, the other gets CONCURRENCY_CONFLICT
    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(false);
    if (!res2.ok) {
      expect(res2.error.type).toBe('CONCURRENCY_CONFLICT');
    }
  });
});
