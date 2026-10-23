import { BedPlantingCell, Plant, GardenEntity, Point2D } from '../types';

export type CompanionClassification = 'beneficial' | 'incompatible' | 'neutral' | 'unknown';
export type EvidenceConfidence = 'established' | 'traditional' | 'insufficient';
export type SynergyCategory =
  | 'pest_control'
  | 'nutrient_sharing'
  | 'pollination'
  | 'disease_vector'
  | 'allelopathy'
  | 'root_layering'
  | 'general';

export interface CompanionConflict {
  plantA: string;
  plantB: string;
  isHarmful: boolean;
  message: string;
  category?: SynergyCategory;
  botanicalReason?: string;
  botanicalReasonEn?: string;
}

export interface CompanionRecommendation {
  plantA: string;
  plantB: string;
  canonicalIdA: string;
  canonicalIdB: string;
  classification: CompanionClassification;
  isHarmful: boolean;
  confidence: EvidenceConfidence;
  source: string;
  category: SynergyCategory;
  explanation: string;
  explanationEt: string;
  explanationEn: string;
  conditions?: string;
  botanicalReason?: string;
  botanicalReasonEn?: string;
  message?: string;
}

export interface CellSynergyDetails {
  status: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  goodCount: number;
  badCount: number;
  neutralCount: number;
  relationships: {
    neighborPlantId: string;
    neighborName: string;
    neighborIcon: string;
    type: 'good' | 'bad' | 'neutral';
    reason: string;
    category?: SynergyCategory;
    botanicalReason?: string;
    confidence?: EvidenceConfidence;
    source?: string;
  }[];
}

export interface BedHarmonyScore {
  harmonyPercentage: number;
  positivePairs: number;
  negativePairs: number;
  neutralPairs: number;
  totalPairings: number;
  summary: string;
  recommendations: CompanionRecommendation[];
}

export interface CrossBedInteraction {
  bedAId: string;
  bedBId: string;
  bedAName: string;
  bedBName: string;
  distanceM: number;
  centerA: Point2D;
  centerB: Point2D;
  pairings: CompanionRecommendation[];
  overallClassification: CompanionClassification;
}

interface BotanicalPairKnowledge {
  pair: [string, string];
  classification: CompanionClassification;
  isHarmful: boolean;
  confidence: EvidenceConfidence;
  source: string;
  category: SynergyCategory;
  conditionsEt?: string;
  conditionsEn?: string;
  reasonEt: string;
  reasonEn: string;
}

