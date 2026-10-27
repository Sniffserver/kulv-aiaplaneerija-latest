import { useMemo, useState } from 'react';
import type { Plant } from '../../types';
import { PlantCard } from './PlantCard';
import { EmptyState } from '../common/EmptyState';
import { PlantsEmptyIllustration } from '../common/EmptyStateIllustrations';

type PlantsModuleProps = {
  plants: Plant[];
  onSelectPlant: (plant: Plant) => void;
  onOpenAddPlant: () => void;
};

export function PlantsModule({
  plants,
  onSelectPlant,
  onOpenAddPlant
}: PlantsModuleProps) {
  const [query, setQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');

  const families = useMemo(() => {
    return Array.from(new Set(plants.map((plant) => plant.family))).sort();
  }, [plants]);

  const filteredPlants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return plants.filter((plant) => {
      const matchesQuery =
        !normalizedQuery ||
        plant.name.toLowerCase().includes(normalizedQuery) ||
        plant.family.toLowerCase().includes(normalizedQuery);

      const matchesFamily =
        selectedFamily === 'all' || plant.family === selectedFamily;

      return matchesQuery && matchesFamily;
    });
  }, [plants, query, selectedFamily]);

  return (
    <section className="kulv-plants-module" aria-labelledby="plants-heading">
      <header className="kulv-page-header">
        <div>
          <h1 id="plants-heading">Taimed</h1>
          <p className="kulv-page-subtitle">
            Vali taim, et näha kasvatusjuhiseid ja lisada see aeda.
          </p>
        </div>

        <button
          type="button"
          className="kulv-button kulv-button--primary"
          onClick={onOpenAddPlant}
        >
          Lisa taim
        </button>
      </header>

      <div className="kulv-filter-bar">
        <label className="kulv-field">
          <span className="kulv-field__label">Otsi</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Näiteks porgand või ristõielised"
          />
        </label>

        <label className="kulv-field">
          <span className="kulv-field__label">Perekond</span>
          <select
            value={selectedFamily}
            onChange={(event) => setSelectedFamily(event.target.value)}
          >
            <option value="all">Kõik</option>
            {families.map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredPlants.length === 0 ? (
        <EmptyState
          illustration={<PlantsEmptyIllustration />}
          title="Taimede kataloog on tühi"
          description="Lisa esimene taim või muuda otsingut, et näha sobivaid taimeid."
          actionLabel="Lisa taim"
          onAction={onOpenAddPlant}
          testId="plants-empty-state"
        />
      ) : (
        <div className="kulv-plant-grid">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onSelect={onSelectPlant}
            />
          ))}
        </div>
      )}
    </section>
  );
}
