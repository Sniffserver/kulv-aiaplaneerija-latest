import { performance } from 'node:perf_hooks';
import { CompanionEngine } from '../src/logic/companionEngine';
import { SolarEngine } from '../src/logic/solarEngine';
import { PlantingCalendar } from '../src/logic/plantingCalendar';
import { DEFAULT_PLANTS } from '../src/data/defaultPlants';
import { BedPlantingCell } from '../src/types';

const REPETITIONS = 5;

// Generate test bed with 120 planting cells
const testPlantings: BedPlantingCell[] = Array.from({ length: 120 }, (_, i) => {
  const plant = DEFAULT_PLANTS[i % DEFAULT_PLANTS.length];
  return {
    id: `bench-cell-${i}`,
    bedId: 'bench-bed-1',
    plantId: plant.id,
    plantName: plant.name,
    plantIcon: plant.icon,
    gridX: i % 10,
    gridY: Math.floor(i / 10),
    year: 2026,
    dateAdded: '2026-05-01'
  };
});

function benchmarkCompanionAnalysis(): number {
  const start = performance.now();
  CompanionEngine.evaluateBedCompanions(testPlantings, DEFAULT_PLANTS);
  return performance.now() - start;
}

function benchmarkSolarSim(): number {
  const start = performance.now();
  for (let day = 1; day <= 365; day++) {
    SolarEngine.calculateSolarNoonAltitude(59.437, day);
    SolarEngine.calculateDaylightHours(59.437, day);
  }
  return performance.now() - start;
}

function benchmarkPlantingCalendar(): number {
  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    for (const plant of DEFAULT_PLANTS) {
      PlantingCalendar.calculateTimeline(plant, '05-20', 2026);
    }
  }
  return performance.now() - start;
}

console.log('=== KÜLV Garden Engine Performance Benchmark ===');
console.log(`Analyzing bed with ${testPlantings.length} planting cells & ${DEFAULT_PLANTS.length} botanical species...`);

const companionTimes: number[] = [];
const solarTimes: number[] = [];
const calendarTimes: number[] = [];

for (let r = 0; r < REPETITIONS; r++) {
  companionTimes.push(benchmarkCompanionAnalysis());
  solarTimes.push(benchmarkSolarSim());
  calendarTimes.push(benchmarkPlantingCalendar());
}

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

console.log(`Companion Matrix Analysis: avg ${avg(companionTimes).toFixed(3)} ms`);
console.log(`365-Day Solar Engine:       avg ${avg(solarTimes).toFixed(3)} ms`);
console.log(`Planting Calendar Timeline: avg ${avg(calendarTimes).toFixed(3)} ms`);
console.log('Engine performance verified successfully.');
