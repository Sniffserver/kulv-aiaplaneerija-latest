import { describe, it, expect } from 'vitest';
import {
  EstonianFrostEngine,
  ESTONIAN_REGIONS,
  PROTECTION_OFFSETS,
  getDayOfYear,
  dayOfYearToMMDD
} from './estonianFrostEngine';
import { BedSuccessionSlot } from '../types/rotation';

describe('EstonianFrostEngine', () => {
  it('correctly calculates Day-of-Year conversions', () => {
    expect(getDayOfYear('01-01')).toBe(1);
    expect(getDayOfYear('05-20')).toBe(140);
    expect(dayOfYearToMMDD(140)).toBe('05-20');
  });

  it('provides distinct regional frost dates between maritime islands and central plateau', () => {
    const islandsDates = EstonianFrostEngine.getAdjustedFrostDates('islands', 'none');
    const centralDates = EstonianFrostEngine.getAdjustedFrostDates('central', 'none');

    // Islands should have significantly longer frost-free season than central
    expect(islandsDates.frostFreeDays).toBeGreaterThan(centralDates.frostFreeDays);
    expect(islandsDates.springFrostDoy).toBeLessThan(centralDates.springFrostDoy);
  });

  it('extends frost protection with fleece and greenhouse', () => {
    const base = EstonianFrostEngine.getAdjustedFrostDates('central', 'none');
    const withFleece = EstonianFrostEngine.getAdjustedFrostDates('central', 'fleece');
    const withGreenhouse = EstonianFrostEngine.getAdjustedFrostDates('central', 'greenhouse');

    expect(withFleece.springFrostDoy).toBeLessThan(base.springFrostDoy);
    expect(withGreenhouse.springFrostDoy).toBeLessThan(withFleece.springFrostDoy);
    expect(withGreenhouse.frostFreeDays).toBeGreaterThan(base.frostFreeDays + 40);
  });

  it('detects spring frost collision when sowing sensitive crop too early', () => {
    const slot: BedSuccessionSlot = {
      id: 'slot-1',
      bedId: 'bed-1',
      year: 2026,
      seasonSlot: 'early_spring',
      plantId: 'tomat',
      plantName: 'Tomat',
      botanicalFamily: 'Solanaceae',
      guild: 'heavy_feeder',
      sowDate: '04-15', // Too early for outdoor open ground in central Estonia
      harvestDate: '08-20',
      daysToMaturity: 80,
      protectionType: 'none'
    };

    const alert = EstonianFrostEngine.evaluateSlotFrostRisk(slot, 'central');
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('danger');
    expect(alert?.frostPhase).toBe('spring_frost');
  });

  it('detects autumn frost collision when long-season crop extends past freeze', () => {
    const slot: BedSuccessionSlot = {
      id: 'slot-2',
      bedId: 'bed-1',
      year: 2026,
      seasonSlot: 'main_crop',
      plantId: 'korvits',
      plantName: 'Hiidkõrvits',
      botanicalFamily: 'Cucurbitaceae',
      guild: 'heavy_feeder',
      sowDate: '06-01',
      harvestDate: '10-25', // Past central Estonia frost (~09-18)
      daysToMaturity: 140,
      protectionType: 'none'
    };

    const alert = EstonianFrostEngine.evaluateSlotFrostRisk(slot, 'central');
    expect(alert).not.toBeNull();
    expect(alert?.severity).toBe('danger');
    expect(alert?.frostPhase).toBe('autumn_frost');
  });
});
