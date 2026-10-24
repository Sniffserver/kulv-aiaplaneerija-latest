import { describe, it, expect } from 'vitest';
import { CompanionEngine, normalizePlantIdentifier, evaluatePairRelationship } from './companionEngine';
import { BedPlantingCell, GardenEntity } from '../types';
import { DEFAULT_PLANTS } from '../data/defaultPlants';

describe('CompanionEngine - Pure Deterministic Domain Engine', () => {
  describe('Canonical Species ID & Alias Normalization', () => {
    it('normalizes Estonian, English, scientific and colloquial names', () => {
      expect(normalizePlantIdentifier('Tomat')).toBe('tomat');
      expect(normalizePlantIdentifier('Tomato')).toBe('tomat');
      expect(normalizePlantIdentifier('Solanum lycopersicum')).toBe('tomat');
      expect(normalizePlantIdentifier('küüslauk')).toBe('kuuslauk');
      expect(normalizePlantIdentifier('Küüslauk')).toBe('kuuslauk');
      expect(normalizePlantIdentifier('Garlic')).toBe('kuuslauk');
      expect(normalizePlantIdentifier('Sweet Basil')).toBe('basiilik');
      expect(normalizePlantIdentifier('põlduba')).toBe('polduba');
      expect(normalizePlantIdentifier('suvikõrvits')).toBe('suvikorvits');
      expect(normalizePlantIdentifier('Päevalill')).toBe('paevalill');
    });

    it('resolves catalog plants accurately', () => {
      expect(normalizePlantIdentifier('Harilik kurk', DEFAULT_PLANTS)).toBe('kurk');
      expect(normalizePlantIdentifier('White Cabbage', DEFAULT_PLANTS)).toBe('kapsas');
    });
  });

  describe('Scientific Confidence Tiers & Horticultural Guidance', () => {
    it('provides established scientific confidence and citations for known pairings (e.g. Tomat + Basiilik)', () => {
      const rec = evaluatePairRelationship('tomat', 'basiilik', DEFAULT_PLANTS, 'et');
      expect(rec.classification).toBe('beneficial');
      expect(rec.isHarmful).toBe(false);
      expect(rec.confidence).toBe('established');
      expect(rec.source).toContain('RHS');
      expect(rec.category).toBe('pest_control');
      expect(rec.explanation).toContain('eeterlikud õlid');
    });

    it('provides established scientific evidence for Solanaceae blight hazard (Tomat + Kartul)', () => {
      const rec = evaluatePairRelationship('tomat', 'kartul', DEFAULT_PLANTS, 'et');
      expect(rec.classification).toBe('incompatible');
      expect(rec.isHarmful).toBe(true);
      expect(rec.confidence).toBe('established');
      expect(rec.source).toContain('METK');
      expect(rec.category).toBe('disease_vector');
      expect(rec.explanation).toContain('lehemädanikku');
    });

    it('distinguishes traditional folk claims with "traditional" confidence tag', () => {
      const rec = evaluatePairRelationship('porgand', 'rosmariin', DEFAULT_PLANTS, 'et');
      expect(rec.classification).toBe('beneficial');
      expect(rec.confidence).toBe('traditional');
      expect(rec.source).toContain('Rahvapärane');
    });

    it('does NOT invent incompatibilities for unknown pairs, defaulting cleanly to neutral/unknown', () => {
      // Strawberry and Sunflower have no antagonistic relationship documented
      const rec = evaluatePairRelationship('maasikas', 'mais', DEFAULT_PLANTS, 'et');
      expect(rec.classification).toBe('neutral');
      expect(rec.isHarmful).toBe(false);
      expect(rec.confidence).toBe('insufficient');
      expect(rec.explanation).toContain('Spetsiifiline positiivne või negatiivne koostoime puudub');
    });
  });

  describe('Botanical Family Fallbacks', () => {
    it('applies Alliaceae + Fabaceae allelopathy fallback rule', () => {
      // Leek (porrulauk) + Bush bean (aeduba)
      const rec = evaluatePairRelationship('porrulauk', 'aeduba', DEFAULT_PLANTS, 'et');
      expect(rec.classification).toBe('incompatible');
      expect(rec.category).toBe('allelopathy');
      expect(rec.confidence).toBe('established');
      expect(rec.explanation).toContain('mügarbakterite');
    });

    it('applies Fennel (apteegitill) strong allelopathy rule against crops', () => {
      const rec = evaluatePairRelationship('apteegitill', 'kurk', DEFAULT_PLANTS, 'et');
      expect(rec.classification).toBe('incompatible');
      expect(rec.category).toBe('allelopathy');
    });
  });

  describe('Bed Harmony & Plantings Calculations', () => {
    it('detects antagonistic neighbors (e.g. Hernes and Sibul)', () => {
      const plantings: BedPlantingCell[] = [
        {
          id: 'c1',
          bedId: 'b1',
          plantId: 'hernes',
          plantName: 'Hernes',
          plantIcon: '🫛',
          gridX: 0,
          gridY: 0,
          year: 2026,
          dateAdded: '2026-05-01'
        },
        {
          id: 'c2',
          bedId: 'b1',
          plantId: 'sibul',
          plantName: 'Sibul',
          plantIcon: '🧅',
          gridX: 1,
          gridY: 0,
          year: 2026,
          dateAdded: '2026-05-01'
        }
      ];

      const conflicts = CompanionEngine.evaluateBedCompanions(plantings, DEFAULT_PLANTS);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some((c) => c.isHarmful)).toBe(true);
    });

    it('calculates bed harmony score with detailed recommendations list', () => {
      const plantings: BedPlantingCell[] = [
        {
          id: 'c1',
          bedId: 'b1',
          plantId: 'tomat',
          plantName: 'Tomat',
          plantIcon: '🍅',
          gridX: 0,
          gridY: 0,
          year: 2026,
          dateAdded: '2026-05-01'
        },
        {
          id: 'c2',
          bedId: 'b1',
          plantId: 'basiilik',
          plantName: 'Basiilik',
          plantIcon: '🌿',
          gridX: 1,
          gridY: 0,
          year: 2026,
          dateAdded: '2026-05-01'
        }
      ];

      const harmony = CompanionEngine.calculateBedHarmony(plantings, DEFAULT_PLANTS);
      expect(harmony.harmonyPercentage).toBeGreaterThanOrEqual(90);
      expect(harmony.positivePairs).toBe(1);
      expect(harmony.negativePairs).toBe(0);
      expect(harmony.recommendations.length).toBe(1);
      expect(harmony.recommendations[0].classification).toBe('beneficial');
    });

    it('calculates planted cell synergy details with neighbor relationship breakdown', () => {
      const cellTomato: BedPlantingCell = {
        id: 'c1',
        bedId: 'b1',
        plantId: 'tomat',
        plantName: 'Tomat',
        plantIcon: '🍅',
        gridX: 1,
        gridY: 1,
        year: 2026,
        dateAdded: '2026-05-01'
      };
      const cellBasil: BedPlantingCell = {
        id: 'c2',
        bedId: 'b1',
        plantId: 'basiilik',
        plantName: 'Basiilik',
        plantIcon: '🌿',
        gridX: 1,
        gridY: 2,
        year: 2026,
        dateAdded: '2026-05-01'
      };

      const plantings = [cellTomato, cellBasil];
      const details = CompanionEngine.getPlantedCellSynergy(cellTomato, plantings, DEFAULT_PLANTS);

      expect(details.status).toBe('positive');
      expect(details.goodCount).toBe(1);
      expect(details.badCount).toBe(0);
      expect(details.relationships.length).toBe(1);
      expect(details.relationships[0].type).toBe('good');
    });
  });

  describe('Spatial Proximity & Cross-Bed Interactions (within 1.5m)', () => {
    it('evaluates relationships between adjacent beds within 1.5 meters', () => {
      const bedA: GardenEntity = {
        id: 'bed-1',
        name: 'Tomatipeenar',
        category: 'bed',
        subType: 'raisedBed',
        x: 2.0,
        y: 2.0,
        rotation: 0,
        shapeType: 'rectangle',
        width: 1.0,
        length: 2.0,
        heightM: 0.4,
        shadowCasting: false,
        zIndex: 10,
        createdAt: '2026-05-01',
        updatedAt: '2026-05-01',
        bedData: {
          type: 'raisedBed',
          coverType: 'none',
          calculatedSunHours: 8,
          plantings: [
            {
              id: 'p1',
              bedId: 'bed-1',
              plantId: 'tomat',
              plantName: 'Tomat',
              plantIcon: '🍅',
              gridX: 0,
              gridY: 0,
              year: 2026,
              dateAdded: '2026-05-01'
            }
          ]
        }
      };

      // Bed B is 0.8 meters away from Bed A, containing basil
      const bedB: GardenEntity = {
        id: 'bed-2',
        name: 'Ürdikast',
        category: 'bed',
        subType: 'raisedBed',
        x: 3.8,
        y: 2.0,
        rotation: 0,
        shapeType: 'rectangle',
        width: 1.0,
        length: 2.0,
        heightM: 0.4,
        shadowCasting: false,
        zIndex: 10,
        createdAt: '2026-05-01',
        updatedAt: '2026-05-01',
        bedData: {
          type: 'raisedBed',
          coverType: 'none',
          calculatedSunHours: 8,
          plantings: [
            {
              id: 'p2',
              bedId: 'bed-2',
              plantId: 'basiilik',
              plantName: 'Basiilik',
              plantIcon: '🌿',
              gridX: 0,
              gridY: 0,
              year: 2026,
              dateAdded: '2026-05-01'
            }
          ]
        }
      };

      // Bed C is 10 meters away, too far to interact
      const bedC: GardenEntity = {
        id: 'bed-3',
        name: 'Kauge kartulimaa',
        category: 'bed',
        subType: 'raisedBed',
        x: 15.0,
        y: 15.0,
        rotation: 0,
        shapeType: 'rectangle',
        width: 2.0,
        length: 3.0,
        heightM: 0.4,
        shadowCasting: false,
        zIndex: 10,
        createdAt: '2026-05-01',
        updatedAt: '2026-05-01',
        bedData: {
          type: 'raisedBed',
          coverType: 'none',
          calculatedSunHours: 8,
          plantings: [
            {
              id: 'p3',
              bedId: 'bed-3',
              plantId: 'kartul',
              plantName: 'Kartul',
              plantIcon: '🥔',
              gridX: 0,
              gridY: 0,
              year: 2026,
              dateAdded: '2026-05-01'
            }
          ]
        }
      };

      const interactions = CompanionEngine.evaluateCrossBedInteractions([bedA, bedB, bedC], DEFAULT_PLANTS, 1.5);
      expect(interactions.length).toBe(1);
      expect(interactions[0].bedAId).toBe('bed-1');
      expect(interactions[0].bedBId).toBe('bed-2');
      expect(interactions[0].overallClassification).toBe('beneficial');
      expect(interactions[0].pairings[0].classification).toBe('beneficial');
    });
  });
});
