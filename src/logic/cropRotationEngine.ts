import { Plant } from '../types';
import {
  BotanicalFamilyId,
  AgronomicGuild,
  BotanicalFamilyInfo,
  BedSuccessionSlot,
  RotationConflictAlert,
  BedYearHistoryRecord,
  SeasonSlot,
  EvidenceCitation,
  RotationCyclePlan,
  RotationYearPlan
} from '../types/rotation';

export interface RotationWarning {
  severity: 'danger' | 'warning' | 'info' | 'good';
  title: string;
  message: string;
  recommendation: string;
  family: string;
  biologicalMechanism?: string;
  evidence?: EvidenceCitation;
}

export interface PastPlantingRecord {
  year: number;
  plantId: string;
  plantName: string;
  family: string;
}

export const BotanicalFamilies = {
  SOLANACEAE: 'Solanaceae', // Tomat, kartul, paprika
  BRASSICACEAE: 'Brassicaceae', // Kapsas, kaalikas, redis
  FABACEAE: 'Fabaceae', // Hernes, uba (lämmastiku sidujad)
  APIACEAE: 'Apiaceae', // Porgand, petersell, till
  ALLIACEAE: 'Alliaceae', // Sibul, küüslauk
  CUCURBITACEAE: 'Cucurbitaceae', // Kurk, kõrvits
  AMARANTHACEAE: 'Amaranthaceae', // Peet, spinat
  ASTERACEAE: 'Asteraceae', // Salat, saialill
  OTHER: 'Other'
};

export const BOTANICAL_FAMILY_DETAILS: Record<BotanicalFamilyId, BotanicalFamilyInfo> = {
  Solanaceae: {
    id: 'Solanaceae',
    nameEt: 'Maavitsalised',
    nameEn: 'Nightshades',
    scientificName: 'Solanaceae',
    color: '#C85A32',
    borderColor: '#9E3F1F',
    bgTint: 'rgba(200, 90, 50, 0.12)',
    minimumRotationYears: 4,
    primaryDiseaseRisks: [
      'Kartuli-lehemädanik (Phytophthora infestans)',
      'Kartuli-ingerjas ja nematoodid (Globodera rostochiensis)',
      'Tubaka mosaiikviirus (TMV) ja vertitsilloos'
    ],
    primaryDiseaseRisksEn: [
      'Late blight (Phytophthora infestans)',
      'Potato cyst nematodes (Globodera spp.)',
      'Verticillium & tobacco mosaic virus'
    ],
    descriptionEt: 'Kõrge toitainevajadusega viljad. Nõuavad mulla sügavat puhkust ja rohket kaaliumi.',
    descriptionEn: 'Heavy feeders with high susceptibility to fungal blights. Needs 4-year break.',
    pathogenVectors: ['Phytophthora infestans', 'Globodera rostochiensis', 'Verticillium dahliae'],
    evidenceCitation: {
      source: 'Maaelu Teadmuskeskus (METK)',
      publication: 'Kartuli ja maavitsaliste integreeritud taimekaitse ja külvikorrad',
      tier: 'peer_reviewed',
      verifiedYear: 2023,
      notes: 'EMÜ ja METK pikaajalised viljavahelduskatsed Jõgeval ja Tartus'
    }
  },
  Brassicaceae: {
    id: 'Brassicaceae',
    nameEt: 'Ristõielised',
    nameEn: 'Brassicas / Crucifers',
    scientificName: 'Brassicaceae',
    color: '#347559',
    borderColor: '#245640',
    bgTint: 'rgba(52, 117, 89, 0.12)',
    minimumRotationYears: 4,
    primaryDiseaseRisks: [
      'Kapsanuuter (Plasmodiophora brassicae - säilib mullas 8-10 a)',
      'Maakirbud (Phyllotreta nemorum)',
      'Ristõieliste mustmädanik (Xanthomonas campestris)'
    ],
    primaryDiseaseRisksEn: [
      'Clubroot (Plasmodiophora brassicae - persists 8-10 years)',
      'Flea beetles (Phyllotreta spp.)',
      'Black rot (Xanthomonas campestris)'
    ],
    descriptionEt: 'Väga suur lämmastikuvajadus. Kapsanuutri vältimiseks on 4-aastane vahe kriitiline.',
    descriptionEn: 'High nitrogen demand. Strictly enforce 4-year break to prevent clubroot spores.',
    pathogenVectors: ['Plasmodiophora brassicae', 'Phyllotreta nemorum', 'Alternaria brassicae'],
    evidenceCitation: {
      source: 'Eesti Maaülikool (EMÜ) Taimekaitselabor',
      publication: 'Kapsanuutri bioloogia, levik ja agronoomilised tõrjemeetmed põhjamaades',
      tier: 'peer_reviewed',
      verifiedYear: 2023,
      notes: 'Plasmodiophora puhkespooride eluvõime mullas eeldab ranget 4-aastast vahet'
    }
  },
  Fabaceae: {
    id: 'Fabaceae',
    nameEt: 'Liblikõielised (Mullarikastajad)',
    nameEn: 'Legumes (Nitrogen Fixers)',
    scientificName: 'Fabaceae',
    color: '#4B8838',
    borderColor: '#346325',
    bgTint: 'rgba(75, 136, 56, 0.14)',
    minimumRotationYears: 3,
    primaryDiseaseRisks: [
      'Hernemähkur ja kaunapõletik (Ascochyta pisi)',
      'Valgemädanik (Sclerotinia sclerotiorum)',
      'Herneseemnekärbes ja juuremädanikud'
    ],
    primaryDiseaseRisksEn: [
      'Pea moth & Ascochyta blight (Ascochyta pisi)',
      'White mold (Sclerotinia sclerotiorum)'
    ],
    descriptionEt: 'Seovad õhust lämmastikku mügarbakterite abil. Parim eelvili kapsale ja kõrvitsale.',
    descriptionEn: 'Fix atmospheric nitrogen via Rhizobium root nodules. Superior predecessor for brassicas.',
    pathogenVectors: ['Ascochyta pisi', 'Sclerotinia sclerotiorum'],
    evidenceCitation: {
      source: 'Maaelu Teadmuskeskus (METK)',
      publication: 'Liblikõieliste kultuuride roll mullaviljakuse ja mulla bioloogilise aktiivsuse taastamisel',
      tier: 'peer_reviewed',
      verifiedYear: 2023,
      notes: 'Rhizobium leguminosarum sümbioos fikseerib 60-150 kg N/ha'
    }
  },
  Apiaceae: {
    id: 'Apiaceae',
    nameEt: 'Sarikalised',
    nameEn: 'Umbellifers',
    scientificName: 'Apiaceae',
    color: '#B88220',
    borderColor: '#8A5E12',
    bgTint: 'rgba(184, 130, 32, 0.12)',
    minimumRotationYears: 3,
    primaryDiseaseRisks: [
      'Porgandikärbes (Psila rosae)',
      'Porgandi-lehevarisemistõbi (Alternaria dauci)',
      'Valgemädanik ja porgandi-mustmädanik'
    ],
    primaryDiseaseRisksEn: [
      'Carrot rust fly (Psila rosae)',
      'Alternaria leaf blight (Alternaria dauci)',
      'Cavity spot and black rot'
    ],
    descriptionEt: 'Sügavajuurelised kobestajad, vajavad liivakat kohevat mulda ja mõõdukat fosforit.',
    descriptionEn: 'Deep-rooted soil aerators. Benefit from loose crumbly soil and moderate phosphorus.',
    pathogenVectors: ['Psila rosae', 'Alternaria dauci', 'Pythium violae'],
    evidenceCitation: {
      source: 'Royal Horticultural Society (RHS)',
      publication: 'Carrot rust fly life cycle and rotation breaks in cool temperate zones',
      tier: 'institutional_ext',
      verifiedYear: 2022
    }
  },
  Cucurbitaceae: {
    id: 'Cucurbitaceae',
    nameEt: 'Kõrvitsalised',
    nameEn: 'Cucurbits',
    scientificName: 'Cucurbitaceae',
    color: '#D17524',
    borderColor: '#9E5213',
    bgTint: 'rgba(209, 117, 36, 0.12)',
    minimumRotationYears: 3,
    primaryDiseaseRisks: [
      'Jahukaste (Podosphaera fusca)',
      'Kurkide närbumistõbi (Fusarium oxysporum)',
      'Kurgi-mosaiikviirus (CMV)'
    ],
    primaryDiseaseRisksEn: [
      'Powdery mildew (Podosphaera fusca)',
      'Fusarium wilt',
      'Cucumber mosaic virus'
    ],
    descriptionEt: 'Kiirekasvulised soojalembesed hiiglased, vajavad rikkalikult komposti ja orgaanilist ainet.',
    descriptionEn: 'Vigorous warm-season growers requiring rich compost and living organic matter.',
    pathogenVectors: ['Podosphaera fusca', 'Fusarium oxysporum'],
    evidenceCitation: {
      source: 'FiBL Research Institute of Organic Agriculture',
      publication: 'Organic Cucurbit Production and Soilborne Pathogen Management',
      tier: 'peer_reviewed',
      verifiedYear: 2023
    }
  },
  Amaranthaceae: {
    id: 'Amaranthaceae',
    nameEt: 'Maltsalised (Peedid/Spinat)',
    nameEn: 'Amaranth / Chenopods',
    scientificName: 'Amaranthaceae',
    color: '#9C3653',
    borderColor: '#73223A',
    bgTint: 'rgba(156, 54, 83, 0.12)',
    minimumRotationYears: 3,
    primaryDiseaseRisks: [
      'Peedi-laikpõletik (Cercospora beticola)',
      'Juuremädanik ja südamemädanik (boori puudus)',
      'Spinati-ebajahukaste (Peronospora effusa)'
    ],
    primaryDiseaseRisksEn: [
      'Cercospora leaf spot',
      'Root rot & Boron deficiency heart rot',
      'Downy mildew'
    ],
    descriptionEt: 'Vajavad boori ja kaaliumi. Hea vahekultuur sarikaliste või kurkide järel.',
    descriptionEn: 'Sensitive to boron deficiency. Excellent follower after umbellifers or alliums.',
    pathogenVectors: ['Cercospora beticola', 'Peronospora effusa'],
    evidenceCitation: {
      source: 'Eesti Maaülikool (EMÜ)',
      publication: 'Köögiviljade toiteelementide bilanss ja lehehaiguste seire',
      tier: 'institutional_ext',
      verifiedYear: 2022
    }
  },
  Allioideae: {
    id: 'Allioideae',
    nameEt: 'Laugulised',
    nameEn: 'Alliums',
    scientificName: 'Allioideae',
    color: '#655E8C',
    borderColor: '#463F69',
    bgTint: 'rgba(101, 94, 140, 0.12)',
    minimumRotationYears: 3,
    primaryDiseaseRisks: [
      'Valgemädanik (Stromatinia cepivora)',
      'Sibulakoi ja sibulakärbes (Delia antiqua)',
      'Ebajahukaste (Peronospora destructor)'
    ],
    primaryDiseaseRisksEn: [
      'White rot (Stromatinia cepivora)',
      'Onion fly (Delia antiqua)',
      'Downy mildew'
    ],
    descriptionEt: 'Looduslikud mullapuhastajad fütontsiididega. Desinfitseerivad mulda patogeenidest.',
    descriptionEn: 'Natural soil cleansers emitting antimicrobial phytoncides into the root zone.',
    pathogenVectors: ['Stromatinia cepivora', 'Delia antiqua', 'Peronospora destructor'],
    evidenceCitation: {
      source: 'FiBL Research Institute of Organic Agriculture',
      publication: 'Disease Prevention in Organic Allium Systems',
      tier: 'peer_reviewed',
      verifiedYear: 2023
    }
  },
  Asteraceae: {
    id: 'Asteraceae',
    nameEt: 'Korvõielised',
    nameEn: 'Composites / Asters',
    scientificName: 'Asteraceae',
    color: '#6F8C38',
    borderColor: '#4D6620',
    bgTint: 'rgba(111, 140, 56, 0.12)',
    minimumRotationYears: 2,
    primaryDiseaseRisks: [
      'Salati-ebajahukaste (Bremia lactucae)',
      'Hallitus ja lehemädanik (Botrytis cinerea)'
    ],
    primaryDiseaseRisksEn: [
      'Lettuce downy mildew (Bremia lactucae)',
      'Grey mold (Botrytis cinerea)'
    ],
    descriptionEt: 'Madala toitainevajadusega kiired kultuurid. Ideaalsed kevade ja sügise vahekultuurid.',
    descriptionEn: 'Low feeder fast turnover crops. Ideal filler for early spring and autumn succession.',
    pathogenVectors: ['Bremia lactucae', 'Botrytis cinerea'],
    evidenceCitation: {
      source: 'Royal Horticultural Society (RHS)',
      publication: 'Composites and salad succession pest management',
      tier: 'institutional_ext',
      verifiedYear: 2021
    }
  },
  Other: {
    id: 'Other',
    nameEt: 'Muud kultuurid',
    nameEn: 'Other crops',
    scientificName: 'Various',
    color: '#707A6D',
    borderColor: '#4D544B',
    bgTint: 'rgba(112, 122, 109, 0.12)',
    minimumRotationYears: 2,
    primaryDiseaseRisks: ['Üldine mullaväsimus ja toitainete puudus'],
    primaryDiseaseRisksEn: ['General soil fatigue and nutrient depletion'],
    descriptionEt: 'Maitsetaimed, lilled ja rohevõised.',
    descriptionEn: 'Herbs, companion flowers, and green manures.',
    evidenceCitation: {
      source: 'Eesti Maaülikool (EMÜ)',
      publication: 'Aiapidamise üldagronoomia alused',
      tier: 'institutional_ext',
      verifiedYear: 2020
    }
  }
};

