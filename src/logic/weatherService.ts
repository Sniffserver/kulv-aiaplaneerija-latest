import { WeatherInfo, DailyForecastItem, WeatherAlert } from '../types';

export function mapWmoCode(code: number): { description: string; icon: string } {
  switch (code) {
    case 0:
      return { description: 'Selge taevas', icon: '☀️' };
    case 1:
      return { description: 'Peamiselt selge', icon: '🌤️' };
    case 2:
      return { description: 'Vahelduv pilvisus', icon: '⛅' };
    case 3:
      return { description: 'Pilves', icon: '☁️' };
    case 45:
    case 48:
      return { description: 'Udu ja härmatis', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { description: 'Kerge uduvihm', icon: '🌦️' };
    case 56:
    case 57:
      return { description: 'Külmuv uduvihm', icon: '🌧️' };
    case 61:
      return { description: 'Nõrk vihmasadu', icon: '🌦️' };
    case 63:
      return { description: 'Mõõdukas vihmasadu', icon: '🌧️' };
    case 65:
      return { description: 'Tugev vihmasadu', icon: '🌧️' };
    case 66:
    case 67:
      return { description: 'Jäätuv vihm', icon: '🌨️' };
    case 71:
      return { description: 'Kerge lumesadu', icon: '🌨️' };
    case 73:
      return { description: 'Mõõdukas lumesadu', icon: '❄️' };
    case 75:
      return { description: 'Tugev lumesadu', icon: '❄️' };
    case 77:
      return { description: 'Lumeterad', icon: '🌨️' };
    case 80:
    case 81:
      return { description: 'Hoovihm', icon: '🌦️' };
    case 82:
      return { description: 'Tugev paduvihm', icon: '🌧️' };
    case 85:
    case 86:
      return { description: 'Lumehood', icon: '🌨️' };
    case 95:
      return { description: 'Äike', icon: '⛈️' };
    case 96:
    case 99:
      return { description: 'Äikesevihm rahega', icon: '⛈️' };
    default:
      return { description: 'Vahelduv ilm', icon: '⛅' };
  }
}

function getEstonianDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Täna';
  if (index === 1) return 'Homme';

  const date = new Date(dateStr);
  const days = ['Pühap', 'Esmasp', 'Teisip', 'Kolmap', 'Neljap', 'Reede', 'Laup'];
  return days[date.getDay()] || dateStr;
}

