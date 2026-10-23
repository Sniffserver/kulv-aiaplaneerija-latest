import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { Plant } from '../types';
import { PlantCard } from '../components/PlantCard';
import { Search, Plus, X } from 'lucide-react';

interface PlantsCatalogScreenProps {
  onSelectPlant: (plant: Plant) => void;
  onOpenAddCustomPlant: () => void;
}

export const PlantsCatalogScreen: React.FC<PlantsCatalogScreenProps> = ({
  onSelectPlant,
  onOpenAddCustomPlant
}) => {
  const { plants, language, t } = useGarden();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', labelEt: 'Kõik', labelEn: 'All' },
    { id: 'veg', labelEt: 'Köögivili', labelEn: 'Vegetables' },
    { id: 'herb', labelEt: 'Ürdid', labelEn: 'Herbs' },
    { id: 'berry', labelEt: 'Marjad & Puuviljad', labelEn: 'Berries & Fruits' },
    { id: 'nordic', labelEt: 'Põhjamaised sordid', labelEn: 'Nordic Varieties' }
  ];

  const categoryCounts = useMemo(() => {
    return {
      all: plants.length,
      veg: plants.filter((p) => !p.family.includes('Lamiaceae') && !p.family.includes('Rosaceae')).length,
      herb: plants.filter(
        (p) => p.family.includes('Lamiaceae') || ['till', 'basiilik', 'petersell', 'koriander'].includes(p.id)
      ).length,
      berry: plants.filter(
        (p) =>
          p.family.includes('Rosaceae') ||
          p.family.includes('Ericaceae') ||
          ['maasikas', 'mustikas', 'vaarikas', 'sõstar', 'pohl'].includes(p.id)
      ).length,
      nordic: plants.filter((p) => p.isNordicSuitable).length
    };
  }, [plants]);

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        plant.name.toLowerCase().includes(q) ||
        (plant.nameEn && plant.nameEn.toLowerCase().includes(q)) ||
        plant.family.toLowerCase().includes(q) ||
        plant.scientificName.toLowerCase().includes(q) ||
        (plant.varieties && plant.varieties.some((v) => v.toLowerCase().includes(q)));

      let matchesCategory = true;
      if (selectedCategory === 'veg') {
        matchesCategory = !plant.family.includes('Lamiaceae') && !plant.family.includes('Rosaceae');
      } else if (selectedCategory === 'herb') {
        matchesCategory =
          plant.family.includes('Lamiaceae') || ['till', 'basiilik', 'petersell', 'koriander'].includes(plant.id);
      } else if (selectedCategory === 'berry') {
        matchesCategory =
          plant.family.includes('Rosaceae') ||
          plant.family.includes('Ericaceae') ||
          ['maasikas', 'mustikas', 'vaarikas', 'sõstar', 'pohl'].includes(plant.id);
      } else if (selectedCategory === 'nordic') {
        matchesCategory = plant.isNordicSuitable;
      }

      return matchesQuery && matchesCategory;
    });
  }, [plants, searchQuery, selectedCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1
            className="font-serif-display"
            style={{ fontSize: '26px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)', margin: 0, letterSpacing: '-0.02em' }}
          >
            {language === 'en' ? 'Plant Encyclopedia' : 'Taimede entsüklopeedia'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--kulv-text-muted, #5F675A)', margin: '4px 0 0 0' }}>
            {language === 'en'
              ? 'Nordic climate cultivars, frost & harvest timelines, and companion synergies.'
              : 'Eesti ja Põhjamaade kliimasse sobivad sordid, idanemis- ja saagiajad ning naabrusmõjud.'}
          </p>
        </div>

        <button
          onClick={onOpenAddCustomPlant}
          data-testid="fab_add_plant"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: '8px',
            backgroundColor: 'var(--kulv-primary, #4F6B45)',
            color: 'white',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            minHeight: '44px'
          }}
        >
          <Plus size={16} />
          <span>{language === 'en' ? 'Add Plant' : 'Lisa taim'}</span>
        </button>
      </div>

      {/* Search Field */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '12px',
          padding: '10px 14px',
          minHeight: '44px'
        }}
      >
        <Search size={18} color="var(--kulv-text-muted, #5F675A)" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === 'en'
              ? 'Search by plant name, English name, variety, or family...'
              : 'Otsi taime nime, sordi või sugukonna järgi...'
          }
          data-testid="plant_search_field"
          style={{
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            width: '100%',
            fontSize: '13px',
            color: 'var(--kulv-text, #2A2E24)'
          }}
        />
        {searchQuery.length > 0 && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label={language === 'en' ? 'Clear search' : 'Tühjenda otsing'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kulv-text-muted, #5F675A)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Category Tabs with Counts */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id as keyof typeof categoryCounts] ?? 0;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                minHeight: '40px',
                border: isSelected
                  ? '1px solid var(--kulv-primary, #4F6B45)'
                  : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: isSelected
                  ? 'var(--kulv-primary, #4F6B45)'
                  : 'var(--kulv-surface, #FFFDF8)',
                color: isSelected ? 'white' : 'var(--kulv-text, #2A2E24)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{language === 'en' ? cat.labelEn : cat.labelEt}</span>
              <span
                style={{
                  fontSize: '11px',
                  opacity: isSelected ? 0.9 : 0.65,
                  fontWeight: 500
                }}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Plants Count */}
      <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 500 }}>
        {language === 'en' ? `Showing ${filteredPlants.length} plants` : `Kuvatakse ${filteredPlants.length} taime`}
      </div>

      {/* Responsive Herbarium Grid */}
      {filteredPlants.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '12px',
            color: 'var(--kulv-text-muted, #5F675A)',
            fontSize: '13px'
          }}
        >
          {language === 'en'
            ? `No plants found matching "${searchQuery}".`
            : `Ühtegi taime ei leitud otsinguga "${searchQuery}".`}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '12px'
          }}
        >
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onClick={() => onSelectPlant(plant)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
