export type SolarSeasonPresetId = 'midsummer' | 'late_summer' | 'spring_equinox' | 'autumn_equinox';

export interface SolarSeasonPreset {
  id: SolarSeasonPresetId;
  dayOfYear: number;
  labelEt: string;
  labelEn: string;
  dateStr: string;
  descriptionEt: string;
  descriptionEn: string;
}

export const SOLAR_SEASON_PRESETS: SolarSeasonPreset[] = [
  {
    id: 'midsummer',
    dayOfYear: 172,
    labelEt: 'Jaanipäev / Suvine pööripäev (21. juuni)',
    labelEn: 'Midsummer / Summer Solstice (June 21)',
    dateStr: '06-21',
    descriptionEt: 'Päike tõuseb Eestis kuni 54° kõrgusele, pikim päev (18.5h) ja lühimad varjud.',
    descriptionEn: 'Peak solar altitude up to 54°, longest daylight (18.5h) and shortest shadows.'
  },
  {
    id: 'late_summer',
    dayOfYear: 213,
    labelEt: 'Südasuvi / Viljumisaeg (1. august)',
    labelEn: 'Late Summer / Ripening (August 1)',
    dateStr: '08-01',
    descriptionEt: 'Köögiviljade peamine valmimisaeg, päevapikkus ~16h, soojenenud muld.',
    descriptionEn: 'Prime vegetable growth & ripening season, ~16h daylight, warmed soil.'
  },
  {
    id: 'spring_equinox',
    dayOfYear: 79,
    labelEt: 'Kevadine pööripäev (20. märts)',
    labelEn: 'Spring Equinox (March 20)',
    dateStr: '03-20',
    descriptionEt: 'Ettekasvatuse ja kasvuhoone käivitamise aeg, päikese tipp 30°, pikad varjud.',
    descriptionEn: 'Seed starting & greenhouse thawing season, sun peak at 30°, long shadows.'
  },
  {
    id: 'autumn_equinox',
    dayOfYear: 265,
    labelEt: 'Sügisene pööripäev (22. september)',
    labelEn: 'Autumn Equinox (September 22)',
    dateStr: '09-22',
    descriptionEt: 'Saagikoristus ja taliküüslaugu mahapanek, päikese tipp 30°, jahenevad ööd.',
    descriptionEn: 'Harvest & garlic planting season, sun peak at 30°, cooling nights.'
  }
];

