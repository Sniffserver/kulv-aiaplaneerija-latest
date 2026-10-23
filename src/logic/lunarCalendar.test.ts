import { describe, it, expect } from 'vitest';
import { LunarCalendar } from './lunarCalendar';

describe('LunarCalendar & Biodynamic Engine', () => {
  it('calculates valid moon phase with name and icon', () => {
    const today = new Date('2026-05-15T12:00:00Z');
    const phase = LunarCalendar.getMoonPhase(today);

    expect(phase.phaseValue).toBeGreaterThanOrEqual(0);
    expect(phase.phaseValue).toBeLessThanOrEqual(1);
    expect(typeof phase.name).toBe('string');
    expect(typeof phase.icon).toBe('string');
    expect(typeof phase.advice).toBe('string');
  });

  it('calculates biodynamic element day (root, leaf, flower, fruit)', () => {
    const date = new Date('2026-05-15T12:00:00Z');
    const bio = LunarCalendar.getBiodynamicDay(date);

    expect(['root', 'leaf', 'flower', 'fruit']).toContain(bio.element);
    expect(bio.bestCrops.length).toBeGreaterThan(0);
    expect(typeof bio.constellation).toBe('string');
  });

  it('generates a 7-day lunar schedule for weather integration', () => {
    const schedule = LunarCalendar.get7DayLunarSchedule(new Date('2026-05-15T12:00:00Z'));
    expect(schedule.length).toBe(7);
    expect(schedule[0].dayName).toBe('Täna');
    expect(schedule[1].dayName).toBe('Homme');
    expect(schedule[0].biodynamic.elementName).toBeDefined();
  });
});
