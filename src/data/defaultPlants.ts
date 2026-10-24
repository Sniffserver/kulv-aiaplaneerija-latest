import { Plant } from '../types';
import rawPlants from '../assets/data/plants.json';

// English translations and agronomy metadata mapping for Nordic plants
const PLANT_METADATA_EXTENSIONS: Record<
  string,
  {
    nameEn: string;
    hardinessZone?: string;
    targetPh?: string;
    soilPreference?: string;
    optimalSow?: string;
    optimalPlantOut?: string;
    optimalHarvest?: string;
  }
> = {
  tomat: {
    nameEn: 'Tomato',
    hardinessZone: 'Zone 4-8 (greenhouse/protected)',
    targetPh: '6.0–6.8',
    soilPreference: 'Rikkalik kompostimuld, kergelt happeline',
    optimalSow: '03-15',
    optimalPlantOut: '05-20',
    optimalHarvest: '08-01'
  },
  kurk: {
    nameEn: 'Cucumber',
    hardinessZone: 'Zone 4-7 (warm bed/greenhouse)',
    targetPh: '5.8–6.8',
    soilPreference: 'Soe huumusrikas kõdumuld, niiske',
    optimalSow: '04-15',
    optimalPlantOut: '05-25',
    optimalHarvest: '07-15'
  },
  porgand: {
    nameEn: 'Carrot',
    hardinessZone: 'Zone 3-9 (very hardy)',
    targetPh: '6.0–6.8',
    soilPreference: 'Sügav liivsavimuld ilma kivideta',
    optimalSow: '04-20',
    optimalPlantOut: '04-20',
    optimalHarvest: '08-15'
  },
  sibul: {
    nameEn: 'Onion',
    hardinessZone: 'Zone 3-8 (hardy)',
    targetPh: '6.2–7.0',
    soilPreference: 'Hea drenaažiga liivsavi, mitte värske sõnnik',
    optimalSow: '05-05',
    optimalPlantOut: '05-05',
    optimalHarvest: '08-25'
  },
  kuuslauk: {
    nameEn: 'Garlic',
    hardinessZone: 'Zone 3-8 (winter hardy to -30°C)',
    targetPh: '6.0–7.0',
    soilPreference: 'Toitainerikas kobe aiamuld',
    optimalSow: '09-25',
    optimalPlantOut: '09-25',
    optimalHarvest: '07-25'
  },
  hernes: {
    nameEn: 'Garden Pea',
    hardinessZone: 'Zone 2-8 (cold hardy)',
    targetPh: '6.0–7.5',
    soilPreference: 'Kergem aiamuld, ei vaja liigset lämmastikku',
    optimalSow: '04-15',
    optimalPlantOut: '04-15',
    optimalHarvest: '07-01'
  },
  peet: {
    nameEn: 'Beetroot',
    hardinessZone: 'Zone 3-8 (hardy)',
    targetPh: '6.5–7.5',
    soilPreference: 'Huumusrikas liivsavi, boorivajadus',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '08-20'
  },
  suvikorvits: {
    nameEn: 'Zucchini / Courgette',
    hardinessZone: 'Zone 4-8',
    targetPh: '6.0–7.5',
    soilPreference: 'Väga toitainerikas kompostipeenar',
    optimalSow: '04-20',
    optimalPlantOut: '05-25',
    optimalHarvest: '07-20'
  },
  korvits: {
    nameEn: 'Pumpkin / Winter Squash',
    hardinessZone: 'Zone 4-8',
    targetPh: '6.0–7.0',
    soilPreference: 'Soe kompostihunnik või kõdumuld',
    optimalSow: '04-20',
    optimalPlantOut: '05-25',
    optimalHarvest: '09-15'
  },
  kartul: {
    nameEn: 'Potato',
    hardinessZone: 'Zone 3-8',
    targetPh: '5.0–6.0',
    soilPreference: 'Kobe kergelt happeline muld, ei talu liialt lupja',
    optimalSow: '05-05',
    optimalPlantOut: '05-05',
    optimalHarvest: '08-20'
  },
  lehtsalat: {
    nameEn: 'Leaf Lettuce',
    hardinessZone: 'Zone 3-8 (frost tolerant)',
    targetPh: '6.0–7.0',
    soilPreference: 'Niiske jahe huumusmuld',
    optimalSow: '04-25',
    optimalPlantOut: '05-10',
    optimalHarvest: '06-15'
  },
  salat: {
    nameEn: 'Leaf Lettuce',
    hardinessZone: 'Zone 3-8 (frost tolerant)',
    targetPh: '6.0–7.0',
    soilPreference: 'Niiske jahe huumusmuld',
    optimalSow: '04-25',
    optimalPlantOut: '05-10',
    optimalHarvest: '06-15'
  },
  spinat: {
    nameEn: 'Spinach',
    hardinessZone: 'Zone 2-8 (very cold hardy)',
    targetPh: '6.5–7.5',
    soilPreference: 'Niiske jahe toitainerikas muld',
    optimalSow: '04-10',
    optimalPlantOut: '04-10',
    optimalHarvest: '05-25'
  },
  redis: {
    nameEn: 'Radish',
    hardinessZone: 'Zone 2-8 (quick cool season)',
    targetPh: '6.0–7.0',
    soilPreference: 'Kobe niiske liivsavi',
    optimalSow: '04-15',
    optimalPlantOut: '04-15',
    optimalHarvest: '05-25'
  },
  kapsas: {
    nameEn: 'White Cabbage',
    hardinessZone: 'Zone 3-8',
    targetPh: '6.5–7.5',
    soilPreference: 'Raske savimuld rohke lubjaga (kapsanuutri vastu)',
    optimalSow: '03-25',
    optimalPlantOut: '05-15',
    optimalHarvest: '09-15'
  },
  lehtkapsas: {
    nameEn: 'Kale',
    hardinessZone: 'Zone 2-9 (survives snow & -15°C)',
    targetPh: '6.5–7.5',
    soilPreference: 'Lubjarikas jahe muld',
    optimalSow: '04-15',
    optimalPlantOut: '05-20',
    optimalHarvest: '10-15'
  },
  brokoli: {
    nameEn: 'Broccoli',
    hardinessZone: 'Zone 3-8',
    targetPh: '6.0–7.0',
    soilPreference: 'Toitainerikas niiske aiamuld',
    optimalSow: '04-01',
    optimalPlantOut: '05-15',
    optimalHarvest: '07-25'
  },
  lillkapsas: {
    nameEn: 'Cauliflower',
    hardinessZone: 'Zone 3-8',
    targetPh: '6.5–7.2',
    soilPreference: 'Kõrge niiskus ja rikkalik toitainesisaldus',
    optimalSow: '03-25',
    optimalPlantOut: '05-15',
    optimalHarvest: '07-30'
  },
  kaalikas: {
    nameEn: 'Rutabaga / Swede',
    hardinessZone: 'Zone 2-8 (classic Nordic staple)',
    targetPh: '6.0–7.0',
    soilPreference: 'Raskem jahedam saviliivmuld',
    optimalSow: '05-10',
    optimalPlantOut: '05-10',
    optimalHarvest: '09-30'
  },
  naeris: {
    nameEn: 'Turnip',
    hardinessZone: 'Zone 2-8',
    targetPh: '6.0–7.0',
    soilPreference: 'Kobe jahe aiamuld',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '07-15'
  },
  aeduba: {
    nameEn: 'Bush Bean',
    hardinessZone: 'Zone 4-8',
    targetPh: '6.0–7.0',
    soilPreference: 'Soe kerge aiamuld, ei talu külma',
    optimalSow: '05-10',
    optimalPlantOut: '06-01',
    optimalHarvest: '08-01'
  },
  polduba: {
    nameEn: 'Fava Bean / Broad Bean',
    hardinessZone: 'Zone 2-8 (classic Estonian food)',
    targetPh: '6.0–7.5',
    soilPreference: 'Raskem niiske savimuld',
    optimalSow: '04-15',
    optimalPlantOut: '04-15',
    optimalHarvest: '07-25'
  },
  paprika: {
    nameEn: 'Sweet Pepper',
    hardinessZone: 'Zone 5-8 (greenhouse)',
    targetPh: '6.0–6.8',
    soilPreference: 'Soe ja kohev kompostimuld',
    optimalSow: '03-01',
    optimalPlantOut: '05-25',
    optimalHarvest: '08-15'
  },
  porrulauk: {
    nameEn: 'Leek',
    hardinessZone: 'Zone 3-8 (hardy, stays till winter)',
    targetPh: '6.5–7.0',
    soilPreference: 'Sügavalt haritud rammus muld',
    optimalSow: '03-10',
    optimalPlantOut: '05-15',
    optimalHarvest: '10-01'
  },
  pastinaak: {
    nameEn: 'Parsnip',
    hardinessZone: 'Zone 2-8 (sweetens after frost)',
    targetPh: '6.0–7.0',
    soilPreference: 'Väga sügav kivideta liivsavimuld',
    optimalSow: '04-15',
    optimalPlantOut: '04-15',
    optimalHarvest: '10-15'
  },
  rabarber: {
    nameEn: 'Rhubarb',
    hardinessZone: 'Zone 2-8 (perennial)',
    targetPh: '5.5–6.8',
    soilPreference: 'Sügav toitainerikas püsiv kasvukoht',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '05-20'
  },
  spargel: {
    nameEn: 'Asparagus',
    hardinessZone: 'Zone 3-8 (perennial)',
    targetPh: '6.5–7.5',
    soilPreference: 'Liivakas hästi dreenitud sügav muld',
    optimalSow: '04-20',
    optimalPlantOut: '05-15',
    optimalHarvest: '05-15'
  },
  mais: {
    nameEn: 'Sweet Corn',
    hardinessZone: 'Zone 4-8',
    targetPh: '6.0–6.8',
    soilPreference: 'Soe kiiresti soojenev muld rohke lämmastikuga',
    optimalSow: '04-25',
    optimalPlantOut: '06-01',
    optimalHarvest: '08-25'
  },
  basiilik: {
    nameEn: 'Sweet Basil',
    hardinessZone: 'Zone 5-9 (tender annual)',
    targetPh: '6.0–7.0',
    soilPreference: 'Kobe soe kompostmuld',
    optimalSow: '03-25',
    optimalPlantOut: '06-01',
    optimalHarvest: '07-01'
  },
  till: {
    nameEn: 'Dill',
    hardinessZone: 'Zone 3-8 (Nordic herb staple)',
    targetPh: '5.8–7.0',
    soilPreference: 'Niiske kerge aiamuld',
    optimalSow: '04-20',
    optimalPlantOut: '04-20',
    optimalHarvest: '06-01'
  },
  petersell: {
    nameEn: 'Parsley',
    hardinessZone: 'Zone 3-8 (biennial, winter hardy)',
    targetPh: '6.0–7.0',
    soilPreference: 'Sügav niiske aiamuld',
    optimalSow: '04-15',
    optimalPlantOut: '04-15',
    optimalHarvest: '06-20'
  },
  piparmunt: {
    nameEn: 'Peppermint',
    hardinessZone: 'Zone 3-8 (vigorous perennial)',
    targetPh: '6.0–7.0',
    soilPreference: 'Niiske poolvarjuline huumusmuld',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '06-15'
  },
  tuumian: {
    nameEn: 'Thyme',
    hardinessZone: 'Zone 4-8 (evergreen perennial)',
    targetPh: '6.5–8.0',
    soilPreference: 'Kuiv lubjarikas kivine liivmuld',
    optimalSow: '04-01',
    optimalPlantOut: '05-15',
    optimalHarvest: '06-15'
  },
  rosmariin: {
    nameEn: 'Rosemary',
    hardinessZone: 'Zone 7 (pot herb in Estonia)',
    targetPh: '6.0–7.5',
    soilPreference: 'Kuiv hästi dreenitud liivsavimuld',
    optimalSow: '03-01',
    optimalPlantOut: '05-25',
    optimalHarvest: '06-15'
  },
  maasikas: {
    nameEn: 'Garden Strawberry',
    hardinessZone: 'Zone 3-8 (perennial)',
    targetPh: '5.5–6.5',
    soilPreference: 'Kergelt happeline huumusrikas liivsavi',
    optimalSow: '05-15',
    optimalPlantOut: '05-15',
    optimalHarvest: '06-25'
  },
  vaarikas: {
    nameEn: 'Raspberry',
    hardinessZone: 'Zone 3-8 (perennial)',
    targetPh: '5.8–6.5',
    soilPreference: 'Toitainerikas niiske, rohke multšiga',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '07-15'
  },
  mustsorstar: {
    nameEn: 'Blackcurrant',
    hardinessZone: 'Zone 2-8 (hardy Nordic bush)',
    targetPh: '6.0–7.0',
    soilPreference: 'Rammus niiske saviliivmuld',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '07-20'
  },
  punanesorstar: {
    nameEn: 'Redcurrant',
    hardinessZone: 'Zone 2-8 (hardy Nordic bush)',
    targetPh: '6.0–7.0',
    soilPreference: 'Toitainerikas parasniiske aiamuld',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '07-15'
  },
  karusmari: {
    nameEn: 'Gooseberry',
    hardinessZone: 'Zone 3-8',
    targetPh: '6.0–6.8',
    soilPreference: 'Õhurikas saviliivmuld',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '07-25'
  },
  mustikas: {
    nameEn: 'Northern Highbush Blueberry',
    hardinessZone: 'Zone 3-7 (acid peat lover)',
    targetPh: '4.2–4.8',
    soilPreference: 'Hapu rabaturvas, männikoor, liiv',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '08-01'
  },
  ounapuu: {
    nameEn: 'Apple Tree',
    hardinessZone: 'Zone 3-8 (Estonian heritage fruit)',
    targetPh: '6.0–6.8',
    soilPreference: 'Sügav vett läbilaskev viljakas saviliivmuld',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '09-10'
  },
  ploomipuu: {
    nameEn: 'Plum Tree',
    hardinessZone: 'Zone 4-8',
    targetPh: '6.0–7.0',
    soilPreference: 'Soe lubjarikas saviliivmuld',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '08-25'
  },
  kirsipuu: {
    nameEn: 'Sour / Sweet Cherry Tree',
    hardinessZone: 'Zone 4-8',
    targetPh: '6.5–7.5',
    soilPreference: 'Hea drenaažiga lubjarikas soe muld',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '07-20'
  },
  saialill: {
    nameEn: 'Pot Marigold / Calendula',
    hardinessZone: 'Zone 3-9 (beneficial companion)',
    targetPh: '6.0–7.5',
    soilPreference: 'Tavaline aiamuld, vähenõudlik',
    optimalSow: '04-20',
    optimalPlantOut: '04-20',
    optimalHarvest: '06-20'
  },
  tagetes: {
    nameEn: 'French Marigold (Tagetes)',
    hardinessZone: 'Zone 4-9 (nematode suppressor)',
    targetPh: '6.0–7.5',
    soilPreference: 'Mõõdukalt viljakas aiamuld',
    optimalSow: '04-01',
    optimalPlantOut: '05-20',
    optimalHarvest: '06-25'
  },
  kurgirohi: {
    nameEn: 'Borage',
    hardinessZone: 'Zone 3-8 (pollinator magnet)',
    targetPh: '6.0–7.0',
    soilPreference: 'Tavaline aiamuld, isekülvav',
    optimalSow: '05-01',
    optimalPlantOut: '05-01',
    optimalHarvest: '06-15'
  },
  mungalill: {
    nameEn: 'Nasturtium',
    hardinessZone: 'Zone 4-9 (aphid trap crop)',
    targetPh: '6.0–7.0',
    soilPreference: 'Lahjem muld rohke õitsemise tagamiseks',
    optimalSow: '05-05',
    optimalPlantOut: '05-20',
    optimalHarvest: '07-01'
  },
  paevalill: {
    nameEn: 'Sunflower',
    hardinessZone: 'Zone 3-8 (living trellis & windbreak)',
    targetPh: '6.0–7.5',
    soilPreference: 'Sügav toitainerikas muld rohke päikesega',
    optimalSow: '05-01',
    optimalPlantOut: '05-15',
    optimalHarvest: '08-25'
  }
};

