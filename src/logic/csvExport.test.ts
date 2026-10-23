import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, sanitizeCSVField, generateHarvestCSV, generateJournalCSV, generateSeasonalSowingCSV } from './csvExport';
import { JournalEntry } from '../types';

describe('CSV Sanitization and Export (CSV Injection Prevention)', () => {
  it('neutralizes dangerous formula prefixes (=, +, -, @, tab, return, pipe, percent)', () => {
    expect(sanitizeCsvCell('=cmd|/C calc!A0')).toBe(`'=cmd|/C calc!A0`);
    expect(sanitizeCsvCell('+12345')).toBe(`'+12345`);
    expect(sanitizeCsvCell('-SUM(A1:A10)')).toBe(`'-SUM(A1:A10)`);
    expect(sanitizeCsvCell('@SUM(1,2)')).toBe(`'@SUM(1,2)`);
    expect(sanitizeCsvCell('\tmalicious')).toBe(`'\tmalicious`);
    expect(sanitizeCsvCell('\rmalicious')).toBe(`'\rmalicious`);
    expect(sanitizeCsvCell('%COMSPEC%')).toBe(`'%COMSPEC%`);
    expect(sanitizeCsvCell('|cmd.exe')).toBe(`'|cmd.exe`);
  });

  it('neutralizes formula injection even when prefixed with leading spaces or indentation', () => {
    expect(sanitizeCsvCell('   =cmd|/C calc!A0')).toBe(`'   =cmd|/C calc!A0`);
    expect(sanitizeCsvCell('  @SUM(1,2)')).toBe(`'  @SUM(1,2)`);
    expect(sanitizeCsvCell('\t\t-5+10')).toBe(`'\t\t-5+10`);
  });

  it('prefixes dangerous calculation command =cmd|\'/c calc\'!A1 with single quote', () => {
    const maliciousPayload = "=cmd|'/c calc'!A1";
    const sanitized = sanitizeCsvCell(maliciousPayload);
    expect(sanitized).toBe(`'${maliciousPayload}`);
    expect(sanitized.startsWith("'=")).toBe(true);
  });

  it('leaves benign strings, numbers, and null/undefined safe and escapes double quotes', () => {
    expect(sanitizeCsvCell('Porgand')).toBe('Porgand');
    expect(sanitizeCsvCell('Tomat "Malle"')).toBe('Tomat ""Malle""');
    expect(sanitizeCsvCell(12.5)).toBe('12.5');
    expect(sanitizeCsvCell(null)).toBe('');
    expect(sanitizeCsvCell(undefined)).toBe('');
    expect(sanitizeCSVField('Tillipeenar')).toBe('Tillipeenar');
  });

  it('generates compliant CSV with UTF-8 BOM and sanitized malicious notes', () => {
    const entries: JournalEntry[] = [
      {
        id: 'j-1',
        title: '=HYPERLINK("http://attacker.com")',
        content: 'Esimene saak',
        category: 'harvest',
        date: '2026-07-20',
        plantName: 'Hernetõrvik',
        yieldAmount: 2.5,
        yieldUnit: 'kg'
      },
      {
        id: 'j-2',
        title: 'Tavaline sissekanne',
        content: 'Vaatlusmärkmed',
        category: 'observation',
        date: '2026-07-21'
      }
    ];

    const csv = generateHarvestCSV(entries);
    // Starts with UTF-8 BOM
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Header exists
    expect(csv).toContain('"Kuupäev","Kultuur","Kogus","Ühik","Märkmed"');

    // Only harvest category included
    expect(csv).toContain('Hernetõrvik');
    expect(csv).not.toContain('Vaatlusmärkmed');

    // Formula injection neutralized with leading apostrophe
    expect(csv).toContain(`"'=HYPERLINK(""http://attacker.com""): Esimene saak"`);
  });

  it('generates full journal CSV with all rows safely sanitized', () => {
    const entries: JournalEntry[] = [
      {
        id: 'j-3',
        title: '@SUM(1, 100)',
        content: 'Väetamine',
        category: 'observation',
        date: '2026-05-15',
        growthStage: 'vegetative'
      }
    ];
    const journalCsv = generateJournalCSV(entries);
    expect(journalCsv).toContain(`"'@SUM(1, 100)"`);
  });

  it('generates seasonal sowing CSV with UTF-8 BOM, bilingual support, and sanitized formula injection', () => {
    const plants = [
      {
        id: 'porgand',
        name: 'Porgand',
        nameEn: 'Carrot',
        scientificName: 'Daucus carota',
        family: 'Apiaceae',
        varieties: ['Nantes 4', 'Amsterdam 2'],
        optimalSowDateStart: '04-20',
        optimalPlantOutDate: '05-10',
        optimalHarvestDate: '08-25',
        spacingCm: 5,
        rowSpacingCm: 25,
        depthCm: 1.5,
        daysToMaturity: 90,
        sunNeed: 'full' as const,
        targetPh: '6.0-6.8',
        companionsGood: ['Sibul', 'Hernes'],
        companionsBad: ['Till'],
        isNordicSuitable: true,
        weeksBeforeFrostSowIndoors: null
      },
      {
        id: 'tomat',
        name: '=cmd|/C "malicious"',
        nameEn: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        family: 'Solanaceae',
        varieties: ['Vilja', 'Malle'],
        optimalSowDateStart: '03-15',
        optimalPlantOutDate: '05-25',
        optimalHarvestDate: '08-10',
        spacingCm: 45,
        rowSpacingCm: 60,
        depthCm: 0.5,
        daysToMaturity: 110,
        sunNeed: 'full' as const,
        targetPh: '6.2-6.8',
        companionsGood: ['Basiilik', 'Saialill'],
        companionsBad: ['Kartul'],
        isNordicSuitable: true,
        weeksBeforeFrostSowIndoors: 8
      }
    ];

    const beds = [
      {
        id: 'bed_1',
        name: 'Põhja peenar',
        plantings: [{ plantId: 'porgand', plantName: 'Porgand' }]
      }
    ];

    // Test Estonian generation
    const csvEt = generateSeasonalSowingCSV(plants, beds, { language: 'et' });
    expect(csvEt.startsWith('\uFEFF')).toBe(true);
    expect(csvEt).toContain('"Kultuur","Ladinakeelne nimi","Sugukond"');
    expect(csvEt).toContain('"Porgand"');
    expect(csvEt).toContain('"Põhja peenar"');
    expect(csvEt).toContain('"8 ndl enne öökülma"');
    // Formula injection sanitized
    expect(csvEt).toContain(`"'=cmd|/C ""malicious"""`);

    // Test English generation
    const csvEn = generateSeasonalSowingCSV(plants, beds, { language: 'en' });
    expect(csvEn).toContain('"Crop","Scientific Name","Botanical Family"');
    expect(csvEn).toContain('"Carrot"');
    expect(csvEn).toContain('"8 wks before frost"');
  });
});
