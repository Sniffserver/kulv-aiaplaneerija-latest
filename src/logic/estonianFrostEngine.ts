import { EstonianRegionId, CropProtectionType, BedSuccessionSlot, FrostAlert } from '../types/rotation';
import { Plant } from '../types';

export interface EstonianRegionProfile {
  id: EstonianRegionId;
  nameEt: string;
  nameEn: string;
  hardinessZone: string;
  springLastFrost: string; // MM-DD
  autumnFirstFrost: string; // MM-DD
  averageFrostFreeDays: number;
  descriptionEt: string;
  descriptionEn: string;
}

export const ESTONIAN_REGIONS: Record<EstonianRegionId, EstonianRegionProfile> = {
  north_coast: {
    id: 'north_coast',
    nameEt: 'Põhja-Eesti rannik (Tallinn, Lahemaa, Viimsi)',
    nameEn: 'Northern Coast (Tallinn, Lahemaa, Viimsi)',
    hardinessZone: 'Zone 5b / 6a',
    springLastFrost: '05-18',
    autumnFirstFrost: '10-10',
    averageFrostFreeDays: 145,
    descriptionEt: 'Meri hoiab sügise pikalt sooja, kuid kevadine merebriis võib taimede ärkamist veidi edasi lükata.',
    descriptionEn: 'Maritime moderation extends autumn, while sea breezes slightly delay early spring warmup.'
  },
  central: {
    id: 'central',
    nameEt: 'Kesk-Eesti & Pandivere (Paide, Türi, Jõgeva, Väike-Maarja)',
    nameEn: 'Central Plains & Pandivere (Paide, Jõgeva)',
    hardinessZone: 'Zone 5a',
    springLastFrost: '05-30',
    autumnFirstFrost: '09-18',
    averageFrostFreeDays: 111,
    descriptionEt: 'Kõrgustiku ja külmalohkude tõttu võivad öökülmad kesta mai lõpuni ja naasta juba septembri keskpaigas.',
    descriptionEn: 'Highland cold sinks bring late May frosts and early mid-September freezes.'
  },
  southeast: {
    id: 'southeast',
    nameEt: 'Lõuna- ja Kagu-Eesti (Tartu, Võru, Valga, Põlva)',
    nameEn: 'South-East Continental (Tartu, Võru, Valga)',
    hardinessZone: 'Zone 4b / 5a',
    springLastFrost: '05-22',
    autumnFirstFrost: '09-22',
    averageFrostFreeDays: 123,
    descriptionEt: 'Kontinentaalsem mikrokliima kiire ja sooja kevadise mullasoojenemisega, kuid järskude sügiskülmadega.',
    descriptionEn: 'More continental climate with rapid spring soil warmup, followed by crisp early autumn night chills.'
  },
  islands: {
    id: 'islands',
    nameEt: 'Lääne-Eesti saared (Saaremaa, Hiiumaa, Muhu)',
    nameEn: 'Western Islands (Saaremaa, Hiiumaa, Muhu)',
    hardinessZone: 'Zone 6a / 6b',
    springLastFrost: '05-08',
    autumnFirstFrost: '10-22',
    averageFrostFreeDays: 167,
    descriptionEt: 'Eesti pehmeim saareline mikrokliima. Pikim vegetatsiooniperiood ja harvad ootamatud öökülmad.',
    descriptionEn: 'The mildest maritime island climate in Estonia. Longest growing season with rare sudden frosts.'
  }
};

export const PROTECTION_OFFSETS: Record<CropProtectionType, { springDays: number; autumnDays: number; labelEt: string; labelEn: string }> = {
  none: {
    springDays: 0,
    autumnDays: 0,
    labelEt: 'Avamaa (Kaitseta)',
    labelEn: 'Open Ground (Unprotected)'
  },
  fleece: {
    springDays: 12,
    autumnDays: 12,
    labelEt: 'Katteloor (17-30 g/m²)',
    labelEn: 'Agrotextile Fleece'
  },
  cold_frame: {
    springDays: 16,
    autumnDays: 14,
    labelEt: 'Külmlava / Minikasvuhoone',
    labelEn: 'Cold Frame / Low Tunnel'
  },
  greenhouse: {
    springDays: 25,
    autumnDays: 22,
    labelEt: 'Polükarbonaat- või klaaskasvuhoone',
    labelEn: 'Polycarbonate / Glass Greenhouse'
  }
};

/**
 * Parses MM-DD or YYYY-MM-DD into a standard Day-Of-Year integer (1..365).
 */
export function getDayOfYear(dateStr: string): number {
  const parts = dateStr.split('-');
  const month = parseInt(parts.length === 3 ? parts[1] : parts[0], 10);
  const day = parseInt(parts.length === 3 ? parts[2] : parts[1], 10);
  const daysInMonths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let doy = 0;
  for (let m = 1; m < month; m++) {
    doy += daysInMonths[m];
  }
  return doy + day;
}

/**
 * Converts a Day-Of-Year integer back to MM-DD format.
 */
export function dayOfYearToMMDD(doy: number): string {
  const daysInMonths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let remaining = Math.max(1, Math.min(365, doy));
  let month = 1;
  while (month <= 12 && remaining > daysInMonths[month]) {
    remaining -= daysInMonths[month];
    month++;
  }
  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = remaining < 10 ? `0${remaining}` : `${remaining}`;
  return `${mm}-${dd}`;
}

