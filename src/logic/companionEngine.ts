import { BedPlantingCell, Plant } from '../types';

export interface CompanionConflict {
  plantA: string;
  plantB: string;
  isHarmful: boolean;
  message: string;
  category?: 'pest_control' | 'nutrient_sharing' | 'pollination' | 'disease_vector' | 'allelopathy' | 'root_layering' | 'general';
  botanicalReason?: string;
  botanicalReasonEn?: string;
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
    category?: string;
    botanicalReason?: string;
  }[];
}

export interface BedHarmonyScore {
  harmonyPercentage: number;
  positivePairs: number;
  negativePairs: number;
  totalPairings: number;
  summary: string;
}

interface BotanicalPairKnowledge {
  pair: [string, string];
  isHarmful: boolean;
  category: 'pest_control' | 'nutrient_sharing' | 'pollination' | 'disease_vector' | 'allelopathy' | 'root_layering' | 'general';
  reasonEt: string;
  reasonEn: string;
}

const BOTANICAL_PAIRS: BotanicalPairKnowledge[] = [
  {
    pair: ['porgand', 'sibul'],
    isHarmful: false,
    category: 'pest_control',
    reasonEt: 'Sibula teravad väävliaurud eksitavad porgandikärbest (Psila rosae), porgand peletab sibulakärbest. Erinev juurestiku sügavus väldib konkurentsi.',
    reasonEn: 'Onion sulfur volatiles mask carrot rust fly (Psila rosae), while carrot foliage repels onion fly. Complementary root depths avoid competition.'
  },
  {
    pair: ['porgand', 'kuuslauk'],
    isHarmful: false,
    category: 'pest_control',
    reasonEt: 'Küüslaugu allitsiin ja tugev aroom peletavad porgandikärbest ning pärsivad mullaseente teket.',
    reasonEn: 'Garlic allicin and sharp aroma deter carrot rust fly and suppress soil-borne fungal spores.'
  },
  {
    pair: ['tomat', 'basiilik'],
    isHarmful: false,
    category: 'pest_control',
    reasonEt: 'Basiiliku eeterlikud õlid peletavad kedriklesta ja ripslasi ning parandavad tomati aroomi ja maitseomadusi kasvuhoones.',
    reasonEn: 'Basil essential oils repel spider mites and thrips while enhancing tomato vigor and sweetness in greenhouse conditions.'
  },
  {
    pair: ['tomat', 'kartul'],
    isHarmful: true,
    category: 'disease_vector',
    reasonEt: 'Ohtlik naabrus! Mõlemad maavitsalised nakatuvad kergesti samasse laastavasse lehemädanikku (Phytophthora infestans).',
    reasonEn: 'High hazard! Both Solanaceae crops share catastrophic late blight (Phytophthora infestans).'
  },
  {
    pair: ['hernes', 'sibul'],
    isHarmful: true,
    category: 'allelopathy',
    reasonEt: 'Laukuliste antibakteriaalsed juureeritised pärsivad liblikõieliste juurtel elavate Rhizobium-mügarbakterite lämmastiku sidumist.',
    reasonEn: 'Allium root exudates inhibit nitrogen-fixing Rhizobium bacteria inhabiting legume root nodules.'
  },
  {
    pair: ['hernes', 'kuuslauk'],
    isHarmful: true,
    category: 'allelopathy',
    reasonEt: 'Küüslaugu fungitsiidsed väävliühendid takistavad herne mügarbakterite loomulikku sümbioosi.',
    reasonEn: 'Garlic antifungal sulfur compounds impede legume nitrogen fixation.'
  },
  {
    pair: ['uba', 'sibul'],
    isHarmful: true,
    category: 'allelopathy',
    reasonEt: 'Sibula ja küüslaugu juureeritised pidurdavad põldoa ja aedoa arengut.',
    reasonEn: 'Allium root secretions inhibit growth and root nodulation of beans.'
  },
  {
    pair: ['hernes', 'mais'],
    isHarmful: false,
    category: 'nutrient_sharing',
    reasonEt: 'Liblikõielised toidavad mulda lämmastikuga; mais pakub füüsilist ronimistuge ja tuulekaitset.',
    reasonEn: 'Legumes feed the soil with fixed nitrogen; corn provides living trellis and windbreak.'
  },
  {
    pair: ['kapsas', 'till'],
    isHarmful: false,
    category: 'pest_control',
    reasonEt: 'Tilli vihmavarjulised õied meelitavad röövherilasi ja lepatriinusid, kes hävitavad kapsakoi röövikuid ja lehetäisid.',
    reasonEn: 'Dill umbel flowers attract parasitic wasps and ladybugs that prey on cabbage loopers and aphids.'
  },
  {
    pair: ['maasikas', 'kuuslauk'],
    isHarmful: false,
    category: 'pest_control',
    reasonEt: 'Küüslaugu lenduvad allitsiini aurud vähendavad maasika-hahkhallitust (Botrytis cinerea) ja peletavad maasikalesta.',
    reasonEn: 'Garlic allicin vapors act as a natural bio-fungicide suppressing strawberry gray mold (Botrytis cinerea).'
  },
  {
    pair: ['kurk', 'till'],
    isHarmful: false,
    category: 'pollination',
    reasonEt: 'Till meelitab tolmeldajaid kurgiõitele ja soodustab saagikust ja viljumist.',
    reasonEn: 'Dill draws pollinators to cucumber blossoms, boosting pollination and uniform fruit development.'
  },
  {
    pair: ['kurk', 'paevalill'],
    isHarmful: false,
    category: 'nutrient_sharing',
    reasonEt: 'Päevalill toimib loodusliku tuuletõkkena ning kurgi ronivad võrsed saavad varre najale toetuda.',
    reasonEn: 'Sunflowers provide wind shelter and sturdy natural trellising for climbing cucumber vines.'
  },
  {
    pair: ['peet', 'kapsas'],
    isHarmful: false,
    category: 'root_layering',
    reasonEt: 'Peedi sammasjuur toitub sügavamalt, kapsa pinnapealne juurestik ei konkureeri toitainete pärast.',
    reasonEn: 'Beet taproots feed in deeper soil strata while cabbage shallow roots feed near the surface without competition.'
  },
  {
    pair: ['salat', 'redis'],
    isHarmful: false,
    category: 'root_layering',
    reasonEt: 'Kiirekasvuline salat hoiab maapinna jahedana ja niiskena, vähendades redise puitumist ja kirpude rünnakuid.',
    reasonEn: 'Fast-growing lettuce acts as living mulch, retaining moisture and shielding radishes from flea beetles.'
  },
  {
    pair: ['apteegitill', 'tomat'],
    isHarmful: true,
    category: 'allelopathy',
    reasonEt: 'Tugevalt allelopaatiline taim! Fenkol eritab aineid, mis pidurdavad tomati ja teiste aiaviljade arengut.',
    reasonEn: 'Strongly allelopathic plant! Fennel root exudates severely inhibit tomato and vegetable growth.'
  },
  {
    pair: ['tomat', 'tagetes'],
    isHarmful: false,
    category: 'pest_control',
    reasonEt: 'Sametill (Tagetes) eritab tiofeene, mis pärsivad mullas elavaid kahjulikke nematoodiusse ja peletavad kasvuhoone-karilast.',
    reasonEn: 'Marigolds secrete thiophenes that suppress parasitic root-knot nematodes and repel greenhouse whiteflies.'
  },
  {
    pair: ['tomat', 'saialill'],
    isHarmful: false,
    category: 'pest_control',
    reasonEt: 'Saialill toimib püünistaimena kahjuritele ja meelitab lehetäidest toituvaid lepatriinusid ning sirelasi.',
    reasonEn: 'Calendula acts as a trap crop for pests and attracts predatory hoverflies and ladybugs.'
  }
];

