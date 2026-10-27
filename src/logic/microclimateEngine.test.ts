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

  it('handles empty or missing samples by returning the baseline regional standard profile', () => {
    const emptyProfile = MicroclimateEngine.calculateProfile([]);
    expect(emptyProfile.terrainClassification).toBe('standard');
    expect(emptyProfile.averageNightOffset).toBe(0.0);
    expect(emptyProfile.samplesCount).toBe(0);
    expect(emptyProfile.name).toContain('Kalibreerimata');

    const nullProfile = MicroclimateEngine.calculateProfile(null as any);
    expect(nullProfile.terrainClassification).toBe('standard');
  });

  it('identifies sheltered slope terrain when offset is moderate positive (+1.2°C to +2.9°C)', () => {
    const samples: MicroclimateSample[] = [
      { id: '1', date: '2026-05-15', forecastMin: 2, measuredMin: 3.8, offset: 1.8, environment: 'open_bed' },
      { id: '2', date: '2026-05-16', forecastMin: 3, measuredMin: 4.6, offset: 1.6, environment: 'open_bed' }
    ];

    const profile = MicroclimateEngine.calculateProfile(samples);
    expect(profile.terrainClassification).toBe('sheltered');
    expect(profile.averageNightOffset).toBe(1.7);
    expect(profile.name).toContain('Tuulevarjuline');
    expect(profile.lastCalibratedDate).toBe('2026-05-16');
  });

  it('identifies standard terrain when local readings closely match forecast (-1.7°C to +1.1°C)', () => {
    const samples: MicroclimateSample[] = [
      { id: '1', date: '2026-05-18', forecastMin: 5, measuredMin: 5.2, offset: 0.2, environment: 'open_bed' },
      { id: '2', date: '2026-05-19', forecastMin: 6, measuredMin: 5.6, offset: -0.4, environment: 'open_bed' }
    ];

    const profile = MicroclimateEngine.calculateProfile(samples);
    expect(profile.terrainClassification).toBe('standard');
    expect(profile.averageNightOffset).toBe(-0.1);
    expect(profile.name).toContain('Tavapärane');
  });

  it('saves and loads profile via localStorage with resilient fallback', () => {
    const testProfile = MicroclimateEngine.calculateProfile([
      { id: '1', date: '2026-05-20', forecastMin: 4, measuredMin: 7.5, offset: 3.5, environment: 'greenhouse' }
    ]);

    MicroclimateEngine.saveProfile(testProfile);
    const loaded = MicroclimateEngine.loadProfile();

    expect(loaded.terrainClassification).toBe('greenhouse');
    expect(loaded.averageNightOffset).toBe(3.5);
  });
});