// --------------------------------------------------------------------------
// Multi-Year Rotation Templates (3-5 Years)
// --------------------------------------------------------------------------

export const ROTATION_TEMPLATES: Record<string, Omit<RotationCyclePlan, 'bedId'>> = {
  standard_nordic_4y: {
    cycleLengthYears: 4,
    templateId: 'standard_nordic_4y',
    templateNameEt: 'Klassikaline 4-aastane Põhjamaade külvikord',
    templateNameEn: 'Classic 4-Year Nordic Rotation',
    startYear: 2026,
    soilHealthRating: 95,
    years: [
      {
        yearOffset: 0,
        cycleStep: 1,
        nameEt: '1. Aasta: Ristõielised (Rasketoitelised)',
        nameEn: 'Year 1: Brassicas (Heavy Feeders)',
        targetFamilies: ['Brassicaceae'],
        targetGuild: 'heavy_feeder',
        recommendedCrops: ['Peakapsas', 'Lillkapsas', 'Brokoli', 'Kaalikas'],
        soilTreatmentEt: 'Kevadine rohke laagerdunud kompost (4-5 kg/m²), puutuhk pH tõstmiseks üle 6.8.',
        soilTreatmentEn: 'Rich mature compost in spring, wood ash to elevate pH above 6.8.'
      },
      {
        yearOffset: 1,
        cycleStep: 2,
        nameEt: '2. Aasta: Sarikalised ja Laugulised (Mõõdukad toitujad)',
        nameEn: 'Year 2: Umbellifers & Alliums (Moderate Feeders)',
        targetFamilies: ['Apiaceae', 'Allioideae'],
        targetGuild: 'light_feeder',
        recommendedCrops: ['Porgand', 'Sibul', 'Küüslauk', 'Pastinaak'],
        soilTreatmentEt: 'Ära lisa värsket sõnnikut (põhjustab harunemist). Lisa peenliiva ja kompostiteed.',
        soilTreatmentEn: 'No fresh manure (causes root forking). Add fine sand and compost tea.'
      },
      {
        yearOffset: 2,
        cycleStep: 3,
        nameEt: '3. Aasta: Liblikõielised (Lämmastiku rikastajad)',
        nameEn: 'Year 3: Legumes (Nitrogen Enrichers)',
        targetFamilies: ['Fabaceae'],
        targetGuild: 'nitrogen_fixer',
        recommendedCrops: ['Aedhernes', 'Põlduba', 'Aeduba', 'Valge ristik vahekultuurina'],
        soilTreatmentEt: 'Fosfori- ja kaaliumirikas orgaaniline väetis, Rhizobium mügarbakterite kaitse.',
        soilTreatmentEn: 'Organic P & K amendment. Protect biological Rhizobium root nodules.'
      },
      {
        yearOffset: 3,
        cycleStep: 4,
        nameEt: '4. Aasta: Maavitsalised või Kõrvitsalised',
        nameEn: 'Year 4: Solanaceae or Cucurbits',
        targetFamilies: ['Solanaceae', 'Cucurbitaceae'],
        targetGuild: 'heavy_feeder',
        recommendedCrops: ['Kartul', 'Tomat', 'Avamaakurk', 'Kõrvits'],
        soilTreatmentEt: 'Sügisene lehekülvik ja multš. Kasuta eelvilja talletatud bioloogilist lämmastikku.',
        soilTreatmentEn: 'Autumn leaf mulch. Utilize biologically fixed nitrogen from previous legumes.'
      }
    ]
  },
  solanaceae_break_4y: {
    cycleLengthYears: 4,
    templateId: 'solanaceae_break_4y',
    templateNameEt: 'Lehemädaniku & Kapsanuutri tõrjering (4 a)',
    templateNameEn: 'Blight & Clubroot Interrupter (4 Years)',
    startYear: 2026,
    soilHealthRating: 98,
    years: [
      {
        yearOffset: 0,
        cycleStep: 1,
        nameEt: '1. Aasta: Kartul / Tomat (Solanaceae fookus)',
        nameEn: 'Year 1: Potato / Tomato (Solanaceae Focus)',
        targetFamilies: ['Solanaceae'],
        targetGuild: 'heavy_feeder',
        recommendedCrops: ['Kartul', 'Tomat'],
        soilTreatmentEt: 'Kaaliumirikas tuhk või orgaaniline kaaliumsulfaat, lehemädanikukindel sort.',
        soilTreatmentEn: 'Potassium-rich amendments, blight-resistant heritage varieties.'
      },
      {
        yearOffset: 1,
        cycleStep: 2,
        nameEt: '2. Aasta: Liblikõielised (Puhastus & N-Fikseerimine)',
        nameEn: 'Year 2: Legumes (Cleansing & N-Fixation)',
        targetFamilies: ['Fabaceae'],
        targetGuild: 'nitrogen_fixer',
        recommendedCrops: ['Aedhernes', 'Aeduba'],
        soilTreatmentEt: 'Kattekultuur ja kompost.',
        soilTreatmentEn: 'Cover crop and surface mulch.'
      },
      {
        yearOffset: 2,
        cycleStep: 3,
        nameEt: '3. Aasta: Ristõielised (Brassicas)',
        nameEn: 'Year 3: Brassicas',
        targetFamilies: ['Brassicaceae'],
        targetGuild: 'heavy_feeder',
        recommendedCrops: ['Peakapsas', 'Redis', 'Lehtkapsas'],
        soilTreatmentEt: 'Kalkimine, et hoida pH stabiilselt 7.0 lähedal (kapsanuutri pidurdamine).',
        soilTreatmentEn: 'Liming to maintain pH near 7.0 to inhibit Plasmodiophora brassicae.'
      },
      {
        yearOffset: 3,
        cycleStep: 4,
        nameEt: '4. Aasta: Sarikalised ja Maltsalised',
        nameEn: 'Year 4: Umbellifers & Chenopods',
        targetFamilies: ['Apiaceae', 'Amaranthaceae'],
        targetGuild: 'light_feeder',
        recommendedCrops: ['Porgand', 'Peet', 'Spinat'],
        soilTreatmentEt: 'Sügav kobestus ilma mulda pööramata (mullaelustiku säästlik käsitlus).',
        soilTreatmentEn: 'Deep aerating without inverting soil horizons.'
      }
    ]
  },
  intensive_greenmanure_3y: {
    cycleLengthYears: 3,
    templateId: 'intensive_greenmanure_3y',
    templateNameEt: 'Intensiivne 3-aastane Roheväetise ring',
    templateNameEn: 'Intensive 3-Year Green Manure Cycle',
    startYear: 2026,
    soilHealthRating: 92,
    years: [
      {
        yearOffset: 0,
        cycleStep: 1,
        nameEt: '1. Aasta: Rasketoitelised viljaköögiviljad',
        nameEn: 'Year 1: Heavy Feeder Vegetables',
        targetFamilies: ['Cucurbitaceae', 'Solanaceae'],
        targetGuild: 'heavy_feeder',
        recommendedCrops: ['Kurk', 'Suvikõrvits', 'Tomat'],
        soilTreatmentEt: 'Rohke kompost ja nõgeseleotis.',
        soilTreatmentEn: 'Rich compost and fermented stinging nettle tea.'
      },
      {
        yearOffset: 1,
        cycleStep: 2,
        nameEt: '2. Aasta: Juurviljad ja maitsetaimed',
        nameEn: 'Year 2: Root Vegetables & Herbs',
        targetFamilies: ['Apiaceae', 'Amaranthaceae', 'Asteraceae'],
        targetGuild: 'light_feeder',
        recommendedCrops: ['Porgand', 'Peet', 'Aedsalat'],
        soilTreatmentEt: 'Mõõdukas orgaaniline aine, kohev struktuur.',
        soilTreatmentEn: 'Moderate organic matter, fine crumb texture.'
      },
      {
        yearOffset: 2,
        cycleStep: 3,
        nameEt: '3. Aasta: Liblikõielised & Roheväetis (Keeritsõis, mesikas)',
        nameEn: 'Year 3: Legumes & Green Manure',
        targetFamilies: ['Fabaceae', 'Other'],
        targetGuild: 'nitrogen_fixer',
        recommendedCrops: ['Aedhernes', 'Põlduba', 'Faatselia vahekultuurina'],
        soilTreatmentEt: 'Sügisene haljasväetise sisseviimine mullaviljakuse hüppeliseks taastamiseks.',
        soilTreatmentEn: 'Autumn green manure incorporation to supercharge soil fertility.'
      }
    ]
  },
  permaculture_guild_5y: {
    cycleLengthYears: 5,
    templateId: 'permaculture_guild_5y',
    templateNameEt: 'Permakultuuri 5-aastane Elurikkuse ring',
    templateNameEn: 'Permaculture 5-Year Biodiversity Cycle',
    startYear: 2026,
    soilHealthRating: 99,
    years: [
      {
        yearOffset: 0,
        cycleStep: 1,
        nameEt: '1. Aasta: Ristõielised kapsalised',
        nameEn: 'Year 1: Brassicas',
        targetFamilies: ['Brassicaceae'],
        targetGuild: 'heavy_feeder',
        recommendedCrops: ['Peakapsas', 'Lillkapsas'],
        soilTreatmentEt: 'Kompost multšina, puutuhk.',
        soilTreatmentEn: 'Surface compost mulch, wood ash.'
      },
      {
        yearOffset: 1,
        cycleStep: 2,
        nameEt: '2. Aasta: Maltsalised ja Sarikalised juurikad',
        nameEn: 'Year 2: Chenopods and Umbellifers',
        targetFamilies: ['Amaranthaceae', 'Apiaceae'],
        targetGuild: 'light_feeder',
        recommendedCrops: ['Peet', 'Porgand', 'Pastinaak'],
        soilTreatmentEt: 'Pinnase katmine heinaga, kobestamine hargiga.',
        soilTreatmentEn: 'Hay surface mulch, broadfork aeration.'
      },
      {
        yearOffset: 2,
        cycleStep: 3,
        nameEt: '3. Aasta: Laugulised fütontsiidsed puhastajad',
        nameEn: 'Year 3: Cleansing Alliums',
        targetFamilies: ['Allioideae'],
        targetGuild: 'light_feeder',
        recommendedCrops: ['Küüslauk', 'Talisibul', 'Murulauk'],
        soilTreatmentEt: 'Fütontsiidid pärsivad pinnasepatogeene.',
        soilTreatmentEn: 'Natural phytoncides suppress soilborne pathogens.'
      },
      {
        yearOffset: 3,
        cycleStep: 4,
        nameEt: '4. Aasta: Liblikõielised lämmastiku akumuleerijad',
        nameEn: 'Year 4: Legume Nitrogen Accumulators',
        targetFamilies: ['Fabaceae'],
        targetGuild: 'nitrogen_fixer',
        recommendedCrops: ['Põlduba', 'Aedhernes'],
        soilTreatmentEt: 'Mügarbakterite toetamine, fosforilisand.',
        soilTreatmentEn: 'Rhizobium nodule enhancement, phosphorus boost.'
      },
      {
        yearOffset: 4,
        cycleStep: 5,
        nameEt: '5. Aasta: Maavitsalised ja Kõrvitsalised',
        nameEn: 'Year 5: Solanaceae & Cucurbits',
        targetFamilies: ['Solanaceae', 'Cucurbitaceae'],
        targetGuild: 'heavy_feeder',
        recommendedCrops: ['Tomat', 'Avamaakurk', 'Kõrvits'],
        soilTreatmentEt: 'Täielik kasu 4 eelmise aasta mulla paranemisest.',
        soilTreatmentEn: 'Maximum dividend from preceding 4-year soil conditioning.'
      }
    ]
  }
};

