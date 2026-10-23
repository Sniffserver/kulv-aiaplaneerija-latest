import { describe, it, expect } from 'vitest';
import { validateGardenBackup } from '../lib/validation/backupSchema';
import { GardenBackup } from '../types';

describe('Backup Import/Export Validation', () => {
  const validBackup: GardenBackup = {
    version: '1.1.0',
    exportedAt: '2026-05-15T12:00:00.000Z',
    appName: 'KÜLV – Aia- ja taimekasvatuse planeerija',
    settings: {
      locationName: 'Tartu',
      lat: 58.378,
      lng: 26.729,
      springFrostDate: '05-20',
      autumnFrostDate: '09-25',
      yardWidthM: 20,
      yardLengthM: 30,
      northAngle: 0,
      themeMode: 'meadow'
    },
    beds: [
      {
        id: 'bed-test-1',
        name: 'Katsepeenar',
        type: 'raisedBed',
        x: 1,
        y: 1,
        width: 1.2,
        length: 3.0,
        height: 0.4,
        rotation: 0,
        coverType: 'none',
        notes: '',
        calculatedSunHours: 8.0,
        plantings: []
      }
    ],
    tasks: [
      {
        id: 'task-test-1',
        title: 'Kasta peenraid',
        completed: false,
        dueDate: '2026-05-20',
        category: 'water',
        createdAt: '2026-05-01'
      }
    ],
    journal: [
      {
        id: 'journal-test-1',
        title: 'Kevadtööd tehtud',
        content: 'Muld ette valmistatud',
        category: 'observation',
        date: '2026-05-01'
      }
    ],
    customPlants: []
  };

  it('validates a complete, compliant backup file successfully', () => {
    const jsonStr = JSON.stringify(validBackup);
    const result = validateGardenBackup(jsonStr);

    expect(result.success).toBe(true);
    expect(result.data?.version).toBe('1.1.0');
    expect(result.data?.beds.length).toBe(1);
    expect(result.data?.beds[0].name).toBe('Katsepeenar');
    expect(result.data?.tasks.length).toBe(1);
    expect(result.data?.journal.length).toBe(1);
  });

  it('rejects corrupted or incomplete bed entries without dimensions', () => {
    const invalidBackup = {
      ...validBackup,
      beds: [{ id: 'bad-bed', name: 'No dimensions' }]
    };
    const result = validateGardenBackup(JSON.stringify(invalidBackup));
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Varukoopia valideerimistõrge');
  });

  it('rejects completely empty or non-JSON input', () => {
    const result = validateGardenBackup('{ corrupted: true ');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Vigane JSON formaat');
  });

  it('rejects payload exceeding the 5 MB security limit', () => {
    // Generate string > 5 MB
    const hugePayload = ' '.repeat(5 * 1024 * 1024 + 10);
    const result = validateGardenBackup(hugePayload);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('5 MB');
  });
});
