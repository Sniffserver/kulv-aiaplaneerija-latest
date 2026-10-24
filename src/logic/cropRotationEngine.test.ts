import { describe, it, expect } from 'vitest';
import {
  CropRotationEngine,
  BotanicalFamilies,
  BOTANICAL_FAMILY_DETAILS,
  ROTATION_TEMPLATES,
  createDefaultRotationPlan
} from './cropRotationEngine';
import { Plant, BedYearHistoryRecord } from '../types';
import { PLANT_ENCYCLOPEDIA, getPlantEncyclopediaEntry } from '../data/plantEncyclopedia';

const mockTomato: Plant = {
  id: 'tomat',
  name: 'Tomat',
  scientificName: 'Solanum lycopersicum',
  family: 'Maavitsalised (Solanaceae)',
  icon: '🍅',
  varieties: [],
  optimalSowDateStart: '03-15',
  optimalPlantOutDate: '05-20',
  optimalHarvestDate: '08-10',
  spacingCm: 50,
  rowSpacingCm: 60,
  depthCm: 1.5,
  daysToMaturity: 75,
  sunNeed: 'full',
  sunHoursMin: 6,
  waterNeed: 'high',
  weeksBeforeFrostSowIndoors: 8,
  weeksAfterFrostPlantOut: 2,
  greenhouseShiftWeeks: 4,
  companionsGood: ['basiilik'],
  companionsBad: ['kartul'],
  description: '',
  isNordicSuitable: true
};

const mockCabbage: Plant = {
  id: 'kapsas',
  name: 'Peakapsas',
  scientificName: 'Brassica oleracea',
  family: 'Ristõielised (Brassicaceae)',
  icon: '🥬',
  varieties: [],
  optimalSowDateStart: '03-20',
  optimalPlantOutDate: '05-15',
  optimalHarvestDate: '09-10',
  spacingCm: 50,
  rowSpacingCm: 60,
  depthCm: 1.0,
  daysToMaturity: 90,
  sunNeed: 'full',
  sunHoursMin: 6,
  waterNeed: 'high',
  weeksBeforeFrostSowIndoors: 5,
  weeksAfterFrostPlantOut: 1,
  greenhouseShiftWeeks: null,
  companionsGood: ['till'],
  companionsBad: ['tomat'],
  description: '',
  isNordicSuitable: true
};

const mockCarrot: Plant = {
  id: 'porgand',
  name: 'Porgand',
  scientificName: 'Daucus carota',
  family: 'Sarikalised (Apiaceae)',
  icon: '🥕',
  varieties: [],
  optimalSowDateStart: '04-20',
  optimalPlantOutDate: '04-20',
  optimalHarvestDate: '08-15',
  spacingCm: 4,
  rowSpacingCm: 25,
  depthCm: 1.5,
  daysToMaturity: 80,
  sunNeed: 'full',
  sunHoursMin: 6,
  waterNeed: 'medium',
  weeksBeforeFrostSowIndoors: null,
  weeksAfterFrostPlantOut: null,
  greenhouseShiftWeeks: null,
  companionsGood: ['sibul'],
  companionsBad: ['till'],
  description: '',
  isNordicSuitable: true
};

const mockGarlic: Plant = {
  id: 'kuuslauk',
  name: 'Küüslauk',
  scientificName: 'Allium sativum',
  family: 'Laugulised (Allioideae)',
  icon: '🧄',
  varieties: [],
  optimalSowDateStart: '09-25',
  optimalPlantOutDate: '09-25',
  optimalHarvestDate: '07-25',
  spacingCm: 12,
  rowSpacingCm: 25,
  depthCm: 6.0,
  daysToMaturity: 270,
  sunNeed: 'full',
  sunHoursMin: 6,
  waterNeed: 'medium',
  weeksBeforeFrostSowIndoors: null,
  weeksAfterFrostPlantOut: null,
  greenhouseShiftWeeks: null,
  companionsGood: ['tomat'],
  companionsBad: ['hernes'],
  description: '',
  isNordicSuitable: true
};

