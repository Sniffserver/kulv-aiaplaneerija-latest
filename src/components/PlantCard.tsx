import React from 'react';
import { Plant } from '../types';
import { Snowflake } from 'lucide-react';
import { useGarden } from '../context/GardenContext';

interface PlantCardProps {
  plant: Plant;
  onClick: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onClick }) => {
  const { language } = useGarden();

  const primaryName = language === 'en' && plant.nameEn ? plant.nameEn : plant.name;
  const secondaryName = language === 'en' && plant.nameEn ? plant.name : plant.nameEn;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`plant_card_${plant.id}`}
      className="kulv-plant-card"
      aria-label={`${primaryName}. Ava taime üksikasjad.`}
    >
      <span className="kulv-plant-card__icon" aria-hidden="true">
        {plant.icon}
      </span>

      <span className="kulv-plant-card__body">
        <span className="kulv-plant-card__name">
          {primaryName}
          {secondaryName && (
            <span className="kulv-plant-card__secondary"> ({secondaryName})</span>
          )}
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
      </span>

      {plant.isNordicSuitable && (
        <span className="kulv-plant-card__badge">
          <Snowflake size={12} aria-hidden="true" />
          {language === 'en' ? 'Nordic hardy' : 'Põhjamaine'}
        </span>
      )}
    </button>
  );
};
