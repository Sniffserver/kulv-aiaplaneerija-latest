import { Plant, GardenBed } from '../types';
import { BedSuccessionSlot, EstonianRegionId, CropProtectionType } from '../types/rotation';
import { CropRotationEngine } from './cropRotationEngine';
import { EstonianFrostEngine, getDayOfYear, dayOfYearToMMDD } from './estonianFrostEngine';

export interface SuccessionRecommendation {
  plant: Plant;
  variety?: string;
  earliestSowDate: string; // MM-DD
  estimatedHarvestDate: string; // MM-DD
  daysOccupyingBed: number;
  suitabilityScore: number; // 0 to 100
  suitabilityCategory: 'excellent' | 'good' | 'marginal' | 'blocked';
  rotationCompatibility: 'optimal' | 'acceptable' | 'warning' | 'blocked';
  feasibleCyclesCount: number;
  blockingConstraints: string[];
  warnings: string[];
  explanationEt: string;
  explanationEn: string;
  isUncertain: boolean;
  missingDataNotes?: string[];
}

export const SuccessionPlannerEngine = {
  /**
   * Evaluates and ranks possible follow-up succession crops for a specific garden bed.
   */
  evaluateFollowUpCrops(
    bedId: string,
    targetYear: number,
    existingSlots: BedSuccessionSlot[],
    availablePlants: Plant[],
    beds: GardenBed[],
    regionId: EstonianRegionId = 'central'
  ): SuccessionRecommendation[] {
    const targetBed = beds.find((b) => b.id === bedId);
    const bedSlots = existingSlots
      .filter((s) => s.bedId === bedId && s.year === targetYear)
      .sort((a, b) => getDayOfYear(a.sowDate) - getDayOfYear(b.sowDate));

    // Determine when bed is available (after the last scheduled slot, or default to early spring 04-15)
    let bedAvailableDoy = 105; // ~April 15
    let priorFamily: string = 'Other';

    if (bedSlots.length > 0) {
      const lastSlot = bedSlots[bedSlots.length - 1];
      bedAvailableDoy = getDayOfYear(lastSlot.harvestDate) + 3; // 3 day turnover
      priorFamily = lastSlot.botanicalFamily;
    }

    const frostProfile = EstonianFrostEngine.getAdjustedFrostDates(
      regionId,
      targetBed?.coverType === 'greenhouse' ? 'greenhouse' : targetBed?.coverType === 'fleece' ? 'fleece' : 'none'
    );
    const seasonEndDoy = frostProfile.autumnFrostDoy + (targetBed?.coverType === 'greenhouse' ? 20 : 10);

    const recommendations: SuccessionRecommendation[] = [];

    for (const plant of availablePlants) {
      const missingNotes: string[] = [];
      let isUncertain = false;

      // DTM estimation with fallback
      let dtm = plant.daysToMaturity;
      if (!dtm || isNaN(dtm)) {
        dtm = 65; // documented default
        isUncertain = true;
        missingNotes.push(
          `Valmimisaeg (DTM) puudub — kasutatud vaikimisi ${dtm} päeva. (Maturity days missing, defaulted to 65).`
        );
      }

      // Earliest feasible sowing date
      const optimalPlantOutDoy = plant.optimalPlantOutDate ? getDayOfYear(plant.optimalPlantOutDate) : bedAvailableDoy;
      const earliestSowDoy = Math.max(bedAvailableDoy, optimalPlantOutDoy);
      const estimatedHarvestDoy = earliestSowDoy + dtm;

      // Remaining season check
      const remainingDays = seasonEndDoy - earliestSowDoy;
      const daysOccupying = dtm;

      const blockingConstraints: string[] = [];
      const warnings: string[] = [];

      // Check season limit
      if (estimatedHarvestDoy > seasonEndDoy) {
        blockingConstraints.push(
          `Taim ei jõua enne hooaja lõppu (${dayOfYearToMMDD(seasonEndDoy)}) valmida. Ületab päevi ${estimatedHarvestDoy - seasonEndDoy} võrra.`
        );
      }

      // Check rotation compatibility using CropRotationEngine
      const family = CropRotationEngine.resolveFamilyId(plant);
      const rotationAlerts = CropRotationEngine.evaluateRotation(
        plant,
        bedSlots.map((s) => ({
          year: s.year,
          plantId: s.plantId,
          plantName: s.plantName,
          family: s.botanicalFamily
        })),
        targetYear
      );

      let rotationCompatibility: 'optimal' | 'acceptable' | 'warning' | 'blocked' = 'optimal';
      for (const alert of rotationAlerts) {
        if (alert.severity === 'danger') {
          rotationCompatibility = 'blocked';
          blockingConstraints.push(alert.message);
          warnings.push(alert.recommendation);
        } else if (alert.severity === 'warning') {
          rotationCompatibility = 'warning';
          warnings.push(alert.recommendation);
        } else if (alert.severity === 'good') {
          rotationCompatibility = 'optimal';
        }
      }

      // Prior family direct check
      if (family === priorFamily && family !== 'Fabaceae') {
        if (rotationCompatibility !== 'blocked') rotationCompatibility = 'warning';
        warnings.push(`Sama sugukond (${family}) eelneva kultuuriga – suurenenud haiguserisk.`);
      }

      // Calculate feasible cycles count
      const availableSeasonDays = seasonEndDoy - getDayOfYear('04-15');
      const feasibleCyclesCount = Math.max(1, Math.floor(availableSeasonDays / (daysOccupying + 10)));

      // Suitability Score Calculation (0 - 100)
      let score = 80;
      if (blockingConstraints.length > 0 || rotationCompatibility === 'blocked') {
        score = 0;
      } else {
        if (rotationCompatibility === 'optimal') score += 15;
        if (rotationCompatibility === 'warning') score -= 20;
        if (isUncertain) score -= 10;
        if (estimatedHarvestDoy + 10 > seasonEndDoy) score -= 25; // Tight fit
        if (family === 'Fabaceae') score += 10; // Nitrogen fixer bonus
      }
      score = Math.max(0, Math.min(100, score));

      let suitabilityCategory: 'excellent' | 'good' | 'marginal' | 'blocked' = 'excellent';
      if (score >= 85) suitabilityCategory = 'excellent';
      else if (score >= 65) suitabilityCategory = 'good';
      else if (score >= 40) suitabilityCategory = 'marginal';
      else suitabilityCategory = 'blocked';

      const earliestSowDateStr = dayOfYearToMMDD(earliestSowDoy);
      const estimatedHarvestDateStr = dayOfYearToMMDD(Math.min(estimatedHarvestDoy, seasonEndDoy));

      const explanationEt =
        blockingConstraints.length > 0
          ? `Takistatud: ${blockingConstraints[0]}`
          : `Sobib suurepäraselt järeltulijaks: saab külvata alates ${earliestSowDateStr}, valmib eeldatavalt ${estimatedHarvestDateStr} (${daysOccupying} päeva).`;

      const explanationEn =
        blockingConstraints.length > 0
          ? `Blocked: ${blockingConstraints[0]}`
          : `Excellent succession candidate: sow from ${earliestSowDateStr}, expected harvest ${estimatedHarvestDateStr} (${daysOccupying} days).`;

      recommendations.push({
        plant,
        earliestSowDate: earliestSowDateStr,
        estimatedHarvestDate: estimatedHarvestDateStr,
        daysOccupyingBed: daysOccupying,
        suitabilityScore: score,
        suitabilityCategory,
        rotationCompatibility,
        feasibleCyclesCount,
        blockingConstraints,
        warnings,
        explanationEt,
        explanationEn,
        isUncertain,
        missingDataNotes: missingNotes.length > 0 ? missingNotes : undefined
      });
    }

    // Sort by suitability score descending
    return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }
};
