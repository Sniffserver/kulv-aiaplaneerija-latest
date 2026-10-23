import React from 'react';
import { useGarden } from '../../context/GardenContext';

export const PrintableGardenReport: React.FC = () => {
  const { beds, plants } = useGarden();

  return (
    <div className="printable-report" style={{ display: 'none', padding: '20px' }}>
      <style>{`
        @media print {
          .printable-report { display: block !important; }
        }
      `}</style>
      <h1>Garden Summary Report</h1>
      <h2>Beds</h2>
      <ul>
        {beds.map(bed => (
          <li key={bed.id}>
            {bed.name} - Plantings: {bed.plantings.length}
          </li>
        ))}
      </ul>
      <h2>Plant List</h2>
      <ul>
        {plants.map(plant => (
          <li key={plant.id}>{plant.name}</li>
        ))}
      </ul>
    </div>
  );
};
