/**
 * Lunar and Biodynamic Planting Calendar Engine for Northern Gardeners.
 * Calculates Moon phases and Maria Thun biodynamic plant organ days (Root, Leaf, Flower, Fruit).
 */

export type BiodynamicElementType = 'root' | 'leaf' | 'flower' | 'fruit';

export interface BiodynamicDayInfo {
  element: BiodynamicElementType;
  elementName: string;
  icon: string;
  constellation: string;
  bestCrops: string[];
  advice: string;
}

export interface MoonPhaseInfo {
  phaseValue: number; // 0 to 1 (0 = new, 0.5 = full)
  name: string;
  icon: string;
  isWaxing: boolean;
  advice: string;
}

export interface DayLunarInfo {
  date: string; // YYYY-MM-DD
  dayName: string;
  phase: MoonPhaseInfo;
  biodynamic: BiodynamicDayInfo;
}

// Synodic month in days (New Moon to New Moon)
const SYNODIC_MONTH = 29.53058867;
// Reference new moon: 2000-01-06 18:14 UTC
const KNOWN_NEW_MOON_UTC = 947182440000;

// Sidereal period (Moon orbit relative to zodiac constellations) ~27.321661 days
const SIDEREAL_MONTH = 27.321661;
// Reference anchor when moon enters Aries (Fire/Fruit): 2026-01-01 00:00 UTC ~ Pisces/Aries border
const KNOWN_ARIES_ANCHOR_UTC = 1767225600000;

const ZODIAC_ELEMENTS: {
  name: string;
  element: BiodynamicElementType;
  elementName: string;
  icon: string;
  crops: string[];
  advice: string;
}[] = [
  {
    name: 'Jäär (Tuli)',
    element: 'fruit',
    elementName: 'Viljapäev',
    icon: '🍅',
    crops: ['Tomat', 'Kurk', 'Kõrvits', 'Hernes', 'Uba', 'Paprika'],
    advice: 'Soodne vilja kandvate köögiviljade külviks ja istutuseks.'
  },
  {
    name: 'Sõnn (Maa)',
    element: 'root',
    elementName: 'Juurepäev',
    icon: '🥕',
    crops: ['Porgand', 'Peet', 'Redis', 'Sibul', 'Küüslauk', 'Kartul'],
    advice: 'Parim aeg juurviljade ja mugulate külviks ning muldamiseks.'
  },
  {
    name: 'Kaksikud (Õhk)',
    element: 'flower',
    elementName: 'Õiepäev',
    icon: '🌸',
    crops: ['Lilled', 'Brokoli', 'Lillkapsas', 'Maitsetaimed'],
    advice: 'Soodne lilletaimede ja õisikkapsaste külviks ning hooldustöödeks.'
  },
  {
    name: 'Vähk (Vesi)',
    element: 'leaf',
    elementName: 'Lehepäev',
    icon: '🥬',
    crops: ['Salat', 'Spinat', 'Lehtkapsas', 'Lehtpeet', 'Till'],
    advice: 'Ideaalne lehtköögiviljade ja ürtide külviks ning kastmiseks.'
  },
  {
    name: 'Lõvi (Tuli)',
    element: 'fruit',
    elementName: 'Viljapäev',
    icon: '🍅',
    crops: ['Tomat', 'Mais', 'Kõrvitsalised', 'Marjad'],
    advice: 'Väga viljakas päev soojust armastavate viljaköögiviljade tarvis.'
  },
  {
    name: 'Neitsi (Maa)',
    element: 'root',
    elementName: 'Juurepäev',
    icon: '🥕',
    crops: ['Porgand', 'Mustjuur', 'Kaalikas', 'Naeris'],
    advice: 'Soodustab tugevat juurestikku ja säilitusjuurviljade arengut.'
  },
  {
    name: 'Kaalud (Õhk)',
    element: 'flower',
    elementName: 'Õiepäev',
    icon: '🌸',
    crops: ['Lilled', 'Saialill', 'Ravimtaimed'],
    advice: 'Õitsemise ja seemnekasvatuse toetamine.'
  },
  {
    name: 'Skorpion (Vesi)',
    element: 'leaf',
    elementName: 'Lehepäev',
    icon: '🥬',
    crops: ['Kapsalised', 'Salatid', 'Basiilik', 'Münt'],
    advice: 'Lopsaka lehemassi areng ja kastmistööd.'
  },
  {
    name: 'Ambur (Tuli)',
    element: 'fruit',
    elementName: 'Viljapäev',
    icon: '🍅',
    crops: ['Uba', 'Hernes', 'Paprika', 'Tomat'],
    advice: 'Kaunviljade ja viljataimede külv ning toetamine.'
  },
  {
    name: 'Kaljukits (Maa)',
    element: 'root',
    elementName: 'Juurepäev',
    icon: '🥕',
    crops: ['Kartul', 'Porgand', 'Sibul', 'Peet'],
    advice: 'Vastupidavad ja kauasäilivad juurviljad.'
  },
  {
    name: 'Veevalaja (Õhk)',
    element: 'flower',
    elementName: 'Õiepäev',
    icon: '🌸',
    crops: ['Õitsvad ürdid', 'Dekoratiivtaimed'],
    advice: 'Kobestamine ja mulla õhustamine.'
  },
  {
    name: 'Kalad (Vesi)',
    element: 'leaf',
    elementName: 'Lehepäev',
    icon: '🥬',
    crops: ['Spinat', 'Hapukapsasordid', 'Murulauk'],
    advice: 'Vee-elemendi taimede külv ja kastmine.'
  }
];

