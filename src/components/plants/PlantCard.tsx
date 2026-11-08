import type { Plant } from '../../types';

type PlantCardProps = {
  plant: Plant;
  onSelect: (plant: Plant) => void;
};

export function PlantCard({ plant, onSelect }: PlantCardProps) {
  const harvestDays = plant.daysToHarvest ?? plant.daysToMaturity;
  const daysToMaturity = plant.daysToMaturity || 70;
  const pct = Math.min(100, Math.max(15, Math.round((40 / daysToMaturity) * 100)));

  return (
    <button
      type="button"
      className="kulv-plant-card"
      onClick={() => onSelect(plant)}
      aria-label={`Ava taime ${plant.name} üksikasjad`}
      data-testid={`plant-card-${plant.id}`}
    >
      <span className="kulv-plant-card__icon" aria-hidden="true">
        {plant.icon}
      </span>

      <span className="kulv-plant-card__body">
        <span className="kulv-plant-card__name flex items-center justify-between gap-2">
          <span>{plant.name}</span>
          <span className="kulv-badge kulv-badge--luminous text-[10px] px-2 py-0.5">
            {pct}%
          </span>
        </span>
        <span className="kulv-plant-card__meta">
          {plant.family} · {harvestDays} päeva
        </span>
        <div className="w-full mt-1.5 h-1 rounded-full bg-[var(--kulv-border)]/40 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-[var(--kulv-primary,#4F6B45)] rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </span>

      <span className="kulv-plant-card__chevron" aria-hidden="true">
        →
      </span>
    </button>
  );
}