const weatherMemoryCache = new Map<string, { timestamp: number; data: WeatherInfo }>();
export const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function fetchLiveWeather(
  lat: number,
  lng: number,
  locationName: string,
  forceRefresh = false
): Promise<WeatherInfo> {
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

  if (!forceRefresh) {
    const memCached = weatherMemoryCache.get(cacheKey);
    if (memCached && Date.now() - memCached.timestamp < WEATHER_CACHE_TTL_MS) {
      return { ...memCached.data, locationName };
    }

    try {
      if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem(`kulv_weather_${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Date.now() - parsed.timestamp < WEATHER_CACHE_TTL_MS) {
            weatherMemoryCache.set(cacheKey, parsed);
            return { ...parsed.data, locationName };
          }
        }
      }
    } catch {}
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_min,precipitation_sum,precipitation_probability_max&hourly=temperature_2m&forecast_days=7&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo response not ok: ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const wmo = mapWmoCode(current.weather_code ?? 2);

    const dailyForecast: DailyForecastItem[] = [];
    if (daily && daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const code = daily.weather_code?.[i] ?? 2;
        const codeInfo = mapWmoCode(code);
        const tempMax = Math.round(daily.temperature_2m_max?.[i] ?? 18);
        const tempMin = Math.round(daily.temperature_2m_min?.[i] ?? 8);
        const apparentTempMin =
          daily.apparent_temperature_min?.[i] != null ? Math.round(daily.apparent_temperature_min[i]) : undefined;
        const precipitationProbability =
          daily.precipitation_probability_max?.[i] != null
            ? Math.round(daily.precipitation_probability_max[i])
            : undefined;

        const effectiveMin = apparentTempMin != null ? Math.min(tempMin, apparentTempMin) : tempMin;
        let frostRisk: 'none' | 'light' | 'moderate' | 'severe' = 'none';
        if (effectiveMin <= -2) {
          frostRisk = 'severe';
        } else if (effectiveMin <= 0) {
          frostRisk = 'moderate';
        } else if (effectiveMin <= 3) {
          frostRisk = 'light';
        }

        dailyForecast.push({
          date: daily.time[i],
          dayName: getEstonianDayName(daily.time[i], i),
          tempMax,
          tempMin,
          apparentTempMin,
          precipitationProbability,
          frostRisk,
          weatherCode: code,
          weatherDescription: codeInfo.description,
          icon: codeInfo.icon,
          precipitationSum: Math.round((daily.precipitation_sum?.[i] ?? 0) * 10) / 10
        });
      }
    }

    // Sample hourly forecast every 3 hours
    const hourlyForecast = [];
    if (hourly && hourly.time && hourly.temperature_2m) {
      for (let i = 0; i < Math.min(hourly.time.length, 56); i += 3) {
        const tStr = hourly.time[i]; // e.g. "2026-05-15T12:00"
        const dateObj = new Date(tStr);
        const dayPrefix = ['P', 'E', 'T', 'K', 'N', 'R', 'L'][dateObj.getDay()];
        const hourStr = dateObj.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' });
        hourlyForecast.push({
          time: `${dayPrefix} ${hourStr}`,
          hour: hourStr,
          temp: Math.round(hourly.temperature_2m[i] * 10) / 10
        });
      }
    }

    // Evaluate 7-day agricultural frost, heat and precipitation warnings
    const alerts: WeatherAlert[] = [];
    const severeFrostDays = dailyForecast.filter((d) => d.tempMin <= 0);
    const lightFrostDays = dailyForecast.filter((d) => d.tempMin > 0 && d.tempMin <= 3);
    const lowestUpcomingNightTemp =
      dailyForecast.length > 0 ? Math.min(...dailyForecast.map((d) => d.tempMin)) : Math.round(current.temperature_2m);
    const frostRiskDaysCount = severeFrostDays.length + lightFrostDays.length;

    if (severeFrostDays.length > 0) {
      const frostDates = severeFrostDays.map((d) => `${d.dayName} (${d.tempMin}°C)`).join(', ');
      alerts.push({
        id: 'frost_freeze_7d',
        title: `❄️ Öökülmaoht tuvastatud (${severeFrostDays.length} ööl)`,
        severity: 'danger',
        advice: `Prognoositav öine temperatuur langeb miinustesse: ${frostDates}. Ära istuta avamaale soojust armastavaid kultuure (tomat, kurk, kõrvits, basiilik). Kasvuhoone uksed sulgeda ja peenardel kasutada katteloori!`,
        affectedCrops: 'Tomat, kurk, basiilik, suvikõrvits, paprika, oad'
      });
    } else if (lightFrostDays.length > 0) {
      const frostDates = lightFrostDays.map((d) => `${d.dayName} (+${d.tempMin}°C)`).join(', ');
      alerts.push({
        id: 'frost_warning_7d',
        title: `⚠️ Hallaoht lähinädalal (${lightFrostDays.length} ööl)`,
        severity: 'warning',
        advice: `Öine temperatuur võib langeda maapinna lähedal kriitilise piirini: ${frostDates}. Hoida katteloorid kasvuhoones ja peenardel käepärast.`,
        affectedCrops: 'Tomat, kurk, basiilik, kõrvitsalised, noored idud'
      });
    } else {
      alerts.push({
        id: 'frost_safe_window_7d',
        title: '🌱 Soodne öökülmavaba nädal',
        severity: 'info',
        advice: `Kõik 7 eelseisvat ööd püsivad prognoosi järgi üle +4°C (madalaim ${lowestUpcomingNightTemp}°C). Soodne periood istikute karastamiseks ja peenrasse istutamiseks.`,
        affectedCrops: 'Kõik aia- ja kasvuhoonetaimed'
      });
    }

    const maxUpcomingTemp =
      dailyForecast.length > 0 ? Math.max(...dailyForecast.map((d) => d.tempMax)) : current.temperature_2m;

    if (maxUpcomingTemp >= 28) {
      alerts.push({
        id: 'heat_warning',
        title: 'Kuumalaine aias',
        severity: 'warning',
        advice: `Päevane temperatuur ulatub ${maxUpcomingTemp}°C-ni. Kasta varahommikul või hilisõhtul ning taga kasvuhoone rohke tuulutus.`,
        affectedCrops: 'Kasvuhoonetaimed, lehtsalat, hernes'
      });
    }

    const tips: string[] = [];
    if (severeFrostDays.length > 0) {
      tips.push(
        'Öökülmaohu korral: kasta mulda kergelt enne õhtut, sest niiske pinnas hoiab soojust paremini kui kuiv muld.'
      );
    } else if (current.relative_humidity_2m > 75) {
      tips.push('Kõrge õhuniiskus soodustab seenhaigusi – taga kasvuhoones hea õhuvahetus.');
    } else {
      tips.push('Päikeseline ilm sobib hästi peenarde rohimiseks ja mulla kobestamiseks.');
    }

    if (dailyForecast[0]?.precipitationSum && dailyForecast[0].precipitationSum > 5) {
      tips.push(`Täna on oodata sademeid (${dailyForecast[0].precipitationSum} mm) – vihmavesi täidab vihmaveetünnid!`);
    } else {
      tips.push('Kuival perioodil kasta sügavalt ja harvemini, et juured areneksid sügavamale.');
    }

    const result: WeatherInfo = {
      locationName,
      lat,
      lng,
      temperature: Math.round(current.temperature_2m * 10) / 10,
      apparentTemperature: Math.round((current.apparent_temperature ?? current.temperature_2m) * 10) / 10,
      tempMax: dailyForecast[0]?.tempMax ?? Math.round(current.temperature_2m + 3),
      tempMin: dailyForecast[0]?.tempMin ?? Math.round(current.temperature_2m - 5),
      relativeHumidity: Math.round(current.relative_humidity_2m ?? 65),
      precipitation: Math.round((current.precipitation ?? 0) * 10) / 10,
      windSpeed: Math.round((current.wind_speed_10m ?? 3.5) * 10) / 10,
      weatherCode: current.weather_code ?? 2,
      weatherDescription: wmo.description,
      icon: wmo.icon,
      alerts,
      tips,
      dailyForecast,
      hourlyForecast,
      frostRiskDaysCount,
      lowestUpcomingNightTemp,
      isLive: true,
      lastUpdated: new Date().toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' })
    };

    // Save in cache
    const cacheEntry = { timestamp: Date.now(), data: result };
    weatherMemoryCache.set(cacheKey, cacheEntry);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(`kulv_weather_${cacheKey}`, JSON.stringify(cacheEntry));
      }
    } catch {}

    return result;
  } catch {
    // Check if we have stale cache before resorting to generic fallback
    const stale = weatherMemoryCache.get(cacheKey);
    if (stale) {
      return { ...stale.data, locationName, isLive: false };
    }
    // Fallback based on latitude and seasonal simulation
    return getFallbackWeather(lat, lng, locationName);
  }
}

export function getFallbackWeather(lat: number, lng: number, locationName: string): WeatherInfo {
  const simulatedTemp = 16.5;
  const fallbackDaily: DailyForecastItem[] = [
    {
      date: '2026-05-15',
      dayName: 'Täna',
      tempMax: 19,
      tempMin: 8,
      apparentTempMin: 7,
      precipitationProbability: 10,
      frostRisk: 'none',
      weatherCode: 2,
      weatherDescription: 'Vahelduv pilvisus',
      icon: '⛅',
      precipitationSum: 0.0
    },
    {
      date: '2026-05-16',
      dayName: 'Homme',
      tempMax: 20,
      tempMin: 9,
      apparentTempMin: 8,
      precipitationProbability: 5,
      frostRisk: 'none',
      weatherCode: 1,
      weatherDescription: 'Peamiselt selge',
      icon: '🌤️',
      precipitationSum: 0.0
    },
    {
      date: '2026-05-17',
      dayName: 'Pühap',
      tempMax: 18,
      tempMin: 7,
      apparentTempMin: 6,
      precipitationProbability: 60,
      frostRisk: 'none',
      weatherCode: 61,
      weatherDescription: 'Nõrk vihmasadu',
      icon: '🌦️',
      precipitationSum: 3.2
    },
    {
      date: '2026-05-18',
      dayName: 'Esmasp',
      tempMax: 15,
      tempMin: 2,
      apparentTempMin: 1,
      precipitationProbability: 20,
      frostRisk: 'light',
      weatherCode: 2,
      weatherDescription: 'Vahelduv pilvisus, jahe öö',
      icon: '⛅',
      precipitationSum: 0.5
    },
    {
      date: '2026-05-19',
      dayName: 'Teisip',
      tempMax: 14,
      tempMin: -1,
      apparentTempMin: -2,
      precipitationProbability: 0,
      frostRisk: 'moderate',
      weatherCode: 0,
      weatherDescription: 'Selge ja öökülmaoht',
      icon: '☀️',
      precipitationSum: 0.0
    },
    {
      date: '2026-05-20',
      dayName: 'Kolmap',
      tempMax: 17,
      tempMin: 4,
      apparentTempMin: 3,
      precipitationProbability: 15,
      frostRisk: 'none',
      weatherCode: 2,
      weatherDescription: 'Vahelduv pilvisus',
      icon: '⛅',
      precipitationSum: 0.0
    },
    {
      date: '2026-05-21',
      dayName: 'Neljap',
      tempMax: 21,
      tempMin: 10,
      apparentTempMin: 9,
      precipitationProbability: 5,
      frostRisk: 'none',
      weatherCode: 0,
      weatherDescription: 'Päikeseline ja soe',
      icon: '☀️',
      precipitationSum: 0.0
    }
  ];

  return {
    locationName,
    lat,
    lng,
    temperature: simulatedTemp,
    apparentTemperature: 15.8,
    tempMax: 19.0,
    tempMin: 8.5,
    relativeHumidity: 68,
    precipitation: 0.0,
    windSpeed: 3.8,
    weatherCode: 2,
    weatherDescription: 'Vahelduv pilvisus, soodne aiatöödeks',
    icon: '⛅',
    alerts: [
      {
        id: 'a1',
        title: '❄️ Öökülma oht teisipäeval (-1°C)',
        severity: 'danger',
        advice:
          'Prognoosis on teisipäeva öösel miinuskraadid. Hoida katteloorid kasvuhoones käepärast ja ära istuta avamaale soojust nõudvaid taimi!',
        affectedCrops: 'Tomat, kurk, basiilik, kõrvitsalised'
      }
    ],
    tips: [
      'Kasta peenraid varahommikul, et vältida liigset aurustumist ja seenhaigusi.',
      'Õhuta kasvuhoonet keskpäeval, kui temperatuur ületab 24°C.'
    ],
    dailyForecast: fallbackDaily,
    hourlyForecast: [
      { time: 'Täna 09:00', hour: '09:00', temp: 13.2 },
      { time: 'Täna 12:00', hour: '12:00', temp: 17.5 },
      { time: 'Täna 15:00', hour: '15:00', temp: 19.0 },
      { time: 'Täna 18:00', hour: '18:00', temp: 16.4 },
      { time: 'Täna 21:00', hour: '21:00', temp: 12.1 },
      { time: 'Homme 00:00', hour: '00:00', temp: 9.8 },
      { time: 'Homme 03:00', hour: '03:00', temp: 8.5 },
      { time: 'Homme 06:00', hour: '06:00', temp: 10.2 },
      { time: 'Homme 09:00', hour: '09:00', temp: 14.8 },
      { time: 'Homme 12:00', hour: '12:00', temp: 19.5 },
      { time: 'Homme 15:00', hour: '15:00', temp: 20.0 },
      { time: 'Homme 18:00', hour: '18:00', temp: 17.0 }
    ],
    frostRiskDaysCount: 2,
    lowestUpcomingNightTemp: -1,
    isLive: false,
    lastUpdated: new Date().toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' })
  };
}
