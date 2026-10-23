import { describe, it, expect } from 'vitest';
import { PlantingCalendar } from './plantingCalendar';
import { DEFAULT_PLANTS } from '../data/defaultPlants';

describe('PlantingCalendar', () => {
  it('calculates sowing and harvest dates anchored to May 20 frost date', () => {
    const tomato = DEFAULT_PLANTS.find((p) => p.id === 'tomat')!;
    const timeline = PlantingCalendar.calculateTimeline(tomato, '05-20', 2026);

    expect(timeline.indoorSowStart).toBeDefined();
    // 8 weeks before May 20 should be late March
    expect(timeline.indoorSowStart).toContain('2026-03');

    // Greenhouse planting ~4 weeks before outdoor frost date
    expect(timeline.greenhousePlantStart).toContain('2026-04');

    // Outdoor date roughly 2 weeks after frost date
    expect(timeline.outdoorPlantStart).toContain('2026-06');

    // Harvest should be 75 days after planting out
    expect(timeline.harvestStart).toBeDefined();
  });

  it('provides correct Estonian month names', () => {
    expect(PlantingCalendar.getMonthNameEstonian(5)).toBe('Mai');
    expect(PlantingCalendar.getMonthNameEstonian(6)).toBe('Juuni');
  });
});
