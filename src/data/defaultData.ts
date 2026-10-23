import { GardenBed, Task, JournalEntry, AppSettings, WeatherInfo, YardPlan, GardenEntity, DEFAULT_YARD_LAYERS, convertBedToGardenEntity } from '../types';

export const INITIAL_SETTINGS: AppSettings = {
  locationName: 'Tallinn',
  lat: 59.437,
  lng: 24.754,
  springFrostDate: '05-20',
  autumnFrostDate: '09-25',
  yardWidthM: 20,
  yardLengthM: 30,
  northAngle: 0,
  themeMode: 'meadow'
};

export const INITIAL_BEDS: GardenBed[] = [
  {
    id: 'bed_1',
    name: 'Põhiline köögiviljapeenar',
    type: 'raisedBed',
    x: 2.0,
    y: 2.0,
    width: 1.2,
    length: 3.0,
    height: 0.4,
    rotation: 0,
    coverType: 'none',
    notes: 'Kompostimullaga täidetud kõrgpeenar',
    calculatedSunHours: 8.0,
    plantings: [
      { id: 'c1', bedId: 'bed_1', plantId: 'porgand', plantName: 'Aedporgand', plantIcon: '🥕', gridX: 0, gridY: 0, year: 2026, dateAdded: '2026-05-01' },
      { id: 'c2', bedId: 'bed_1', plantId: 'sibul', plantName: 'Mugulsibul', plantIcon: '🧅', gridX: 1, gridY: 0, year: 2026, dateAdded: '2026-05-01' },
      { id: 'c3', bedId: 'bed_1', plantId: 'peet', plantName: 'Aedpeet', plantIcon: '🟣', gridX: 2, gridY: 0, year: 2026, dateAdded: '2026-05-05' },
      { id: 'c4_extra', bedId: 'bed_1', plantId: 'salat', plantName: 'Lehtsalat', plantIcon: '🥬', gridX: 0, gridY: 1, year: 2026, dateAdded: '2026-05-05' },
      { id: 'c5_extra', bedId: 'bed_1', plantId: 'hernes', plantName: 'Aedhernes', plantIcon: '🫛', gridX: 1, gridY: 1, year: 2026, dateAdded: '2026-05-05' }
    ]
  },
  {
    id: 'bed_2',
    name: 'Kasvuhoone peenar',
    type: 'greenhouse',
    x: 2.0,
    y: 7.0,
    width: 2.0,
    length: 4.0,
    height: 2.2,
    rotation: 0,
    coverType: 'greenhouse',
    notes: 'Kütteta polükarbonaat kasvuhoone tomatite ja kurkide jaoks',
    calculatedSunHours: 8.5,
    plantings: [
      { id: 'c4', bedId: 'bed_2', plantId: 'tomat', plantName: 'Tomat', plantIcon: '🍅', gridX: 0, gridY: 0, year: 2026, dateAdded: '2026-05-15' },
      { id: 'c5', bedId: 'bed_2', plantId: 'kurk', plantName: 'Harilik kurk', plantIcon: '🥒', gridX: 1, gridY: 0, year: 2026, dateAdded: '2026-05-15' },
      { id: 'c6_gh', bedId: 'bed_2', plantId: 'basiilik', plantName: 'Basiilik', plantIcon: '🌱', gridX: 0, gridY: 1, year: 2026, dateAdded: '2026-05-15' }
    ]
  },
  {
    id: 'bed_3',
    name: 'Ürtide terrassikast',
    type: 'pot',
    x: 6.0,
    y: 3.0,
    width: 0.8,
    length: 1.5,
    height: 0.5,
    rotation: 0,
    coverType: 'none',
    notes: 'Köögilähedane värskete ürtide kast',
    calculatedSunHours: 6.0,
    plantings: [
      { id: 'c6', bedId: 'bed_3', plantId: 'basiilik', plantName: 'Basiilik', plantIcon: '🌱', gridX: 0, gridY: 0, year: 2026, dateAdded: '2026-05-20' },
      { id: 'c7', bedId: 'bed_3', plantId: 'till', plantName: 'Aedtill', plantIcon: '🌿', gridX: 1, gridY: 0, year: 2026, dateAdded: '2026-05-20' }
    ]
  }
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Tomatitaimede ettekülv toas', completed: true, dueDate: '2026-03-25', category: 'sow', plantId: 'tomat', createdAt: '2026-03-01' },
  { id: 't2', title: 'Kurgi ettekülv pottidesse', completed: false, dueDate: '2026-04-15', category: 'sow', plantId: 'kurk', createdAt: '2026-03-01' },
  { id: 't3', title: 'Porgandi ja sibula külv peenrasse', completed: false, dueDate: '2026-05-05', category: 'plant', plantId: 'porgand', createdAt: '2026-03-01' },
  { id: 't4', title: 'Kasvuhoone mullale komposti lisamine', completed: false, dueDate: '2026-05-10', category: 'feed', plantId: null, createdAt: '2026-03-01' },
  { id: 't5', title: 'Tomatite istutamine kasvuhoonesse', completed: false, dueDate: '2026-05-20', category: 'plant', plantId: 'tomat', createdAt: '2026-03-01' }
];

