import { describe, it, expect } from 'vitest';
import { MicroclimateEngine, MicroclimateSample } from './microclimateEngine';

describe('MicroclimateEngine (Local Sensor Calibration)', () => {
  it('identifies a frost pocket when measured temperatures are consistently lower than forecast', () => {
    const samples: MicroclimateSample[] = [
      { id: '1', date: '2026-05-10', forecastMin: 4, measuredMin: 1.5, offset: -2.5, environment: 'open_bed' },
      { id: '2', date: '2026-05-11', forecastMin: 5, measuredMin: 3.0, offset: -2.0, environment: 'open_bed' },
      { id: '3', date: '2026-05-12', forecastMin: 2, measuredMin: -0.5, offset: -2.5, environment: 'open_bed' }
    ];

    const profile = MicroclimateEngine.calculateProfile(samples);
    expect(profile.terrainClassification).toBe('frost_pocket');
    expect(profile.averageNightOffset).toBeLessThanOrEqual(-2.0);
    expect(profile.name).toContain('Külmalohk');
  });

  it('adjusts night temperature accurately using the learned offset', () => {
    // When Open-Meteo predicts +3°C, but local frost pocket has -2.3°C offset:
    const adjusted = MicroclimateEngine.adjustNightTemperature(3.0, -2.3);
    expect(adjusted).toBe(0.7); // Dangerous frost territory!
  });

  it('recognizes greenhouse buffered microclimate with positive offset', () => {
    const samples: MicroclimateSample[] = [
      { id: '1', date: '2026-05-10', forecastMin: 3, measuredMin: 7, offset: 4.0, environment: 'greenhouse' },
      { id: '2', date: '2026-05-11', forecastMin: 2, measuredMin: 6, offset: 4.0, environment: 'greenhouse' }
    ];

    const profile = MicroclimateEngine.calculateProfile(samples);
    expect(profile.terrainClassification).toBe('greenhouse');
    expect(profile.averageNightOffset).toBe(4.0);
  });
});
