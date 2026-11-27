import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapWmoCode, getFallbackWeather, fetchLiveWeather, resetWeatherServiceState } from './weatherService';

const mockOpenMeteoPayload = {
  current: {
    temperature_2m: 15.2,
    relative_humidity_2m: 62,
    apparent_temperature: 14.5,
    precipitation: 0,
    weather_code: 1,
    wind_speed_10m: 4.1
  },
  daily: {
    time: ['2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21'],
    weather_code: [1, 2, 0, 1, 2, 3, 1],
    temperature_2m_max: [18, 19, 20, 17, 16, 15, 19],
    temperature_2m_min: [7, 8, 9, 5, 4, 6, 8],
    apparent_temperature_min: [6, 7, 8, 4, 3, 5, 7],
    precipitation_sum: [0, 0, 0, 0.4, 1.2, 0.5, 0],
    precipitation_probability_max: [10, 15, 5, 25, 40, 20, 10]
  },
  hourly: {
    time: ['2026-05-15T09:00', '2026-05-15T12:00', '2026-05-15T15:00'],
    temperature_2m: [12.1, 14.9, 15.2]
  }
};

describe('WeatherService & Meteorological Warnings', () => {
  beforeEach(() => {
    resetWeatherServiceState();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it('coalesces concurrent live weather fetches for identical coordinates', async () => {
    let resolveFetch!: (res: Response) => void;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const p1 = fetchLiveWeather(59.437, 24.754, 'Tallinn');
    const p2 = fetchLiveWeather(59.437, 24.754, 'Kalamaja');

    resolveFetch(
      new Response(JSON.stringify(mockOpenMeteoPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r1.isLive).toBe(true);
    expect(r1.locationName).toBe('Tallinn');
    expect(r2.locationName).toBe('Kalamaja');
  });

  it('backs off after HTTP 429 and serves stale session cache during cooldown', async () => {
    const staleEntry = {
      timestamp: Date.now() - 60 * 60 * 1000, // older than 15m TTL
      data: {
        ...getFallbackWeather(58.378, 26.729, 'Tartu'),
        temperature: 17.4,
        isLive: true
      }
    };
    sessionStorage.setItem('kulv_weather_58.38_26.73', JSON.stringify(staleEntry));

    const fetchMock = vi.fn().mockResolvedValue(
      new Response('Too many requests', {
        status: 429,
        headers: { 'Retry-After': '120' }
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const firstAttempt = await fetchLiveWeather(58.378, 26.729, 'Tartu', true);
    expect(firstAttempt.temperature).toBe(17.4);
    expect(firstAttempt.isLive).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second forced attempt during cooldown skips network entirely
    const secondAttempt = await fetchLiveWeather(58.378, 26.729, 'Tartu', true);
    expect(secondAttempt.temperature).toBe(17.4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
