import React from 'react';
import { Plant } from '../types';
import { Snowflake } from 'lucide-react';
import { useGarden } from '../context/GardenContext';

interface PlantCardProps {
  plant: Plant;
  onClick: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onClick }) => {
  const garden = useGarden();
  const language = garden?.language || 'et';
  const beds = garden?.beds || [];

  const primaryName = language === 'en' && plant.nameEn ? plant.nameEn : plant.name;
  const secondaryName = language === 'en' && plant.nameEn ? plant.name : plant.nameEn;

  // Find if this plant is actively planted in any garden bed
  const plantedCells = React.useMemo(() => {
    return (beds || []).flatMap((b) => b.plantings || []).filter((p) => p.plantId === plant.id);
  }, [beds, plant.id]);

  // Calculate life cycle progress (percentage & stage) relative to daysToMaturity
  const growthInfo = React.useMemo(() => {
    const daysToMaturity = plant.daysToMaturity || 70;
    const isPlanted = plantedCells.length > 0;

    let pct = 35;
    let stageName = language === 'en' ? 'Vegetative' : 'Lehekasv';

    if (isPlanted) {
      const dates = plantedCells
        .map((p) => new Date(p.dateAdded).getTime())
        .filter((t) => !isNaN(t));
      const latestDate = dates.length > 0 ? Math.max(...dates) : Date.now();
      const elapsedDays = Math.max(1, Math.floor((Date.now() - latestDate) / (1000 * 60 * 60 * 24)));
      pct = Math.min(100, Math.max(8, Math.round((elapsedDays / daysToMaturity) * 100)));

      if (pct >= 85) stageName = language === 'en' ? 'Harvest Ready' : 'Koristusküps';
      else if (pct >= 60) stageName = language === 'en' ? 'Flowering' : 'Õitsemine';
      else if (pct >= 25) stageName = language === 'en' ? 'Vegetative' : 'Lehekasv';
      else stageName = language === 'en' ? 'Germinating' : 'Idanemine';
    } else {
      // Baseline seasonal lifecycle preview based on optimal sow and harvest cycle
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      if (currentMonth >= 4 && currentMonth <= 5) {
        pct = 22;
        stageName = language === 'en' ? 'Germinating' : 'Idanemine';
      } else if (currentMonth >= 6 && currentMonth <= 7) {
        pct = 54;
        stageName = language === 'en' ? 'Vegetative' : 'Lehekasv';
      } else if (currentMonth >= 8 && currentMonth <= 9) {
        pct = 88;
        stageName = language === 'en' ? 'Harvest Ready' : 'Koristusküps';
      } else {
        pct = 15;
        stageName = language === 'en' ? 'Pre-sow cycle' : 'Külvieelne faas';
      }
    }

    return {
      isPlanted,
      pct,
      stageName,
      badgeLabel: `${stageName} (${pct}%)`
    };
  }, [plant.daysToMaturity, plantedCells, language]);

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`plant_card_${plant.id}`}
      className="kulv-plant-card items-start"
      aria-label={`${primaryName}. Ava taime üksikasjad.`}
    >
      <span className="kulv-plant-card__icon mt-0.5" aria-hidden="true">
        {plant.icon}
      </span>

      <span className="kulv-plant-card__body flex-1 min-w-0">
        <span className="kulv-plant-card__name flex items-center justify-between gap-2">
          <span className="truncate">
            {primaryName}
            {secondaryName && (
              <span className="kulv-plant-card__secondary"> ({secondaryName})</span>
            )}
          </span>
          <span
            data-testid={`plant_growth_badge_${plant.id}`}
            className="kulv-badge kulv-badge--luminous shrink-0 text-[11px] px-2 py-0.5 inline-flex items-center gap-1.5"
            title={`${growthInfo.stageName} (${growthInfo.pct}%)`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--kulv-primary,#4F6B45)] animate-pulse" />
            <span>{growthInfo.badgeLabel}</span>
          </span>
        </span>

        <span className="kulv-plant-card__meta">
          {plant.family}
          {plant.scientificName && ` (${plant.scientificName})`}
        </span>

        <span className="kulv-plant-card__meta">
          {language === 'en' ? 'Maturity:' : 'Saak:'} ~{plant.daysToMaturity}
          {language === 'en' ? 'd' : 'p'}
          {' · '}
          {language === 'en' ? 'Spacing:' : 'Vahe:'} {plant.spacingCm} cm
        </span>

        {/* Life cycle visual progress bar */}
        <div
          data-testid={`plant_growth_progress_${plant.id}`}
          className="w-full mt-2"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between text-[10px] text-[var(--kulv-text-muted)] font-medium mb-1">
            <span>{language === 'en' ? 'Life cycle' : 'Elutsükkel'}</span>
            <span className="tabular-nums font-semibold text-[var(--kulv-primary)]">{growthInfo.pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--kulv-border)]/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--kulv-primary,#4F6B45)] transition-all duration-300"
              style={{ width: `${growthInfo.pct}%` }}
            />
          </div>
        </div>
      </span>

      {plant.isNordicSuitable && (
        <span className="kulv-plant-card__badge self-start mt-1">
          <Snowflake size={12} aria-hidden="true" />
          {language === 'en' ? 'Nordic hardy' : 'Põhjamaine'}
        </span>
      )}
    </button>
  );
};
