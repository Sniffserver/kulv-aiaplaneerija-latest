import { describe, it, expect } from 'vitest';
import { SolarEngine } from './solarEngine';

describe('SolarEngine', () => {
  const tallinnLat = 59.437;

  it('calculates midsummer daylight hours around 18.5h in Estonia (day ~172)', () => {
    const hours = SolarEngine.calculateDaylightHours(tallinnLat, 172);
    expect(hours).toBeGreaterThanOrEqual(18.0);
    expect(hours).toBeLessThanOrEqual(19.0);
  });

  it('calculates midwinter daylight hours around 5.7h in Estonia (day ~355)', () => {
    const hours = SolarEngine.calculateDaylightHours(tallinnLat, 355);
    expect(hours).toBeGreaterThanOrEqual(5.5);
    expect(hours).toBeLessThanOrEqual(6.5);
  });

  it('calculates solar noon altitude peaks in midsummer and bottoms in midwinter', () => {
    const summerAltitude = SolarEngine.calculateSolarNoonAltitude(tallinnLat, 172);
    const winterAltitude = SolarEngine.calculateSolarNoonAltitude(tallinnLat, 355);
    expect(summerAltitude).toBeGreaterThan(50); // ~54°
    expect(winterAltitude).toBeLessThan(12);    // ~7°
  });

  it('calculates longer shadows at lower solar altitudes', () => {
    const shadowHighSun = SolarEngine.calculateShadowLength(2.0, 50.0);
    const shadowLowSun = SolarEngine.calculateShadowLength(2.0, 15.0);
    expect(shadowLowSun).toBeGreaterThan(shadowHighSun);
  });

  it('calculates and memoizes shadow displacement vector', () => {
    const vector1 = SolarEngine.getCachedShadowVector(2.0, 45.0, 180);
    const vector2 = SolarEngine.getCachedShadowVector(2.0, 45.0, 180);
    expect(vector1.length).toBeGreaterThan(0);
    expect(vector1).toBe(vector2); // Same memoized reference
  });

  it('accurately computes known solar position for Tallinn on 21.06 (solstice): solar noon altitude ~54° and azimuth ~180°', () => {
    // 21. June = day 172 of the year
    const altitude = SolarEngine.calculateSolarNoonAltitude(tallinnLat, 172);
    expect(altitude).toBeGreaterThanOrEqual(53.5);
    expect(altitude).toBeLessThanOrEqual(54.5);

    // Midday solar azimuth is due South (180°)
    const noonAzimuth = 180.0;
    const shadowVector = SolarEngine.getCachedShadowVector(1.0, altitude, noonAzimuth);
    // At azimuth 180° (South), shadow points directly North (dy < 0, dx ~ 0)
    expect(Math.abs(shadowVector.dx)).toBeLessThan(0.001);
    expect(shadowVector.dy).toBeLessThan(0);
  });

  it('calculates exact diurnal sun positions (calculateSunPosition)', () => {
    // Tallinn midsummer solar noon
    const noon = SolarEngine.calculateSunPosition(tallinnLat, 172, 12);
    expect(noon.isAboveHorizon).toBe(true);
    expect(noon.altitudeDeg).toBeGreaterThan(53);
    expect(noon.altitudeDeg).toBeLessThan(55);
    expect(noon.azimuthDeg).toBe(180);

    // Morning sun has azimuth in Eastern hemisphere (< 180°)
    const morning = SolarEngine.calculateSunPosition(tallinnLat, 172, 8);
    expect(morning.isAboveHorizon).toBe(true);
    expect(morning.azimuthDeg).toBeLessThan(180);

    // Evening sun has azimuth in Western hemisphere (> 180°)
    const evening = SolarEngine.calculateSunPosition(tallinnLat, 172, 18);
    expect(evening.isAboveHorizon).toBe(true);
    expect(evening.azimuthDeg).toBeGreaterThan(180);
  });
});