export const DEFAULT_PLANTS: Plant[] = (() => {
  const list: Plant[] = (rawPlants as any[]).map((raw) => {
    const meta = PLANT_METADATA_EXTENSIONS[raw.id] || {};
    return {
      id: raw.id,
      name: raw.name,
      scientificName: raw.scientificName || '',
      family: raw.family || '',
      icon: raw.icon || '🌱',
      varieties: raw.nordicVarieties || raw.varieties || [],
      optimalSowDateStart: meta.optimalSow || '04-15',
      optimalPlantOutDate: meta.optimalPlantOut || '05-20',
      optimalHarvestDate: meta.optimalHarvest || '08-15',
      spacingCm: raw.spacingCm || 30,
      rowSpacingCm: Math.round((raw.spacingCm || 30) * 1.5),
      depthCm: raw.depthCm || 1.5,
      daysToMaturity: raw.daysToMaturity || 70,
      sunNeed: raw.sunNeed || 'full',
      sunHoursMin: raw.sunHoursMin || 6,
      waterNeed: raw.waterNeed || 'medium',
      weeksBeforeFrostSowIndoors: raw.weeksBeforeFrostSowIndoors ?? null,
      weeksAfterFrostPlantOut: raw.weeksAfterFrostPlantOut ?? null,
      greenhouseShiftWeeks: raw.greenhouseShiftWeeks ?? null,
      companionsGood: raw.companionsGood || [],
      companionsBad: raw.companionsBad || [],
      description: raw.description || '',
      isNordicSuitable: raw.isNordicSuitable ?? true,
      nameEn: meta.nameEn || raw.name,
      hardinessZone: meta.hardinessZone,
      targetPh: meta.targetPh,
      soilPreference: meta.soilPreference,
      botanicalFamilyId: raw.familyId
    };
  });

  // Ensure 'salat' alias is also in the list if lehtsalat is present, so legacy references never break
  const lehtsalat = list.find((p) => p.id === 'lehtsalat');
  if (lehtsalat && !list.some((p) => p.id === 'salat')) {
    list.push({
      ...lehtsalat,
      id: 'salat',
      name: 'Lehtsalat'
    });
  }

  return list;
})();
