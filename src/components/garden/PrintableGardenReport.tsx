import React from 'react';
import { useGarden } from '../../context/GardenContext';
import { BotanicalPlantIcon } from '../icons/BotanicalPlantIcon';

export const PrintableGardenReport: React.FC = () => {
  const { beds, plants, language } = useGarden();

  return (
    <div className="printable-report" style={{ display: 'none', padding: '24px', backgroundColor: '#FFFDF8', color: '#2A2E24', fontFamily: 'serif' }}>
      <style>{`
        @media print {
          .printable-report { display: block !important; }
        }
      `}</style>
      <div style={{ borderBottom: '2px solid #3E5637', paddingBottom: '12px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#3E5637' }}>
          {language === 'en' ? 'KÜLV — Garden Plan & Plant Inventory' : 'KÜLV — Aiaplaan ja taimede pass'}
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#5F675A' }}>
          {language === 'en' ? 'Printable field binder sheet' : 'Trükitav aiamapi leht'} · {new Date().toLocaleDateString()}
        </p>
      </div>

      <h2 style={{ fontSize: '18px', color: '#4F6B45', borderBottom: '1px solid #C9BFA9', paddingBottom: '6px' }}>
        {language === 'en' ? 'Garden Beds & Crop Coordinates' : 'Peenrad ja kultuuride asetus'}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {beds.map((bed) => (
          <div
            key={bed.id}
            style={{
              border: '2px solid #79634F',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: '#FAF7F0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <strong style={{ fontSize: '15px', color: '#3E5637' }}>{bed.name}</strong>
              <span style={{ fontSize: '12px', color: '#5F675A' }}>
                {bed.width}m × {bed.length}m ({(bed.width * bed.length).toFixed(1)} m²)
              </span>
            </div>

            {bed.plantings.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  backgroundColor: '#5A4638',
                  padding: '8px',
                  borderRadius: '6px'
                }}
              >
                {bed.plantings.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#6A5344',
                      border: '1px solid #8A715F',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      color: '#FFFDF8',
                      fontSize: '11px'
                    }}
                  >
                    <BotanicalPlantIcon plantId={p.plantId} plantName={p.plantName} size={16} ariaHidden />
                    <span style={{ fontWeight: 600 }}>{p.plantName}</span>
                    <span style={{ fontSize: '9px', color: '#D5C7B7' }}>
                      ({p.gridX + 1},{p.gridY + 1})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#79634F', fontStyle: 'italic' }}>
                {language === 'en' ? 'No crops planted yet.' : 'Peenras pole veel aktiivseid kultuure.'}
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '18px', color: '#4F6B45', borderBottom: '1px solid #C9BFA9', paddingBottom: '6px' }}>
        {language === 'en' ? 'Plant Catalog' : 'Taimestik'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
        {plants.map((plant) => (
          <div
            key={plant.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 8px',
              border: '1px solid #C9BFA9',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            <BotanicalPlantIcon plantId={plant.id} plantName={plant.name} size={18} ariaHidden />
            <div>
              <div style={{ fontWeight: 700 }}>{plant.name}</div>
              <div style={{ fontSize: '10px', color: '#5F675A' }}>{plant.family} · {plant.spacingCm}cm</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