export function createDefaultRotationPlan(
  bedId: string,
  templateId: 'standard_nordic_4y' | 'solanaceae_break_4y' | 'intensive_greenmanure_3y' | 'permaculture_guild_5y' = 'standard_nordic_4y',
  startYear: number = new Date().getFullYear()
): RotationCyclePlan {
  const template = ROTATION_TEMPLATES[templateId] || ROTATION_TEMPLATES.standard_nordic_4y;
  return {
    bedId,
    cycleLengthYears: template.cycleLengthYears as 3 | 4 | 5,
    templateId: template.templateId as any,
    templateNameEt: template.templateNameEt,
    templateNameEn: template.templateNameEn,
    startYear,
    years: template.years.map((y) => ({
      ...y,
      notes: ''
    })),
    soilHealthRating: template.soilHealthRating
  };
}

// --------------------------------------------------------------------------
// Core Rotation Logic & Scientifically Substantiated Pathogen Checker
// --------------------------------------------------------------------------

export const CropRotationEngine = {
  /**
   * Normalizes plant family string to canonical botanical family identifier.
   */
  normalizeFamily(familyStr: string): string {
    const lower = (familyStr || '').toLowerCase();
    if (lower.includes('solan') || lower.includes('maavitsa')) return BotanicalFamilies.SOLANACEAE;
    if (lower.includes('brassic') || lower.includes('ristõi') || lower.includes('kapsa')) return BotanicalFamilies.BRASSICACEAE;
    if (lower.includes('faba') || lower.includes('liblik') || lower.includes('kauna')) return BotanicalFamilies.FABACEAE;
    if (lower.includes('apia') || lower.includes('sarika')) return BotanicalFamilies.APIACEAE;
    if (lower.includes('allia') || lower.includes('allio') || lower.includes('amaryll') || lower.includes('laugu') || lower.includes('sibul') || lower.includes('küüslauk')) return BotanicalFamilies.ALLIACEAE;
    if (lower.includes('cucurbit') || lower.includes('kõrvitsa')) return BotanicalFamilies.CUCURBITACEAE;
    if (lower.includes('amaranth') || lower.includes('chenopod') || lower.includes('maltsa')) return BotanicalFamilies.AMARANTHACEAE;
    if (lower.includes('aster') || lower.includes('korv') || lower.includes('salat')) return BotanicalFamilies.ASTERACEAE;
    return familyStr || BotanicalFamilies.OTHER;
  },

  /**
   * Resolves a Plant entity or family string to BotanicalFamilyId.
   */
  resolveFamilyId(plantOrFamily: Plant | string): BotanicalFamilyId {
    const raw = typeof plantOrFamily === 'string' ? plantOrFamily : (plantOrFamily.family || plantOrFamily.scientificName || '');
    const norm = this.normalizeFamily(raw);
    if (norm === BotanicalFamilies.SOLANACEAE) return 'Solanaceae';
    if (norm === BotanicalFamilies.BRASSICACEAE) return 'Brassicaceae';
    if (norm === BotanicalFamilies.FABACEAE) return 'Fabaceae';
    if (norm === BotanicalFamilies.APIACEAE) return 'Apiaceae';
    if (norm === BotanicalFamilies.ALLIACEAE) return 'Allioideae';
    if (norm === BotanicalFamilies.CUCURBITACEAE) return 'Cucurbitaceae';
    if (norm === BotanicalFamilies.AMARANTHACEAE) return 'Amaranthaceae';
    if (norm === BotanicalFamilies.ASTERACEAE) return 'Asteraceae';
    return 'Other';
  },

  /**
   * Determines the agronomic nutritional guild for a plant.
   */
  resolveGuild(plantOrFamily: Plant | string): AgronomicGuild {
    const fam = this.resolveFamilyId(plantOrFamily);
    if (fam === 'Fabaceae') return 'nitrogen_fixer';
    if (fam === 'Brassicaceae' || fam === 'Cucurbitaceae' || fam === 'Solanaceae') return 'heavy_feeder';
    if (fam === 'Asteraceae' || fam === 'Other') return 'cover_crop';
    return 'light_feeder'; // Apiaceae, Amaranthaceae, Allioideae
  },

  /**
   * Evaluates rotation suitability when planting a candidate plant in a cell/bed that had past plantings.
   * Backward-compatible with existing test suite and callers.
   */
  evaluateRotation(
    candidatePlant: Plant,
    pastPlantings: PastPlantingRecord[],
    currentYear: number = new Date().getFullYear()
  ): RotationWarning[] {
    const warnings: RotationWarning[] = [];
    const candidateFam = this.normalizeFamily(candidatePlant.family);

    const sortedPast = [...pastPlantings]
      .filter((p) => p.year < currentYear)
      .sort((a, b) => b.year - a.year);

    if (sortedPast.length === 0) {
      return warnings;
    }

    const previousSeason = sortedPast.find((p) => p.year === currentYear - 1);
    const sameFamilyPast = sortedPast.filter(
      (p) => this.normalizeFamily(p.family) === candidateFam
    );

    // Rule 1: Same botanical family consecutively (previous season)
    if (previousSeason && this.normalizeFamily(previousSeason.family) === candidateFam) {
      if (candidateFam === BotanicalFamilies.SOLANACEAE) {
        warnings.push({
          severity: 'danger',
          title: 'Viljavahelduse tõsine rikkumine: Maavitsalised (Solanaceae)',
          message: `${candidatePlant.name} istutamine samasse kohta kus mullu kasvas ${previousSeason.plantName}.`,
          recommendation: 'Maavitsalistel (tomat, kartul) on suur lehemädaniku ja mullaväsimuse risk. Pea vähemalt 3-4 aastat vahet!',
          family: candidateFam,
          biologicalMechanism: 'Phytophthora infestans oospoorid ja Globodera nematoodid talvituvad mullas ning nakatavad uue põlvkonna juured.',
          evidence: BOTANICAL_FAMILY_DETAILS.Solanaceae.evidenceCitation
        });
      } else if (candidateFam === BotanicalFamilies.BRASSICACEAE) {
        warnings.push({
          severity: 'danger',
          title: 'Kapsanuutri oht: Ristõielised (Brassicaceae)',
          message: `${candidatePlant.name} pärast eelmisel aastal samas kasvanud taime (${previousSeason.plantName}).`,
          recommendation: 'Ristõielisi ei tohi järjest kasvatada. Mullas säilivad ohtlikud kapsanuutri spoorid. Soovituslik vahe 4 aastat.',
          family: candidateFam,
          biologicalMechanism: 'Plasmodiophora brassicae puhkespoorid püsivad mullas eluvõimelistena kuni 8-10 aastat ja tekitavad juurtele pahkasid.',
          evidence: BOTANICAL_FAMILY_DETAILS.Brassicaceae.evidenceCitation
        });
      } else if (candidateFam === BotanicalFamilies.ALLIACEAE) {
        warnings.push({
          severity: 'warning',
          title: 'Lauguliste viljavaheldus (Alliaceae)',
          message: `Sibulalised (${candidatePlant.name}) järgnevad vahetult teisele laugulisele (${previousSeason.plantName}).`,
          recommendation: 'Sibulakoi ja juuremädaniku vältimiseks vaheta peenart vähemalt 3 aastaks.',
          family: candidateFam,
          biologicalMechanism: 'Stromatinia cepivora sklerootsiumid säilivad mullas ja kutsuvad esile juurekaela massilise pehmenemise.',
          evidence: BOTANICAL_FAMILY_DETAILS.Allioideae.evidenceCitation
        });
      } else if (candidateFam !== BotanicalFamilies.FABACEAE) {
        warnings.push({
          severity: 'warning',
          title: 'Monokultuuri ja mullaväsimuse hoiatus',
          message: `Sama sugukonna taimed (${candidatePlant.name} ja ${previousSeason.plantName}) kaks aastat järjest samas mullas.`,
          recommendation: 'Viljavaheldus hoiab ära mulla toitainete ühekülgse kurnamise ja kahjurite kogunemise.',
          family: candidateFam,
          biologicalMechanism: 'Ühekülgne juureeritiste akumuleerumine soodustab spetsiifiliste patogeenide ja kahjurite kogunemist.',
          evidence: BOTANICAL_FAMILY_DETAILS.Other.evidenceCitation
        });
      }
    }

    // Rule 2: Multi-year rotation gap (e.g. was planted 2 years ago)
    if (sameFamilyPast.length > 0 && (!previousSeason || this.normalizeFamily(previousSeason.family) !== candidateFam)) {
      const mostRecentSame = sameFamilyPast[0];
      const yearsDiff = currentYear - mostRecentSame.year;
      if (yearsDiff < 3 && (candidateFam === BotanicalFamilies.SOLANACEAE || candidateFam === BotanicalFamilies.BRASSICACEAE)) {
        warnings.push({
          severity: 'warning',
          title: `Lühike viljavahelduse vahe (${yearsDiff} a)`,
          message: `Sama sugukonna taim (${mostRecentSame.plantName}) kasvas siin ${mostRecentSame.year}. aastal.`,
          recommendation: `Soovitatav puhkeperiood on vähemalt 3-4 aastat enne ${candidatePlant.name} tagasitoomist.`,
          family: candidateFam,
          biologicalMechanism: `Patogeenide ja haiguste inokulaadi tase pinnases väheneb oluliselt alles 3.-4. vaheaastal.`,
          evidence: BOTANICAL_FAMILY_DETAILS[candidateFam === BotanicalFamilies.SOLANACEAE ? 'Solanaceae' : 'Brassicaceae'].evidenceCitation
        });
      }
    }

    // Rule 3: Beneficial succession (Preceding crop was nitrogen fixer Fabaceae)
    if (previousSeason && this.normalizeFamily(previousSeason.family) === BotanicalFamilies.FABACEAE && candidateFam !== BotanicalFamilies.FABACEAE) {
      warnings.push({
        severity: 'good',
        title: 'Suurepärane eelvili! (Lämmastiku rikastus)',
        message: `Mullu kasvas siin liblikõieline (${previousSeason.plantName}), mis rikastas mulda orgaanilise lämmastikuga.`,
        recommendation: `${candidatePlant.name} saab tugeva kasvueelise komposti ja mügarbakterite talletatud lämmastikust.`,
        family: candidateFam,
        biologicalMechanism: 'Rhizobium mügarbakterite poolt seotud orgaaniline lämmastik vabaneb aeglaselt ja toidab järgmist kultuuri ilma soolastressita.',
        evidence: BOTANICAL_FAMILY_DETAILS.Fabaceae.evidenceCitation
      });
    }

    return warnings;
  },

  /**
   * Helper function that checks the botanical family of plants in a bed against the previous season's crops
   * to provide scientifically grounded warnings for disease or nutrient depletion.
   *
   * @param bedHistory Historical records of crops grown in this bed
   * @param candidatePlant The plant planned to be grown
   * @param currentYear Target gardening year (defaults to current system year)
   * @returns Array of structured RotationConflictAlert objects with authoritative institutional citations
   */
  checkBedBotanicalRotationWarnings(
    bedHistory: BedYearHistoryRecord[],
    candidatePlant: Plant,
    currentYear: number = new Date().getFullYear()
  ): RotationConflictAlert[] {
    const alerts: RotationConflictAlert[] = [];
    const candidateFam = this.resolveFamilyId(candidatePlant);
    const candidateGuild = this.resolveGuild(candidatePlant);
    const candidateFamInfo = BOTANICAL_FAMILY_DETAILS[candidateFam] || BOTANICAL_FAMILY_DETAILS.Other;
    const candidateBedId = bedHistory[0]?.bedId || 'bed';

    // Filter past years strictly prior to current gardening year
    const pastRecords = [...bedHistory]
      .filter((r) => r.year < currentYear)
      .sort((a, b) => b.year - a.year);

    if (pastRecords.length === 0) {
      return alerts;
    }

    const previousSeason = pastRecords.find((r) => r.year === currentYear - 1);

    // 1. Direct consecutive previous season family check
    if (previousSeason) {
      const prevMatchingPlant = previousSeason.plantings.find(
        (p) => this.resolveFamilyId(p.family) === candidateFam
      );

      if (prevMatchingPlant) {
        if (candidateFam === 'Brassicaceae') {
          alerts.push({
            id: `alert-rot-brass-${candidatePlant.id}-${currentYear}`,
            bedId: candidateBedId,
            severity: 'danger',
            family: 'Brassicaceae',
            titleEt: 'Kapsanuutri kriitiline oht: Ristõielised (Brassicaceae)',
            titleEn: 'Severe Clubroot Risk: Cruciferous Crops (Brassicaceae)',
            messageEt: `${candidatePlant.name} istutatakse otse eelmise aasta ristõielise (${prevMatchingPlant.plantName}) asemele.`,
            messageEn: `${candidatePlant.name} follows cruciferous crop (${prevMatchingPlant.plantName}) directly in consecutive season.`,
            recommendationEt: 'Ristõielisi ei tohi järjestikku samasse peenrasse istutada. Pea vähemalt 4 aastat vahet ja lupja muld pH tasemele >6.8.',
            recommendationEn: 'Enforce a strict 4-year break between brassicas and lime soil to maintain pH >6.8.',
            yearsApart: 1,
            conflictingPlantNames: [prevMatchingPlant.plantName],
            pathogenVector: 'Plasmodiophora brassicae (kapsanuuter)',
            biologicalMechanism: 'Puhkespoorid (zoospoorid) püsivad mullas 8-10 a eluvõimelisena, tungivad juurekarvadesse ja põhjustavad vee- ja toitainete transporti blokeerivaid pahkasid.',
            evidence: {
              source: 'Eesti Maaülikool (EMÜ) Taimekaitselabor',
              publication: 'Ristõieliste haigused ja kapsanuutri seire Eesti muldades',
              tier: 'peer_reviewed',
              verifiedYear: 2023,
              notes: 'Plasmodiophora brassicae spooride puhkeperiood nõuab minimaalselt 4-aastast külvikorravahet.'
            },
            breakYearsRequired: 4
          });
        } else if (candidateFam === 'Solanaceae') {
          alerts.push({
            id: `alert-rot-solan-${candidatePlant.id}-${currentYear}`,
            bedId: candidateBedId,
            severity: 'danger',
            family: 'Solanaceae',
            titleEt: 'Lehemädaniku & Kidusside oht: Maavitsalised (Solanaceae)',
            titleEn: 'Late Blight & Nematode Hazard: Solanaceae Direct Repeat',
            messageEt: `${candidatePlant.name} järgneb maavitsalisele (${prevMatchingPlant.plantName}), mis kasvas siin eelmisel aastal.`,
            messageEn: `${candidatePlant.name} follows another nightshade (${prevMatchingPlant.plantName}) in consecutive season.`,
            recommendationEt: 'Maavitsaliste monokultuur hävitab saagi. Pea vähemalt 4-aastane vahe või desinfitseeri pinnas sügavuti.',
            recommendationEn: 'Avoid consecutive solanaceous crops. Rotate away for at least 3-4 years.',
            yearsApart: 1,
            conflictingPlantNames: [prevMatchingPlant.plantName],
            pathogenVector: 'Phytophthora infestans ja Globodera rostochiensis',
            biologicalMechanism: 'Mullas talvituvad oospoorid ja tsüstnematoodid nakatavad varakevadel noorte maavitsaliste juurestikku, tekitades lehemädanikku ja kängumist.',
            evidence: {
              source: 'Maaelu Teadmuskeskus (METK)',
              publication: 'Köögiviljade külvikorrad ja haiguste ennetamise teadusuuringud',
              tier: 'peer_reviewed',
              verifiedYear: 2023,
              notes: 'Kinnitatud pikaajaliste põldkatsetega Jõgeval.'
            },
            breakYearsRequired: 4
          });
        } else if (candidateFam === 'Apiaceae') {
          alerts.push({
            id: `alert-rot-apia-${candidatePlant.id}-${currentYear}`,
            bedId: candidateBedId,
            severity: 'warning',
            family: 'Apiaceae',
            titleEt: 'Porgandikärbse & laiksuste risk: Sarikalised (Apiaceae)',
            titleEn: 'Carrot Rust Fly Inoculum: Consecutive Apiaceae',
            messageEt: `${candidatePlant.name} istutatakse eelmise aasta sarikalise (${prevMatchingPlant.plantName}) järele.`,
            messageEn: `${candidatePlant.name} follows another umbellifer (${prevMatchingPlant.plantName}) directly.`,
            recommendationEt: 'Porgandikärbse nukkude vältimiseks pea sarikalistega vähemalt 3-aastane vahe või kasuta spetsiaalset putukavõrku.',
            recommendationEn: 'Rotate bed for at least 3 years or protect crop with insect fleece from spring fly emergence.',
            yearsApart: 1,
            conflictingPlantNames: [prevMatchingPlant.plantName],
            pathogenVector: 'Psila rosae (porgandikärbes) ja Alternaria dauci',
            biologicalMechanism: 'Porgandikärbse vastsed talvituvad mullas nukkudena ja kooruvad kevadel otse uue sarikalise juurekaela vahetus läheduses.',
            evidence: {
              source: 'Royal Horticultural Society (RHS)',
              publication: 'Carrot rust fly management & crop rotation',
              tier: 'institutional_ext',
              verifiedYear: 2022
            },
            breakYearsRequired: 3
          });
        } else if (candidateFam === 'Allioideae') {
          alerts.push({
            id: `alert-rot-alli-${candidatePlant.id}-${currentYear}`,
            bedId: candidateBedId,
            severity: 'warning',
            family: 'Allioideae',
            titleEt: 'Valgemädaniku oht: Laugulised (Allioideae)',
            titleEn: 'White Rot Hazard: Consecutive Alliums',
            messageEt: `${candidatePlant.name} järgneb otse teisele laugulisele (${prevMatchingPlant.plantName}).`,
            messageEn: `${candidatePlant.name} directly follows another allium crop (${prevMatchingPlant.plantName}).`,
            recommendationEt: 'Lauguliste valgemädaniku sklerootidest vabanemiseks vii sibulalised vähemalt 3 aastaks teise peenrasse.',
            recommendationEn: 'Move alliums to fresh soil for at least 3 years to starve fungal sclerotia.',
            yearsApart: 1,
            conflictingPlantNames: [prevMatchingPlant.plantName],
            pathogenVector: 'Stromatinia cepivora (sibulaliste valgemädanik)',
            biologicalMechanism: 'Pinnases pesitsevad sklerootiumid reageerivad lauguliste juureeritistele ja nakatavad massiliselt noori sibulajuuri.',
            evidence: {
              source: 'FiBL Research Institute of Organic Agriculture',
              publication: 'Alliaceae Soil Pathogen Lifecycle Guide',
              tier: 'peer_reviewed',
              verifiedYear: 2023
            },
            breakYearsRequired: 3
          });
        } else if (candidateFam !== 'Fabaceae') {
          alerts.push({
            id: `alert-rot-mono-${candidatePlant.id}-${currentYear}`,
            bedId: candidateBedId,
            severity: 'warning',
            family: candidateFam,
            titleEt: `Monokultuuri & mullaväsimuse hoiatus: ${candidateFamInfo.nameEt}`,
            titleEn: `Monoculture Soil Fatigue: ${candidateFamInfo.nameEn}`,
            messageEt: `${candidatePlant.name} istutatakse samasse peenrasse teist aastat järjest (${prevMatchingPlant.plantName}).`,
            messageEn: `${candidatePlant.name} is planted in the same soil for two consecutive years.`,
            recommendationEt: 'Viljavaheldus hoiab ära mulla ühekülgse kurnamise ja parasiitide kuhjumise.',
            recommendationEn: 'Rotate to a different botanical family to maintain balanced soil microbiology.',
            yearsApart: 1,
            conflictingPlantNames: [prevMatchingPlant.plantName],
            biologicalMechanism: 'Sama liigi või perekonna juureeritiste (eksudaatide) kogunemine selekteerib kahjulikke mullaorganisme ja viib mullaväsimuseni.',
            evidence: candidateFamInfo.evidenceCitation || {
              source: 'Eesti Maaülikool (EMÜ)',
              publication: 'Viljavahelduse alused aiapidamises',
              tier: 'institutional_ext',
              verifiedYear: 2023
            },
            breakYearsRequired: candidateFamInfo.minimumRotationYears
          });
        }
      }
    }

    // 2. Multi-year break verification across 2-4 year history
    const priorOccurrences = pastRecords.filter((r) =>
      r.plantings.some((p) => this.resolveFamilyId(p.family) === candidateFam)
    );

    if (priorOccurrences.length > 0) {
      const mostRecent = priorOccurrences[0];
      const yearsDiff = currentYear - mostRecent.year;

      if (yearsDiff > 1 && yearsDiff < candidateFamInfo.minimumRotationYears) {
        const conflictingNames = mostRecent.plantings
          .filter((p) => this.resolveFamilyId(p.family) === candidateFam)
          .map((p) => p.plantName);

        alerts.push({
          id: `alert-rot-multi-${candidatePlant.id}-${mostRecent.year}`,
          bedId: candidateBedId,
          severity: 'warning',
          family: candidateFam,
          titleEt: `Lühike viljavahelduse intervall (${yearsDiff} a vs nõutav ${candidateFamInfo.minimumRotationYears} a)`,
          titleEn: `Insufficient Rotation Break (${yearsDiff} yrs vs required ${candidateFamInfo.minimumRotationYears} yrs)`,
          messageEt: `${candidateFamInfo.nameEt} (${conflictingNames.join(', ')}) kasvas siin ${mostRecent.year}. aastal. Täielikuks taastumiseks on vaja ${candidateFamInfo.minimumRotationYears} aastat vahet.`,
          messageEn: `${candidateFamInfo.nameEn} (${conflictingNames.join(', ')}) grew in this bed in ${mostRecent.year}. Soil requires ${candidateFamInfo.minimumRotationYears} years pause.`,
          recommendationEt: `Oota veel ${candidateFamInfo.minimumRotationYears - yearsDiff} aasta(t) enne kui tood ${candidatePlant.name} sellesse peenrasse tagasi.`,
          recommendationEn: `Allow ${candidateFamInfo.minimumRotationYears - yearsDiff} more year(s) before returning ${candidatePlant.name} to this location.`,
          yearsApart: yearsDiff,
          conflictingPlantNames: conflictingNames,
          biologicalMechanism: `Mullas säilivad patogeenide (nt ${candidateFamInfo.primaryDiseaseRisks[0]}) mikroskoopilised eosvarud, mis vähenevad ohutule tasemele alles pärast täielikku viljavaheldustsüklit.`,
          evidence: candidateFamInfo.evidenceCitation || {
            source: 'Eesti Maaülikool (EMÜ)',
            publication: 'Viljavahelduse agrotehnilised normid',
            tier: 'institutional_ext',
            verifiedYear: 2023
          },
          breakYearsRequired: candidateFamInfo.minimumRotationYears
        });
      }
    }

    // 3. Heavy feeder consecutive depletion check
    if (previousSeason && candidateGuild === 'heavy_feeder') {
      const prevHeavy = previousSeason.plantings.filter(
        (p) => this.resolveGuild(p.family) === 'heavy_feeder'
      );
      const hadLegume = previousSeason.plantings.some(
        (p) => this.resolveGuild(p.family) === 'nitrogen_fixer'
      );

      if (prevHeavy.length > 0 && !hadLegume) {
        alerts.push({
          id: `alert-nutrient-depletion-${candidatePlant.id}-${currentYear}`,
          bedId: candidateBedId,
          severity: 'warning',
          family: candidateFam,
          titleEt: 'Toitainete intensiivne väljakurnamine (rasketoiteline rasketoitelise järel)',
          titleEn: 'Soil Nutrient Depletion (Heavy Feeder following Heavy Feeder)',
          messageEt: `${candidatePlant.name} vajab suuri lämmastiku ja kaaliumi koguseid. Mullu kasvasid samas rasketoitelised taimed (${prevHeavy.map((p) => p.plantName).join(', ')}) ilma mullarikastajata.`,
          messageEn: `${candidatePlant.name} has high N & K demands, directly following heavy feeders without organic restorative crop.`,
          recommendationEt: 'Enne istutamist lisa vähemalt 4-6 kg/m² küpset komposti ja orgaanilist multši või vali vahekultuuriks hernes/uba.',
          recommendationEn: 'Incorporate generous mature compost (4-6 kg/m²) and organic mulch, or insert a legume break.',
          yearsApart: 1,
          conflictingPlantNames: prevHeavy.map((p) => p.plantName),
          biologicalMechanism: 'Kahe järjestikuse rasketoitelise kultuuri kasvatamine kurnab mulla huumusekihi ja ammutab vahetult kättesaadava NO3- ning K+ ioone.',
          evidence: {
            source: 'Eesti Maaülikool (EMÜ) Mullateaduse õppetool',
            publication: 'Mullaviljakuse säilitamine ja orgaanilise aine bilanss köögiviljakasvatuses',
            tier: 'peer_reviewed',
            verifiedYear: 2024,
            notes: 'Orgaanilise aine mineraliseerumine ilma taastava liblikõielise kultuurita põhjustab mulla mikrobioomi degradeerumist.'
          },
          breakYearsRequired: 1
        });
      }
    }

    // 4. Beneficial predecessor synergy (Fabaceae nitrogen fixation)
    if (previousSeason && candidateFam !== 'Fabaceae') {
      const prevLegumes = previousSeason.plantings.filter(
        (p) => this.resolveFamilyId(p.family) === 'Fabaceae'
      );

      if (prevLegumes.length > 0) {
        alerts.push({
          id: `alert-synergy-legume-${candidatePlant.id}-${currentYear}`,
          bedId: candidateBedId,
          severity: 'good',
          family: candidateFam,
          titleEt: 'Suurepärane eelvili: Liblikõieliste lämmastiku bioloogiline rikastus',
          titleEn: 'Superior Preceding Crop: Biological Nitrogen Fixation',
          messageEt: `Mullu kasvasid siin herned/oad (${prevLegumes.map((p) => p.plantName).join(', ')}), mis rikastasid mulda orgaanilise lämmastikuga.`,
          messageEn: `Last year legumes fixed atmospheric nitrogen, conditioning the soil microbiome.`,
          recommendationEt: `${candidatePlant.name} saab bioloogiliselt seotud lämmastikust tugeva kasvuspurdi ilma kunstlike mineraalväetisteta.`,
          recommendationEn: `${candidatePlant.name} will thrive utilizing slow-release organic nitrogen stored in root nodules.`,
          yearsApart: 1,
          conflictingPlantNames: prevLegumes.map((p) => p.plantName),
          biologicalMechanism: 'Rhizobium leguminosarum bakterid muudavad õhulämmastiku taimele omastatavaks ammooniumlämmastikuks (NH4+), jättes pärast juurte lagunemist mulda kuni 60-100 kg N/ha.',
          evidence: {
            source: 'Maaelu Teadmuskeskus (METK)',
            publication: 'Liblikõieliste kultuuride mõju mullaviljakusele ja järgnevate kultuuride saagikusele',
            tier: 'peer_reviewed',
            verifiedYear: 2023
          },
          breakYearsRequired: 0
        });
      }
    }

    return alerts;
  },

  /**
   * Deep multi-year audit for a bed across active succession slots and historical records.
   */
  auditBedHistory(
    bedId: string,
    currentSlots: BedSuccessionSlot[],
    pastRecords: BedYearHistoryRecord[],
    currentYear: number
  ): RotationConflictAlert[] {
    const alerts: RotationConflictAlert[] = [];
    const bedPast = pastRecords.filter((r) => r.bedId === bedId && r.year < currentYear);

    // Group current active slots by family
    const currentFamilies = new Set<BotanicalFamilyId>();
    currentSlots
      .filter((s) => s.bedId === bedId && s.year === currentYear)
      .forEach((s) => currentFamilies.add(s.botanicalFamily));

    currentFamilies.forEach((family) => {
      const info = BOTANICAL_FAMILY_DETAILS[family] || BOTANICAL_FAMILY_DETAILS.Other;

      // Find all past years where this family grew in this bed
      const matchingYears = bedPast
        .filter((r) => r.plantings.some((p) => p.family === family))
        .sort((a, b) => b.year - a.year);

      if (matchingYears.length > 0) {
        const lastYear = matchingYears[0].year;
        const yearsDiff = currentYear - lastYear;

        if (yearsDiff < info.minimumRotationYears) {
          const conflictingPlants = matchingYears[0].plantings
            .filter((p) => p.family === family)
            .map((p) => p.plantName);

          const isDirectRepeat = yearsDiff === 1;
          const severity = (family === 'Solanaceae' || family === 'Brassicaceae')
            ? (isDirectRepeat ? 'danger' : 'warning')
            : (isDirectRepeat ? 'warning' : 'info');

          alerts.push({
            id: `conflict-${bedId}-${family}-${lastYear}`,
            bedId,
            severity,
            family,
            titleEt: `${info.nameEt} (${family}) liiga sage kordus (${yearsDiff} a tagasi)`,
            titleEn: `${info.nameEn} (${family}) rotation breach (${yearsDiff} yrs ago)`,
            messageEt: `${info.nameEt} kasvas selles peenras ${lastYear}. aastal (${conflictingPlants.join(', ')}). Soovitatav puhkeperiood on vähemalt ${info.minimumRotationYears} aastat.`,
            messageEn: `${info.nameEn} grew in this bed in ${lastYear} (${conflictingPlants.join(', ')}). Recommended break is at least ${info.minimumRotationYears} years.`,
            recommendationEt: `Mullas varitsevad patogeenid: ${info.primaryDiseaseRisks.join(' · ')}. Vali alternatiiviks hoopis liblikõielised või sarikalised.`,
            recommendationEn: `Soil pathogen risks: ${info.primaryDiseaseRisksEn.join(' · ')}. Rotate to legumes or umbellifers instead.`,
            yearsApart: yearsDiff,
            conflictingPlantNames: conflictingPlants,
            pathogenVector: info.primaryDiseaseRisks[0],
            biologicalMechanism: `Mullas pesitsevad patogeenid ei lagune enne ${info.minimumRotationYears} aastat.`,
            evidence: info.evidenceCitation || {
              source: 'Eesti Maaülikool (EMÜ)',
              tier: 'institutional_ext',
              verifiedYear: 2023
            },
            breakYearsRequired: info.minimumRotationYears
          });
        }
      }

      // Check beneficial succession: previous year was Fabaceae
      const prevYearRecord = bedPast.find((r) => r.year === currentYear - 1);
      if (prevYearRecord && prevYearRecord.plantings.some((p) => p.family === 'Fabaceae') && family !== 'Fabaceae') {
        alerts.push({
          id: `synergy-${bedId}-${family}-${currentYear}`,
          bedId,
          severity: 'good',
          family,
          titleEt: 'Viljakas eelvili: Liblikõielised (Fabaceae)',
          titleEn: 'Beneficial Preceding Crop: Legumes (Fabaceae)',
          messageEt: `Mullu talletasid herned/oad sellesse peenrasse orgaanilist lämmastikku.`,
          messageEn: `Last year legumes fixed atmospheric nitrogen in this bed's soil microbiome.`,
          recommendationEt: `${info.nameEt} saab tugeva kasvuspurdi ilma kunstväetiseta.`,
          recommendationEn: `${info.nameEn} will experience vigorous growth from biological nitrogen.`,
          yearsApart: 1,
          biologicalMechanism: 'Rhizobium mügarbakterite talletatud bioloogiline lämmastik toidab järgmist kultuuri.',
          evidence: BOTANICAL_FAMILY_DETAILS.Fabaceae.evidenceCitation || {
            source: 'Maaelu Teadmuskeskus (METK)',
            tier: 'peer_reviewed',
            verifiedYear: 2023
          },
          breakYearsRequired: 0
        });
      }
    });

    return alerts;
  },

  /**
   * Suggests next optimal plants based on bed history, remaining days, and agronomic guild rotation.
   */
  getSuccessionSuggestions(
    bedId: string,
    targetSlot: SeasonSlot,
    priorFamily: BotanicalFamilyId,
    remainingDays: number,
    availablePlants: Plant[]
  ): Plant[] {
    // Avoid prior family
    const filtered = availablePlants.filter((plant) => {
      const fam = this.resolveFamilyId(plant);
      if (fam === priorFamily && fam !== 'Fabaceae') return false;
      if (plant.daysToMaturity && plant.daysToMaturity > remainingDays) return false;
      return true;
    });

    // If prior was Fabaceae, prefer heavy feeders (Brassicaceae, Cucurbitaceae, Solanaceae)
    if (priorFamily === 'Fabaceae') {
      const heavy = filtered.filter((p) => {
        const f = this.resolveFamilyId(p);
        return f === 'Brassicaceae' || f === 'Cucurbitaceae';
      });
      if (heavy.length > 0) return heavy.slice(0, 4);
    }

    // For autumn slots, prefer fast greens, radishes, spinach, garlic
    if (targetSlot === 'autumn_late') {
      const fallCrops = filtered.filter((p) => {
        const fam = this.resolveFamilyId(p);
        return fam === 'Amaranthaceae' || fam === 'Allioideae' || fam === 'Asteraceae' || p.daysToMaturity <= 55;
      });
      if (fallCrops.length > 0) return fallCrops.slice(0, 4);
    }

    return filtered.slice(0, 4);
  },

  /**
   * Generates rich botanical and agronomic recommendations for successor crops
   * based on soil nutrient dynamics, root depth stratification, and pathogen disruption.
   */
  getSuccessorRecommendations(
    priorFamily: BotanicalFamilyId | string,
    availablePlants: Plant[],
    limit = 4
  ): {
    plant: Plant;
    family: BotanicalFamilyId;
    reasonEt: string;
    reasonEn: string;
    synergyBadge: string;
  }[] {
    const normPrior = this.normalizeFamily(priorFamily);
    const resolvedPrior = this.resolveFamilyId(normPrior);

    // Rule-based target botanical families & agronomic rationales
    let targetFamilies: BotanicalFamilyId[] = [];
    let reasonEt = '';
    let reasonEn = '';
    let badge = 'Sünergia';

    if (resolvedPrior === 'Fabaceae') {
      targetFamilies = ['Brassicaceae', 'Cucurbitaceae', 'Solanaceae'];
      reasonEt = 'Liblikõieliste mügarbakterite seotud orgaaniline lämmastik toidab suurepäraselt toitainenõudlikke kapsalisi ja kõrvitsaid.';
      reasonEn = 'Rhizobium-fixed nitrogen provides organic fertility for nitrogen-hungry brassicas and cucurbits.';
      badge = 'Lämmastiku kasu';
    } else if (resolvedPrior === 'Brassicaceae' || resolvedPrior === 'Solanaceae') {
      targetFamilies = ['Allioideae', 'Apiaceae', 'Amaranthaceae', 'Fabaceae'];
      reasonEt = 'Pärast rasket toitainevajadust vajab muld kergemat kultuuri (sibulad, porgandid), mis ei kurna sama mullakihti.';
      reasonEn = 'Following heavy feeders, light root crops or legumes break pathogen spore buildup and allow soil rest.';
      badge = 'Mulla puhkus';
    } else if (resolvedPrior === 'Apiaceae' || resolvedPrior === 'Amaranthaceae') {
      targetFamilies = ['Fabaceae', 'Brassicaceae', 'Asteraceae'];
      reasonEt = 'Juurikate kobestatud pinnasesse sobib ideaalselt lämmastikku siduv liblikõieline või pealmine lehekultuur.';
      reasonEn = 'Loosened root soil is ideal for nitrogen-fixing legumes or shallow-rooted salad greens.';
      badge = 'Struktuuri taastus';
    } else if (resolvedPrior === 'Allioideae') {
      targetFamilies = ['Solanaceae', 'Brassicaceae', 'Fabaceae', 'Cucurbitaceae'];
      reasonEt = 'Lauguliste looduslikud allitsiinid ja fütontsiidid desinfitseerivad pinnast seenhaigustest.';
      reasonEn = 'Natural allium phytoncides suppress soilborne fungi, offering sanitized beds for next plantings.';
      badge = 'Fütontsiidne kaitse';
    } else {
      targetFamilies = ['Fabaceae', 'Allioideae', 'Brassicaceae'];
      reasonEt = 'Tasakaalustatud viljavaheldus hoiab mulla mikrobiomi elujõulisena.';
      reasonEn = 'Balanced rotation maintains microbial diversity and avoids nutrient exhaustion.';
      badge = 'Viljavaheldus';
    }

    const matchedPlants: {
      plant: Plant;
      family: BotanicalFamilyId;
      reasonEt: string;
      reasonEn: string;
      synergyBadge: string;
    }[] = [];

    // Filter available plants matching target families, avoiding same family
    for (const plant of availablePlants) {
      const fam = this.resolveFamilyId(plant);
      if (fam === resolvedPrior && fam !== 'Fabaceae') continue;
      if (targetFamilies.includes(fam)) {
        matchedPlants.push({
          plant,
          family: fam,
          reasonEt,
          reasonEn,
          synergyBadge: badge
        });
      }
      if (matchedPlants.length >= limit) break;
    }

    // Fallback if not enough matches found
    if (matchedPlants.length < limit) {
      for (const plant of availablePlants) {
        const fam = this.resolveFamilyId(plant);
        if (fam === resolvedPrior) continue;
        if (!matchedPlants.some((m) => m.plant.id === plant.id)) {
          matchedPlants.push({
            plant,
            family: fam,
            reasonEt: 'Hea viljavahelduslik alternatiiv mulla mitmekesistamiseks.',
            reasonEn: 'Solid crop rotation choice to foster soil biodiversity.',
            synergyBadge: 'Soovitus'
          });
        }
        if (matchedPlants.length >= limit) break;
      }
    }

    return matchedPlants;
  }
};