export const INITIAL_JOURNAL: JournalEntry[] = [
  {
    id: 'j1',
    title: 'Kevadine aia planeerimine algas',
    content: 'Planeerisin uue hooaja peenarde paigutuse. Põhipeenrasse lähevad kõrvuti porgand ja sibul porgandikärbse tõrjeks. Kasvuhoonesse valitud Eesti klassikaline "Malle" sort.',
    category: 'observation',
    date: '2026-03-15',
    photoUrl: null
  },
  {
    id: 'j2',
    title: 'Tomatiseemnete külv toas ettekasvatuseks',
    content: 'Külvatud sordid "Malle" ja "Vilja" külvikasti kookos-turbamulda soojusmatil 23°C juures.',
    category: 'observation',
    date: '2026-03-22',
    plantId: 'tomat',
    plantName: 'Tomat',
    growthStage: 'Idanemine',
    growthProgressPct: 12
  },
  {
    id: 'j3',
    title: 'Tomatitaimede pikeerimine pottidesse',
    content: 'Tõusmed on jõulised ja esimesed pärislehed arenenud. Taimed pikeeritud 0.5L pottidesse orgaanilise kompostmullaga.',
    category: 'observation',
    date: '2026-04-12',
    plantId: 'tomat',
    plantName: 'Tomat',
    growthStage: 'Lehekasv',
    growthProgressPct: 30
  },
  {
    id: 'j4',
    title: 'Porgandi ja sibula külv põhipeenrasse',
    content: 'Muld soojenenud 8 kraadini. Külvatud porgandiseemned 1.5 cm sügavusele koos sibulapistikutega.',
    category: 'observation',
    date: '2026-05-03',
    plantId: 'porgand',
    plantName: 'Aedporgand',
    growthStage: 'Idanemine',
    growthProgressPct: 15
  },
  {
    id: 'j5',
    title: 'Tomatitaimede istutamine kasvuhoonesse',
    content: 'Öökülmaoht on möödas. Taimed istutatud kasvuhoonesse koos nõgeseleotise ja kergelt sügavama istutusega.',
    category: 'observation',
    date: '2026-05-18',
    plantId: 'tomat',
    plantName: 'Tomat',
    growthStage: 'Lehekasv',
    growthProgressPct: 45
  },
  {
    id: 'j6',
    title: 'Esimene lehtsalati ja aedtilli värske korje',
    content: 'Terrassikasti salat ja till on mõnusalt lopsakad ja krõmpsud. Koristatud esimeseks värskeks lõunaks.',
    category: 'harvest',
    date: '2026-06-04',
    plantId: 'salat',
    plantName: 'Lehtsalat',
    yieldAmount: 0.6,
    yieldUnit: 'kg',
    growthStage: 'Saagikoristus',
    growthProgressPct: 100
  },
  {
    id: 'j7',
    title: 'Tomati esimesed õiekobarad avanenud',
    content: 'Kasvuhoone tomatitel on 2–3 õiekobarat täies õies. Taimi toestatud nööridega ja külgvõrsed eemaldatud.',
    category: 'observation',
    date: '2026-06-16',
    plantId: 'tomat',
    plantName: 'Tomat',
    growthStage: 'Õitsemine',
    growthProgressPct: 62
  },
  {
    id: 'j8',
    title: 'Varajase aedherne magus saak',
    content: 'Kaunad on pungil ja magusad. Lapsed noppisid esimese suure kausitäie herneid.',
    category: 'harvest',
    date: '2026-06-27',
    plantId: 'hernes',
    plantName: 'Aedhernes',
    yieldAmount: 1.4,
    yieldUnit: 'kg',
    growthStage: 'Saagikoristus',
    growthProgressPct: 95
  },
  {
    id: 'j9',
    title: 'Kasvuhoone kurkide intensiivne korje',
    content: 'Kurgitaimed kannavad rikkalikult vilju. Kurgid krõbedad, ideaalsed värskeks hapendamiseks.',
    category: 'harvest',
    date: '2026-07-14',
    plantId: 'kurk',
    plantName: 'Harilik kurk',
    yieldAmount: 3.8,
    yieldUnit: 'kg',
    growthStage: 'Saagikoristus',
    growthProgressPct: 90
  },
  {
    id: 'j10',
    title: 'Tomatid punetavad & valmimisfaas käib',
    content: 'Esimesed "Malle" viljad hakkavad altpoolt punaseks tõmbuma. Kastmist veidi vähendatud maitse tihendamiseks.',
    category: 'observation',
    date: '2026-07-28',
    plantId: 'tomat',
    plantName: 'Tomat',
    growthStage: 'Valmimine',
    growthProgressPct: 85
  },
  {
    id: 'j11',
    title: 'Suur tomati ja kurgi tippsaagi koristus',
    content: 'Võimas augustikuine saagikoristus! Magusad lihakad tomatid ja salatikurgid kastidesse sorteeritud.',
    category: 'harvest',
    date: '2026-08-10',
    plantId: 'tomat',
    plantName: 'Tomat',
    yieldAmount: 5.6,
    yieldUnit: 'kg',
    growthStage: 'Saagikoristus',
    growthProgressPct: 100
  },
  {
    id: 'j12',
    title: 'Mugulsibulate koristus ja kuivatamine',
    content: 'Pealsed lamandusid, sibulad välja tõmmatud ja varikatuse all restidel kuivama pandud.',
    category: 'harvest',
    date: '2026-08-22',
    plantId: 'sibul',
    plantName: 'Mugulsibul',
    yieldAmount: 3.2,
    yieldUnit: 'kg',
    growthStage: 'Saagikoristus',
    growthProgressPct: 100
  },
  {
    id: 'j13',
    title: 'Sügisene porgandi ja peedi põhikoristus',
    content: 'Põhipeenra saak käes. Porgandid pikad, sirged ja mahlased ilma kahjurikahjustuseta.',
    category: 'harvest',
    date: '2026-09-08',
    plantId: 'porgand',
    plantName: 'Aedporgand',
    yieldAmount: 6.2,
    yieldUnit: 'kg',
    growthStage: 'Saagikoristus',
    growthProgressPct: 100
  }
];