export const LunarCalendar = {
  /**
   * Calculates astronomical moon phase for a given date.
   */
  getMoonPhase(date: Date): MoonPhaseInfo {
    const diffMs = date.getTime() - KNOWN_NEW_MOON_UTC;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const cycles = diffDays / SYNODIC_MONTH;
    const phaseValue = cycles - Math.floor(cycles); // 0.0 to 1.0

    let name = 'Noorkuu';
    let icon = '🌑';
    let isWaxing = true;
    let advice = 'Uue alguse aeg: sobib taimede kärpimiseks ja puhkuseks.';

    if (phaseValue < 0.03 || phaseValue >= 0.97) {
      name = 'Noorkuu';
      icon = '🌑';
      isWaxing = true;
      advice = 'Noorkuu ajal hoidu olulistest külvitöödest; hea aeg rohimiseks.';
    } else if (phaseValue < 0.24) {
      name = 'Kasvav noorkuu';
      icon = '🌒';
      isWaxing = true;
      advice = 'Mahlade liikumine ülespoole: soodne leht- ja viljakultuuride külviks.';
    } else if (phaseValue < 0.28) {
      name = 'Esimene veerand';
      icon = '🌓';
      isWaxing = true;
      advice = 'Taimede kasvutempo kiireneb; soodne ettekülviks ja pikeerimiseks.';
    } else if (phaseValue < 0.47) {
      name = 'Kasvav täiskuu';
      icon = '🌔';
      isWaxing = true;
      advice = 'Väga viljakas periood enne täiskuud; soodne viljakultuuridele.';
    } else if (phaseValue < 0.53) {
      name = 'Täiskuu';
      icon = '🌕';
      isWaxing = false;
      advice = 'Taimede elujõud on tipus: hea aeg ravimtaimede ja saagi korjamiseks.';
    } else if (phaseValue < 0.74) {
      name = 'Kahanev kuu';
      icon = '🌖';
      isWaxing = false;
      advice = 'Mahlade liikumine juurtesse: soodne aeg juurviljade külviks ja istutuseks.';
    } else if (phaseValue < 0.78) {
      name = 'Viimane veerand';
      icon = '🌗';
      isWaxing = false;
      advice = 'Juurestiku arengu toetamine, kompostimine ja mulla väetamine.';
    } else {
      name = 'Vanakuu';
      icon = '🌘';
      isWaxing = false;
      advice = 'Kahjuritõrje, umbrohu kitkumine ja aia sanitaarne puhastus.';
    }

    return {
      phaseValue: Math.round(phaseValue * 100) / 100,
      name,
      icon,
      isWaxing,
      advice
    };
  },

  /**
   * Calculates biodynamic Maria Thun day type (Root, Leaf, Flower, Fruit) based on Moon's position.
   */
  getBiodynamicDay(date: Date): BiodynamicDayInfo {
    const diffMs = date.getTime() - KNOWN_ARIES_ANCHOR_UTC;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // Cycle across 12 signs (~2.28 days per sign)
    const signSpanDays = SIDEREAL_MONTH / 12.0;
    const signIndex = ((Math.floor(diffDays / signSpanDays) % 12) + 12) % 12;

    const currentSign = ZODIAC_ELEMENTS[signIndex];

    return {
      element: currentSign.element,
      elementName: currentSign.elementName,
      icon: currentSign.icon,
      constellation: currentSign.name,
      bestCrops: currentSign.crops,
      advice: currentSign.advice
    };
  },

  /**
   * Returns a 7-day lunar & biodynamic schedule starting from a given date.
   */
  get7DayLunarSchedule(startDate: Date = new Date()): DayLunarInfo[] {
    const result: DayLunarInfo[] = [];
    const dayNames = ['Pühap', 'Esmasp', 'Teisip', 'Kolmap', 'Neljap', 'Reede', 'Laup'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);

      const dateStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Täna' : i === 1 ? 'Homme' : dayNames[d.getDay()];

      result.push({
        date: dateStr,
        dayName,
        phase: this.getMoonPhase(d),
        biodynamic: this.getBiodynamicDay(d)
      });
    }

    return result;
  }
};