// Canonical pair knowledge based on agronomy science and established Nordic / EU research
// Sources: METK (Eesti Maaelu Teadmuskeskus), EMÜ (Eesti Maaülikool), RHS (Royal Horticultural Society), USDA ARS
const BOTANICAL_PAIRS: BotanicalPairKnowledge[] = [
  {
    pair: ['porgand', 'sibul'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'METK (Eesti Maaelu Teadmuskeskus) & RHS',
    category: 'pest_control',
    conditionsEt: 'Avamaa peenrad, hea õhuringlusega päikeseline kasvukoht',
    conditionsEn: 'Open field beds, full sun with good air circulation',
    reasonEt: 'Sibula teravad väävliaurud eksitavad porgandikärbest (Psila rosae), porgand peletab sibulakärbest. Erinev juurestiku sügavus väldib konkurentsi.',
    reasonEn: 'Onion sulfur volatiles mask carrot rust fly (Psila rosae), while carrot foliage repels onion fly. Complementary root depths avoid competition.'
  },
  {
    pair: ['porgand', 'kuuslauk'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'METK & EMÜ (Eesti Maaülikool)',
    category: 'pest_control',
    conditionsEt: 'Avamaa, parasniiske liivsavimuld',
    conditionsEn: 'Open beds, well-draining sandy loam',
    reasonEt: 'Küüslaugu allitsiin ja tugev aroom peletavad porgandikärbest ning pärsivad mullaseente teket.',
    reasonEn: 'Garlic allicin and sharp aroma deter carrot rust fly and suppress soil-borne fungal spores.'
  },
  {
    pair: ['tomat', 'basiilik'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'RHS (Royal Horticultural Society) & USDA ARS',
    category: 'pest_control',
    conditionsEt: 'Kasvuhoone või soe päikeseline terrassikast',
    conditionsEn: 'Greenhouse or warm sunny container garden',
    reasonEt: 'Basiiliku eeterlikud õlid peletavad kedriklesta ja ripslasi ning parandavad tomati aroomi ja maitseomadusi kasvuhoones.',
    reasonEn: 'Basil essential oils repel spider mites and thrips while enhancing tomato vigor and sweetness in greenhouse conditions.'
  },
  {
    pair: ['tomat', 'kartul'],
    classification: 'incompatible',
    isHarmful: true,
    confidence: 'established',
    source: 'METK & EMÜ Taimekaitse osakond',
    category: 'disease_vector',
    conditionsEt: 'Kõik kasvukohad (kasvuhoone ja avamaa)',
    conditionsEn: 'All growing locations (greenhouse and open beds)',
    reasonEt: 'Ohtlik naabrus! Mõlemad maavitsalised nakatuvad kergesti samasse laastavasse lehemädanikku (Phytophthora infestans) ja levitavad kartulimardikat.',
    reasonEn: 'High hazard! Both Solanaceae crops share catastrophic late blight (Phytophthora infestans) and harbor Colorado potato beetle.'
  },
  {
    pair: ['hernes', 'sibul'],
    classification: 'incompatible',
    isHarmful: true,
    confidence: 'established',
    source: 'EMÜ & RHS Agronomy',
    category: 'allelopathy',
    conditionsEt: 'Avamaa ja kõrgpeenrad',
    conditionsEn: 'Open garden beds and raised beds',
    reasonEt: 'Laukuliste antibakteriaalsed juureeritised pärsivad liblikõieliste juurtel elavate Rhizobium-mügarbakterite lämmastiku sidumist.',
    reasonEn: 'Allium root exudates inhibit nitrogen-fixing Rhizobium bacteria inhabiting legume root nodules.'
  },
  {
    pair: ['hernes', 'kuuslauk'],
    classification: 'incompatible',
    isHarmful: true,
    confidence: 'established',
    source: 'EMÜ & METK',
    category: 'allelopathy',
    conditionsEt: 'Kõik peenrad',
    conditionsEn: 'All planting beds',
    reasonEt: 'Küüslaugu fungitsiidsed väävliühendid takistavad herne mügarbakterite loomulikku sümbioosi ja pidurdavad herne kasvu.',
    reasonEn: 'Garlic antifungal sulfur compounds impede legume nitrogen fixation and stunt pea development.'
  },
  {
    pair: ['aeduba', 'sibul'],
    classification: 'incompatible',
    isHarmful: true,
    confidence: 'established',
    source: 'METK & RHS',
    category: 'allelopathy',
    conditionsEt: 'Avamaa ja lavad',
    conditionsEn: 'Open beds and cold frames',
    reasonEt: 'Sibula ja küüslaugu juureeritised pidurdavad põldoa ja aedoa arengut ning seiskavad mügarbakterite tegevuse.',
    reasonEn: 'Allium root secretions inhibit growth and root nodulation of bush beans.'
  },
  {
    pair: ['polduba', 'sibul'],
    classification: 'incompatible',
    isHarmful: true,
    confidence: 'established',
    source: 'METK (Eesti Maaelu Teadmuskeskus)',
    category: 'allelopathy',
    conditionsEt: 'Avamaa põllupeenrad',
    conditionsEn: 'Open field beds',
    reasonEt: 'Laukude väävlirikkad allomoonid pärsivad põldoa juurte mügarbakterite elutegevust ja nõrgendavad taime.',
    reasonEn: 'Sulfur-rich Allium allomones suppress broad bean root nodulation bacteria and weaken plant vigor.'
  },
  {
    pair: ['hernes', 'mais'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'FAO & USDA ARS (Three Sisters Agroecology)',
    category: 'nutrient_sharing',
    conditionsEt: 'Soe, päikeseline avamaapeenar',
    conditionsEn: 'Warm sunny open bed',
    reasonEt: 'Liblikõielised toidavad mulda lämmastikuga; mais pakub füüsilist ronimistuge ja tuulekaitset.',
    reasonEn: 'Legumes feed the soil with fixed nitrogen; corn provides living trellis and windbreak.'
  },
  {
    pair: ['aeduba', 'mais'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'FAO & USDA ARS',
    category: 'nutrient_sharing',
    conditionsEt: 'Soe ja parasniiske muld',
    conditionsEn: 'Warm and moderately moist soil',
    reasonEt: 'Uba seob õhulämmastikku maisi toitmiseks; tugev maisitaim on aedoale looduslikuks ronimistoeks.',
    reasonEn: 'Beans fix atmospheric nitrogen for high-feeding corn; corn provides natural physical climbing support.'
  },
  {
    pair: ['kapsas', 'till'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'METK & RHS',
    category: 'pest_control',
    conditionsEt: 'Avamaa ja jahedam kevadine muld',
    conditionsEn: 'Open garden beds, cool moist soil',
    reasonEt: 'Tilli vihmavarjulised õied meelitavad röövherilasi ja lepatriinusid, kes hävitavad kapsakoi röövikuid ja lehetäisid.',
    reasonEn: 'Dill umbel flowers attract parasitic wasps and ladybugs that prey on cabbage loopers and aphids.'
  },
  {
    pair: ['maasikas', 'kuuslauk'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'EMÜ Aiandusosakond & METK',
    category: 'pest_control',
    conditionsEt: 'Püsiv maasikapeenar multšiga',
    conditionsEn: 'Perennial strawberry patch with mulch',
    reasonEt: 'Küüslaugu lenduvad allitsiini aurud vähendavad maasika-hahkhallitust (Botrytis cinerea) ja peletavad maasikalesta.',
    reasonEn: 'Garlic allicin vapors act as a natural bio-fungicide suppressing strawberry gray mold (Botrytis cinerea).'
  },
  {
    pair: ['kurk', 'till'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'EMÜ & RHS',
    category: 'pollination',
    conditionsEt: 'Kasvuhoone või soe peenar',
    conditionsEn: 'Greenhouse or warm bed',
    reasonEt: 'Till meelitab tolmeldajaid kurgiõitele ja soodustab saagikust ja viljumist.',
    reasonEn: 'Dill draws pollinators to cucumber blossoms, boosting pollination and uniform fruit development.'
  },
  {
    pair: ['kurk', 'paevalill'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'EMÜ & Permaculture Research',
    category: 'nutrient_sharing',
    conditionsEt: 'Avamaa tuulevarjuks',
    conditionsEn: 'Open field windbreak',
    reasonEt: 'Päevalill toimib loodusliku tuuletõkkena ning kurgi ronivad võrsed saavad varre najale toetuda.',
    reasonEn: 'Sunflowers provide wind shelter and sturdy natural trellising for climbing cucumber vines.'
  },
  {
    pair: ['peet', 'kapsas'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'RHS Horticultural Science',
    category: 'root_layering',
    conditionsEt: 'Avamaa peenar',
    conditionsEn: 'Open vegetable bed',
    reasonEt: 'Peedi sammasjuur toitub sügavamalt, kapsa pinnapealne juurestik ei konkureeri toitainete pärast.',
    reasonEn: 'Beet taproots feed in deeper soil strata while cabbage shallow roots feed near the surface without competition.'
  },
  {
    pair: ['salat', 'redis'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'RHS & METK',
    category: 'root_layering',
    conditionsEt: 'Kevadine külv, niiske muld',
    conditionsEn: 'Early spring sowing, cool moist soil',
    reasonEt: 'Kiirekasvuline salat hoiab maapinna jahedana ja niiskena, vähendades redise puitumist ja maakirpude rünnakuid.',
    reasonEn: 'Fast-growing lettuce acts as living mulch, retaining moisture and shielding radishes from flea beetles.'
  },
  {
    pair: ['apteegitill', 'tomat'],
    classification: 'incompatible',
    isHarmful: true,
    confidence: 'established',
    source: 'RHS & EMÜ Allelopathy Research',
    category: 'allelopathy',
    conditionsEt: 'Kõik kasvukohad',
    conditionsEn: 'All growing locations',
    reasonEt: 'Tugevalt allelopaatiline taim! Fenkol eritab aineid, mis pidurdavad tomati ja teiste aiaviljade arengut.',
    reasonEn: 'Strongly allelopathic plant! Fennel root exudates severely inhibit tomato and vegetable growth.'
  },
  {
    pair: ['apteegitill', 'aeduba'],
    classification: 'incompatible',
    isHarmful: true,
    confidence: 'established',
    source: 'RHS Horticultural Science',
    category: 'allelopathy',
    conditionsEt: 'Kõik kasvukohad',
    conditionsEn: 'All growing locations',
    reasonEt: 'Apteegitilli allopaatilised ained pärsivad tugevalt kaunviljade arengut ja juurestikku.',
    reasonEn: 'Fennel allelochemicals strongly suppress legume root expansion and foliage growth.'
  },
  {
    pair: ['tomat', 'tagetes'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'USDA ARS & METK',
    category: 'pest_control',
    conditionsEt: 'Kasvuhoone ja soe avamaa',
    conditionsEn: 'Greenhouse and warm sunny beds',
    reasonEt: 'Sametill (Tagetes) eritab tiofeene, mis pärsivad mullas elavaid kahjulikke nematoodiusse ja peletavad kasvuhoone-karilast.',
    reasonEn: 'Marigolds secrete thiophenes that suppress parasitic root-knot nematodes and repel greenhouse whiteflies.'
  },
  {
    pair: ['tomat', 'saialill'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'EMÜ & RHS',
    category: 'pest_control',
    conditionsEt: 'Kasvuhoone ja avamaa',
    conditionsEn: 'Greenhouse and garden beds',
    reasonEt: 'Saialill toimib püünistaimena kahjuritele ja meelitab lehetäidest toituvaid lepatriinusid ning sirelasi.',
    reasonEn: 'Calendula acts as a trap crop for pests and attracts predatory hoverflies and ladybugs.'
  },
  {
    pair: ['kapsas', 'saialill'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'METK & EMÜ',
    category: 'pest_control',
    conditionsEt: 'Avamaa köögiviljapeenar',
    conditionsEn: 'Open vegetable bed',
    reasonEt: 'Saialill meelitab kapsakahjureid eemale ja toob aeda parasiitherilased, kes hävitavad kapsaliblika röövikuid.',
    reasonEn: 'Calendula acts as trap plant drawing aphids away while attracting parasitic wasps that decimate cabbage worms.'
  },
  {
    pair: ['spinat', 'maasikas'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'RHS Horticultural Science',
    category: 'root_layering',
    conditionsEt: 'Päikeseline või poolvarjuline peenar',
    conditionsEn: 'Full sun to partial shade',
    reasonEt: 'Spinati saponiinid toetavad mulla mikrobioloogilist tasakaalu ning madal lehestik varjutab maasikajuuri.',
    reasonEn: 'Spinach saponins enhance soil microbiology while shallow foliage protects strawberry roots from drying.'
  },
  {
    pair: ['kartul', 'saialill'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'METK Taimekaitse',
    category: 'pest_control',
    conditionsEt: 'Kartulimaa või peenravaod',
    conditionsEn: 'Potato patch or raised mounds',
    reasonEt: 'Saialill pärsib traatusside ja nematoodide levikut mullas ning toetab mulla tervist.',
    reasonEn: 'Calendula suppresses wireworms and soil nematodes, improving tuber quality.'
  },
  {
    pair: ['porgand', 'salat'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'RHS Companion Planting Guide',
    category: 'root_layering',
    conditionsEt: 'Tihe külvikord, kevad-suvi',
    conditionsEn: 'Succession planting, spring to summer',
    reasonEt: 'Salat valmib ja koristatakse kiiresti enne, kui porgandite sammasjuur vajab laia ruumi ja sügavust.',
    reasonEn: 'Quick-growing lettuce is harvested early before carrots need full taproot expansion.'
  },
  {
    pair: ['sibul', 'peet'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'METK & RHS',
    category: 'root_layering',
    conditionsEt: 'Avamaa peenar',
    conditionsEn: 'Open garden bed',
    reasonEt: 'Mõlema kultuuri juurestiku horisondid ei konkureeri ning sibula aroom peletab peedikärbseid.',
    reasonEn: 'Root zones occupy non-competing soil strata, and allium fragrance deters mangold fly larvae.'
  },
  {
    pair: ['kurk', 'basiilik'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'established',
    source: 'RHS Horticultural Science',
    category: 'pest_control',
    conditionsEt: 'Kasvuhoone või soe peenar',
    conditionsEn: 'Greenhouse or warm bed',
    reasonEt: 'Basiiliku eeterlikud õlid peletavad kurgikahjureid (ripslased, jahukaste) ja soodustavad tervislikku mikrokliimat.',
    reasonEn: 'Basil essential oils deter thrips and downy mildew spores, promoting healthy microclimate.'
  },
  // Traditional / Folklore pairings clearly distinguished with traditional confidence
  {
    pair: ['porgand', 'rosmariin'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'traditional',
    source: 'Rahvapärane aiandustarkus (Traditional Lore)',
    category: 'pest_control',
    conditionsEt: 'Avamaa või terrassipeenar',
    conditionsEn: 'Open bed or patio garden',
    reasonEt: 'Rosmariini tugev aroom arvatakse peletavat porgandikärbest, kuigi rosmariin vajab kuivemat mulda kui porgand.',
    reasonEn: 'Rosemary scent is traditionally held to deter carrot fly, though moisture needs differ slightly.'
  },
  {
    pair: ['kapsas', 'piparmunt'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'traditional',
    source: 'Rahvapärane aiandustarkus (Traditional Lore)',
    category: 'pest_control',
    conditionsEt: 'Münt potis kapsaste vahel (vältimaks levikut)',
    conditionsEn: 'Mint grown in container near cabbage (to prevent spreading)',
    reasonEt: 'Mündi intensiivne lõhn eksitab kapsaliblikaid, kuid mündi juurestik on agressiivne ja vajab potis piiramist.',
    reasonEn: 'Strong mint aroma masks cabbages from white butterflies, but mint must be contained in pots.'
  },
  {
    pair: ['tomat', 'petersell'],
    classification: 'beneficial',
    isHarmful: false,
    confidence: 'traditional',
    source: 'Traditsiooniline aianduspraktika (Traditional Gardening)',
    category: 'general',
    conditionsEt: 'Kasvuhoone servad',
    conditionsEn: 'Greenhouse borders',
    reasonEt: 'Traditsiooniline hea naabrus; petersell täidab tomati alust ruumi ilma tugeva konkurentsita.',
    reasonEn: 'Traditional companion pairing; parsley utilizes understory space without heavy root competition.'
  }
];

// Alias mapping to canonical species IDs
const PLANT_ALIASES: Record<string, string> = {
  // Solanaceae
  tomat: 'tomat',
  tomato: 'tomat',
  'solanum lycopersicum': 'tomat',
  kartul: 'kartul',
  potato: 'kartul',
  'solanum tuberosum': 'kartul',
  paprika: 'paprika',
  'sweet pepper': 'paprika',
  pepper: 'paprika',
  'capsicum annuum': 'paprika',

  // Apiaceae
  porgand: 'porgand',
  carrot: 'porgand',
  'daucus carota': 'porgand',
  till: 'till',
  dill: 'till',
  'anethum graveolens': 'till',
  petersell: 'petersell',
  parsley: 'petersell',
  'petroselinum crispum': 'petersell',
  pastinaak: 'pastinaak',
  parsnip: 'pastinaak',
  'pastinaca sativa': 'pastinaak',
  apteegitill: 'apteegitill',
  fenkol: 'apteegitill',
  fennel: 'apteegitill',
  'foeniculum vulgare': 'apteegitill',

  // Alliaceae
  sibul: 'sibul',
  onion: 'sibul',
  'allium cepa': 'sibul',
  kuuslauk: 'kuuslauk',
  küüslauk: 'kuuslauk',
  garlic: 'kuuslauk',
  'allium sativum': 'kuuslauk',
  porrulauk: 'porrulauk',
  leek: 'porrulauk',
  'allium porrum': 'porrulauk',

  // Fabaceae
  hernes: 'hernes',
  pea: 'hernes',
  'garden pea': 'hernes',
  'pisum sativum': 'hernes',
  aeduba: 'aeduba',
  'bush bean': 'aeduba',
  bean: 'aeduba',
  'phaseolus vulgaris': 'aeduba',
  polduba: 'polduba',
  põlduba: 'polduba',
  'fava bean': 'polduba',
  'broad bean': 'polduba',
  'vicia faba': 'polduba',

  // Cucurbitaceae
  kurk: 'kurk',
  'harilik kurk': 'kurk',
  cucumber: 'kurk',
  'cucumis sativus': 'kurk',
  suvikorvits: 'suvikorvits',
  suvikõrvits: 'suvikorvits',
  zucchini: 'suvikorvits',
  courgette: 'suvikorvits',
  korvits: 'korvits',
  kõrvits: 'korvits',
  pumpkin: 'korvits',
  squash: 'korvits',

  // Brassicaceae
  kapsas: 'kapsas',
  'valge peakapsas': 'kapsas',
  'white cabbage': 'kapsas',
  cabbage: 'kapsas',
  lehtkapsas: 'lehtkapsas',
  kale: 'lehtkapsas',
  brokoli: 'brokoli',
  broccoli: 'brokoli',
  lillkapsas: 'lillkapsas',
  cauliflower: 'lillkapsas',
  redis: 'redis',
  radish: 'redis',
  kaalikas: 'kaalikas',
  swede: 'kaalikas',
  rutabaga: 'kaalikas',
  naeris: 'naeris',
  turnip: 'naeris',

  // Asteraceae & Benefactors
  saialill: 'saialill',
  calendula: 'saialill',
  'pot marigold': 'saialill',
  tagetes: 'tagetes',
  sametill: 'tagetes',
  'french marigold': 'tagetes',
  marigold: 'tagetes',
  paevalill: 'paevalill',
  päevalill: 'paevalill',
  sunflower: 'paevalill',
  kurgirohi: 'kurgirohi',
  borage: 'kurgirohi',
  mungalill: 'mungalill',
  nasturtium: 'mungalill',

  // Lamiaceae
  basiilik: 'basiilik',
  basil: 'basiilik',
  'sweet basil': 'basiilik',
  'ocimum basilicum': 'basiilik',
  rosmariin: 'rosmariin',
  rosemary: 'rosmariin',
  tuumian: 'tuumian',
  tüümian: 'tuumian',
  thyme: 'tuumian',
  piparmunt: 'piparmunt',
  piparmünt: 'piparmunt',
  peppermint: 'piparmunt',
  mint: 'piparmunt',

  // Chenopodiaceae / Amaranthaceae
  peet: 'peet',
  beet: 'peet',
  beetroot: 'peet',
  'beta vulgaris': 'peet',
  spinat: 'spinat',
  spinach: 'spinat',

  // Others
  salat: 'salat',
  lehtsalat: 'salat',
  lettuce: 'salat',
  maasikas: 'maasikas',
  strawberry: 'maasikas',
  mais: 'mais',
  corn: 'mais',
  'sweet corn': 'mais',
  vaarikas: 'vaarikas',
  raspberry: 'vaarikas',
  mustsorstar: 'mustsorstar',
  mustsõstar: 'mustsorstar',
  blackcurrant: 'mustsorstar',
  punanesorstar: 'punanesorstar',
  punanesõstar: 'punanesorstar',
  redcurrant: 'punanesorstar',
  karusmari: 'karusmari',
  gooseberry: 'karusmari',
  ounapuu: 'ounapuu',
  õunapuu: 'ounapuu',
  apple: 'ounapuu',
  ploomipuu: 'ploomipuu',
  plum: 'ploomipuu',
  kirsipuu: 'kirsipuu',
  cherry: 'kirsipuu'
};

/**
 * Botanical family mapping for canonical IDs to enable botanical-family fallbacks.
 */
const CANONICAL_BOTANICAL_FAMILIES: Record<string, string> = {
  tomat: 'solanaceae',
  kartul: 'solanaceae',
  paprika: 'solanaceae',

  porgand: 'apiaceae',
  till: 'apiaceae',
  petersell: 'apiaceae',
  pastinaak: 'apiaceae',
  apteegitill: 'apiaceae',

  sibul: 'alliaceae',
  kuuslauk: 'alliaceae',
  porrulauk: 'alliaceae',

  hernes: 'fabaceae',
  aeduba: 'fabaceae',
  polduba: 'fabaceae',

  kurk: 'cucurbitaceae',
  suvikorvits: 'cucurbitaceae',
  korvits: 'cucurbitaceae',

  kapsas: 'brassicaceae',
  lehtkapsas: 'brassicaceae',
  brokoli: 'brassicaceae',
  lillkapsas: 'brassicaceae',
  redis: 'brassicaceae',
  kaalikas: 'brassicaceae',
  naeris: 'brassicaceae',

  saialill: 'asteraceae',
  tagetes: 'asteraceae',
  paevalill: 'asteraceae',
  salat: 'asteraceae',

  basiilik: 'lamiaceae',
  rosmariin: 'lamiaceae',
  tuumian: 'lamiaceae',
  piparmunt: 'lamiaceae',

  peet: 'chenopodiaceae',
  spinat: 'chenopodiaceae',

  maasikas: 'rosaceae',
  vaarikas: 'rosaceae',
  ounapuu: 'rosaceae',
  ploomipuu: 'rosaceae',
  kirsipuu: 'rosaceae',

  mais: 'poaceae'
};

/**
 * Normalizes any string identifier, plant name, or alias to a canonical plant species ID.
 */
export function normalizePlantIdentifier(raw: string, allPlants?: Plant[]): string {
  if (!raw) return '';
  const clean = raw.trim().toLowerCase().replace(/[-_]/g, ' ');

  // Direct match in alias dictionary
  if (PLANT_ALIASES[clean]) {
    return PLANT_ALIASES[clean];
  }

  // Without spaces match (e.g. "sweetcorn" -> "sweet corn")
  const compact = clean.replace(/\s+/g, '');
  if (PLANT_ALIASES[compact]) {
    return PLANT_ALIASES[compact];
  }

  // Match against catalog if supplied
  if (allPlants) {
    const found = allPlants.find(
      (p) =>
        p.id.toLowerCase() === clean ||
        p.name.toLowerCase() === clean ||
        p.scientificName?.toLowerCase() === clean ||
        p.nameEn?.toLowerCase() === clean
    );
    if (found) {
      return normalizePlantIdentifier(found.id);
    }
  }

  return clean;
}

/**
 * Resolves botanical family ID for a given canonical plant species ID.
 */
export function getBotanicalFamily(canonicalId: string, plant?: Plant): string {
  const raw = plant?.botanicalFamilyId?.toLowerCase() || CANONICAL_BOTANICAL_FAMILIES[canonicalId] || 'unknown';
  if (raw === 'allium' || raw === 'amaryllidaceae') return 'alliaceae';
  if (raw === 'amaranthaceae') return 'chenopodiaceae';
  return raw;
}

function findDirectBotanicalKnowledge(canonicalA: string, canonicalB: string): BotanicalPairKnowledge | null {
  for (const item of BOTANICAL_PAIRS) {
    const [p1, p2] = item.pair;
    if ((canonicalA === p1 && canonicalB === p2) || (canonicalA === p2 && canonicalB === p1)) {
      return item;
    }
  }
  return null;
}

/**
 * Pure deterministic domain evaluation of two plant species.
 * Distinguishes established horticultural guidance from traditional claims with weak evidence.
 * Does NOT invent incompatibilities simply because a pair is absent from the database.
 */
export function evaluatePairRelationship(
  idOrNameA: string,
  idOrNameB: string,
  allPlants: Plant[] = [],
  lang: 'et' | 'en' = 'et'
): CompanionRecommendation {
  const canonicalA = normalizePlantIdentifier(idOrNameA, allPlants);
  const canonicalB = normalizePlantIdentifier(idOrNameB, allPlants);

  const plantObjA = allPlants.find((p) => p.id.toLowerCase() === canonicalA || p.name.toLowerCase() === canonicalA);
  const plantObjB = allPlants.find((p) => p.id.toLowerCase() === canonicalB || p.name.toLowerCase() === canonicalB);

  const displayNameA = (lang === 'en' ? plantObjA?.nameEn : plantObjA?.name) || plantObjA?.name || idOrNameA;
  const displayNameB = (lang === 'en' ? plantObjB?.nameEn : plantObjB?.name) || plantObjB?.name || idOrNameB;

  // 1. Check direct curated botanical knowledge
  const direct = findDirectBotanicalKnowledge(canonicalA, canonicalB);
  if (direct) {
    const explanation = lang === 'en' ? direct.reasonEn : direct.reasonEt;
    return {
      plantA: displayNameA,
      plantB: displayNameB,
      canonicalIdA: canonicalA,
      canonicalIdB: canonicalB,
      classification: direct.classification,
      isHarmful: direct.isHarmful,
      confidence: direct.confidence,
      source: direct.source,
      category: direct.category,
      explanation,
      explanationEt: direct.reasonEt,
      explanationEn: direct.reasonEn,
      conditions: lang === 'en' ? direct.conditionsEn : direct.conditionsEt,
      botanicalReason: direct.reasonEt,
      botanicalReasonEn: direct.reasonEn,
      message: explanation
    };
  }

  // 2. Botanical family scientific rules
  const familyA = getBotanicalFamily(canonicalA, plantObjA);
  const familyB = getBotanicalFamily(canonicalB, plantObjB);

  // Established: Fennel is strongly allelopathic to almost all garden plants
  if (canonicalA === 'apteegitill' || canonicalB === 'apteegitill') {
    const reasonEt = 'Apteegitill (fenkol) eritab juurtest ja võrsetest allelopaatilisi aineid, mis pärsivad enamiku aiaviljade kasvu.';
    const reasonEn = 'Fennel root and foliage exudates possess strong allelopathic properties inhibiting growth in neighboring crops.';
    return {
      plantA: displayNameA,
      plantB: displayNameB,
      canonicalIdA: canonicalA,
      canonicalIdB: canonicalB,
      classification: 'incompatible',
      isHarmful: true,
      confidence: 'established',
      source: 'RHS Horticultural Science',
      category: 'allelopathy',
      explanation: lang === 'en' ? reasonEn : reasonEt,
      explanationEt: reasonEt,
      explanationEn: reasonEn,
      botanicalReason: reasonEt,
      botanicalReasonEn: reasonEn,
      message: lang === 'en' ? reasonEn : reasonEt
    };
  }

  // Established: Alliaceae + Fabaceae allelopathy (Garlic/Onion/Leek + Peas/Beans)
  if (
    (familyA === 'alliaceae' && familyB === 'fabaceae') ||
    (familyA === 'fabaceae' && familyB === 'alliaceae')
  ) {
    const reasonEt = 'Laugu perekonna (Alliaceae) väävliühendid ja juureeritised pärsivad liblikõieliste (Fabaceae) juurtel elavate lämmastikku siduvate mügarbakterite tegevust.';
    const reasonEn = 'Allium sulfur secretions inhibit nitrogen-fixing Rhizobium bacteria on legume roots.';
    return {
      plantA: displayNameA,
      plantB: displayNameB,
      canonicalIdA: canonicalA,
      canonicalIdB: canonicalB,
      classification: 'incompatible',
      isHarmful: true,
      confidence: 'established',
      source: 'EMÜ & RHS Agronomy',
      category: 'allelopathy',
      explanation: lang === 'en' ? reasonEn : reasonEt,
      explanationEt: reasonEt,
      explanationEn: reasonEn,
      botanicalReason: reasonEt,
      botanicalReasonEn: reasonEn,
      message: lang === 'en' ? reasonEn : reasonEt
    };
  }

  // Established: Solanaceae + Solanaceae disease vector risk (Potato + Tomato + Pepper)
  if (familyA === 'solanaceae' && familyB === 'solanaceae' && canonicalA !== canonicalB) {
    const reasonEt = 'Samast maavitsaliste (Solanaceae) sugukonnast taimed nakatuvad samadesse mulla- ja lehehaigustesse (kartuli-lehemädanik, närbumistõved).';
    const reasonEn = 'Solanaceae family crops share acute susceptibility to common pathogens (Phytophthora late blight, verticillium wilt).';
    return {
      plantA: displayNameA,
      plantB: displayNameB,
      canonicalIdA: canonicalA,
      canonicalIdB: canonicalB,
      classification: 'incompatible',
      isHarmful: true,
      confidence: 'established',
      source: 'METK & EMÜ Taimekaitse',
      category: 'disease_vector',
      explanation: lang === 'en' ? reasonEn : reasonEt,
      explanationEt: reasonEt,
      explanationEn: reasonEn,
      botanicalReason: reasonEt,
      botanicalReasonEn: reasonEn,
      message: lang === 'en' ? reasonEn : reasonEt
    };
  }

  // Established: Brassicaceae + Brassicaceae shared pest accumulation
  if (familyA === 'brassicaceae' && familyB === 'brassicaceae' && canonicalA !== canonicalB) {
    const reasonEt = 'Ristõielised (kapsad, kaalikas, redis) koguvad samu kahjureid (maakirbud, kapsakoi) ja kapsanuutrit (Plasmodiophora).';
    const reasonEn = 'Brassicaceae crops attract shared specialist pests (flea beetles, cabbage moth) and accumulate clubroot spores.';
    return {
      plantA: displayNameA,
      plantB: displayNameB,
      canonicalIdA: canonicalA,
      canonicalIdB: canonicalB,
      classification: 'incompatible',
      isHarmful: true,
      confidence: 'established',
      source: 'METK (Eesti Maaelu Teadmuskeskus)',
      category: 'disease_vector',
      explanation: lang === 'en' ? reasonEn : reasonEt,
      explanationEt: reasonEt,
      explanationEn: reasonEn,
      botanicalReason: reasonEt,
      botanicalReasonEn: reasonEn,
      message: lang === 'en' ? reasonEn : reasonEt
    };
  }

  // 3. Check catalog explicit lists (companionsGood / companionsBad)
  if (plantObjA && plantObjB) {
    const aListBad = plantObjA.companionsBad.map((x) => normalizePlantIdentifier(x, allPlants));
    const bListBad = plantObjB.companionsBad.map((x) => normalizePlantIdentifier(x, allPlants));
    const isBadInCatalog = aListBad.includes(canonicalB) || bListBad.includes(canonicalA);

    if (isBadInCatalog) {
      const reasonEt = `${displayNameA} ja ${displayNameB} on kataloogi andmetel ebasoodsad naabrid (kurnavad samu toitaineid või tõmbavad ligi samu kahjureid).`;
      const reasonEn = `${displayNameA} and ${displayNameB} are registered as antagonistic companions (share pest vulnerabilities or nutrient competition).`;
      return {
        plantA: displayNameA,
        plantB: displayNameB,
        canonicalIdA: canonicalA,
        canonicalIdB: canonicalB,
        classification: 'incompatible',
        isHarmful: true,
        confidence: 'traditional',
        source: 'Aianduskataloog (Horticultural Catalog)',
        category: 'disease_vector',
        explanation: lang === 'en' ? reasonEn : reasonEt,
        explanationEt: reasonEt,
        explanationEn: reasonEn,
        botanicalReason: reasonEt,
        botanicalReasonEn: reasonEn,
        message: lang === 'en' ? reasonEn : reasonEt
      };
    }

    const aListGood = plantObjA.companionsGood.map((x) => normalizePlantIdentifier(x, allPlants));
    const bListGood = plantObjB.companionsGood.map((x) => normalizePlantIdentifier(x, allPlants));
    const isGoodInCatalog = aListGood.includes(canonicalB) || bListGood.includes(canonicalA);

    if (isGoodInCatalog) {
      const reasonEt = `${displayNameA} ja ${displayNameB} toetavad teineteist (rikastavad mikrokliimat ja soodustavad kasvu).`;
      const reasonEn = `${displayNameA} and ${displayNameB} support each other (enhance microclimate and mutual vigor).`;
      return {
        plantA: displayNameA,
        plantB: displayNameB,
        canonicalIdA: canonicalA,
        canonicalIdB: canonicalB,
        classification: 'beneficial',
        isHarmful: false,
        confidence: 'traditional',
        source: 'Aianduskataloog (Horticultural Catalog)',
        category: 'general',
        explanation: lang === 'en' ? reasonEn : reasonEt,
        explanationEt: reasonEt,
        explanationEn: reasonEn,
        botanicalReason: reasonEt,
        botanicalReasonEn: reasonEn,
        message: lang === 'en' ? reasonEn : reasonEt
      };
    }
  }

  // 4. Default clean fallback: Neutral / Unknown without inventing false antagonisms
  const isSameSpecies = canonicalA === canonicalB;
  const reasonEt = isSameSpecies
    ? `${displayNameA} ja ${displayNameB} on sama kultuur – sobib monokultuursesse ritta, arvestades taimede vahekaugust.`
    : `Spetsiifiline positiivne või negatiivne koostoime puudub. Taimed sobivad naabriteks normaalse vahekauguse ja valgusolude korral.`;
  const reasonEn = isSameSpecies
    ? `${displayNameA} and ${displayNameB} are identical species – compatible within standard in-row spacing.`
    : `No specific antagonistic or synergistic relationship documented. Compatible neighbors given standard spacing and sunlight.`;

  return {
    plantA: displayNameA,
    plantB: displayNameB,
    canonicalIdA: canonicalA,
    canonicalIdB: canonicalB,
    classification: isSameSpecies ? 'neutral' : 'neutral',
    isHarmful: false,
    confidence: 'insufficient',
    source: 'Üldine agronoomia / Teadusuuringud',
    category: 'general',
    explanation: lang === 'en' ? reasonEn : reasonEt,
    explanationEt: reasonEt,
    explanationEn: reasonEn,
    botanicalReason: reasonEt,
    botanicalReasonEn: reasonEn,
    message: lang === 'en' ? reasonEn : reasonEt
  };
}

export const CompanionEngine = {
  /**
   * Normalizes plant ID or name to canonical ID.
   */
  normalizePlantId(idOrName: string, allPlants?: Plant[]): string {
    return normalizePlantIdentifier(idOrName, allPlants);
  },

  /**
   * Evaluates pairwise companion relationship between two plant species.
   */
  evaluatePair(
    idA: string,
    idB: string,
    allPlants: Plant[] = [],
    lang: 'et' | 'en' = 'et'
  ): CompanionRecommendation {
    return evaluatePairRelationship(idA, idB, allPlants, lang);
  },

  /**
   * Evaluates neighbor conflicts and positive synergies across all adjacent cells in a bed.
   * Backward-compatible with previous signature.
   */
  evaluateBedCompanions(
    plantings: BedPlantingCell[],
    allPlants: Plant[],
    lang: 'et' | 'en' = 'et'
  ): CompanionConflict[] {
    const results: CompanionConflict[] = [];

    for (let i = 0; i < plantings.length; i++) {
      for (let j = i + 1; j < plantings.length; j++) {
        const cellA = plantings[i];
        const cellB = plantings[j];

        // Check if adjacent cells (Chebyshev distance dx <= 1 && dy <= 1)
        const dx = Math.abs(cellA.gridX - cellB.gridX);
        const dy = Math.abs(cellA.gridY - cellB.gridY);
        if (dx <= 1 && dy <= 1) {
          const rec = evaluatePairRelationship(cellA.plantId, cellB.plantId, allPlants, lang);
          if (rec.classification === 'incompatible' || rec.classification === 'beneficial') {
            results.push({
              plantA: rec.plantA,
              plantB: rec.plantB,
              isHarmful: rec.isHarmful,
              message: rec.explanation,
              category: rec.category,
              botanicalReason: rec.explanationEt,
              botanicalReasonEn: rec.explanationEn
            });
          }
        }
      }
    }

    return results;
  },

  /**
   * Evaluates live synergy for an already planted cell relative to its surrounding neighbors in the bed.
   */
  getPlantedCellSynergy(
    targetCell: BedPlantingCell,
    plantings: BedPlantingCell[],
    allPlants: Plant[],
    lang: 'et' | 'en' = 'et'
  ): CellSynergyDetails {
    const plantMap = new Map<string, Plant>();
    for (const p of allPlants) {
      plantMap.set(p.id.toLowerCase(), p);
    }

    const targetPlant = plantMap.get(targetCell.plantId.toLowerCase());
    if (!targetPlant) {
      return { status: 'neutral', score: 0, goodCount: 0, badCount: 0, neutralCount: 0, relationships: [] };
    }

    const neighborCells = plantings.filter(
      (c) =>
        !(c.gridX === targetCell.gridX && c.gridY === targetCell.gridY) &&
        Math.abs(c.gridX - targetCell.gridX) <= 1 &&
        Math.abs(c.gridY - targetCell.gridY) <= 1
    );

    const relationships: CellSynergyDetails['relationships'] = [];
    let goodCount = 0;
    let badCount = 0;
    let neutralCount = 0;

    for (const neighbor of neighborCells) {
      const neighborPlant = plantMap.get(neighbor.plantId.toLowerCase());
      if (!neighborPlant) continue;

      const rec = evaluatePairRelationship(targetPlant.id, neighborPlant.id, allPlants, lang);

      if (rec.classification === 'incompatible') {
        badCount++;
        relationships.push({
          neighborPlantId: neighborPlant.id,
          neighborName: neighborPlant.name,
          neighborIcon: neighborPlant.icon,
          type: 'bad',
          reason: rec.explanation,
          category: rec.category,
          botanicalReason: rec.explanationEt,
          confidence: rec.confidence,
          source: rec.source
        });
      } else if (rec.classification === 'beneficial') {
        goodCount++;
        relationships.push({
          neighborPlantId: neighborPlant.id,
          neighborName: neighborPlant.name,
          neighborIcon: neighborPlant.icon,
          type: 'good',
          reason: rec.explanation,
          category: rec.category,
          botanicalReason: rec.explanationEt,
          confidence: rec.confidence,
          source: rec.source
        });
      } else {
        neutralCount++;
        relationships.push({
          neighborPlantId: neighborPlant.id,
          neighborName: neighborPlant.name,
          neighborIcon: neighborPlant.icon,
          type: 'neutral',
          reason: rec.explanation,
          confidence: rec.confidence,
          source: rec.source
        });
      }
    }

    const score = goodCount * 2 - badCount * 3;
    let status: CellSynergyDetails['status'] = 'neutral';
    if (badCount > 0 && goodCount > 0) {
      status = 'mixed';
    } else if (badCount > 0) {
      status = 'negative';
    } else if (goodCount > 0) {
      status = 'positive';
    }

    return {
      status,
      score,
      goodCount,
      badCount,
      neutralCount,
      relationships
    };
  },

  /**
   * Evaluates overall harmony score and synergy statistics for the entire bed.
   * For beds without precise plant coordinates, accepts bed-level plantings or species list.
   */
  calculateBedHarmony(
    plantings: BedPlantingCell[],
    allPlants: Plant[],
    lang: 'et' | 'en' = 'et'
  ): BedHarmonyScore {
    const recommendations: CompanionRecommendation[] = [];

    // Evaluate all distinct pairs in bed
    for (let i = 0; i < plantings.length; i++) {
      for (let j = i + 1; j < plantings.length; j++) {
        const cellA = plantings[i];
        const cellB = plantings[j];

        // If coordinates exist, check adjacency (within Chebyshev distance 1)
        // If bed is purely aggregated without grid coordinates, check all distinct pairs
        const dx = Math.abs(cellA.gridX - cellB.gridX);
        const dy = Math.abs(cellA.gridY - cellB.gridY);
        const isAdjacent = (cellA.gridX === 0 && cellA.gridY === 0 && cellB.gridX === 0 && cellB.gridY === 0)
          ? true
          : (dx <= 1 && dy <= 1);

        if (isAdjacent) {
          const rec = evaluatePairRelationship(cellA.plantId, cellB.plantId, allPlants, lang);
          recommendations.push(rec);
        }
      }
    }

    const positivePairs = recommendations.filter((r) => r.classification === 'beneficial').length;
    const negativePairs = recommendations.filter((r) => r.classification === 'incompatible').length;
    const neutralPairs = recommendations.filter((r) => r.classification === 'neutral' || r.classification === 'unknown').length;
    const totalPairings = positivePairs + negativePairs;

    let harmonyPercentage = 100;
    if (totalPairings > 0) {
      harmonyPercentage = Math.max(0, Math.min(100, Math.round(((positivePairs + 0.5) / (totalPairings + 0.5)) * 100)));
      if (negativePairs > 0 && positivePairs === 0) {
        harmonyPercentage = Math.max(10, 50 - negativePairs * 15);
      }
    }

    let summary = lang === 'en'
      ? 'No plant companion relationships in bed.'
      : 'Peenras puuduvad naabrustaimede suhted.';

    if (negativePairs > 0 && positivePairs > 0) {
      summary = lang === 'en'
        ? `${positivePairs} beneficial pairing(s) and ${negativePairs} warning(s).`
        : `${positivePairs} soodsat suhet ja ${negativePairs} hoiatust.`;
    } else if (positivePairs > 0) {
      summary = lang === 'en'
        ? `${positivePairs} excellent companion relationship(s)! All plants support each other.`
        : `${positivePairs} suurepärast naabrussuhet! Kõik taimed toetavad teineteist.`;
    } else if (negativePairs > 0) {
      summary = lang === 'en'
        ? `Attention: ${negativePairs} incompatible plant pairing(s) in bed!`
        : `Tähelepanu: ${negativePairs} ebasoodsat naabrit peenras!`;
    }

    return {
      harmonyPercentage,
      positivePairs,
      negativePairs,
      neutralPairs,
      totalPairings,
      summary,
      recommendations
    };
  },

  /**
   * Evaluates potential synergy if a candidate plant were placed at (gridX, gridY).
   */
  getCellSynergy(
    gridX: number,
    gridY: number,
    candidatePlant: Plant,
    plantings: BedPlantingCell[],
    allPlants: Plant[],
    lang: 'et' | 'en' = 'et'
  ): { status: 'good' | 'bad' | 'neutral'; reason?: string; botanicalReason?: string; confidence?: EvidenceConfidence; source?: string } {
    const neighborCells = plantings.filter(
      (c) => !(c.gridX === gridX && c.gridY === gridY) &&
        Math.abs(c.gridX - gridX) <= 1 &&
        Math.abs(c.gridY - gridY) <= 1
    );

    if (neighborCells.length === 0) {
      return { status: 'neutral' };
    }

    // First check for bad companion conflicts
    for (const neighbor of neighborCells) {
      const rec = evaluatePairRelationship(candidatePlant.id, neighbor.plantId, allPlants, lang);
      if (rec.classification === 'incompatible') {
        return {
          status: 'bad',
          reason: rec.explanation,
          botanicalReason: rec.explanationEt,
          confidence: rec.confidence,
          source: rec.source
        };
      }
    }

    // Then check for good companion synergies
    for (const neighbor of neighborCells) {
      const rec = evaluatePairRelationship(candidatePlant.id, neighbor.plantId, allPlants, lang);
      if (rec.classification === 'beneficial') {
        return {
          status: 'good',
          reason: rec.explanation,
          botanicalReason: rec.explanationEt,
          confidence: rec.confidence,
          source: rec.source
        };
      }
    }

    return { status: 'neutral' };
  },

  /**
   * Returns top beneficial and antagonistic companion recommendations for a plant from the catalog.
   */
  getSuggestedCompanions(
    targetPlantId: string,
    allPlants: Plant[]
  ): { good: Plant[]; bad: Plant[] } {
    const canonicalTarget = normalizePlantIdentifier(targetPlantId, allPlants);
    const target = allPlants.find(
      (p) => normalizePlantIdentifier(p.id, allPlants) === canonicalTarget
    );
    if (!target) return { good: [], bad: [] };

    const good: Plant[] = [];
    const bad: Plant[] = [];

    for (const candidate of allPlants) {
      if (candidate.id === target.id) continue;
      const rec = evaluatePairRelationship(target.id, candidate.id, allPlants);
      if (rec.classification === 'beneficial') {
        good.push(candidate);
      } else if (rec.classification === 'incompatible') {
        bad.push(candidate);
      }
    }

    return { good, bad };
  },

  /**
   * Evaluates spatial proximity and cross-bed companion relationships between beds within maxDistanceM (default 1.5m).
   */
  evaluateCrossBedInteractions(
    entities: GardenEntity[],
    allPlants: Plant[],
    maxDistanceM = 1.5,
    lang: 'et' | 'en' = 'et'
  ): CrossBedInteraction[] {
    const bedEntities = entities.filter(
      (e) => !e.deletedAt && e.visible !== false && (e.category === 'bed' || e.category === 'structure')
    );
    const interactions: CrossBedInteraction[] = [];

    for (let i = 0; i < bedEntities.length; i++) {
      for (let j = i + 1; j < bedEntities.length; j++) {
        const bedA = bedEntities[i];
        const bedB = bedEntities[j];

        // Euclidean distance between bounding box centers
        const centerA: Point2D = { x: bedA.x + bedA.width / 2, y: bedA.y + bedA.length / 2 };
        const centerB: Point2D = { x: bedB.x + bedB.width / 2, y: bedB.y + bedB.length / 2 };
        const centerDist = Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y);

        // Approximate edge-to-edge distance
        const halfSpanA = Math.max(bedA.width, bedA.length) / 2;
        const halfSpanB = Math.max(bedB.width, bedB.length) / 2;
        const edgeDist = Math.max(0, centerDist - halfSpanA - halfSpanB);

        if (edgeDist <= maxDistanceM) {
          const plantingsA = bedA.bedData?.plantings || [];
          const plantingsB = bedB.bedData?.plantings || [];

          const pairings: CompanionRecommendation[] = [];

          // Compare distinct plants between bedA and bedB
          const uniquePlantsA = Array.from(new Set(plantingsA.map((p) => p.plantId)));
          const uniquePlantsB = Array.from(new Set(plantingsB.map((p) => p.plantId)));

          for (const plantIdA of uniquePlantsA) {
            for (const plantIdB of uniquePlantsB) {
              const rec = evaluatePairRelationship(plantIdA, plantIdB, allPlants, lang);
              if (rec.classification === 'beneficial' || rec.classification === 'incompatible') {
                pairings.push(rec);
              }
            }
          }

          if (pairings.length > 0) {
            const hasConflict = pairings.some((p) => p.classification === 'incompatible');
            const hasSynergy = pairings.some((p) => p.classification === 'beneficial');
            const overallClassification: CompanionClassification =
              hasConflict && hasSynergy ? 'incompatible' : hasConflict ? 'incompatible' : 'beneficial';

            interactions.push({
              bedAId: bedA.id,
              bedBId: bedB.id,
              bedAName: bedA.name,
              bedBName: bedB.name,
              distanceM: Math.round(edgeDist * 10) / 10,
              centerA,
              centerB,
              pairings,
              overallClassification
            });
          }
        }
      }
    }

    return interactions;
  }
};
