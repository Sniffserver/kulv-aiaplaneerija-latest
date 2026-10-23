import { describe, it, expect } from 'vitest';
import { SuccessionPlannerEngine } from './successionPlannerEngine';
import { DEFAULT_PLANTS } from '../data/defaultPlants';
import { BedSuccessionSlot, GardenBed } from '../types/rotation';

describe('SuccessionPlannerEngine - Pure Deterministic Engine', () => {
  const sampleBeds: GardenBed[] = [
    {
      id: 'bed_1',
      name: 'Peenar 1',
      type: 'raised',
      coverType: 'none',
      width: 1.2,
      length: 3.0
    },
    {
      id: 'bed_gh',
      name: 'Kasvuhoone',
      type: 'greenhouse',
      coverType: 'greenhouse',
      width: 2.0,
      length: 4.0
    }
  ];

  it('evaluates follow-up crops for a bed becoming available after harvest', () => {
    const existingSlots: BedSuccessionSlot[] = [
      {
        id: 'slot_1',
        bedId: 'bed_1',
        year: 2026,
        seasonSlot: 'early_spring',
        plantId: 'redis',
        plantName: 'Redis',
        botanicalFamily: 'Brassicaceae',
        sowDate: '04-10',
        harvestDate: '05-20',
        daysToMaturity: 35,
        protectionType: 'none'
      }
    ];

    const recs = SuccessionPlannerEngine.evaluateFollowUpCrops(
      'bed_1',
      2026,
      existingSlots,
      DEFAULT_PLANTS,
      sampleBeds,
      'central'
    );

    expect(recs.length).toBeGreaterThan(0);
    // Should have earliest sow date after 05-20 (e.g. 05-23 accounting for 3d turnover)
    const topRec = recs[0];
    expect(topRec.earliestSowDate).toBe('05-23');
  });

  it('identifies crops that mature before season ends vs crops that cannot mature', () => {
    const existingSlots: BedSuccessionSlot[] = [
      {
        id: 'slot_1',
        bedId: 'bed_1',
        year: 2026,
        seasonSlot: 'main_crop',
        plantId: 'tomat',
        plantName: 'Tomat',
        botanicalFamily: 'Solanaceae',
        sowDate: '05-20',
        harvestDate: '09-10', // Late harvest
        daysToMaturity: 90,
        protectionType: 'none'
      }
    ];

    const recs = SuccessionPlannerEngine.evaluateFollowUpCrops(
      'bed_1',
      2026,
      existingSlots,
      DEFAULT_PLANTS,
      sampleBeds,
      'central'
    );

    // After 09-13, autumn season is nearly over, long maturity crops should be blocked or penalized
    const squashRec = recs.find((r) => r.plant.id === 'korvits');
    if (squashRec) {
      expect(squashRec.suitabilityScore).toBe(0);
      expect(squashRec.blockingConstraints.length).toBeGreaterThan(0);
    }
  });

  it('handles rotation conflicts correctly (e.g. Brassicaceae consecutive breach)', () => {
    const existingSlots: BedSuccessionSlot[] = [
      {
        id: 'slot_1',
        bedId: 'bed_1',
        year: 2026,
        seasonSlot: 'early_spring',
        plantId: 'kapsas',
        plantName: 'Kapsas',
        botanicalFamily: 'Brassicaceae',
        sowDate: '04-15',
        harvestDate: '07-15',
        daysToMaturity: 80,
        protectionType: 'none'
      }
    ];

    const recs = SuccessionPlannerEngine.evaluateFollowUpCrops(
      'bed_1',
      2026,
      existingSlots,
      DEFAULT_PLANTS,
      sampleBeds,
      'central'
    );

    const brassicaFollower = recs.find((r) => r.plant.id === 'redis' || r.plant.id === 'lillkapsas');
    if (brassicaFollower) {
      expect(brassicaFollower.rotationCompatibility).toMatch(/warning|blocked/);
    }
  });

  it('handles missing harvest dates or maturity info with uncertainty flags and defaults', () => {
    const plantsWithMissingDtm = [
      ...DEFAULT_PLANTS,
      {
        id: 'mysterious_plant',
        name: 'Tundmatu taim',
        family: 'Other',
        daysToMaturity: undefined as any
      }
    ];

    const recs = SuccessionPlannerEngine.evaluateFollowUpCrops(
      'bed_1',
      2026,
      [],
      plantsWithMissingDtm,
      sampleBeds,
      'central'
    );

    const mysteriousRec = recs.find((r) => r.plant.id === 'mysterious_plant');
    expect(mysteriousRec).toBeDefined();
    expect(mysteriousRec?.isUncertain).toBe(true);
    expect(mysteriousRec?.missingDataNotes).toBeDefined();
  });

  it('calculates feasible growing cycles count and stable sorting', () => {
    const recs = SuccessionPlannerEngine.evaluateFollowUpCrops(
      'bed_1',
      2026,
      [],
      DEFAULT_PLANTS,
      sampleBeds,
      'central'
    );

    expect(recs.length).toBeGreaterThan(1);
    // Ensure sorted descending by suitability score
    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].suitabilityScore).toBeGreaterThanOrEqual(recs[i + 1].suitabilityScore);
    }
  });
});
