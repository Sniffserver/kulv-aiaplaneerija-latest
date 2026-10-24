export type BotanicalFamilyId =
  | 'Solanaceae'
  | 'Brassicaceae'
  | 'Fabaceae'
  | 'Apiaceae'
  | 'Cucurbitaceae'
  | 'Amaranthaceae'
  | 'Allioideae'
  | 'Asteraceae'
  | 'Other';

export type AgronomicGuild =
  | 'heavy_feeder' // High N/K demand (Cabbage, Squash, Tomato, Corn)
  | 'light_feeder' // Moderate demand (Carrot, Beet, Onion, Radish)
  | 'nitrogen_fixer' // Soil enricher (Peas, Beans, Clover)
  | 'cover_crop'; // Soil cleanser / deep rooter (Rye, Phacelia, Buckwheat)

export type SeasonSlot =
  | 'early_spring' // March - May (cold hardy greens, radishes, onion sets)
  | 'main_crop' // May - August (warm season crops, fruiting vegetables)
  | 'autumn_late'; // August - November (fall greens, winter roots, garlic, cover crops)

export type CropProtectionType =
  | 'none' // Avamaa (Open ground)
  | 'fleece' // Katteloor 17-30g (+10 to +14 days)
  | 'cold_frame' // Külmlava (+14 to +18 days)
  | 'greenhouse'; // Kasvuhoone (+21 to +28 days)

export type EstonianRegionId =
  | 'north_coast' // Zone 5b/6a: Tallinn, Viimsi, Lahemaa
  | 'central' // Zone 5a: Paide, Rapla, Jõgeva, Pandivere
  | 'southeast' // Zone 4b/5a: Tartu, Võru, Valga, Setomaa
  | 'islands'; // Zone 6a/6b: Saaremaa, Hiiumaa, Muhu

/**
 * Scientifically grounded evidence classification:
 * - peer_reviewed: Controlled university/institute agronomy studies
 * - institutional_ext: Agricultural research centres (METK, EMÜ, RHS, FiBL)
 * - empirical_hort: Documented commercial master grower trials
 * - traditional: Folk wisdom / companion lore (must include scientific scrutiny note)
 */
export type EvidenceTier = 'peer_reviewed' | 'institutional_ext' | 'empirical_hort' | 'traditional';

export interface EvidenceCitation {
  source: string; // e.g. "Eesti Maaülikool (EMÜ)", "Maaelu Teadmuskeskus (METK)", "RHS"
  publication?: string;
  tier: EvidenceTier;
  url?: string;
  verifiedYear: number;
  notes?: string;
}

export interface BotanicalFamilyInfo {
  id: BotanicalFamilyId;
  nameEt: string;
  nameEn: string;
  scientificName: string;
  color: string;
  borderColor: string;
  bgTint: string;
  minimumRotationYears: number;
  primaryDiseaseRisks: string[];
  primaryDiseaseRisksEn: string[];
  descriptionEt: string;
  descriptionEn: string;
  pathogenVectors?: string[];
  evidenceCitation?: EvidenceCitation;
}

export interface BedSuccessionSlot {
  id: string;
  bedId: string;
  year: number;
  seasonSlot: SeasonSlot;
  plantId: string;
  plantName: string;
  plantNameEn?: string;
  plantIcon?: string;
  variety?: string;
  botanicalFamily: BotanicalFamilyId;
  guild: AgronomicGuild;
  sowDate: string; // MM-DD or YYYY-MM-DD
  transplantDate?: string; // MM-DD or YYYY-MM-DD
  harvestDate: string; // MM-DD or YYYY-MM-DD
  daysToMaturity: number;
  protectionType: CropProtectionType;
  notes?: string;
}

export interface RotationConflictAlert {
  id: string;
  bedId: string;
  severity: 'danger' | 'warning' | 'info' | 'good';
  family: BotanicalFamilyId;
  titleEt: string;
  titleEn: string;
  messageEt: string;
  messageEn: string;
  recommendationEt: string;
  recommendationEn: string;
  yearsApart?: number;
  conflictingPlantNames?: string[];
  pathogenVector?: string;
  biologicalMechanism: string;
  evidence: EvidenceCitation;
  breakYearsRequired: number;
}

