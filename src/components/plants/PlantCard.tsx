import type { Plant } from '../../types';

type PlantCardProps = {
  plant: Plant;
  onSelect: (plant: Plant) => void;
};

export function PlantCard({ plant, onSelect }: PlantCardProps) {
  const harvestDays = plant.daysToHarvest ?? plant.daysToMaturity;

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
        <span className="kulv-plant-card__name">{plant.name}</span>
        <span className="kulv-plant-card__meta">
          {plant.family} · {harvestDays} päeva
        </span>
      </span>

      <span className="kulv-plant-card__chevron" aria-hidden="true">
        →
      </span>
    </button>
  );
}
