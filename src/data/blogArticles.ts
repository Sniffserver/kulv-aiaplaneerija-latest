export type BlogCategory = 'crop_rotation' | 'soil_health' | 'climate' | 'ipm';

export interface BlogArticle {
  id: string;
  titleEt: string;
  titleEn: string;
  summaryEt: string;
  summaryEn: string;
  contentEt: string[];
  contentEn: string[];
  category: BlogCategory;
  categoryLabelEt: string;
  categoryLabelEn: string;
  readTimeMinutes: number;
  publishedDate: string;
  author: string;
  authorRole: string;
  institutionalAffiliation: string;
  tags: string[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'crop-rotation-science-clubroot',
    titleEt: 'Viljavahelduse teaduslik alus: miks 4-aastane paus päästab kapsasaagi',
    titleEn: 'The Science of Crop Rotation: Why a 4-Year Break Saves Your Brassicas',
    summaryEt: 'Uurime Plasmodiophora brassicae (kapsanuutri) puhkespooride elutsüklit mullas ja seda, miks lühem külvikorravahe viib paratamatult saagikuse kollapsini.',
    summaryEn: 'Exploring the soil lifecycle of Plasmodiophora brassicae (clubroot) resting spores and why inadequate rotation breaks lead to crop collapse.',
    category: 'crop_rotation',
    categoryLabelEt: 'Viljavaheldus',
    categoryLabelEn: 'Crop Rotation',
    readTimeMinutes: 6,
    publishedDate: '2026-03-12',
    author: 'Agronoomia töörühm',
    authorRole: 'Taimekaitse ja mullaökoloogia teadur',
    institutionalAffiliation: 'Eesti Maaülikool & METK',
    tags: ['Viljavaheldus', 'Brassicaceae', 'Kapsanuuter', 'Mullamikroobid'],
    contentEt: [
      'Põhjamaades on ristõielised (Brassicaceae: peakapsas, kaalikas, naeris, redis, lehtkapsas) aedniku toidulaual asendamatud. Ometi teevad paljud hobiaednikud vea, istutades neid igal teisel või kolmandal aastal samasse peenrasse.',
      'Kapsanuutri tekitaja Plasmodiophora brassicae ei ole tavaline seen, vaid algloomalaadne limakseen (Plasmodiophorida). Nakatunud juurtele moodustuvad ebakorrapärased pahad, mis blokeerivad ksüleemi ja floeemi, takistades vee ja toitainete transporti.',
      'Miks on 4-aastane vahe kohustuslik miinimum? Taimekaitselaborite uuringud näitavad, et Plasmodiophora puhkespoorid suudavad mullas eluvõimelistena säilida 8–10 aastat. Esimese kolme aasta jooksul on inokulaadi tase peenras piisav massiliseks nakatumiseks.',
      'Lisaks viljavaheldusele on kriitiline hoida mulla pH väärtus üle 6.8. Happelises mullas (pH < 6.0) idanevad kapsanuutri zoospoorid eksponentsiaalselt kiiremini. Kevadine puutuhk või lubiväetis peenras enne ristõielisi on hädavajalik profülaktiline samm.'
    ],
    contentEn: [
      'In Nordic gardens, brassicas are staple cold-hardy crops. Yet gardeners frequently err by planting them every two or three years in the same plot.',
      'Clubroot (Plasmodiophora brassicae) is a protist pathogen that infects root hairs, causing massive root malformations that obstruct hydraulic flow.',
      'Why is a 4-year gap mandatory? Research confirms resting spores survive up to 10 years in the soil matrix. Inoculum density remains pathogenic for the first 3-4 years without non-host crops.',
      'Maintaining soil pH above 6.8 inhibits spore germination significantly, pairing agronomic liming with rotation intervals.'
    ]
  },
  {
    id: 'nordic-soil-health-rhizobium',
    titleEt: 'Põhjamaa mullatervis: orgaaniline aine, pH ja mügarbakterid',
    titleEn: 'Nordic Soil Biology: Organic Matter, pH, and Rhizobial Symbiosis',
    summaryEt: 'Kuidas liblikõielised (hernes, põlduba) seovad atmosfäärilämmastikku ja loovad järgmiseks hooajaks elava bioväetise varu ilma kunstväetisteta.',
    summaryEn: 'How legumes fix atmospheric nitrogen via Rhizobium root nodules, leaving slow-release biological nutrients for next season.',
    category: 'soil_health',
    categoryLabelEt: 'Mullatervis',
    categoryLabelEn: 'Soil Health',
    readTimeMinutes: 5,
    publishedDate: '2026-02-28',
    author: 'Dr. Kristiina Vaher',
    authorRole: 'Mullamikrobioloogia lektor',
    institutionalAffiliation: 'Eesti Maaülikooli Mullateaduse õppetool',
    tags: ['Mullatervis', 'Rhizobium', 'Hernes', 'Kompost'],
    contentEt: [
      'Põhjamaa jahedates muldades on orgaanilise aine mineraliseerumine kevadel aeglane. Seetõttu vajavad rasketoitelised kultuurid (tomat, kõrvits, kapsas) stabiilset ja kättesaadavat lämmastikuallikat.',
      'Liblikõielised (Fabaceae) elavad sümbioosis Rhizobium leguminosarum bakteritega. Need mikroobid tarbivad taime fotosünteesi toodetud suhkruid ning vastutasuks redutseerivad atmosfääri gaasilise lämmastiku (N2) ammooniumiks (NH4+).',
      'Hooaja lõppedes ära kunagi tõmba herne ega põldoa juuri maast välja! Lõika varred maapinna kõrguselt maha. Mullas lagunevad mügarad vabastavad kuni 80–120 kg N/ha otse mulla huumusesse, muutes selle peenra ideaalseks stardikohaks järgmise aasta rasketoitelistele viljadele.',
      'Oluline hoiatus: Lauguliste (küüslauk, sibul) allitsiinilised juureeritised pärsivad Rhizobium bakterite kinnitumist. Hoia kaunviljad laugulistest eraldi!'
    ],
    contentEn: [
      'In cool Nordic climates, soil mineralisation is delayed in early spring. Heavy feeders demand biologically active, slow-release nitrogen reserves.',
      'Legumes partner with symbiotic Rhizobium bacteria to convert atmospheric nitrogen into bioavailable ammonium.',
      'Never yank pea or broad bean roots out at season end: cut stems at ground level so decomposing nodules enrich the soil horizons organically.',
      'Note: Allium antimicrobial root exudates inhibit rhizobial attachment; separate legumes and alliums.'
    ]
  },
  {
    id: 'spring-frost-gdd-science',
    titleEt: 'Varakevadised külvid ja öökülmade teadus: GDD ja katteloorid',
    titleEn: 'Early Spring Sowings and Frost Dynamics: GDD & Thermal Covers',
    summaryEt: 'Kasvupäevade soojussumma (GDD) ja mikrokliima füüsika: kuidas 17g/m² ja 30g/m² katteloor nihutab saagi algust 2–3 nädalat varasemaks.',
    summaryEn: 'Growing Degree Days (GDD) and microclimate physics: how agricultural fleece shifts the Nordic season forward by 2-3 weeks.',
    category: 'climate',
    categoryLabelEt: 'Kliima & Öökülm',
    categoryLabelEn: 'Climate & Frost',
    readTimeMinutes: 7,
    publishedDate: '2026-02-15',
    author: 'Agrometeoroloogia keskus',
    authorRole: 'Kliima ja agrometeoroloogia analüütik',
    institutionalAffiliation: 'Maaelu Teadmuskeskus (METK)',
    tags: ['Öökülm', 'GDD', 'Katteloor', 'Kevadkülvid'],
    contentEt: [
      'Eesti agrokliimas kõigub viimane kevadine öökülm mai keskpaigast (saartel ja põhjarannikul) kuni juuni esimese nädalani (Kagu-Eestis ja Pandiverel).',
      'Taimede arengut ei juhi kalendripäevad, vaid akumuleeritud soojussumma ehk Growing Degree Days (GDD). Baastemperatuurist kõrgemate päevakeskmiste temperatuuride summa määrab idanemise ja õitsemise täpsuse.',
      'Katteloor (17–30 g/m²) ei toimi pelgalt tuuletõkkena: maapinnast kiirgav infrapunasoojus peegeldub loori poorse struktuuri all tagasi, tõstes öist miinimumtemperatuuri 2–4 °C võrra. See loob mikrokliima, mis vastab kuni 150 km lõunapoolsemale asukohale.',
      'Oluline on loor tihedalt muldservaga kinni katta, et vältida konvektiivset jahtumist külmade põhjatuulte korral.'
    ],
    contentEn: [
      'Last spring frosts vary widely across Estonia from mid-May along coastal zones to early June in southeastern hollows.',
      'Plant phenology is dictated by Growing Degree Days (GDD) rather than calendar dates.',
      'Agricultural fleeces trap longwave infrared radiation reradiated by soil, raising minimum nocturnal canopy temperatures by 2-4°C.',
      'Secure fleece edges firmly to seal against advective wind chills.'
    ]
  },
  {
    id: 'integrated-pest-management-nordic',
    titleEt: 'Integreeritud taimekaitse (IPM) koduaias: looduslikud vaenlased ja repellendid',
    titleEn: 'Integrated Pest Management (IPM): Natural Predators & Repellents',
    summaryEt: 'Kuidas porgandi- ja sibulapeenarde kombineerimine ning sarikõielised meelitavad parasiitherilasi ja vähendavad kahjurikahjustusi üle 70%.',
    summaryEn: 'How intercropping carrots with alliums and planting umbellifers attracts parasitoid wasps, reducing pest damage by over 70%.',
    category: 'ipm',
    categoryLabelEt: 'Taimekaitse & IPM',
    categoryLabelEn: 'Plant Health & IPM',
    readTimeMinutes: 6,
    publishedDate: '2026-01-20',
    author: 'Entomoloogia uurimisrühm',
    authorRole: 'Rakendusentomoloog',
    institutionalAffiliation: 'Eesti Maaülikool & RHS',
    tags: ['IPM', 'Porgandikärbes', 'Bioloogiline tõrje', 'Segupeenrad'],
    contentEt: [
      'Integreeritud taimekaitse (IPM) põhiprintsiip on ennetada kahjurite massilist paljunemist ökosüsteemi tasakaalustamise kaudu, mitte mürgise keemiaga.',
      'Porgandikärbes (Psila rosae) leiab oma peremeestaime spetsiifiliste lenduvate terpenoidide järgi. Kui kõrvuti istutada sarikalised (porgand) ja laugulised (sibul, porrulauk), maskeerib sibula allüülpropüüldisulfiid porgandi lõhna, viies kärbse munemise eksiteele.',
      'Teine võimas tööriist on sarikõieliste (till, koriander) õitsemine aias. Nende nektar on kergesti kättesaadav pisikestele parasiitherilastele (nt Cotesia glomerata), kes munevad kapsaliblika röövikutesse, hoides kahjurite populatsiooni looduslikult madalal.',
      'IPM reegel nr 1: kontrolli ja jälgi enne sekkumist. Väike arv kahjureid hoiab elus kasulike putukate populatsiooni!'
    ],
    contentEn: [
      'IPM emphasizes ecological prevention over chemical intervention.',
      'Carrot rust flies orient via volatile host terpenes. Intercropping with alliums masks these chemical cues through sulfur volatiles.',
      'Flowering umbellifers provide shallow nectar for parasitic braconid wasps that prey on cabbage caterpillar larvae.',
      'Tolerate threshold baseline pest numbers to sustain predatory insect communities.'
    ]
  }
];