export const EstonianFrostEngine = {
  /**
   * Calculates effective spring last frost and autumn first frost dates with protection adjustments.
   */
  getAdjustedFrostDates(regionId: EstonianRegionId, protection: CropProtectionType = 'none'): {
    springFrostMMDD: string;
    autumnFrostMMDD: string;
    springFrostDoy: number;
    autumnFrostDoy: number;
    frostFreeDays: number;
  } {
    const profile = ESTONIAN_REGIONS[regionId] || ESTONIAN_REGIONS.central;
    const offset = PROTECTION_OFFSETS[protection] || PROTECTION_OFFSETS.none;

    const baseSpringDoy = getDayOfYear(profile.springLastFrost);
    const baseAutumnDoy = getDayOfYear(profile.autumnFirstFrost);

    const adjustedSpringDoy = Math.max(60, baseSpringDoy - offset.springDays); // Not earlier than March 1
    const adjustedAutumnDoy = Math.min(335, baseAutumnDoy + offset.autumnDays); // Not later than Dec 1

    return {
      springFrostMMDD: dayOfYearToMMDD(adjustedSpringDoy),
      autumnFrostMMDD: dayOfYearToMMDD(adjustedAutumnDoy),
      springFrostDoy: adjustedSpringDoy,
      autumnFrostDoy: adjustedAutumnDoy,
      frostFreeDays: Math.max(0, adjustedAutumnDoy - adjustedSpringDoy)
    };
  },

  /**
   * Checks whether a succession slot has frost risk and returns detailed actionable warnings.
   */
  evaluateSlotFrostRisk(
    slot: BedSuccessionSlot,
    regionId: EstonianRegionId,
    plant?: Plant
  ): FrostAlert | null {
    // If grown in a greenhouse and crop is frost-sensitive, greenhouse gives strong protection
    const dates = this.getAdjustedFrostDates(regionId, slot.protectionType);
    const sowDoy = getDayOfYear(slot.sowDate);
    const harvestDoy = getDayOfYear(slot.harvestDate);

    const isFrostSensitive = plant ? (plant.weeksAfterFrostPlantOut ?? 0) >= 0 : true;

    // Check spring freeze collision
    if (isFrostSensitive && sowDoy < dates.springFrostDoy) {
      const daysEarly = dates.springFrostDoy - sowDoy;
      return {
        id: `frost-spring-${slot.id}`,
        slotId: slot.id,
        bedId: slot.bedId,
        plantName: slot.plantName,
        severity: daysEarly > 10 ? 'danger' : 'warning',
        titleEt: `Kevadine öökülmaoht: ${slot.plantName}`,
        titleEn: `Spring Frost Hazard: ${slot.plantNameEn || slot.plantName}`,
        messageEt: `Külv või istutuskuupäev (${slot.sowDate}) on ${daysEarly} päeva enne piirkonna (${ESTONIAN_REGIONS[regionId].hardinessZone}) viimast arvestuslikku öökülma (${dates.springFrostMMDD}).`,
        messageEn: `Planting date (${slot.sowDate}) is ${daysEarly} days ahead of the estimated final frost (${dates.springFrostMMDD}) in ${ESTONIAN_REGIONS[regionId].hardinessZone}.`,
        recommendedActionEt: slot.protectionType === 'none'
          ? 'Lisa peenrale katteloor (+12 päeva) või lükka istutust edasi.'
          : 'Jälgi öiseid temperatuure ja kasuta vajadusel kahekordset katteloori.',
        recommendedActionEn: slot.protectionType === 'none'
          ? 'Add agrotextile fleece (+12 days safety) or delay transplanting.'
          : 'Monitor overnight forecast dips and use double fleece if freezing.',
        daysAtRisk: daysEarly,
        frostPhase: 'spring_frost'
      };
    }

    // Check autumn freeze collision
    if (isFrostSensitive && harvestDoy > dates.autumnFrostDoy) {
      const daysLate = harvestDoy - dates.autumnFrostDoy;
      return {
        id: `frost-autumn-${slot.id}`,
        slotId: slot.id,
        bedId: slot.bedId,
        plantName: slot.plantName,
        severity: daysLate > 14 ? 'danger' : 'warning',
        titleEt: `Sügisene külmaoht enne saagikoristust: ${slot.plantName}`,
        titleEn: `Autumn Freeze Risk Before Harvest: ${slot.plantNameEn || slot.plantName}`,
        messageEt: `Saagikoristuse tähtaeg (${slot.harvestDate}) langeb ${daysLate} päeva peale esimest sügisest öökülma (${dates.autumnFrostMMDD}). Vili ei pruugi avamaal valmida.`,
        messageEn: `Expected harvest date (${slot.harvestDate}) is ${daysLate} days past the first autumn freeze (${dates.autumnFrostMMDD}). Crop may not mature outdoors.`,
        recommendedActionEt: slot.protectionType === 'none'
          ? 'Kasuta sügisel katteloori või vali lühema valmimisajaga (DTM) sort.'
          : 'Valmista ette sügisene lisasoojustus või korista saak toorelt järelvalmimiseks.',
        recommendedActionEn: slot.protectionType === 'none'
          ? 'Apply row cover in September or choose a variety with shorter DTM.'
          : 'Prepare tunnel insulation or harvest green for indoor ripening.',
        daysAtRisk: daysLate,
        frostPhase: 'autumn_frost'
      };
    }

    return null;
  }
};