describe('CropRotationEngine Core & Helpers', () => {
  it('normalizes botanical family names correctly', () => {
    expect(CropRotationEngine.normalizeFamily('Maavitsalised (Solanaceae)')).toBe(BotanicalFamilies.SOLANACEAE);
    expect(CropRotationEngine.normalizeFamily('Ristõielised (Brassicaceae)')).toBe(BotanicalFamilies.BRASSICACEAE);
    expect(CropRotationEngine.normalizeFamily('Liblikõielised (Fabaceae)')).toBe(BotanicalFamilies.FABACEAE);
    expect(CropRotationEngine.normalizeFamily('Sarikalised (Apiaceae)')).toBe(BotanicalFamilies.APIACEAE);
    expect(CropRotationEngine.normalizeFamily('Laugulised (Alliaceae)')).toBe(BotanicalFamilies.ALLIACEAE);
  });

  it('detects severe consecutive planting violations (Solanaceae after Solanaceae)', () => {
    const past = [{ year: 2025, plantId: 'kartul', plantName: 'Kartul', family: 'Maavitsalised (Solanaceae)' }];
    const warnings = CropRotationEngine.evaluateRotation(mockTomato, past, 2026);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].severity).toBe('danger');
    expect(warnings[0].family).toBe(BotanicalFamilies.SOLANACEAE);
    expect(warnings[0].title).toContain('Maavitsalised');
  });

  it('detects clubroot risk for consecutive Brassicaceae plantings', () => {
    const past = [{ year: 2025, plantId: 'kaalikas', plantName: 'Kaalikas', family: 'Ristõielised (Brassicaceae)' }];
    const warnings = CropRotationEngine.evaluateRotation(mockCabbage, past, 2026);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].severity).toBe('danger');
    expect(warnings[0].title).toContain('Kapsanuutri');
  });

  it('recognizes beneficial succession when predecessor is Fabaceae (nitrogen fixer)', () => {
    const past = [{ year: 2025, plantId: 'hernes', plantName: 'Aedhernes', family: 'Liblikõielised (Fabaceae)' }];
    const warnings = CropRotationEngine.evaluateRotation(mockTomato, past, 2026);
    expect(warnings.some((w) => w.severity === 'good')).toBe(true);
  });

  it('audits multi-year bed history and flags 4-year Solanaceae/Brassicaceae rotation gaps', () => {
    const alerts = CropRotationEngine.auditBedHistory(
      'bed-1',
      [
        {
          id: 'slot-1',
          bedId: 'bed-1',
          year: 2026,
          seasonSlot: 'main_crop',
          plantId: 'tomat',
          plantName: 'Tomat',
          botanicalFamily: 'Solanaceae',
          guild: 'heavy_feeder',
          sowDate: '05-20',
          harvestDate: '08-25',
          daysToMaturity: 80,
          protectionType: 'greenhouse'
        }
      ],
      [
        {
          bedId: 'bed-1',
          year: 2024,
          plantings: [
            {
              plantId: 'kartul',
              plantName: 'Kartul',
              family: 'Solanaceae',
              guild: 'heavy_feeder'
            }
          ]
        }
      ],
      2026
    );

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].family).toBe('Solanaceae');
    expect(alerts[0].yearsApart).toBe(2);
    expect(alerts[0].messageEt).toContain('Kartul');
  });
});

