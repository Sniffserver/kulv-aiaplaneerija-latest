import { Plant } from '../types';

export interface PlantTimeline {
  plant: Plant;
  indoorSowStart: string | null;
  greenhousePlantStart: string | null;
  outdoorPlantStart: string;
  harvestStart: string;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export interface NordicRegionProfile {
  id: 'islands' | 'north_coast' | 'central' | 'southeast';
  nameEt: string;
  nameEn: string;
  springFrostDate: string; // MM-DD
  autumnFrostDate: string; // MM-DD
  gddAverage: number;      // Growing degree days baseline (>10°C)
  descriptionEt: string;
  descriptionEn: string;
}

export const NORDIC_REGIONAL_FROST_DATA: Record<string, NordicRegionProfile> = {
  north_coast: {
    id: 'north_coast',
    nameEt: 'Põhja-Eesti rannik (Tallinn, Lahemaa)',
    nameEn: 'Northern Coast (Tallinn, Lahemaa)',
    springFrostDate: '05-20',
    autumnFrostDate: '09-30',
    gddAverage: 1350,
    descriptionEt: 'Merekliima pehmendab sügisel esimesi öökülmi, kevad soojeneb mõõduka tempoga.',
    descriptionEn: 'Maritime influence delays first autumn frost, moderate spring warming.'
  },
  central: {
    id: 'central',
    nameEt: 'Kesk-Eesti ja Pandivere (Paide, Jõgeva)',
    nameEn: 'Central Plateau (Paide, Jõgeva)',
    springFrostDate: '05-28',
    autumnFrostDate: '09-18',
    gddAverage: 1380,
    descriptionEt: 'Külmemad talved ja hilised kevadöökülmad maapinna lähedal, lühem avamaa hooaeg.',
    descriptionEn: 'Colder winters and late ground spring frosts, shorter outdoor window.'
  },
  southeast: {
    id: 'southeast',
    nameEt: 'Lõuna- ja Kagu-Eesti (Tartu, Võru, Valga)',
    nameEn: 'South-East (Tartu, Võru, Valga)',
    springFrostDate: '05-18',
    autumnFrostDate: '09-22',
    gddAverage: 1480,
    descriptionEt: 'Soojem ja päikeselisem suvi kõrgema GDD summaga, orgudes risk kiirgusöökülmadeks.',
    descriptionEn: 'Warmer, sunnier summer with higher GDD, radiation frost risk in valleys.'
  },
  islands: {
    id: 'islands',
    nameEt: 'Lääne-Eesti saared (Saaremaa, Hiiumaa)',
    nameEn: 'Western Islands (Saaremaa, Hiiumaa)',
    springFrostDate: '05-10',
    autumnFrostDate: '10-15',
    gddAverage: 1420,
    descriptionEt: 'Pikim öökülmavaba periood Eestis, jahe kevad aga pikk ja soe sügis.',
    descriptionEn: 'Longest frost-free period in Estonia, cooler spring but warm extended autumn.'
  }
};

export const PlantingCalendar = {
  calculateTimeline(
    plant: Plant,
    springFrostDateStr: string = '05-20',
    year: number = 2026,
    coverType: 'none' | 'greenhouse' | 'fleece' | 'coldFrame' = 'none'
  ): PlantTimeline {
    const parts = springFrostDateStr.split('-').map(Number);
    const frostMonth = parts[0] || 5;
    const frostDay = parts[1] || 20;
    const frostDate = new Date(year, frostMonth - 1, frostDay);

    const indoorSowStart = plant.weeksBeforeFrostSowIndoors != null
      ? formatDate(addWeeks(frostDate, -plant.weeksBeforeFrostSowIndoors))
      : null;

    const greenhousePlantStart = plant.greenhouseShiftWeeks != null
      ? formatDate(addWeeks(frostDate, -plant.greenhouseShiftWeeks))
      : null;

    let outdoorPlantStart: string;
    let coverShiftDays = 0;
    if (coverType === 'greenhouse') coverShiftDays = -21;
    else if (coverType === 'coldFrame') coverShiftDays = -14;
    else if (coverType === 'fleece') coverShiftDays = -10;

    if (plant.weeksAfterFrostPlantOut != null) {
      const baseOut = addWeeks(frostDate, plant.weeksAfterFrostPlantOut);
      outdoorPlantStart = formatDate(addDays(baseOut, coverShiftDays));
    } else {
      // Direct outdoor sowing roughly 2 weeks before or on frost date
      const baseOut = addWeeks(frostDate, -2);
      outdoorPlantStart = formatDate(addDays(baseOut, coverShiftDays));
    }

    const outdoorDate = new Date(outdoorPlantStart);
    const harvestStart = formatDate(addDays(outdoorDate, plant.daysToMaturity));

    return {
      plant,
      indoorSowStart,
      greenhousePlantStart,
      outdoorPlantStart,
      harvestStart
    };
  },

  getMonthNameEstonian(monthIndex: number): string {
    const months = [
      '',
      'Jaanuar',
      'Veebruar',
      'Märts',
      'Aprill',
      'Mai',
      'Juuni',
      'Juuli',
      'August',
      'September',
      'Oktoober',
      'November',
      'Detsember'
    ];
    return months[monthIndex] || '';
  },

  getMonthName(monthIndex: number, lang: 'et' | 'en' = 'et'): string {
    if (lang === 'en') {
      const monthsEn = [
        '',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ];
      return monthsEn[monthIndex] || '';
    }
    return this.getMonthNameEstonian(monthIndex);
  }
};

