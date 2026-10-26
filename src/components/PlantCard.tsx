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
    <div
      onClick={onClick}
      data-testid={`plant_card_${plant.id}`}
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        cursor: 'pointer',
        boxShadow: 'var(--kulv-shadow-card, 0 1px 2px rgba(0,0,0,0.05))',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        minHeight: '68px'
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '10px',
          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}
      >
        {plant.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>{primaryName}</span>
          {secondaryName && (
            <span style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic' }}>
              ({secondaryName})
            </span>
          )}
          {plant.isNordicSuitable && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--kulv-primary, #4F6B45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Snowflake size={12} />
              <span>{language === 'en' ? 'Nordic hardy' : 'Põhjamaine'}</span>
            </span>
          )}
          {plant.targetPh && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'var(--kulv-accent, #D97A3D)'
              }}
            >
              pH {plant.targetPh}
            </span>
          )}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
          {plant.family} {plant.scientificName && `(${plant.scientificName})`}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--kulv-text-muted, #5F675A)',
            marginTop: '4px'
          }}
        >
          <span>
            {language === 'en' ? 'Maturity:' : 'Saak:'} ~{plant.daysToMaturity}
            {language === 'en' ? 'd' : 'p'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {language === 'en' ? 'Spacing:' : 'Vahe:'} {plant.spacingCm} cm
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {plant.sunNeed === 'full'
              ? (language === 'en' ? '☀️ Full Sun' : '☀️ Täispäike')
              : plant.sunNeed === 'partial'
                ? (language === 'en' ? '⛅ Part Shade' : '⛅ Poolvari')
                : (language === 'en' ? '☁️ Shade' : '☁️ Vari')}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {plant.weeksBeforeFrostSowIndoors !== null && plant.weeksBeforeFrostSowIndoors !== undefined
              ? (language === 'en' ? '🌱 Indoor Pre-grow' : '🌱 Ettekasvatus')
              : (language === 'en' ? '🌾 Direct Sow' : '🌾 Otsekülv')}
          </span>
          {plant.varieties && plant.varieties.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span style={{ color: 'var(--kulv-primary, #4F6B45)', fontWeight: 600 }}>
                {language === 'en' ? 'Cultivars:' : 'Sordid:'} {plant.varieties.slice(0, 3).join(', ')}
                {plant.varieties.length > 3 && ` +${plant.varieties.length - 3}`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