export const INITIAL_WEATHER: WeatherInfo = {
  locationName: 'Tallinn',
  lat: 59.437,
  lng: 24.754,
  temperature: 16.5,
  tempMax: 19.0,
  tempMin: 8.5,
  precipitation: 0.0,
  windSpeed: 3.8,
  weatherDescription: 'Vahelduv pilvisus, soodne aiatöödeks',
  icon: '⛅',
  alerts: [
    {
      id: 'a1',
      title: 'Öökülma oht mais',
      severity: 'warning',
      advice: 'Hoida katteloorid kasvuhoones käepärast, kui öine temperatuur langeb alla +4°C.',
      affectedCrops: 'Tomat, kurk, basiilik'
    }
  ],
  tips: [
    'Kasta peenraid varahommikul, et vältida liigset aurustumist ja seenhaigusi.',
    'Õhuta kasvuhoonet keskpäeval, kui temperatuur ületab 24°C.'
  ]
};

export function buildInitialYardPlan(settings: AppSettings, beds: GardenBed[]): YardPlan {
  const now = '2026-05-15T10:00:00.000Z';

  // Convert existing beds to entities
  const bedEntities = beds.map(convertBedToGardenEntity);

  // Add realistic landscape context entities
  const contextEntities: GardenEntity[] = [
    {
      id: 'entity_house',
      name: 'Elumaja',
      category: 'structure',
      subType: 'dwelling_house',
      icon: '🏠',
      x: 2.0,
      y: 16.0,
      elevationM: 0,
      rotation: 0,
      shapeType: 'rectangle',
      width: 9.0,
      length: 11.0,
      heightM: 6.5,
      shadowCasting: true,
      materialType: 'brick',
      color: '#8A5A44',
      zIndex: 20,
      layerId: 'structures',
      locked: true,
      visible: true,
      tags: ['maja', 'ehitis'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'entity_terrace',
      name: 'Puidust terrass',
      category: 'structure',
      subType: 'terrace',
      icon: '🪵',
      x: 11.0,
      y: 18.0,
      elevationM: 0.1,
      rotation: 0,
      shapeType: 'rectangle',
      width: 4.5,
      length: 6.0,
      heightM: 0.25,
      shadowCasting: false,
      materialType: 'wood',
      color: '#D4A373',
      zIndex: 5,
      layerId: 'structures',
      locked: false,
      visible: true,
      tags: ['terrass', 'puhkeala'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'entity_stone_path',
      name: 'Paekivitee peenardeni',
      category: 'path',
      subType: 'stone_path',
      icon: '🧱',
      x: 5.0,
      y: 5.5,
      elevationM: 0,
      rotation: 0,
      shapeType: 'rectangle',
      width: 1.2,
      length: 10.5,
      heightM: 0.05,
      shadowCasting: false,
      materialType: 'stone',
      color: '#A5A58D',
      zIndex: 2,
      layerId: 'infrastructure',
      locked: false,
      visible: true,
      tags: ['tee', 'rada'],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'entity_apple_tree',
      name: 'Vana õunapuu "Valge klaar"',
      category: 'tree',
      subType: 'apple_tree',
      icon: '🍎',
      x: 13.5,
      y: 5.0,
      elevationM: 0,
      rotation: 0,
      shapeType: 'circle',
      width: 4.0,
      length: 4.0,
      heightM: 4.0,
      shadowCasting: true,
      foliageOpacity: 0.85,
      materialType: 'foliage',
      color: '#4A7C59',
      zIndex: 15,
      layerId: 'plants',
      locked: false,
      visible: true,
      tags: ['õunapuu', 'puu'],
      botanicalData: {
        canopyRadiusM: 2.0,
        trunkHeightM: 1.2,
        rootSpreadM: 3.0,
        isDeciduous: true
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'entity_pond',
      name: 'Aia tiik / Veesilm',
      category: 'water',
      subType: 'pond',
      icon: '💧',
      x: 13.0,
      y: 11.5,
      elevationM: 0,
      rotation: 0,
      shapeType: 'circle',
      width: 4.0,
      length: 4.5,
      heightM: 0.0,
      shadowCasting: false,
      materialType: 'water',
      color: '#588B8B',
      zIndex: 3,
      layerId: 'infrastructure',
      locked: false,
      visible: true,
      tags: ['tiik', 'vesi'],
      createdAt: now,
      updatedAt: now
    }
  ];

  return {
    id: 'yard_plan_main',
    name: `${settings.locationName || 'Minu'} aia plaan`,
    schemaVersion: 2,
    units: 'metric',
    widthM: settings.yardWidthM || 20,
    lengthM: settings.yardLengthM || 30,
    northAngleDeg: settings.northAngle || 0,
    entities: [...contextEntities, ...bedEntities],
    layers: DEFAULT_YARD_LAYERS,
    createdAt: now,
    updatedAt: now
  };
}

export const INITIAL_YARD_PLAN: YardPlan = buildInitialYardPlan(INITIAL_SETTINGS, INITIAL_BEDS);

