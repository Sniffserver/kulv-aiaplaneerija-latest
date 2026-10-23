/**
 * Smart Irrigation & Evapotranspiration Advisor for KÜLV.
 * Combines 7-day precipitation forecasts, soil types, and crop water needs into actionable watering recommendations.
 */

import { DailyForecastItem, GardenBed, Plant } from '../types';

export type SoilType = 'sandy' | 'loam' | 'clay';

export interface IrrigationAdvice {
  level: 'urgent' | 'moderate' | 'sufficient' | 'excess';
  headline: string;
  advice: string;
  recommendedLitersPerM2: number;
  consecutiveDryDays: number;
  totalRain7Days: number;
  soilContext: string;
  highPriorityCrops: string[];
}

export const SOIL_CHARACTERISTICS: Record<SoilType, { name: string; retention: string; dryingSpeed: string }> = {
  sandy: { name: 'Liivmuld', retention: 'Madal veemahutavus', dryingSpeed: 'Kuivab 1-2 päevaga, vajab sagedast kastmist' },
  loam: { name: 'Aia- ja kompostmuld', retention: 'Optimaalne veemahutavus', dryingSpeed: 'Hoiab niiskust 3-4 päeva' },
  clay: { name: 'Savimuld', retention: 'Kõrge veemahutavus', dryingSpeed: 'Kuivab aeglaselt, oht liigniiskusele' }
};

export const IrrigationAdvisor = {
  /**
   * Evaluates irrigation needs across a 7-day weather forecast.
   */
  evaluateIrrigation(
    dailyForecast: DailyForecastItem[],
    soilType: SoilType = 'loam',
    beds: GardenBed[] = [],
    catalogPlants: Plant[] = []
  ): IrrigationAdvice {
    const totalRain7Days = dailyForecast.reduce((sum, d) => sum + (d.precipitationSum || 0), 0);

    // Calculate consecutive dry days from today
    let consecutiveDryDays = 0;
    for (const day of dailyForecast) {
      if ((day.precipitationSum || 0) < 1.0) {
        consecutiveDryDays++;
      } else {
        break;
      }
    }

    // Find high water need plants currently planted
    const plantedIds = new Set<string>();
    beds.forEach((b) => b.plantings.forEach((p) => plantedIds.add(p.plantId)));

    const highPriorityCrops: string[] = [];
    catalogPlants.forEach((p) => {
      if (plantedIds.has(p.id) && (p.waterNeed === 'high' || p.id.includes('tomat') || p.id.includes('kurk') || p.id.includes('kõrvits'))) {
        highPriorityCrops.push(p.name);
      }
    });

    if (highPriorityCrops.length === 0) {
      highPriorityCrops.push('Tomat', 'Kurk', 'Suvikõrvits', 'Kapsas');
    }

    const hasGreenhouseBeds = beds.some((b) => b.type === 'greenhouse' || b.coverType === 'greenhouse');
    const soilInfo = SOIL_CHARACTERISTICS[soilType];

    // Evaluate water balance
    if (totalRain7Days < 3 && consecutiveDryDays >= 3) {
      const liters = soilType === 'sandy' ? 10 : soilType === 'clay' ? 12 : 15;
      return {
        level: 'urgent',
        headline: `Vihma pole oodata ${consecutiveDryDays} päeva – kasta aeda sügavalt!`,
        advice: `Prognoositav sademete koguhulk lähinädalal on vaid ${totalRain7Days.toFixed(1)} mm. ${soilInfo.name}: ${soilInfo.dryingSpeed}. Kasta viljuvaid kultuure varahommikul umbes ~${liters} l/m², et vesi jõuaks sügavale juurteni.`,
        recommendedLitersPerM2: liters,
        consecutiveDryDays,
        totalRain7Days: Math.round(totalRain7Days * 10) / 10,
        soilContext: `${soilInfo.name} (${soilInfo.retention})`,
        highPriorityCrops
      };
    }

    if (totalRain7Days < 8) {
      return {
        level: 'moderate',
        headline: `Mõõdukas kastmisvajadus (7p vihm: ${totalRain7Days.toFixed(1)} mm)`,
        advice: `Lähiajal on oodata kergeid sademeid, kuid kuuma päikese korral aurustub pinnas kiiresti. Kasvuhoonetaimed vajavad kindlasti regulaarset kastmist, kuna vihmavesi nendeni ei jõua!`,
        recommendedLitersPerM2: 8,
        consecutiveDryDays,
        totalRain7Days: Math.round(totalRain7Days * 10) / 10,
        soilContext: `${soilInfo.name} (${soilInfo.retention})`,
        highPriorityCrops
      };
    }

    if (totalRain7Days >= 20) {
      return {
        level: 'excess',
        headline: `Tugevad sademed (${totalRain7Days.toFixed(1)} mm) – avamaal kastmist vältida!`,
        advice: `Oodata on märkimisväärset vihmasadu. Avamaapeenrad saavad piisavalt niisutust; jälgi, et savimullas ei tekiks seisvat vett. ${hasGreenhouseBeds ? 'Kasvuhoone vajab endiselt käsitsi kastmist.' : ''}`,
        recommendedLitersPerM2: 0,
        consecutiveDryDays: 0,
        totalRain7Days: Math.round(totalRain7Days * 10) / 10,
        soilContext: `${soilInfo.name} (${soilInfo.retention})`,
        highPriorityCrops
      };
    }

    return {
      level: 'sufficient',
      headline: `Piisav looduslik niiskustasakaal (${totalRain7Days.toFixed(1)} mm vihma)`,
      advice: `Prognoositavad vihmahood tagavad avamaataimedele optimaalse niiskuse. Kasta vajaduspõhiselt üksnes potte, kaste ja kasvuhoonet.`,
      recommendedLitersPerM2: 5,
      consecutiveDryDays,
      totalRain7Days: Math.round(totalRain7Days * 10) / 10,
      soilContext: `${soilInfo.name} (${soilInfo.retention})`,
      highPriorityCrops
    };
  }
};