export interface FrostAlert {
  id: string;
  slotId: string;
  bedId: string;
  plantName: string;
  severity: 'danger' | 'warning';
  titleEt: string;
  titleEn: string;
  messageEt: string;
  messageEn: string;
  recommendedActionEt: string;
  recommendedActionEn: string;
  daysAtRisk: number;
  frostPhase: 'spring_frost' | 'autumn_frost';
}

export interface BedYearHistoryRecord {
  bedId: string;
  year: number;
  plantings: {
    plantId: string;
    plantName: string;
    plantNameEn?: string;
    plantIcon?: string;
    family: BotanicalFamilyId;
    guild: AgronomicGuild;
  }[];
}

// -------------------------------------------------------------
// 3-5 Year Rotation Cycle Planning Types
// -------------------------------------------------------------

export interface RotationYearPlan {
  yearOffset: number; // 0, 1, 2, 3, 4 (0 = 2026, 1 = 2027 etc.)
  cycleStep: number; // 1 to N
  nameEt: string;
  nameEn: string;
  targetFamilies: BotanicalFamilyId[];
  targetGuild: AgronomicGuild;
  recommendedCrops: string[];
  soilTreatmentEt: string;
  soilTreatmentEn: string;
  notes?: string;
}

export interface RotationCyclePlan {
  bedId: string;
  cycleLengthYears: 3 | 4 | 5;
  templateId:
    'standard_nordic_4y' | 'solanaceae_break_4y' | 'intensive_greenmanure_3y' | 'permaculture_guild_5y' | 'custom';
  templateNameEt: string;
  templateNameEn: string;
  startYear: number;
  years: RotationYearPlan[];
  soilHealthRating?: number; // 0 - 100
}

// -------------------------------------------------------------
// 10-Domain Plant Encyclopedia Types
// -------------------------------------------------------------

export interface CompanionAgronomicRelation {
  plantId: string;
  plantName: string;
  relationship: 'beneficial' | 'antagonistic';
  biologicalMechanism: string;
  evidence: EvidenceCitation;
}

export interface HealthProblemEntry {
  name: string;
  type: 'pest' | 'disease' | 'deficiency';
  symptoms: string;
  biologicalRemedy: string;
  evidence: EvidenceCitation;
}

export interface Plant10DomainEncyclopedia {
  plantId: string;
  plantNameEt: string;
  plantNameEn: string;
  scientificName: string;
  family: BotanicalFamilyId;
  cultivation: {
    sowingDepthCm: number;
    germinationDays: string;
    germinationTempC: string;
    spacingInRowCm: number;
    spacingBetweenRowsCm: number;
    thinningAdvice: string;
    wateringFrequency: string;
    fertilizationAdvice: string;
  };
  habitat: {
    sunRequirement: 'Täispäike (6+ h)' | 'Osaline vari' | 'Vari';
    soilType: string;
    optimalPh: string;
    drainage: string;
    containerSuitability: boolean;
    containerVolumeLiters?: number;
  };
  growthCycle: {
    germinationPhase: string;
    vegetativeGrowth: string;
    floweringPhase: string;
    harvestPhase: string;
    seedSavingTime: string;
    daysToMaturity: number;
  };
  culinary: {
    edibleParts: string[];
    flavorProfile: string;
    culinaryUses: string[];
    storageAndPreservation: string;
  };
  ecology: {
    pollinators: string[];
    beneficialInsects: string[];
    biodiversityImpact: string;
    potentialInvasiveRisk: string;
  };
  companions: {
    beneficial: CompanionAgronomicRelation[];
    antagonistic: CompanionAgronomicRelation[];
  };
  healthProblems: HealthProblemEntry[];
  safety: {
    toxicityHuman: string;
    toxicityPets: string;
    allergies: string;
    contraindications: string;
  };
  botany: {
    familyEstonian: string;
    familyScientific: string;
    lifeCycle: 'Üheaastane' | 'Kaheaastane' | 'Mitmeaastane';
    matureHeightCm: string;
    floweringPeriod: string;
    recommendedNordicVarieties: string[];
  };
  reliability: {
    evidenceTier: EvidenceTier;
    primarySources: EvidenceCitation[];
    lastUpdated: string;
    peerReviewNotes: string;
  };
}