export const SolarEngine = {
  /**
   * Calculates peak sun altitude in degrees at solar noon for a given latitude and day of year.
   * Estonia latitude ~58.5°N - 59.5°N.
   */
  calculateSolarNoonAltitude(lat: number, dayOfYear: number): number {
    const declination = 23.45 * Math.sin(((360.0 / 365.0) * (dayOfYear - 81) * Math.PI) / 180.0);
    const altitude = 90.0 - lat + declination;
    return Math.max(0.0, Math.min(90.0, altitude));
  },

  /**
   * Calculates daylight hours for a given latitude and day of year.
   * In Estonia: midsummer (day ~172) has ~18.5 hours daylight, midwinter has ~6 hours.
   */
  calculateDaylightHours(lat: number, dayOfYear: number): number {
    const latRad = (lat * Math.PI) / 180.0;
    const declinationRad = (23.45 * Math.sin(((360.0 / 365.0) * (dayOfYear - 81) * Math.PI) / 180.0) * Math.PI) / 180.0;
    const cosHourAngle = -Math.tan(latRad) * Math.tan(declinationRad);
    const clampedCos = Math.max(-1.0, Math.min(1.0, cosHourAngle));
    const hourAngle = (Math.acos(clampedCos) * 180.0) / Math.PI;
    return (2.0 * hourAngle) / 15.0;
  },

  /**
   * Calculates exact sun altitude and azimuth for any time of day in Estonia.
   * hourDecimal: e.g. 12.0 for 12:00, 14.5 for 14:30.
   */
  calculateSunPosition(
    lat: number,
    dayOfYear: number,
    hourDecimal: number
  ): { altitudeDeg: number; azimuthDeg: number; isAboveHorizon: boolean } {
    const latRad = (lat * Math.PI) / 180.0;
    const declination = 23.45 * Math.sin(((360.0 / 365.0) * (dayOfYear - 81) * Math.PI) / 180.0);
    const declinationRad = (declination * Math.PI) / 180.0;

    // Solar noon is roughly 12:00 solar time (or ~13:15 local daylight savings time in Tallinn)
    const hourAngleDeg = (hourDecimal - 12.0) * 15.0;
    const hourAngleRad = (hourAngleDeg * Math.PI) / 180.0;

    const sinAltitude =
      Math.sin(latRad) * Math.sin(declinationRad) +
      Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
    const clampedSin = Math.max(-1.0, Math.min(1.0, sinAltitude));
    const altitudeRad = Math.asin(clampedSin);
    const altitudeDeg = (altitudeRad * 180.0) / Math.PI;

    if (altitudeDeg <= 0) {
      return { altitudeDeg: 0, azimuthDeg: 180, isAboveHorizon: false };
    }

    const cosAzimuth =
      (Math.sin(declinationRad) - Math.sin(latRad) * Math.sin(altitudeRad)) /
      (Math.cos(latRad) * Math.cos(altitudeRad) || 0.0001);
    const clampedCosAz = Math.max(-1.0, Math.min(1.0, cosAzimuth));
    let azimuthDeg = (Math.acos(clampedCosAz) * 180.0) / Math.PI;

    if (hourDecimal > 12.0) {
      azimuthDeg = 360.0 - azimuthDeg;
    }

    return {
      altitudeDeg: Math.round(altitudeDeg * 10) / 10,
      azimuthDeg: Math.round(azimuthDeg * 10) / 10,
      isAboveHorizon: true
    };
  },

  /**
   * Calculates shadow length (in metres) cast by an obstacle of a given height at solar noon.
   */
  calculateShadowLength(heightM: number, solarAltitudeDeg: number): number {
    if (solarAltitudeDeg <= 5.0) return heightM * 10;
    const altRad = (solarAltitudeDeg * Math.PI) / 180.0;
    return heightM / Math.tan(altRad);
  },

  /**
   * Evaluates whether a garden bed location receives sufficient sun based on nearby objects.
   */
  evaluateSunScore(bedSunHours: number, requiredHours: number, lang: 'et' | 'en' = 'et'): string {
    if (lang === 'en') {
      if (bedSunHours >= requiredHours) {
        return `Excellent sunlight (${bedSunHours.toFixed(1)} h / needed ${requiredHours} h)`;
      }
      if (bedSunHours >= requiredHours - 1.5) {
        return `Adequate sunlight (${bedSunHours.toFixed(1)} h / needed ${requiredHours} h)`;
      }
      return `Too shaded (${bedSunHours.toFixed(1)} h / needs at least ${requiredHours} h)`;
    }

    if (bedSunHours >= requiredHours) {
      return `Suurepärane päikesevalgus (${bedSunHours.toFixed(1)} h / vajalik ${requiredHours} h)`;
    }
    if (bedSunHours >= requiredHours - 1.5) {
      return `Rahuldav päikesevalgus (${bedSunHours.toFixed(1)} h / vajalik ${requiredHours} h)`;
    }
    return `Liiga varjuline (${bedSunHours.toFixed(1)} h / vajalik vähemalt ${requiredHours} h)`;
  },

  /**
   * Calculates and caches shadow displacement vector for an obstacle given height, sun altitude, and sun azimuth.
   * Uses memoization to prevent expensive trigonometry during 60 FPS canvas redraws.
   */
  getCachedShadowVector(
    heightM: number,
    solarAltitudeDeg: number,
    solarAzimuthDeg = 180
  ): { dx: number; dy: number; length: number } {
    const roundedAlt = Math.round(solarAltitudeDeg * 2) / 2;
    const roundedAz = Math.round(solarAzimuthDeg * 2) / 2;
    const cacheKey = `${heightM.toFixed(1)}_${roundedAlt}_${roundedAz}`;

    const cached = shadowCache.get(cacheKey);
    if (cached) return cached;

    const length = this.calculateShadowLength(heightM, solarAltitudeDeg);
    // Shadow falls opposite to sun azimuth:
    const shadowAngleRad = ((solarAzimuthDeg + 180) % 360) * (Math.PI / 180);
    const dx = Math.sin(shadowAngleRad) * length;
    const dy = -Math.cos(shadowAngleRad) * length;

    const result = { dx, dy, length };
    if (shadowCache.size > 500) {
      shadowCache.clear();
    }
    shadowCache.set(cacheKey, result);
    return result;
  }
};

const shadowCache = new Map<string, { dx: number; dy: number; length: number }>();
