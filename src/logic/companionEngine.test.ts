import { describe, it, expect } from 'vitest';
import { CompanionEngine } from './companionEngine';
import { BedPlantingCell } from '../types';
import { DEFAULT_PLANTS } from '../data/defaultPlants';

describe('CompanionEngine', () => {
  it('detects antagonistic neighbors (e.g. Hernes and Sibul)', () => {
    const peas = DEFAULT_PLANTS.find((p) => p.id === 'hernes')!;
    const onion = DEFAULT_PLANTS.find((p) => p.id === 'sibul')!;

    const plantings: BedPlantingCell[] = [
      { id: 'c1', bedId: 'b1', plantId: peas.id, plantName: peas.name, plantIcon: peas.icon, gridX: 0, gridY: 0, year: 2026, dateAdded: '2026-05-01' },
      { id: 'c2', bedId: 'b1', plantId: onion.id, plantName: onion.name, plantIcon: onion.icon, gridX: 1, gridY: 0, year: 2026, dateAdded: '2026-05-01' }
    ];

    const conflicts = CompanionEngine.evaluateBedCompanions(plantings, DEFAULT_PLANTS);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some((c) => c.isHarmful)).toBe(true);
  });

  it('detects beneficial companion synergy (e.g. Tomat and Basiilik)', () => {
    const tomato = DEFAULT_PLANTS.find((p) => p.id === 'tomat')!;
    const basil = DEFAULT_PLANTS.find((p) => p.id === 'basiilik')!;

    const plantings: BedPlantingCell[] = [
      { id: 'c1', bedId: 'b1', plantId: tomato.id, plantName: tomato.name, plantIcon: tomato.icon, gridX: 0, gridY: 0, year: 2026, dateAdded: '2026-05-01' },
      { id: 'c2', bedId: 'b1', plantId: basil.id, plantName: basil.name, plantIcon: basil.icon, gridX: 1, gridY: 0, year: 2026, dateAdded: '2026-05-01' }
    ];

    const conflicts = CompanionEngine.evaluateBedCompanions(plantings, DEFAULT_PLANTS);
    expect(conflicts.some((c) => !c.isHarmful)).toBe(true);
  });

  it('evaluates cell synergy preview correctly for candidate plants', () => {
    const tomato = DEFAULT_PLANTS.find((p) => p.id === 'tomat')!;
    const basil = DEFAULT_PLANTS.find((p) => p.id === 'basiilik')!;

    const plantings: BedPlantingCell[] = [
      { id: 'c1', bedId: 'b1', plantId: tomato.id, plantName: tomato.name, plantIcon: tomato.icon, gridX: 0, gridY: 0, year: 2026, dateAdded: '2026-05-01' }
    ];

    const synergy = CompanionEngine.getCellSynergy(1, 0, basil, plantings, DEFAULT_PLANTS);
    expect(synergy.status).toBe('good');
  });

  it('calculates planted cell synergy details with neighbor relationship breakdown', () => {
    const tomato = DEFAULT_PLANTS.find((p) => p.id === 'tomat')!;
    const basil = DEFAULT_PLANTS.find((p) => p.id === 'basiilik')!;
    const potato = DEFAULT_PLANTS.find((p) => p.id === 'kartul')!;

    const cellTomato: BedPlantingCell = {
      id: 'c1',
      bedId: 'b1',
      plantId: tomato.id,
      plantName: tomato.name,
      plantIcon: tomato.icon,
      gridX: 1,
      gridY: 1,
      year: 2026,
      dateAdded: '2026-05-01'
    };
    const cellBasil: BedPlantingCell = {
      id: 'c2',
      bedId: 'b1',
      plantId: basil.id,
      plantName: basil.name,
      plantIcon: basil.icon,
      gridX: 1,
      gridY: 2,
      year: 2026,
      dateAdded: '2026-05-01'
    };

    const plantings = [cellTomato, cellBasil];
    const details = CompanionEngine.getPlantedCellSynergy(cellTomato, plantings, DEFAULT_PLANTS);

    expect(details.status).toBe('positive');
    expect(details.goodCount).toBe(1);
    expect(details.badCount).toBe(0);
    expect(details.relationships.length).toBe(1);
    expect(details.relationships[0].type).toBe('good');
  });

  it('calculates bed harmony score correctly', () => {
    const tomato = DEFAULT_PLANTS.find((p) => p.id === 'tomat')!;
    const basil = DEFAULT_PLANTS.find((p) => p.id === 'basiilik')!;

    const plantings: BedPlantingCell[] = [
      { id: 'c1', bedId: 'b1', plantId: tomato.id, plantName: tomato.name, plantIcon: tomato.icon, gridX: 0, gridY: 0, year: 2026, dateAdded: '2026-05-01' },
      { id: 'c2', bedId: 'b1', plantId: basil.id, plantName: basil.name, plantIcon: basil.icon, gridX: 1, gridY: 0, year: 2026, dateAdded: '2026-05-01' }
    ];

    const harmony = CompanionEngine.calculateBedHarmony(plantings, DEFAULT_PLANTS);
    expect(harmony.harmonyPercentage).toBeGreaterThanOrEqual(90);
    expect(harmony.positivePairs).toBe(1);
    expect(harmony.negativePairs).toBe(0);
  });

  it('detects mixed synergy when a plant has both positive and negative neighbors', () => {
    const peas = DEFAULT_PLANTS.find((p) => p.id === 'hernes')!;
    const carrot = DEFAULT_PLANTS.find((p) => p.id === 'porgand')!;
    const onion = DEFAULT_PLANTS.find((p) => p.id === 'sibul')!;

    const centerPeas: BedPlantingCell = {
      id: 'c1',
      bedId: 'b1',
      plantId: peas.id,
      plantName: peas.name,
      plantIcon: peas.icon,
      gridX: 1,
      gridY: 1,
      year: 2026,
      dateAdded: '2026-05-01'
    };
    const neighborCarrot: BedPlantingCell = {
      id: 'c2',
      bedId: 'b1',
      plantId: carrot.id,
      plantName: carrot.name,
      plantIcon: carrot.icon,
      gridX: 1,
      gridY: 0,
      year: 2026,
      dateAdded: '2026-05-01'
    };
    const neighborOnion: BedPlantingCell = {
      id: 'c3',
      bedId: 'b1',
      plantId: onion.id,
      plantName: onion.name,
      plantIcon: onion.icon,
      gridX: 1,
      gridY: 2,
      year: 2026,
      dateAdded: '2026-05-01'
    };

    const details = CompanionEngine.getPlantedCellSynergy(centerPeas, [centerPeas, neighborCarrot, neighborOnion], DEFAULT_PLANTS);
    expect(details.status).toBe('mixed');
    expect(details.goodCount).toBe(1);
    expect(details.badCount).toBe(1);
    expect(details.relationships.length).toBe(2);
  });

  it('returns 100% harmony when bed has no plantings or single plant', () => {
    const emptyHarmony = CompanionEngine.calculateBedHarmony([], DEFAULT_PLANTS);
    expect(emptyHarmony.harmonyPercentage).toBe(100);
    expect(emptyHarmony.totalPairings).toBe(0);

    const singleHarmony = CompanionEngine.calculateBedHarmony([
      { id: 'c1', bedId: 'b1', plantId: 'tomat', plantName: 'Tomat', plantIcon: '🍅', gridX: 0, gridY: 0, year: 2026, dateAdded: '2026-05-01' }
    ], DEFAULT_PLANTS);
    expect(singleHarmony.harmonyPercentage).toBe(100);
    expect(singleHarmony.positivePairs).toBe(0);
    expect(singleHarmony.negativePairs).toBe(0);
  });
});
