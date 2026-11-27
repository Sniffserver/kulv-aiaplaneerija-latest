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
    expect(winterAltitude).toBeLessThan(12); // ~7°
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

  it('computes higher max possible daylight hours in midsummer than spring equinox', () => {
    const midsummer = SolarEngine.calculateSunExposureHeatmap({
      yardWidthM: 12,
      yardLengthM: 12,
      lat: tallinnLat,
      seasonId: 'midsummer',
      entities: [],
      resolutionM: 1
    });

    const spring = SolarEngine.calculateSunExposureHeatmap({
      yardWidthM: 12,
      yardLengthM: 12,
      lat: tallinnLat,
      seasonId: 'spring_equinox',
      entities: [],
      resolutionM: 1
    });

    expect(midsummer.maxPossibleHours).toBeGreaterThan(spring.maxPossibleHours);
    expect(midsummer.averageYardSunHours).toBe(midsummer.maxPossibleHours);
    expect(spring.averageYardSunHours).toBe(spring.maxPossibleHours);
  });

  it('reduces sun hours north of a tall house and computes entity footprint exposure', () => {
    const house = {
      x: 4,
      y: 8,
      width: 6,
      length: 4,
      heightM: 5,
      shapeType: 'rectangle' as const,
      shadowCasting: true,
      visible: true
    };

    const heatmap = SolarEngine.calculateSunExposureHeatmap({
      yardWidthM: 14,
      yardLengthM: 16,
      northAngleDeg: 0,
      lat: tallinnLat,
      seasonId: 'spring_equinox',
      entities: [house],
      resolutionM: 0.5
    });

    // Bed right on the north side of the house (smaller Y = North in plan coords when northAngleDeg=0)
    const northBed = SolarEngine.getEntitySunExposure({ x: 5, y: 6.2, width: 2, length: 1.2 }, heatmap);
    // Bed well to the south of the house
    const southBed = SolarEngine.getEntitySunExposure({ x: 5, y: 13.5, width: 2, length: 1.2 }, heatmap);

    expect(northBed.averageHours).toBeLessThan(southBed.averageHours);
    expect(southBed.category).toBe('full_sun');
  });

  it('does not double-count overlapping shadows in the same timestep and respects tree foliage opacity', () => {
    const denseHouse = {
      x: 4,
      y: 8,
      width: 4,
      length: 3,
      heightM: 4,
      shapeType: 'rectangle' as const,
      shadowCasting: true
    };
    const overlappingHouse = { ...denseHouse };

    const singleHeatmap = SolarEngine.calculateSunExposureHeatmap({
      yardWidthM: 12,
      yardLengthM: 12,
      lat: tallinnLat,
      seasonId: 'midsummer',
      entities: [denseHouse],
      resolutionM: 1
    });

    const doubleHeatmap = SolarEngine.calculateSunExposureHeatmap({
      yardWidthM: 12,
      yardLengthM: 12,
      lat: tallinnLat,
      seasonId: 'midsummer',
      entities: [denseHouse, overlappingHouse],
      resolutionM: 1
    });

    expect(doubleHeatmap.averageYardSunHours).toBe(singleHeatmap.averageYardSunHours);

    const dappledTree = {
      x: 4,
      y: 8,
      width: 4,
      length: 4,
      heightM: 4,
      shapeType: 'circle' as const,
      shadowCasting: true,
      foliageOpacity: 0.45
    };
    const treeHeatmap = SolarEngine.calculateSunExposureHeatmap({
      yardWidthM: 12,
      yardLengthM: 12,
      lat: tallinnLat,
      seasonId: 'midsummer',
      entities: [dappledTree],
      resolutionM: 1
    });

    const underTree = SolarEngine.getEntitySunExposure({ x: 5, y: 8.5, width: 2, length: 2 }, treeHeatmap);
    expect(underTree.averageHours).toBeGreaterThan(0);
    expect(underTree.averageHours).toBeLessThan(treeHeatmap.maxPossibleHours);
  });
});
