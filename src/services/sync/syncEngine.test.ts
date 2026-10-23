import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { SyncEngine } from './syncEngine';
import { SyncQueue } from './syncQueue';
import { SyncRepository } from './syncRepository';
import { SyncTransport } from './syncTypes';
import { resetDatabaseConnection } from '../../logic/storageDb';

describe('Sprint 1 — SyncEngine Tests', () => {
  let queue: SyncQueue;
  let repository: SyncRepository;
  let engine: SyncEngine;

  const sampleServerState = {
    version: '1.0.0',
    exportedAt: '2026-10-17T14:00:00.000Z',
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
        id: 'bed-remote-1',
        name: 'Kaugpeenar',
        type: 'raisedBed',
        x: 1,
        y: 1,
        width: 1,
        length: 2,
        height: 0.3,
        rotation: 0,
        coverType: 'none',
        notes: '',
        plantings: [],
        calculatedSunHours: 7.0
      }
    ],
    journal: [],
    tasks: []
  };

  beforeEach(() => {
    resetDatabaseConnection();
    vi.restoreAllMocks();
    queue = new SyncQueue();
    repository = new SyncRepository();
    engine = new SyncEngine({ queue, repository });
  });

  it('1. Õnnestunud sync: lokaalne muudatus saadetakse serverisse, vastus OK, revisjon N+1', async () => {
    const mockTransport: SyncTransport = {
      push: vi.fn().mockResolvedValue({
        status: 200,
        newRevision: 5
      }),
      pull: vi.fn()
    };
    engine.setTransport(mockTransport);

    const result = await engine.sync();
    expect(result.success).toBe(true);
    expect(result.revision).toBe(5);

    const currentRev = await repository.getLocalRevision();
    expect(currentRev).toBe(5);

    const queueItems = await queue.getAll();
    expect(queueItems).toHaveLength(0);
  });

  it('2. Võrgu viga: kui server tagastab 500 või võrguviga, salvestatakse toiming järjekorda', async () => {
    const mockTransport: SyncTransport = {
      push: vi.fn().mockResolvedValue({
        status: 500,
        error: 'Network timeout'
      }),
      pull: vi.fn()
    };
    engine.setTransport(mockTransport);

    const result = await engine.sync();
    expect(result.success).toBe(false);

    // Queue must retain pending item
    const queueItems = await queue.getAll();
    expect(queueItems.length).toBeGreaterThan(0);
    expect(queueItems[0].action).toBe('push');
  });

  it('3. 409 konflikt: serveri uuema seisu korral asendatakse lokaalne seis aatomiliselt', async () => {
    const mockTransport: SyncTransport = {
      push: vi.fn().mockResolvedValue({
        status: 409,
        newRevision: 8,
        serverState: sampleServerState
      }),
      pull: vi.fn()
    };
    engine.setTransport(mockTransport);

    const result = await engine.sync({ strategy: 'server-wins' });
    expect(result.success).toBe(true);
    expect(result.conflictResolved).toBe(true);
    expect(result.revision).toBe(8);

    // Verify local storage was replaced with server state
    const currentSnapshot = await repository.getLocalSnapshot();
    expect(currentSnapshot.beds[0].name).toBe('Kaugpeenar');
  });

  it('4. Offline -> online: järjekord säilib IndexedDB-s lehe taaskäivitusel', async () => {
    // 1. Simulate offline push failure
    await queue.enqueue({
      action: 'push',
      clientRevision: 2,
      payload: { test: true }
    });

    // 2. Simulate page reload by recreating queue instance with same persistent IndexedDB
    const reloadedQueue = new SyncQueue();
    const storedItems = await reloadedQueue.getAll();
    expect(storedItems).toHaveLength(1);
    expect(storedItems[0].clientRevision).toBe(2);
  });

  it('5. Aatomilisus: vigase serveri vastuse korral ei rikuta lokaalset seisu', async () => {
    const originalSnapshot = await repository.getLocalSnapshot();

    const mockTransport: SyncTransport = {
      push: vi.fn(),
      pull: vi.fn().mockResolvedValue({
        status: 200,
        revision: 9,
        serverState: 'VIGANE MITTE-JSON-ANDMESTIK'
      })
    };
    engine.setTransport(mockTransport);

    const result = await engine.sync({ forcePull: true });
    expect(result.success).toBe(false);

    // Verify state was not corrupted
    const currentSnapshot = await repository.getLocalSnapshot();
    expect(currentSnapshot.settings.locationName).toBe(originalSnapshot.settings.locationName);
  });
});
