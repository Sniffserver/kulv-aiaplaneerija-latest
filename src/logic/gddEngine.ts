import { DailyForecastItem } from '../types';

export interface CropGddRequirement {
  cropName: string;
  baseTemp: 5 | 10;
  targetGdd: number;
  description: string;
}

export const ESTONIAN_CROP_GDD_STANDARDS: Record<string, CropGddRequirement> = {
  hernes: {
    cropName: 'Aedhernes',
    baseTemp: 5,
    targetGdd: 220,
    description: 'Vajab idanemiseks ja saagikandeks vähemalt ~220 kraadpäeva (baas 5°C).'
  },
  porgand: {
    cropName: 'Aedporgand',
    baseTemp: 5,
    targetGdd: 520,
    description: 'Varajane saak ~350 GDD, täisküps säilitusporgand ~520 GDD (baas 5°C).'
  },
  redis: {
    cropName: 'Aedredis',
    baseTemp: 5,
    targetGdd: 160,
    description: 'Kiirkultuur: tarbimisküpsus saavutatakse ~160 kraadpäevaga (baas 5°C).'
  },
  lehtkapsas: {
    cropName: 'Lehtkapsas (Kale)',
    baseTemp: 5,
    targetGdd: 280,
    description: 'Külmakindel, lehesaak algab ~280 kraadpäevaga (baas 5°C).'
  },
  spinat: {
    cropName: 'Aedspinat',
    baseTemp: 5,
    targetGdd: 180,
    description: 'Jaheda ilma kultuur, valmib ~180 kraadpäevaga (baas 5°C).'
  },
  sibul: {
    cropName: 'Harilik sibul',
    baseTemp: 5,
    targetGdd: 480,
    description: 'Pealsekasvuks ja sibula moodustamiseks vajab ~480 GDD (baas 5°C).'
  },
  tomat: {
    cropName: 'Tomat',
    baseTemp: 10,
    targetGdd: 680,
    description: 'Soojanõudlik: õitsemine algab ~320 GDD, küpsed viljad ~680 GDD (baas 10°C).'
  },
  kurk: {
    cropName: 'Harilik kurk',
    baseTemp: 10,
    targetGdd: 460,
    description: 'Vajab viljumiseks pidevat soojust ja ~460 kraadpäeva (baas 10°C).'
  },
  suvikorvits: {
    cropName: 'Suvikõrvits',
    baseTemp: 10,
    targetGdd: 420,
    description: 'Esimene saak algab ~420 kraadpäevaga (baas 10°C).'
  },
  basiilik: {
    cropName: 'Vürtsbasiilik',
    baseTemp: 10,
    targetGdd: 300,
    description: 'Külmatundlik maitsetaim, lopsakas lehemass vajab ~300 GDD (baas 10°C).'
  }
};

export const GddEngine = {
  /**
   * Calculates Growing Degree Days (GDD) for a single day:
   * GDD = max(0, ((tempMax + tempMin) / 2) - baseTemp)
   */
  calculateDailyGDD(tempMax: number, tempMin: number, baseTemp: 5 | 10 = 5): number {
    const meanTemp = (tempMax + tempMin) / 2;
    const gdd = meanTemp - baseTemp;
    return gdd > 0 ? Math.round(gdd * 10) / 10 : 0;
  },

  /**
   * Sums the accumulated GDD across a forecast period (e.g. 7 days).
   */
  calculateAccumulatedGDD(dailyForecast: DailyForecastItem[], baseTemp: 5 | 10 = 5): number {
    if (!dailyForecast || dailyForecast.length === 0) return 0;
    const total = dailyForecast.reduce((sum, day) => {
      return sum + this.calculateDailyGDD(day.tempMax, day.tempMin, baseTemp);
    }, 0);
    return Math.round(total * 10) / 10;
  },

  /**
   * Returns standard requirement info for a crop ID or family.
   */
  getCropStandard(cropId: string): CropGddRequirement {
    const normalized = cropId.toLowerCase();
    for (const [key, standard] of Object.entries(ESTONIAN_CROP_GDD_STANDARDS)) {
      if (normalized.includes(key)) {
        return standard;
      }
    }

    // Default heuristics based on tender vs hardy
    if (
      normalized.includes('tomat') ||
      normalized.includes('kurk') ||
      normalized.includes('kõrvits') ||
      normalized.includes('basiilik') ||
      normalized.includes('paprika')
    ) {
      return {
        cropName: cropId,
        baseTemp: 10,
        targetGdd: 550,
        description: 'Soojanõudlik kultuur (baas 10°C).'
      };
    }

    return {
      cropName: cropId,
      baseTemp: 5,
      targetGdd: 350,
      description: 'Põhjamaine jahedust taluv kultuur (baas 5°C).'
    };
  },

  /**
   * Formats an Estonian agricultural evaluation of the 7-day accumulated thermal energy.
   */
  evaluate7DayThermalGrowth(dailyForecast: DailyForecastItem[]): {
    gdd5: number;
    gdd10: number;
    summary: string;
    advice: string;
  } {
    const gdd5 = this.calculateAccumulatedGDD(dailyForecast, 5);
    const gdd10 = this.calculateAccumulatedGDD(dailyForecast, 10);

    let summary = '';
    let advice = '';

    if (gdd10 < 8) {
      summary = `Vähene soojussumma (GDD10: ${gdd10}°d)`;
      advice = `Ööd ja päevad on jahedad. Tomatite, kurkide ja kõrvitsate kasv aeglustub; hoia kasvuhoone soojapidav ja väldi liigniiskust.`;
    } else if (gdd10 < 25) {
      summary = `Mõõdukas soojussumma (GDD10: ${gdd10}°d, GDD5: ${gdd5}°d)`;
      advice = `Tavapärane Eesti kevad/algsuvi. Külmakindlad köögiviljad (porgand, hernes, kapsas) kasvavad stabiilselt.`;
    } else {
      summary = `Väga aktiivne soojussumma (GDD10: ${gdd10}°d, GDD5: ${gdd5}°d)`;
      advice = `Kõrge bioloogiline aktiivsus! Taimede lehe- ja juurekasv kiireneb, taga peenardel piisav kastmine ja kasvuhoones tuulutus.`;
    }

    return { gdd5, gdd10, summary, advice };
  }
};