function findBotanicalRationale(idA: string, idB: string): BotanicalPairKnowledge | null {
  const a = idA.toLowerCase();
  const b = idB.toLowerCase();
  for (const item of BOTANICAL_PAIRS) {
    const [p1, p2] = item.pair;
    if ((a.includes(p1) && b.includes(p2)) || (a.includes(p2) && b.includes(p1))) {
      return item;
    }
  }
  return null;
}

export const CompanionEngine = {
  /**
   * Evaluates neighbor conflicts and positive synergies across all adjacent cells in a bed.
   */
  evaluateBedCompanions(
    plantings: BedPlantingCell[],
    allPlants: Plant[],
    lang: 'et' | 'en' = 'et'
  ): CompanionConflict[] {
    const results: CompanionConflict[] = [];
    const plantMap = new Map<string, Plant>();
    for (const p of allPlants) {
      plantMap.set(p.id.toLowerCase(), p);
    }

    for (let i = 0; i < plantings.length; i++) {
      for (let j = i + 1; j < plantings.length; j++) {
        const cellA = plantings[i];
        const cellB = plantings[j];

        // Check if adjacent cells (dx <= 1 && dy <= 1)
        const dx = Math.abs(cellA.gridX - cellB.gridX);
        const dy = Math.abs(cellA.gridY - cellB.gridY);
        if (dx <= 1 && dy <= 1) {
          const pA = plantMap.get(cellA.plantId.toLowerCase());
          const pB = plantMap.get(cellB.plantId.toLowerCase());
          if (!pA || !pB) continue;

          const rationale = findBotanicalRationale(pA.id, pB.id);

          // Check bad companions
          const isBad =
            (rationale && rationale.isHarmful) ||
            pA.companionsBad.some(
              (c) => c.toLowerCase() === pB.id.toLowerCase() || c.toLowerCase() === pB.name.toLowerCase()
            ) ||
            pB.companionsBad.some(
              (c) => c.toLowerCase() === pA.id.toLowerCase() || c.toLowerCase() === pA.name.toLowerCase()
            );

          if (isBad) {
            const defaultMsg = lang === 'en'
              ? `${pA.name} and ${pB.name} are antagonistic companions (deplete common nutrients or share diseases).`
              : `${pA.name} ja ${pB.name} on ebasoodsad naabrid (kurnavad mulda või soodustavad samu haigusi).`;
            const botanicalMsg = rationale
              ? (lang === 'en' ? rationale.reasonEn : rationale.reasonEt)
              : defaultMsg;

            results.push({
              plantA: pA.name,
              plantB: pB.name,
              isHarmful: true,
              message: defaultMsg,
              category: rationale?.category || 'disease_vector',
              botanicalReason: rationale ? rationale.reasonEt : defaultMsg,
              botanicalReasonEn: rationale ? rationale.reasonEn : defaultMsg
            });
          } else {
            // Check good companions
            const isGood =
              (rationale && !rationale.isHarmful) ||
              pA.companionsGood.some(
                (c) => c.toLowerCase() === pB.id.toLowerCase() || c.toLowerCase() === pB.name.toLowerCase()
              ) ||
              pB.companionsGood.some(
                (c) => c.toLowerCase() === pA.id.toLowerCase() || c.toLowerCase() === pA.name.toLowerCase()
              );

            if (isGood) {
              const defaultMsg = lang === 'en'
                ? `${pA.name} and ${pB.name} are excellent companions (boost vigor and deter pests)!`
                : `${pA.name} ja ${pB.name} on suurepärased naabrid (soodustavad kasvu ja peletavad kahjureid)!`;

              results.push({
                plantA: pA.name,
                plantB: pB.name,
                isHarmful: false,
                message: defaultMsg,
                category: rationale?.category || 'pest_control',
                botanicalReason: rationale ? rationale.reasonEt : defaultMsg,
                botanicalReasonEn: rationale ? rationale.reasonEn : defaultMsg
              });
            }
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

      const rationale = findBotanicalRationale(targetPlant.id, neighborPlant.id);

      const isBad =
        (rationale && rationale.isHarmful) ||
        targetPlant.companionsBad.some(
          (c) => c.toLowerCase() === neighborPlant.id.toLowerCase() || c.toLowerCase() === neighborPlant.name.toLowerCase()
        ) ||
        neighborPlant.companionsBad.some(
          (c) => c.toLowerCase() === targetPlant.id.toLowerCase() || c.toLowerCase() === targetPlant.name.toLowerCase()
        );

      if (isBad) {
        badCount++;
        const defaultReason = lang === 'en'
          ? `${targetPlant.name} and ${neighborPlant.name} inhibit each other's growth!`
          : `${targetPlant.name} ja ${neighborPlant.name} takistavad teineteise kasvu!`;
        const botReason = rationale ? (lang === 'en' ? rationale.reasonEn : rationale.reasonEt) : defaultReason;

        relationships.push({
          neighborPlantId: neighborPlant.id,
          neighborName: neighborPlant.name,
          neighborIcon: neighborPlant.icon,
          type: 'bad',
          reason: defaultReason,
          category: rationale?.category || 'disease_vector',
          botanicalReason: botReason
        });
        continue;
      }

      const isGood =
        (rationale && !rationale.isHarmful) ||
        targetPlant.companionsGood.some(
          (c) => c.toLowerCase() === neighborPlant.id.toLowerCase() || c.toLowerCase() === neighborPlant.name.toLowerCase()
        ) ||
        neighborPlant.companionsGood.some(
          (c) => c.toLowerCase() === targetPlant.id.toLowerCase() || c.toLowerCase() === targetPlant.name.toLowerCase()
        );

      if (isGood) {
        goodCount++;
        const defaultReason = lang === 'en'
          ? `${targetPlant.name} and ${neighborPlant.name} support each other!`
          : `${targetPlant.name} ja ${neighborPlant.name} toetavad teineteist!`;
        const botReason = rationale ? (lang === 'en' ? rationale.reasonEn : rationale.reasonEt) : defaultReason;

        relationships.push({
          neighborPlantId: neighborPlant.id,
          neighborName: neighborPlant.name,
          neighborIcon: neighborPlant.icon,
          type: 'good',
          reason: defaultReason,
          category: rationale?.category || 'pest_control',
          botanicalReason: botReason
        });
        continue;
      }

      neutralCount++;
      const neutralReason = lang === 'en'
        ? `${targetPlant.name} and ${neighborPlant.name} are neutral neighbors.`
        : `${targetPlant.name} ja ${neighborPlant.name} on neutraalsed naabrid.`;

      relationships.push({
        neighborPlantId: neighborPlant.id,
        neighborName: neighborPlant.name,
        neighborIcon: neighborPlant.icon,
        type: 'neutral',
        reason: neutralReason
      });
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
   */
  calculateBedHarmony(
    plantings: BedPlantingCell[],
    allPlants: Plant[],
    lang: 'et' | 'en' = 'et'
  ): BedHarmonyScore {
    const pairings = this.evaluateBedCompanions(plantings, allPlants, lang);
    const positivePairs = pairings.filter((p) => !p.isHarmful).length;
    const negativePairs = pairings.filter((p) => p.isHarmful).length;
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
      totalPairings,
      summary
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
  ): { status: 'good' | 'bad' | 'neutral'; reason?: string; botanicalReason?: string } {
    const plantMap = new Map<string, Plant>();
    for (const p of allPlants) {
      plantMap.set(p.id.toLowerCase(), p);
    }

    const neighborCells = plantings.filter(
      (c) => !(c.gridX === gridX && c.gridY === gridY) &&
        Math.abs(c.gridX - gridX) <= 1 &&
        Math.abs(c.gridY - gridY) <= 1
    );

    if (neighborCells.length === 0) {
      return { status: 'neutral' };
    }

    for (const neighbor of neighborCells) {
      const neighborPlant = plantMap.get(neighbor.plantId.toLowerCase());
      if (!neighborPlant) continue;

      const rationale = findBotanicalRationale(candidatePlant.id, neighborPlant.id);

      const isBad =
        (rationale && rationale.isHarmful) ||
        candidatePlant.companionsBad.some(
          (c) => c.toLowerCase() === neighborPlant.id.toLowerCase() || c.toLowerCase() === neighborPlant.name.toLowerCase()
        ) ||
        neighborPlant.companionsBad.some(
          (c) => c.toLowerCase() === candidatePlant.id.toLowerCase() || c.toLowerCase() === candidatePlant.name.toLowerCase()
        );

      if (isBad) {
        const defaultReason = lang === 'en'
          ? `${candidatePlant.name} and ${neighborPlant.name} are incompatible!`
          : `${candidatePlant.name} ja ${neighborPlant.name} on ebasoodsad naabrid!`;
        const botReason = rationale ? (lang === 'en' ? rationale.reasonEn : rationale.reasonEt) : defaultReason;

        return {
          status: 'bad',
          reason: defaultReason,
          botanicalReason: botReason
        };
      }
    }

    for (const neighbor of neighborCells) {
      const neighborPlant = plantMap.get(neighbor.plantId.toLowerCase());
      if (!neighborPlant) continue;

      const rationale = findBotanicalRationale(candidatePlant.id, neighborPlant.id);

      const isGood =
        (rationale && !rationale.isHarmful) ||
        candidatePlant.companionsGood.some(
          (c) => c.toLowerCase() === neighborPlant.id.toLowerCase() || c.toLowerCase() === neighborPlant.name.toLowerCase()
        ) ||
        neighborPlant.companionsGood.some(
          (c) => c.toLowerCase() === candidatePlant.id.toLowerCase() || c.toLowerCase() === candidatePlant.name.toLowerCase()
        );

      if (isGood) {
        const defaultReason = lang === 'en'
          ? `${candidatePlant.name} and ${neighborPlant.name} support each other!`
          : `${candidatePlant.name} ja ${neighborPlant.name} toetavad teineteist!`;
        const botReason = rationale ? (lang === 'en' ? rationale.reasonEn : rationale.reasonEt) : defaultReason;

        return {
          status: 'good',
          reason: defaultReason,
          botanicalReason: botReason
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
    const target = allPlants.find(
      (p) => p.id.toLowerCase() === targetPlantId.toLowerCase() || p.name.toLowerCase() === targetPlantId.toLowerCase()
    );
    if (!target) return { good: [], bad: [] };

    const good = allPlants.filter((p) => {
      if (p.id === target.id) return false;
      const rationale = findBotanicalRationale(target.id, p.id);
      if (rationale && !rationale.isHarmful) return true;
      return (
        target.companionsGood.some(
          (c) => c.toLowerCase() === p.id.toLowerCase() || c.toLowerCase() === p.name.toLowerCase()
        ) ||
        p.companionsGood.some(
          (c) => c.toLowerCase() === target.id.toLowerCase() || c.toLowerCase() === target.name.toLowerCase()
        )
      );
    });

    const bad = allPlants.filter((p) => {
      if (p.id === target.id) return false;
      const rationale = findBotanicalRationale(target.id, p.id);
      if (rationale && rationale.isHarmful) return true;
      return (
        target.companionsBad.some(
          (c) => c.toLowerCase() === p.id.toLowerCase() || c.toLowerCase() === p.name.toLowerCase()
        ) ||
        p.companionsBad.some(
          (c) => c.toLowerCase() === target.id.toLowerCase() || c.toLowerCase() === target.name.toLowerCase()
        )
      );
    });

    return { good, bad };
  }
};
