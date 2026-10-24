import { JournalEntry } from '../types';

export interface CropYieldRow {
  cropName: string;
  currentYearKg: number;
  compareYearKg: number | null; // null if crop had no records in compare year
  diffPercentage: number | null; // null if not present in compare year or base was 0
  diffText: string; // e.g. "+25% rohkem", "-10% vähem", "—" (when not grown in previous year)
}

export interface YearHarvestComparisonSummary {
  currentYear: number;
  compareYear: number;
  availableYears: number[];
  rows: CropYieldRow[];
  totalCurrentKg: number;
  totalCompareKg: number;
}

/**
 * Extracts all unique years from harvest journal entries plus sensible defaults.
 */
export function extractHarvestYears(journal: JournalEntry[]): number[] {
  const years = new Set<number>();
  const nowYear = new Date().getFullYear();
  years.add(nowYear);
  years.add(nowYear - 1);

  for (const entry of journal) {
    if (entry.category === 'harvest' && entry.date) {
      const y = parseInt(entry.date.substring(0, 4), 10);
      if (!isNaN(y)) {
        years.add(y);
      }
    }
  }

  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Calculates per-crop year-over-year harvest comparison.
 * Rules:
 * 1. Base comparison year is user-selectable (defaults to previous year).
 * 2. If a crop was not harvested/recorded in the comparison year, diffText is "—", NEVER "0%".
 * 3. Percentage differences ("X% rohkem" / "X% vähem") are calculated per specific crop, NOT aggregated total.
 * 4. Distinct rows are returned for every crop for a transparent season summary.
 */
export function calculateCropYieldComparison(
  journal: JournalEntry[],
  currentYear: number,
  compareYear: number
): YearHarvestComparisonSummary {
  const harvestEntries = journal.filter((e) => e.category === 'harvest');

  const toKg = (amount?: number | null, unit?: string | null): number => {
    if (!amount || isNaN(amount)) return 0;
    if (unit === 'g') return amount / 1000;
    return amount;
  };

  const currentCropMap = new Map<string, number>();
  const compareCropMap = new Map<string, number>();

  for (const entry of harvestEntries) {
    if (!entry.date) continue;
    const year = parseInt(entry.date.substring(0, 4), 10);
    const crop = entry.plantName || entry.title || 'Määramata kultuur';
    const kg = toKg(entry.yieldAmount, entry.yieldUnit);

    if (year === currentYear) {
      currentCropMap.set(crop, (currentCropMap.get(crop) || 0) + kg);
    } else if (year === compareYear) {
      compareCropMap.set(crop, (compareCropMap.get(crop) || 0) + kg);
    }
  }

  const allCrops = new Set<string>([...currentCropMap.keys(), ...compareCropMap.keys()]);
  const rows: CropYieldRow[] = [];

  for (const crop of allCrops) {
    const currentKg = Math.round((currentCropMap.get(crop) || 0) * 100) / 100;
    const hasInCompare = compareCropMap.has(crop);
    const compareKg = hasInCompare ? Math.round((compareCropMap.get(crop) || 0) * 100) / 100 : null;

    let diffPercentage: number | null = null;
    let diffText = '—';

    if (compareKg !== null && compareKg > 0) {
      diffPercentage = Math.round(((currentKg - compareKg) / compareKg) * 100);
      if (diffPercentage > 0) {
        diffText = `+${diffPercentage}% rohkem`;
      } else if (diffPercentage < 0) {
        diffText = `${diffPercentage}% vähem`;
      } else {
        diffText = '0%';
      }
    } else if (compareKg === 0 && currentKg > 0) {
      diffText = 'Uus saak';
    } else {
      // Not present in comparison year: strictly "—", not "0%"
      diffText = '—';
    }

    rows.push({
      cropName: crop,
      currentYearKg: currentKg,
      compareYearKg: compareKg,
      diffPercentage,
      diffText
    });
  }

  // Sort by current year yield descending
  rows.sort((a, b) => b.currentYearKg - a.currentYearKg);

  const totalCurrentKg = Math.round(Array.from(currentCropMap.values()).reduce((sum, v) => sum + v, 0) * 100) / 100;
  const totalCompareKg = Math.round(Array.from(compareCropMap.values()).reduce((sum, v) => sum + v, 0) * 100) / 100;

  return {
    currentYear,
    compareYear,
    availableYears: extractHarvestYears(journal),
    rows,
    totalCurrentKg,
    totalCompareKg
  };
}
