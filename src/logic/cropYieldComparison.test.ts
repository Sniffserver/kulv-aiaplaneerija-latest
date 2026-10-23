import { describe, it, expect } from 'vitest';
import { calculateCropYieldComparison, extractHarvestYears } from './cropYieldComparison';
import { JournalEntry } from '../types';

describe('Year-over-Year Harvest Comparison Engine (Semantika lukustamine)', () => {
  const sampleJournal: JournalEntry[] = [
    // 2025 harvests (compare year)
    {
      id: 'h-2025-1',
      title: 'Tomatisaak',
      category: 'harvest',
      date: '2025-08-15',
      plantName: 'Tomat',
      yieldAmount: 10,
      yieldUnit: 'kg',
      content: ''
    },
    {
      id: 'h-2025-2',
      title: 'Porgandid',
      category: 'harvest',
      date: '2025-09-01',
      plantName: 'Porgand',
      yieldAmount: 20,
      yieldUnit: 'kg',
      content: ''
    },
    // 2026 harvests (current year)
    {
      id: 'h-2026-1',
      title: 'Tomatisaak',
      category: 'harvest',
      date: '2026-08-20',
      plantName: 'Tomat',
      yieldAmount: 15, // +50% increase from 10kg
      yieldUnit: 'kg',
      content: ''
    },
    {
      id: 'h-2026-2',
      title: 'Kurgid',
      category: 'harvest',
      date: '2026-07-25',
      plantName: 'Kurk', // was not grown in 2025
      yieldAmount: 8,
      yieldUnit: 'kg',
      content: ''
    },
    {
      id: 'h-2026-3',
      title: 'Porgandid',
      category: 'harvest',
      date: '2026-09-10',
      plantName: 'Porgand',
      yieldAmount: 15, // -25% decrease from 20kg
      yieldUnit: 'kg',
      content: ''
    }
  ];

  it('calculates percentage difference per specific crop rather than aggregate yield', () => {
    const summary = calculateCropYieldComparison(sampleJournal, 2026, 2025);
    const tomatoRow = summary.rows.find((r) => r.cropName === 'Tomat');
    expect(tomatoRow).toBeDefined();
    expect(tomatoRow?.currentYearKg).toBe(15);
    expect(tomatoRow?.compareYearKg).toBe(10);
    expect(tomatoRow?.diffPercentage).toBe(50);
    expect(tomatoRow?.diffText).toBe('+50% rohkem');

    const carrotRow = summary.rows.find((r) => r.cropName === 'Porgand');
    expect(carrotRow).toBeDefined();
    expect(carrotRow?.currentYearKg).toBe(15);
    expect(carrotRow?.compareYearKg).toBe(20);
    expect(carrotRow?.diffPercentage).toBe(-25);
    expect(carrotRow?.diffText).toBe('-25% vähem');
  });

  it('shows dash (—) and NOT 0% when crop was not grown in the comparison year', () => {
    const summary = calculateCropYieldComparison(sampleJournal, 2026, 2025);
    const cucumberRow = summary.rows.find((r) => r.cropName === 'Kurk');
    expect(cucumberRow).toBeDefined();
    expect(cucumberRow?.currentYearKg).toBe(8);
    expect(cucumberRow?.compareYearKg).toBeNull();
    // Must be "—", never "0%"
    expect(cucumberRow?.diffText).toBe('—');
    expect(cucumberRow?.diffPercentage).toBeNull();
  });

  it('produces distinct summary rows for each crop', () => {
    const summary = calculateCropYieldComparison(sampleJournal, 2026, 2025);
    expect(summary.rows.length).toBe(3); // Tomat, Porgand, Kurk
    const cropNames = summary.rows.map((r) => r.cropName);
    expect(cropNames).toContain('Tomat');
    expect(cropNames).toContain('Porgand');
    expect(cropNames).toContain('Kurk');
  });

  it('extracts unique years correctly for comparison base dropdown', () => {
    const years = extractHarvestYears(sampleJournal);
    expect(years).toContain(2025);
    expect(years).toContain(2026);
    expect(years[0]).toBeGreaterThanOrEqual(years[1]); // Descending order
  });
});
