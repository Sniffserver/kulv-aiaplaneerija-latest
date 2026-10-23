import { JournalEntry } from '../types';

/**
 * Sanitizes a CSV cell against Formula Injection (CSV Injection).
 * Spreadsheet tools (Excel, LibreOffice, Google Sheets) interpret cells starting with
 * '=', '+', '-', '@', '\t', or '\r' as formulas or DDE macro commands.
 * Prefixing with an apostrophe (') forces the spreadsheet application to treat the value
 * as safe plain text. Also escapes double quotes for RFC 4180 compliance.
 */
export function sanitizeCsvCell(value: unknown): string {
  const s = String(value ?? '');
  // Neutralize formula injection: cells starting with =, +, -, @, \t, \r, |, % (even if prefixed with whitespace)
  if (/^\s*[=+\-@\t\r|%]/.test(s)) {
    return `'${s.replace(/"/g, '""')}`;
  }
  return s.replace(/"/g, '""');
}

/**
 * Alias for backward compatibility.
 */
export const sanitizeCSVField = sanitizeCsvCell;

/**
 * Generates an RFC 4180 compliant CSV string for harvest records with:
 * - UTF-8 BOM (\uFEFF) for seamless Excel Estonian character encoding (õ, ä, ö, ü)
 * - Formula injection sanitization on every cell
 * - Double-quote wrapping
 */
export function generateHarvestCSV(journal: JournalEntry[]): string {
  const harvestEntries = journal.filter((e) => e.category === 'harvest');
  const headers = ['Kuupäev', 'Kultuur', 'Kogus', 'Ühik', 'Märkmed'];

  const rows = [
    headers,
    ...harvestEntries.map((e) => [
      e.date,
      e.plantName || '',
      e.yieldAmount !== null && e.yieldAmount !== undefined ? String(e.yieldAmount) : '',
      e.yieldUnit || 'kg',
      e.title ? `${e.title}${e.content ? ': ' + e.content : ''}` : e.content || ''
    ])
  ];

  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((cell) => `"${sanitizeCsvCell(cell)}"`)
          .join(',')
      )
      .join('\n')
  );
}

/**
 * Generates an RFC 4180 compliant CSV string for full garden journal export.
 */
export function generateJournalCSV(journal: JournalEntry[]): string {
  const headers = ['Kuupäev', 'Kategooria', 'Pealkiri', 'Kultuur', 'Kasvufaas', 'Märkmed', 'Saagikogus', 'Ühik'];

  const rows = [
    headers,
    ...journal.map((e) => [
      e.date,
      e.category,
      e.title,
      e.plantName || '',
      e.growthStage || '',
      e.content || '',
      e.yieldAmount !== null && e.yieldAmount !== undefined ? String(e.yieldAmount) : '',
      e.yieldUnit || ''
    ])
  ];

  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((cell) => `"${sanitizeCsvCell(cell)}"`)
          .join(',')
      )
      .join('\n')
  );
}

export interface SeasonalSowingExportOptions {
  year?: number;
  language?: 'et' | 'en';
}

/**
 * Generates an RFC 4180 compliant CSV string for the seasonal sowing schedule.
 * Includes UTF-8 BOM (\uFEFF) for Excel Estonian character encoding (õ, ä, ö, ü)
 * and comprehensive formula injection sanitization on every cell.
 */
export function generateSeasonalSowingCSV(
  plants: Array<{
    id: string;
    name: string;
    nameEn?: string;
    scientificName?: string;
    family?: string;
    varieties?: string[];
    optimalSowDateStart?: string;
    optimalPlantOutDate?: string;
    optimalHarvestDate?: string;
    spacingCm?: number;
    rowSpacingCm?: number;
    depthCm?: number;
    daysToMaturity?: number;
    sunNeed?: 'full' | 'partial' | 'shade';
    targetPh?: string;
    companionsGood?: string[];
    companionsBad?: string[];
    isNordicSuitable?: boolean;
    description?: string;
    weeksBeforeFrostSowIndoors?: number | null;
  }>,
  beds?: Array<{
    id: string;
    name: string;
    plantings?: Array<{ plantId: string; plantName: string }>;
  }>,
  options?: SeasonalSowingExportOptions
): string {
  const lang = options?.language || 'et';

  const headers =
    lang === 'en'
      ? [
          'Crop',
          'Scientific Name',
          'Botanical Family',
          'Cultivars',
          'Indoor Sowing',
          'Direct Sowing',
          'Plant Out Date',
          'Harvest Window',
          'Maturity (Days)',
          'Spacing (cm)',
          'Row Spacing (cm)',
          'Depth (cm)',
          'Sun Requirement',
          'Soil pH',
          'Good Companions',
          'Antagonists',
          'Nordic Hardy',
          'Planted In Beds'
        ]
      : [
          'Kultuur',
          'Ladinakeelne nimi',
          'Sugukond',
          'Sordid',
          'Ettekasvatus toas',
          'Otsekülv avamaale',
          'Istutamine avamaale',
          'Saagiperiood',
          'Kasvuaeg (päeva)',
          'Taimede vahe (cm)',
          'Reavahe (cm)',
          'Külvisügavus (cm)',
          'Valguse vajadus',
          'Mulla pH',
          'Head naabrid',
          'Halvad naabrid',
          'Põhjamaine sort',
          'Istutatud peenrasse'
        ];

  // Helper to locate which beds have this plant
  const getBedsForPlant = (plantId: string): string => {
    if (!beds || beds.length === 0) return '';
    const matchingBeds = beds.filter((b) =>
      b.plantings?.some((p) => p.plantId === plantId || p.plantName?.toLowerCase() === plantId.toLowerCase())
    );
    return matchingBeds.map((b) => b.name).join(', ');
  };

  const rows = [
    headers,
    ...plants.map((p) => {
      const displayName = lang === 'en' && p.nameEn ? p.nameEn : p.name;
      const indoorSow = p.weeksBeforeFrostSowIndoors
        ? lang === 'en'
          ? `${p.weeksBeforeFrostSowIndoors} wks before frost`
          : `${p.weeksBeforeFrostSowIndoors} ndl enne öökülma`
        : '-';

      const sunText =
        p.sunNeed === 'full'
          ? lang === 'en'
            ? 'Full Sun'
            : 'Täispäike'
          : p.sunNeed === 'partial'
          ? lang === 'en'
            ? 'Partial Shade'
            : 'Poolvari'
          : p.sunNeed === 'shade'
          ? lang === 'en'
            ? 'Shade'
            : 'Vari'
          : '';

      const plantedBeds = getBedsForPlant(p.id);

      return [
        displayName,
        p.scientificName || '',
        p.family || '',
        (p.varieties || []).join('; '),
        indoorSow,
        p.optimalSowDateStart || '-',
        p.optimalPlantOutDate || '-',
        p.optimalHarvestDate || '-',
        p.daysToMaturity ? String(p.daysToMaturity) : '',
        p.spacingCm ? String(p.spacingCm) : '',
        p.rowSpacingCm ? String(p.rowSpacingCm) : '',
        p.depthCm ? String(p.depthCm) : '',
        sunText,
        p.targetPh || '',
        (p.companionsGood || []).join('; '),
        (p.companionsBad || []).join('; '),
        p.isNordicSuitable ? (lang === 'en' ? 'Yes' : 'Jah') : lang === 'en' ? 'No' : 'Ei',
        plantedBeds || '-'
      ];
    })
  ];

  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((cell) => `"${sanitizeCsvCell(cell)}"`)
          .join(',')
      )
      .join('\n')
  );
}