describe('checkBedBotanicalRotationWarnings (Evidence-Based Pathogen & Nutrient Checks)', () => {
  it('flags Plasmodiophora brassicae (clubroot) danger with 4-year break requirement and EMÜ citation', () => {
    const bedHistory: BedYearHistoryRecord[] = [
      {
        bedId: 'bed-brassica',
        year: 2025,
        plantings: [
          {
            plantId: 'kaalikas',
            plantName: 'Kaalikas',
            family: 'Brassicaceae',
            guild: 'heavy_feeder'
          }
        ]
      }
    ];

    const alerts = CropRotationEngine.checkBedBotanicalRotationWarnings(bedHistory, mockCabbage, 2026);
    expect(alerts.length).toBeGreaterThan(0);

    const clubrootAlert = alerts.find((a) => a.family === 'Brassicaceae');
    expect(clubrootAlert).toBeDefined();
    expect(clubrootAlert?.severity).toBe('danger');
    expect(clubrootAlert?.breakYearsRequired).toBe(4);
    expect(clubrootAlert?.pathogenVector).toContain('Plasmodiophora brassicae');
    expect(clubrootAlert?.biologicalMechanism).toBeDefined();
    expect(clubrootAlert?.evidence.source).toContain('Eesti Maaülikool');
    expect(clubrootAlert?.evidence.tier).toBe('peer_reviewed');
  });

  it('flags Phytophthora infestans (late blight) and potato nematodes with 4-year break and METK citation', () => {
    const bedHistory: BedYearHistoryRecord[] = [
      {
        bedId: 'bed-solan',
        year: 2025,
        plantings: [
          {
            plantId: 'kartul',
            plantName: 'Kartul',
            family: 'Solanaceae',
            guild: 'heavy_feeder'
          }
        ]
      }
    ];

    const alerts = CropRotationEngine.checkBedBotanicalRotationWarnings(bedHistory, mockTomato, 2026);
    const solanAlert = alerts.find((a) => a.family === 'Solanaceae');
    expect(solanAlert).toBeDefined();
    expect(solanAlert?.severity).toBe('danger');
    expect(solanAlert?.breakYearsRequired).toBe(4);
    expect(solanAlert?.pathogenVector).toContain('Phytophthora infestans');
    expect(solanAlert?.evidence.source).toContain('Maaelu Teadmuskeskus (METK)');
    expect(solanAlert?.evidence.tier).toBe('peer_reviewed');
  });

  it('flags Psila rosae (carrot rust fly) risk for consecutive Apiaceae with 3-year break requirement', () => {
    const bedHistory: BedYearHistoryRecord[] = [
      {
        bedId: 'bed-apiaceae',
        year: 2025,
        plantings: [
          {
            plantId: 'pastinaak',
            plantName: 'Pastinaak',
            family: 'Apiaceae',
            guild: 'light_feeder'
          }
        ]
      }
    ];

    const alerts = CropRotationEngine.checkBedBotanicalRotationWarnings(bedHistory, mockCarrot, 2026);
    const apiAlert = alerts.find((a) => a.family === 'Apiaceae');
    expect(apiAlert).toBeDefined();
    expect(apiAlert?.severity).toBe('warning');
    expect(apiAlert?.breakYearsRequired).toBe(3);
    expect(apiAlert?.pathogenVector).toContain('Psila rosae');
    expect(apiAlert?.evidence.tier).toBe('institutional_ext');
  });

  it('flags Stromatinia cepivora (white rot) for consecutive Allioideae', () => {
    const bedHistory: BedYearHistoryRecord[] = [
      {
        bedId: 'bed-allium',
        year: 2025,
        plantings: [
          {
            plantId: 'sibul',
            plantName: 'Harilik sibul',
            family: 'Allioideae',
            guild: 'light_feeder'
          }
        ]
      }
    ];

    const alerts = CropRotationEngine.checkBedBotanicalRotationWarnings(bedHistory, mockGarlic, 2026);
    const alliumAlert = alerts.find((a) => a.family === 'Allioideae');
    expect(alliumAlert).toBeDefined();
    expect(alliumAlert?.severity).toBe('warning');
    expect(alliumAlert?.breakYearsRequired).toBe(3);
    expect(alliumAlert?.pathogenVector).toContain('Stromatinia cepivora');
  });

  it('detects consecutive heavy feeder nutrient depletion alert when preceding crop was heavy feeder without legumes', () => {
    const bedHistory: BedYearHistoryRecord[] = [
      {
        bedId: 'bed-depletion',
        year: 2025,
        plantings: [
          {
            plantId: 'suvikorvits',
            plantName: 'Suvikõrvits',
            family: 'Cucurbitaceae',
            guild: 'heavy_feeder'
          }
        ]
      }
    ];

    // Planting Cabbage (heavy feeder) directly after Zucchini (heavy feeder)
    const alerts = CropRotationEngine.checkBedBotanicalRotationWarnings(bedHistory, mockCabbage, 2026);
    const depletionAlert = alerts.find((a) => a.id.includes('alert-nutrient-depletion'));
    expect(depletionAlert).toBeDefined();
    expect(depletionAlert?.severity).toBe('warning');
    expect(depletionAlert?.evidence.source).toContain('Eesti Maaülikool');
    expect(depletionAlert?.biologicalMechanism).toContain('huumusekihi');
  });

  it('emits beneficial biological synergy alert when preceding crop was Fabaceae (Rhizobium nitrogen fixation)', () => {
    const bedHistory: BedYearHistoryRecord[] = [
      {
        bedId: 'bed-rhizobium',
        year: 2025,
        plantings: [
          {
            plantId: 'hernes',
            plantName: 'Aedhernes',
            family: 'Fabaceae',
            guild: 'nitrogen_fixer'
          }
        ]
      }
    ];

    const alerts = CropRotationEngine.checkBedBotanicalRotationWarnings(bedHistory, mockCabbage, 2026);
    const synergyAlert = alerts.find((a) => a.severity === 'good');
    expect(synergyAlert).toBeDefined();
    expect(synergyAlert?.biologicalMechanism).toContain('Rhizobium');
    expect(synergyAlert?.breakYearsRequired).toBe(0);
    expect(synergyAlert?.evidence.source).toContain('Maaelu Teadmuskeskus (METK)');
  });

  it('flags multi-year rotation interval violations (e.g. 2 years ago for 4-year requirement)', () => {
    const bedHistory: BedYearHistoryRecord[] = [
      {
        bedId: 'bed-multi',
        year: 2024,
        plantings: [
          {
            plantId: 'peakapsas',
            plantName: 'Peakapsas',
            family: 'Brassicaceae',
            guild: 'heavy_feeder'
          }
        ]
      }
    ];

    const alerts = CropRotationEngine.checkBedBotanicalRotationWarnings(bedHistory, mockCabbage, 2026);
    const multiAlert = alerts.find((a) => a.id.includes('alert-rot-multi'));
    expect(multiAlert).toBeDefined();
    expect(multiAlert?.yearsApart).toBe(2);
    expect(multiAlert?.breakYearsRequired).toBe(4);
  });
});

