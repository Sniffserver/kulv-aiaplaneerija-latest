import React from 'react';

export interface BotanicalPlantIconProps {
  plantId?: string;
  plantName?: string;
  size?: number;
  className?: string;
  ariaHidden?: boolean;
}

/**
 * BotanicalPlantIcon
 * Consistent Nordic Botanical vector iconography:
 * - Forest-green outlines: #3E5637
 * - Leaf green fills: #4F6B45
 * - Muted sage secondary: #A9B89A
 * - Soil brown: #79634F
 * - Terracotta-orange accents: #E08A3C
 * - Off-white highlights: #FFFDF8
 * - Warm vegetable accents: #C94C4C (tomato), #7E3F74 (beetroot), #E5A038 (carrot/flower)
 */
export const BotanicalPlantIcon: React.FC<BotanicalPlantIconProps> = ({
  plantId = '',
  plantName = '',
  size = 24,
  className = '',
  ariaHidden = true
}) => {
  const normKey = (plantId + ' ' + plantName).toLowerCase();

  // Normalize mapping for Estonian & English plant catalog keys (diacritic-insensitive)
  const cleanKey = (plantId + ' ' + plantName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z');

  const getPlantCategory = (): string => {
    if (cleanKey.includes('tomat') || cleanKey.includes('tomato')) return 'tomato';
    if (cleanKey.includes('kurk') || cleanKey.includes('cucumber')) return 'cucumber';
    if (cleanKey.includes('porgand') || cleanKey.includes('carrot')) return 'carrot';
    if (cleanKey.includes('sibul') || cleanKey.includes('onion') || cleanKey.includes('shallot')) return 'onion';
    if (cleanKey.includes('kuuslauk') || cleanKey.includes('garlic')) return 'garlic';
    if (cleanKey.includes('kartul') || cleanKey.includes('potato')) return 'potato';
    if (cleanKey.includes('kapsas') || cleanKey.includes('cabbage') || cleanKey.includes('kale') || cleanKey.includes('brussels') || cleanKey.includes('brokoli') || cleanKey.includes('broccoli')) return 'cabbage';
    if (cleanKey.includes('hernes') || cleanKey.includes('pea')) return 'pea';
    if (cleanKey.includes('uba') || cleanKey.includes('bean')) return 'bean';
    if (cleanKey.includes('peet') || cleanKey.includes('beet') || cleanKey.includes('beetroot')) return 'beetroot';
    if (cleanKey.includes('redis') || cleanKey.includes('radish') || cleanKey.includes('kaalikas') || cleanKey.includes('turnip')) return 'radish';
    if (cleanKey.includes('salat') || cleanKey.includes('lettuce') || cleanKey.includes('spinat') || cleanKey.includes('spinach') || cleanKey.includes('rukkola') || cleanKey.includes('rukola') || cleanKey.includes('mangold')) return 'lettuce';
    if (cleanKey.includes('basiilik') || cleanKey.includes('basil')) return 'basil';
    if (cleanKey.includes('till') || cleanKey.includes('dill') || cleanKey.includes('apteegitill') || cleanKey.includes('fennel')) return 'dill';
    if (cleanKey.includes('petersell') || cleanKey.includes('parsley') || cleanKey.includes('koriander') || cleanKey.includes('cilantro')) return 'parsley';
    if (cleanKey.includes('munt') || cleanKey.includes('mint') || cleanKey.includes('piparmunt')) return 'basil';
    if (cleanKey.includes('tuumian') || cleanKey.includes('thyme') || cleanKey.includes('liivatee')) return 'dill';
    if (cleanKey.includes('maasikas') || cleanKey.includes('strawberry')) return 'strawberry';
    if (cleanKey.includes('korvits') || cleanKey.includes('suvikorvits') || cleanKey.includes('squash') || cleanKey.includes('zucchini') || cleanKey.includes('pumpkin')) return 'pumpkin';
    if (cleanKey.includes('paprika') || cleanKey.includes('tsilli') || cleanKey.includes('pepper') || cleanKey.includes('chili')) return 'pepper';
    if (cleanKey.includes('saialill') || cleanKey.includes('tagetes') || cleanKey.includes('calendula') || cleanKey.includes('marigold') || cleanKey.includes('lill')) return 'flower';
    if (cleanKey.includes('marja') || cleanKey.includes('poosas') || cleanKey.includes('vaarikas') || cleanKey.includes('mustikas') || cleanKey.includes('soostar') || cleanKey.includes('berry') || cleanKey.includes('bush')) return 'berry_bush';
    if (cleanKey.includes('puu') || cleanKey.includes('oun') || cleanKey.includes('pirn') || cleanKey.includes('tree') || cleanKey.includes('apple') || cleanKey.includes('kirsipuu') || cleanKey.includes('ploomipuu')) return 'fruit_tree';
    return 'sprout';
  };

  const category = getPlantCategory();

  // SVG palette tokens
  const outline = '#3E5637'; // Forest green outline
  const leaf = '#4F6B45';    // Primary leaf green
  const sage = '#A9B89A';    // Muted sage secondary
  const soil = '#79634F';    // Soil brown
  const terra = '#E08A3C';   // Terracotta orange
  const red = '#C94C4C';     // Deep tomato red
  const purple = '#7B3B68';  // Beetroot purple
  const light = '#FFFDF8';   // Off-white / highlight

  const renderVectorGraphic = () => {
    switch (category) {
      case 'tomato':
        return (
          <g>
            {/* Tomato fruit */}
            <circle cx="16" cy="18" r="10" fill={red} stroke={outline} strokeWidth="1.5" />
            <path d="M12 14 Q16 12 20 14" fill="none" stroke={light} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            {/* Calyx & Stem */}
            <path d="M16 8 L16 3" stroke={outline} strokeWidth="1.75" strokeLinecap="round" />
            <path d="M16 8 Q13 7 11 10 Q14 9 16 8 Q18 9 21 10 Q19 7 16 8 Z" fill={leaf} stroke={outline} strokeWidth="1.25" strokeLinejoin="round" />
            <path d="M16 8 Q16 11 16 13 Q16 10 16 8" stroke={outline} strokeWidth="1" />
          </g>
        );

      case 'cucumber':
        return (
          <g>
            {/* Curved cucumber body */}
            <path
              d="M8 22 C6 18 8 10 14 8 C19 6 25 11 24 18 C23 23 18 25 13 25 C10 25 9 24 8 22 Z"
              fill={leaf}
              stroke={outline}
              strokeWidth="1.5"
            />
            {/* Texture stripes/dots */}
            <path d="M12 12 Q14 18 16 22" fill="none" stroke={sage} strokeWidth="1" strokeDasharray="1.5 2" />
            <circle cx="19" cy="14" r="0.8" fill={light} opacity="0.7" />
            <circle cx="14" cy="18" r="0.8" fill={light} opacity="0.7" />
            {/* Stem & tendril */}
            <path d="M14 8 C14 5 16 4 17 3" fill="none" stroke={outline} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 3 Q20 2 20 5 Q18 6 21 6" fill="none" stroke={outline} strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );

      case 'carrot':
        return (
          <g>
            {/* Foliage / Tops */}
            <path d="M16 12 L16 4 M16 7 L12 4 M16 7 L20 4 M16 9 L10 7 M16 9 L22 7" stroke={leaf} strokeWidth="1.5" strokeLinecap="round" />
            {/* Carrot taproot */}
            <path d="M11 12 C11 12 11 14 13 21 C14 25 16 28 16 28 C16 28 18 25 19 21 C21 14 21 12 21 12 Z" fill={terra} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
            {/* Horizontal ridges */}
            <line x1="13" y1="16" x2="18" y2="16" stroke={outline} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            <line x1="14" y1="20" x2="18" y2="20" stroke={outline} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            <line x1="15" y1="24" x2="17" y2="24" stroke={outline} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
          </g>
        );

      case 'onion':
        return (
          <g>
            {/* Green sprout shoots */}
            <path d="M16 14 L14 4 M16 14 L16 3 M16 14 L18 5" stroke={leaf} strokeWidth="1.5" strokeLinecap="round" />
            {/* Onion bulb */}
            <path d="M16 13 C10 13 9 19 11 23 C13 27 16 28 16 28 C16 28 19 27 21 23 C23 19 22 13 16 13 Z" fill="#E8C68B" stroke={outline} strokeWidth="1.5" />
            {/* Bulb skin ribs */}
            <path d="M14 15 C13 19 14 24 16 27" fill="none" stroke={outline} strokeWidth="1" opacity="0.5" />
            <path d="M18 15 C19 19 18 24 16 27" fill="none" stroke={outline} strokeWidth="1" opacity="0.5" />
            {/* Root tuft */}
            <path d="M15 28 L14 31 M16 28 L16 31 M17 28 L18 31" stroke={soil} strokeWidth="1" strokeLinecap="round" />
          </g>
        );

      case 'garlic':
        return (
          <g>
            {/* Sprout tip */}
            <path d="M16 12 L16 5 M16 9 L14 6" stroke={leaf} strokeWidth="1.4" strokeLinecap="round" />
            {/* Garlic bulb with clove segments */}
            <path d="M16 12 C11 12 10 17 11 22 C12 25 16 27 16 27 C16 27 20 25 21 22 C22 17 21 12 16 12 Z" fill="#F4EFE6" stroke={outline} strokeWidth="1.5" />
            <path d="M13 14 C12 18 13 23 15 26" fill="none" stroke={sage} strokeWidth="1.2" />
            <path d="M19 14 C20 18 19 23 17 26" fill="none" stroke={sage} strokeWidth="1.2" />
            {/* Roots */}
            <path d="M15 27 L14 29 M16 27 L16 30 M17 27 L18 29" stroke={soil} strokeWidth="1" strokeLinecap="round" />
          </g>
        );

      case 'potato':
        return (
          <g>
            {/* Foliage */}
            <circle cx="16" cy="7" r="4" fill={leaf} stroke={outline} strokeWidth="1.2" />
            <circle cx="12" cy="9" r="3" fill={sage} stroke={outline} strokeWidth="1.2" />
            <circle cx="20" cy="9" r="3" fill={sage} stroke={outline} strokeWidth="1.2" />
            {/* Potato tuber */}
            <path d="M11 16 C8 17 7 21 9 24 C11 27 18 28 22 26 C25 24 25 19 22 17 C19 15 14 15 11 16 Z" fill="#A88B68" stroke={outline} strokeWidth="1.5" />
            {/* Potato eyes */}
            <circle cx="12" cy="20" r="0.75" fill={soil} />
            <circle cx="16" cy="23" r="0.75" fill={soil} />
            <circle cx="20" cy="19" r="0.75" fill={soil} />
            <circle cx="17" cy="18" r="0.6" fill={soil} />
          </g>
        );

      case 'cabbage':
        return (
          <g>
            {/* Outer ruffled leaves */}
            <circle cx="16" cy="18" r="11" fill={sage} stroke={outline} strokeWidth="1.5" />
            <path d="M7 14 C10 11 13 15 16 13 C19 11 22 15 25 14" fill="none" stroke={outline} strokeWidth="1.2" strokeLinecap="round" />
            {/* Inner dense head */}
            <circle cx="16" cy="18" r="7" fill={leaf} stroke={outline} strokeWidth="1.2" />
            {/* Leaf veins */}
            <path d="M16 18 Q14 21 12 23 M16 18 Q18 21 20 23 M16 15 L16 18" fill="none" stroke={light} strokeWidth="1" strokeLinecap="round" opacity="0.8" />
          </g>
        );

      case 'pea':
      case 'bean':
        return (
          <g>
            {/* Stem & leaf */}
            <path d="M12 4 Q14 10 16 12" fill="none" stroke={outline} strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="11" cy="7" rx="3.5" ry="2" transform="rotate(-30 11 7)" fill={sage} stroke={outline} strokeWidth="1.2" />
            {/* Pea pod */}
            <path
              d="M16 12 C22 13 25 18 24 24 C23 27 18 27 15 23 C13 20 14 15 16 12 Z"
              fill={leaf}
              stroke={outline}
              strokeWidth="1.5"
            />
            {/* Visible round peas inside translucency */}
            <circle cx="16.5" cy="17" r="1.6" fill={light} opacity="0.6" />
            <circle cx="19" cy="20.5" r="1.6" fill={light} opacity="0.6" />
            <circle cx="21" cy="24" r="1.4" fill={light} opacity="0.6" />
          </g>
        );

      case 'beetroot':
      case 'radish':
        return (
          <g>
            {/* Leaf tops with reddish veins */}
            <path d="M16 13 L14 4 M16 13 L16 3 M16 13 L18 5" stroke={leaf} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 6 L12 4 M18 7 L20 4" stroke={purple} strokeWidth="1.2" strokeLinecap="round" />
            {/* Beetroot globe */}
            <circle cx="16" cy="20" r="7" fill={purple} stroke={outline} strokeWidth="1.5" />
            <path d="M13 18 Q16 16 19 18" fill="none" stroke={light} strokeWidth="1" opacity="0.4" />
            {/* Long taproot */}
            <path d="M16 27 C16 29 15 30 15 32" fill="none" stroke={purple} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );

      case 'lettuce':
        return (
          <g>
            {/* Layered crisp salad leaves */}
            <path d="M10 25 C7 19 8 13 13 10 C15 14 14 20 12 25 Z" fill={sage} stroke={outline} strokeWidth="1.2" />
            <path d="M22 25 C25 19 24 13 19 10 C17 14 18 20 20 25 Z" fill={sage} stroke={outline} strokeWidth="1.2" />
            <path d="M12 26 C12 18 14 12 16 8 C18 12 20 18 20 26 Z" fill={leaf} stroke={outline} strokeWidth="1.4" />
            {/* Crisp center rib */}
            <path d="M16 26 L16 12" stroke={light} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          </g>
        );

      case 'basil':
        return (
          <g>
            <path d="M16 26 L16 8" stroke={outline} strokeWidth="1.5" strokeLinecap="round" />
            {/* Broad fragrant leaves */}
            <path d="M16 12 C11 10 9 14 11 17 C13 19 15 17 16 16 Z" fill={leaf} stroke={outline} strokeWidth="1.2" />
            <path d="M16 12 C21 10 23 14 21 17 C19 19 17 17 16 16 Z" fill={leaf} stroke={outline} strokeWidth="1.2" />
            <path d="M16 18 C10 17 8 21 10 24 C13 25 15 22 16 21 Z" fill={sage} stroke={outline} strokeWidth="1.2" />
            <path d="M16 18 C22 17 24 21 22 24 C19 25 17 22 16 21 Z" fill={sage} stroke={outline} strokeWidth="1.2" />
            <circle cx="16" cy="8" r="2" fill={leaf} stroke={outline} strokeWidth="1" />
          </g>
        );

      case 'dill':
      case 'parsley':
        return (
          <g>
            {/* Feathery sprigs */}
            <path d="M16 27 L16 9 M16 18 L11 12 M16 18 L21 12 M16 14 L12 8 M16 14 L20 8" stroke={leaf} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M11 12 L9 9 M11 12 L13 9 M21 12 L19 9 M21 12 L23 9" stroke={sage} strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="16" cy="7" r="1.5" fill={terra} />
            <circle cx="9" cy="8" r="1.2" fill={terra} />
            <circle cx="23" cy="8" r="1.2" fill={terra} />
          </g>
        );

      case 'strawberry':
        return (
          <g>
            {/* Calyx leaves */}
            <path d="M16 10 L16 5" stroke={outline} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 10 Q12 9 10 11 Q14 11 16 10 Q18 11 22 11 Q20 9 16 10 Z" fill={leaf} stroke={outline} strokeWidth="1.2" />
            {/* Berry cone */}
            <path d="M11 11 C9 14 11 22 16 27 C21 22 23 14 21 11 C18 12 14 12 11 11 Z" fill={red} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
            {/* Seeds (yellow/cream achenes) */}
            <circle cx="13" cy="15" r="0.7" fill="#F8E7A1" />
            <circle cx="16" cy="15" r="0.7" fill="#F8E7A1" />
            <circle cx="19" cy="15" r="0.7" fill="#F8E7A1" />
            <circle cx="14" cy="19" r="0.7" fill="#F8E7A1" />
            <circle cx="17" cy="19" r="0.7" fill="#F8E7A1" />
            <circle cx="16" cy="23" r="0.7" fill="#F8E7A1" />
          </g>
        );

      case 'pumpkin':
        return (
          <g>
            {/* Stem */}
            <path d="M16 11 C16 7 18 6 18 4" fill="none" stroke={outline} strokeWidth="1.75" strokeLinecap="round" />
            {/* Lobed pumpkin body */}
            <ellipse cx="16" cy="19" rx="10" ry="8" fill={terra} stroke={outline} strokeWidth="1.5" />
            <ellipse cx="16" cy="19" rx="6" ry="8" fill="#E89648" stroke={outline} strokeWidth="1.2" />
            <line x1="16" y1="11" x2="16" y2="27" stroke={outline} strokeWidth="1" opacity="0.6" />
          </g>
        );

      case 'pepper':
        return (
          <g>
            <path d="M16 10 L16 5 M16 5 Q18 4 19 6" fill="none" stroke={outline} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 10 Q16 11 18 10" stroke={leaf} strokeWidth="2" strokeLinecap="round" />
            <path d="M12 11 C10 13 11 20 14 25 C15 27 17 27 18 25 C21 20 22 13 20 11 Z" fill={red} stroke={outline} strokeWidth="1.5" />
            <path d="M15 13 Q16 18 16 23" fill="none" stroke={light} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          </g>
        );

      case 'flower':
        return (
          <g>
            {/* Stem */}
            <path d="M16 27 L16 16" stroke={leaf} strokeWidth="1.5" strokeLinecap="round" />
            {/* Petals */}
            <circle cx="16" cy="11" r="3.5" fill={terra} stroke={outline} strokeWidth="1" />
            <circle cx="11" cy="16" r="3.5" fill={terra} stroke={outline} strokeWidth="1" />
            <circle cx="21" cy="16" r="3.5" fill={terra} stroke={outline} strokeWidth="1" />
            <circle cx="12.5" cy="12.5" r="3.5" fill="#F4BD42" stroke={outline} strokeWidth="1" />
            <circle cx="19.5" cy="12.5" r="3.5" fill="#F4BD42" stroke={outline} strokeWidth="1" />
            {/* Floral center disc */}
            <circle cx="16" cy="16" r="3" fill={soil} stroke={outline} strokeWidth="1.2" />
          </g>
        );

      case 'berry_bush':
        return (
          <g>
            {/* Shrub foliage clump */}
            <circle cx="16" cy="16" r="9" fill={leaf} stroke={outline} strokeWidth="1.5" />
            <circle cx="12" cy="14" r="5" fill={sage} stroke={outline} strokeWidth="1" />
            <circle cx="20" cy="15" r="5" fill={sage} stroke={outline} strokeWidth="1" />
            {/* Berries clustered */}
            <circle cx="13" cy="17" r="2" fill={red} stroke={outline} strokeWidth="0.8" />
            <circle cx="18" cy="18" r="2" fill={red} stroke={outline} strokeWidth="0.8" />
            <circle cx="16" cy="12" r="2" fill={red} stroke={outline} strokeWidth="0.8" />
          </g>
        );

      case 'fruit_tree':
        return (
          <g>
            {/* Trunk */}
            <path d="M15 28 L15 19 L17 19 L17 28 Z" fill={soil} stroke={outline} strokeWidth="1.2" />
            {/* Crown */}
            <circle cx="16" cy="13" r="9" fill={leaf} stroke={outline} strokeWidth="1.5" />
            <circle cx="13" cy="11" r="5" fill={sage} opacity="0.6" />
            {/* Apples / Fruit */}
            <circle cx="13" cy="14" r="1.8" fill={red} />
            <circle cx="19" cy="12" r="1.8" fill={red} />
            <circle cx="16" cy="17" r="1.8" fill={red} />
          </g>
        );

      case 'sprout':
      default:
        return (
          <g>
            {/* Curved seedling stem */}
            <path d="M16 26 C16 19 14 14 14 11" fill="none" stroke={outline} strokeWidth="1.75" strokeLinecap="round" />
            {/* Cotyledon leaves */}
            <path d="M14 13 C10 11 8 13 10 16 C12 18 14 15 14 13 Z" fill={leaf} stroke={outline} strokeWidth="1.2" />
            <path d="M15 11 C18 9 21 11 20 14 C18 16 16 13 15 11 Z" fill={sage} stroke={outline} strokeWidth="1.2" />
            {/* Soil baseline mound */}
            <path d="M10 27 Q16 25 22 27" fill="none" stroke={soil} strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {renderVectorGraphic()}
    </svg>
  );
};
