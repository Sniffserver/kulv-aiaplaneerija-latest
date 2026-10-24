import { describe, it, expect } from 'vitest';
import { mapWmoCode, getFallbackWeather } from './weatherService';

describe('WeatherService & Meteorological Warnings', () => {
  it('correctly maps WMO weather codes to Estonian descriptions and icons', () => {
    const clear = mapWmoCode(0);
    expect(clear.description).toBe('Selge taevas');
    expect(clear.icon).toBe('☀️');

    const rain = mapWmoCode(63);
    expect(rain.description).toBe('Mõõdukas vihmasadu');
    expect(rain.icon).toBe('🌧️');

    const thunder = mapWmoCode(95);
    expect(thunder.description).toBe('Äike');
    expect(thunder.icon).toBe('⛈️');

    const snow = mapWmoCode(73);
    expect(snow.description).toBe('Mõõdukas lumesadu');
    expect(snow.icon).toBe('❄️');
  });

  it('generates a reliable offline fallback weather model with 7-day forecasts and frost risk data', () => {
    const fallback = getFallbackWeather(59.437, 24.754, 'Tallinn');

    expect(fallback.locationName).toBe('Tallinn');
    expect(fallback.lat).toBe(59.437);
    expect(fallback.lng).toBe(24.754);
    expect(typeof fallback.temperature).toBe('number');
    expect(typeof fallback.relativeHumidity).toBe('number');
    expect(fallback.dailyForecast?.length).toBe(7);
    expect(fallback.hourlyForecast?.length ?? 0).toBeGreaterThan(0);
    expect(fallback.isLive).toBe(false);

    // Verify frost risk detection on the 7-day forecast
    const frostDays = fallback.dailyForecast?.filter((d) => d.frostRisk && d.frostRisk !== 'none');
    expect(frostDays?.length).toBeGreaterThan(0);
    expect(fallback.lowestUpcomingNightTemp).toBeDefined();
  });

  it('provides agricultural tips and formatted last updated timestamp', () => {
    const fallback = getFallbackWeather(58.378, 26.729, 'Tartu');
    expect(fallback.tips.length).toBeGreaterThan(0);
    expect(typeof fallback.lastUpdated).toBe('string');
  });

  it('fetchLiveWeather returns valid weather model and supports caching/fallback', async () => {
    const { fetchLiveWeather } = await import('./weatherService');
    const result1 = await fetchLiveWeather(59.437, 24.754, 'Tallinn');
    expect(result1.locationName).toBe('Tallinn');
    expect(result1.dailyForecast?.length).toBe(7);

    // Second call should quickly return from cache
    const result2 = await fetchLiveWeather(59.437, 24.754, 'Tallinn', false);
    expect(result2.dailyForecast?.length).toBe(7);
  });
});