describe('Botanical Families & Multi-Year Templates Integrity', () => {
  it('ensures all botanical families have minimumRotationYears and authoritative evidence citations', () => {
    Object.values(BOTANICAL_FAMILY_DETAILS).forEach((fam) => {
      expect(fam.minimumRotationYears).toBeGreaterThanOrEqual(2);
      expect(fam.evidenceCitation).toBeDefined();
      expect(fam.evidenceCitation?.source).toBeTruthy();
      expect(['peer_reviewed', 'institutional_ext', 'empirical_hort', 'traditional']).toContain(
        fam.evidenceCitation?.tier
      );
      expect(fam.evidenceCitation?.verifiedYear).toBeGreaterThanOrEqual(2020);
    });
  });

  it('verifies predefined 3, 4, and 5-year rotation templates', () => {
    expect(ROTATION_TEMPLATES.standard_nordic_4y.cycleLengthYears).toBe(4);
    expect(ROTATION_TEMPLATES.solanaceae_break_4y.cycleLengthYears).toBe(4);
    expect(ROTATION_TEMPLATES.intensive_greenmanure_3y.cycleLengthYears).toBe(3);
    expect(ROTATION_TEMPLATES.permaculture_guild_5y.cycleLengthYears).toBe(5);

    const createdPlan = createDefaultRotationPlan('bed-99', 'standard_nordic_4y', 2026);
    expect(createdPlan.years.length).toBe(4);
    expect(createdPlan.cycleLengthYears).toBe(4);
    expect(createdPlan.bedId).toBe('bed-99');
  });
});

