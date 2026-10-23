import { describe, it, expect } from 'vitest';
import { GddEngine, ESTONIAN_CROP_GDD_STANDARDS } from './gddEngine';
import { DailyForecastItem } from '../types';

describe('GddEngine (Growing Degree Days in Estonia)', () => {
  it('calculates daily GDD correctly for base 5°C and base 10°C', () => {
    // High 20°C, low 10°C -> mean 15°C
    expect(GddEngine.calculateDailyGDD(20, 10, 5)).toBe(10);
    expect(GddEngine.calculateDailyGDD(20, 10, 10)).toBe(5);

    // Cold day: high 8°C, low 0°C -> mean 4°C
    expect(GddEngine.calculateDailyGDD(8, 0, 5)).toBe(0);
    expect(GddEngine.calculateDailyGDD(8, 0, 10)).toBe(0);

    // Border day: high 14°C, low 2°C -> mean 8°C
    expect(GddEngine.calculateDailyGDD(14, 2, 5)).toBe(3);
    expect(GddEngine.calculateDailyGDD(14, 2, 10)).toBe(0);
  });

  it('accumulates 7-day forecast GDD accurately', () => {
    const mockForecast: DailyForecastItem[] = [
      { date: '2026-05-15', dayName: 'Täna', tempMax: 20, tempMin: 10, weatherCode: 1, weatherDescription: 'Selge', icon: '☀️', precipitationSum: 0 },
      { date: '2026-05-16', dayName: 'Homme', tempMax: 18, tempMin: 8, weatherCode: 2, weatherDescription: 'Vahelduv', icon: '⛅', precipitationSum: 0 },
      { date: '2026-05-17', dayName: 'Pühap', tempMax: 16, tempMin: 6, weatherCode: 2, weatherDescription: 'Vahelduv', icon: '⛅', precipitationSum: 0 }
    ];

    // Day 1: mean 15 -> GDD5 = 10, GDD10 = 5
    // Day 2: mean 13 -> GDD5 = 8, GDD10 = 3
    // Day 3: mean 11 -> GDD5 = 6, GDD10 = 1
    // Total: GDD5 = 24, GDD10 = 9
    expect(GddEngine.calculateAccumulatedGDD(mockForecast, 5)).toBe(24);
    expect(GddEngine.calculateAccumulatedGDD(mockForecast, 10)).toBe(9);
  });

  it('returns valid crop standards for standard Estonian garden crops', () => {
    const pea = GddEngine.getCropStandard('hernes');
    expect(pea.baseTemp).toBe(5);
    expect(pea.targetGdd).toBe(ESTONIAN_CROP_GDD_STANDARDS.hernes.targetGdd);

    const tomato = GddEngine.getCropStandard('tomat');
    expect(tomato.baseTemp).toBe(10);
    expect(tomato.targetGdd).toBe(ESTONIAN_CROP_GDD_STANDARDS.tomat.targetGdd);
  });

  it('provides actionable agricultural thermal evaluation for 7-day outlook', () => {
    const mockForecast: DailyForecastItem[] = [
      { date: '2026-05-15', dayName: 'Täna', tempMax: 14, tempMin: 2, weatherCode: 1, weatherDescription: 'Selge', icon: '☀️', precipitationSum: 0 }
    ];

    const evaluation = GddEngine.evaluate7DayThermalGrowth(mockForecast);
    expect(typeof evaluation.gdd5).toBe('number');
    expect(typeof evaluation.gdd10).toBe('number');
    expect(evaluation.summary.length).toBeGreaterThan(0);
    expect(evaluation.advice.length).toBeGreaterThan(0);
  });
});
