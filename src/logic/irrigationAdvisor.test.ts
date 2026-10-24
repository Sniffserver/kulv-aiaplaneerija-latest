import { describe, it, expect } from 'vitest';
import { IrrigationAdvisor } from './irrigationAdvisor';
import { DailyForecastItem } from '../types';

describe('IrrigationAdvisor (Smart Water Balance)', () => {
  it('flags urgent watering when 5+ days dry and rain < 3mm', () => {
    const dryForecast: DailyForecastItem[] = [
      {
        date: '2026-05-15',
        dayName: 'Täna',
        tempMax: 22,
        tempMin: 10,
        weatherCode: 1,
        weatherDescription: 'Päikeseline',
        icon: '☀️',
        precipitationSum: 0
      },
      {
        date: '2026-05-16',
        dayName: 'Homme',
        tempMax: 23,
        tempMin: 11,
        weatherCode: 1,
        weatherDescription: 'Päikeseline',
        icon: '☀️',
        precipitationSum: 0
      },
      {
        date: '2026-05-17',
        dayName: 'Pühap',
        tempMax: 24,
        tempMin: 12,
        weatherCode: 0,
        weatherDescription: 'Selge',
        icon: '☀️',
        precipitationSum: 0
      },
      {
        date: '2026-05-18',
        dayName: 'Esmasp',
        tempMax: 23,
        tempMin: 11,
        weatherCode: 0,
        weatherDescription: 'Selge',
        icon: '☀️',
        precipitationSum: 0
      },
      {
        date: '2026-05-19',
        dayName: 'Teisip',
        tempMax: 21,
        tempMin: 10,
        weatherCode: 2,
        weatherDescription: 'Vahelduv',
        icon: '⛅',
        precipitationSum: 0
      }
    ];

    const advice = IrrigationAdvisor.evaluateIrrigation(dryForecast, 'loam');
    expect(advice.level).toBe('urgent');
    expect(advice.consecutiveDryDays).toBe(5);
    expect(advice.recommendedLitersPerM2).toBeGreaterThanOrEqual(10);
    expect(advice.headline).toContain('kasta aeda sügavalt');
  });

  it('detects excess rainfall and advises against outdoor watering', () => {
    const rainyForecast: DailyForecastItem[] = [
      {
        date: '2026-05-15',
        dayName: 'Täna',
        tempMax: 15,
        tempMin: 8,
        weatherCode: 63,
        weatherDescription: 'Vihm',
        icon: '🌧️',
        precipitationSum: 12.0
      },
      {
        date: '2026-05-16',
        dayName: 'Homme',
        tempMax: 14,
        tempMin: 7,
        weatherCode: 65,
        weatherDescription: 'Tugev vihm',
        icon: '🌧️',
        precipitationSum: 15.0
      }
    ];

    const advice = IrrigationAdvisor.evaluateIrrigation(rainyForecast, 'clay');
    expect(advice.level).toBe('excess');
    expect(advice.recommendedLitersPerM2).toBe(0);
    expect(advice.advice).toContain('Avamaapeenrad saavad piisavalt niisutust');
  });
});