describe('10-Domain Plant Encyclopedia Data Integrity (Anti-Myth Protocol)', () => {
  const stapleCropIds = ['tomat', 'kapsas', 'hernes', 'porgand', 'kuuslauk', 'kurk'];

  it('ensures all staple Nordic garden crops have comprehensive 10-domain data', () => {
    stapleCropIds.forEach((cropId) => {
      const entry = PLANT_ENCYCLOPEDIA[cropId];
      expect(entry, `Crop ${cropId} must exist in PLANT_ENCYCLOPEDIA`).toBeDefined();

      // 1. Kasvatamine
      expect(entry.cultivation.sowingDepthCm).toBeGreaterThan(0);
      expect(entry.cultivation.germinationDays).toBeTruthy();
      expect(entry.cultivation.fertilizationAdvice).toBeTruthy();

      // 2. Kasvukoht
      expect(entry.habitat.optimalPh).toBeTruthy();
      expect(entry.habitat.soilType).toBeTruthy();

      // 3. Kasvutsükkel
      expect(entry.growthCycle.daysToMaturity).toBeGreaterThan(30);
      expect(entry.growthCycle.harvestPhase).toBeTruthy();

      // 4. Köögikasutus
      expect(entry.culinary.edibleParts.length).toBeGreaterThan(0);
      expect(entry.culinary.flavorProfile).toBeTruthy();

      // 5. Ökoloogia
      expect(entry.ecology.pollinators.length).toBeGreaterThan(0);
      expect(entry.ecology.biodiversityImpact).toBeTruthy();

      // 6. Taimekooslused
      expect(entry.companions.beneficial.length).toBeGreaterThan(0);
      entry.companions.beneficial.forEach((c) => {
        expect(c.biologicalMechanism).toBeTruthy();
        expect(c.evidence.source).toBeTruthy();
      });

      // 7. Terviseprobleemid
      expect(entry.healthProblems.length).toBeGreaterThan(0);
      entry.healthProblems.forEach((hp) => {
        expect(hp.symptoms).toBeTruthy();
        expect(hp.biologicalRemedy).toBeTruthy();
        expect(hp.evidence.source).toBeTruthy();
      });

      // 8. Ohutus
      expect(entry.safety.toxicityHuman).toBeTruthy();
      expect(entry.safety.toxicityPets).toBeTruthy();

      // 9. Botaanika
      expect(entry.botany.familyEstonian).toBeTruthy();
      expect(entry.botany.recommendedNordicVarieties.length).toBeGreaterThan(0);

      // 10. Usaldusväärsus
      expect(['peer_reviewed', 'institutional_ext', 'empirical_hort']).toContain(entry.reliability.evidenceTier);
      expect(entry.reliability.primarySources.length).toBeGreaterThan(0);
      entry.reliability.primarySources.forEach((s) => {
        expect(s.source).toBeTruthy();
        expect(s.verifiedYear).toBeGreaterThanOrEqual(2020);
      });
    });
  });

  it('provides a valid fallback 10-domain entry for unknown plants', () => {
    const fallback = getPlantEncyclopediaEntry('unknown_herbal_crop', 'Tundmatu Taim');
    expect(fallback.cultivation).toBeDefined();
    expect(fallback.habitat).toBeDefined();
    expect(fallback.growthCycle).toBeDefined();
    expect(fallback.culinary).toBeDefined();
    expect(fallback.ecology).toBeDefined();
    expect(fallback.companions).toBeDefined();
    expect(fallback.healthProblems).toBeDefined();
    expect(fallback.safety).toBeDefined();
    expect(fallback.botany).toBeDefined();
    expect(fallback.reliability).toBeDefined();
  });
});
