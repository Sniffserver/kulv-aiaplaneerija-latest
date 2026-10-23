import { describe, it, expect } from 'vitest';
import { resolveConflict } from './conflictResolver';
import { GardenStateSnapshot } from '../gardenState';

function createMockSnapshot(updatedAt: string, bedCount = 1): GardenStateSnapshot {
  return {
    schemaVersion: 1,
    settings: {
      locationName: 'Tallinn',
      lat: 59.437,
      lng: 24.753,
      springFrostDate: '05-20',
      autumnFrostDate: '09-25',
      yardWidthM: 20,
      yardLengthM: 30,
      northAngle: 0,
      themeMode: 'light'
    },
    beds: Array.from({ length: bedCount }).map((_, i) => ({
      id: `bed-${i}`,
      name: `Bed ${i}`,
      type: 'raisedBed',
      x: i * 2,
      y: 0,
      width: 2,
      length: 1,
      height: 0.3,
      rotation: 0,
      coverType: 'none',
      notes: '',
      plantings: [],
      calculatedSunHours: 8,
      updatedAt
    })),
    tasks: [],
    journal: [],
    customPlants: [],
    yardPlan: {
      id: 'plan-1',
      name: 'Plaan',
      schemaVersion: 3,
      units: 'metric',
      widthM: 20,
      lengthM: 30,
      northAngleDeg: 0,
      entities: [],
      trash: [],
      layers: [
        { id: 'structures', name: 'Ehitised', visible: true, locked: false },
        { id: 'beds', name: 'Peenrad', visible: true, locked: false }
      ]
    }
  };
}

describe('Deterministic conflictResolver', () => {
  it('guarantees identical input produces identical output (idempotency)', () => {
    const clientState = createMockSnapshot('2026-05-01T12:00:00Z', 2);
    const serverState = createMockSnapshot('2026-05-01T10:00:00Z', 1);

    const res1 = resolveConflict(clientState, serverState, 'last-write-wins');
    const res2 = resolveConflict(clientState, serverState, 'last-write-wins');

    expect(res1.winner).toBe(res2.winner);
    expect(res1.chosenState).toBe(res2.chosenState);
    expect(res1.reason).toBe(res2.reason);
    expect(res1.winner).toBe('client');
  });

  it('correctly honors client-wins strategy', () => {
    const clientState = createMockSnapshot('2026-01-01T00:00:00Z');
    const serverState = createMockSnapshot('2026-10-01T00:00:00Z');

    const result = resolveConflict(clientState, serverState, 'client-wins');
    expect(result.winner).toBe('client');
    expect(result.chosenState).toBe(clientState);
  });

  it('correctly honors server-wins strategy', () => {
    const clientState = createMockSnapshot('2026-10-01T00:00:00Z');
    const serverState = createMockSnapshot('2026-01-01T00:00:00Z');

    const result = resolveConflict(clientState, serverState, 'server-wins');
    expect(result.winner).toBe('server');
    expect(result.chosenState).toBe(serverState);
  });

  it('deterministically breaks ties when timestamps are identical', () => {
    const clientState = createMockSnapshot('2026-05-01T12:00:00Z', 3);
    const serverState = createMockSnapshot('2026-05-01T12:00:00Z', 2);

    const res1 = resolveConflict(clientState, serverState, 'last-write-wins');
    expect(res1.winner).toBe('client');
    expect(res1.chosenState).toBe(clientState);
  });
});
