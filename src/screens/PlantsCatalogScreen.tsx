import React, { useState, useMemo } from 'react';
import { useGarden } from '../context/GardenContext';
import { Plant } from '../types';
import { PlantCard } from '../components/PlantCard';
import { EmptyState } from '../components/common/EmptyState';
import { PlantsEmptyIllustration } from '../components/common/EmptyStateIllustrations';
import {
  Search,
  Plus,
  X,
  SlidersHorizontal,
  Sun,
  Droplets,
  Sprout,
  Calendar,
  ArrowUpDown,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface PlantsCatalogScreenProps {
  onSelectPlant: (plant: Plant) => void;
  onOpenAddCustomPlant: () => void;
}

type SunFilter = 'all' | 'full' | 'partial' | 'shade';
type WaterFilter = 'all' | 'low' | 'medium' | 'high';
type SowMethodFilter = 'all' | 'indoor' | 'direct';
type SowTimingFilter = 'all' | 'early-spring' | 'late-spring' | 'summer' | 'autumn';
type SortOption = 'name-asc' | 'name-desc' | 'days-asc' | 'days-desc' | 'sow-asc';

export const PlantsCatalogScreen: React.FC<PlantsCatalogScreenProps> = ({ onSelectPlant, onOpenAddCustomPlant }) => {
  const { plants, language, t } = useGarden();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Faceted filters
  const [sunFilter, setSunFilter] = useState<SunFilter>('all');
  const [waterFilter, setWaterFilter] = useState<WaterFilter>('all');
  const [sowMethodFilter, setSowMethodFilter] = useState<SowMethodFilter>('all');
  const [sowTimingFilter, setSowTimingFilter] = useState<SowTimingFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (sunFilter !== 'all') count++;
    if (waterFilter !== 'all') count++;
    if (sowMethodFilter !== 'all') count++;
    if (sowTimingFilter !== 'all') count++;
    return count;
  }, [selectedCategory, sunFilter, waterFilter, sowMethodFilter, sowTimingFilter]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSunFilter('all');
    setWaterFilter('all');
    setSowMethodFilter('all');
    setSowTimingFilter('all');
    setSearchQuery('');
    setSortBy('name-asc');
  };

  const filteredPlants = useMemo(() => {
    const list = plants.filter((plant) => {
      // 1. Text Search
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        plant.name.toLowerCase().includes(q) ||
        (plant.nameEn && plant.nameEn.toLowerCase().includes(q)) ||
        plant.family.toLowerCase().includes(q) ||
        plant.scientificName.toLowerCase().includes(q) ||
        (plant.varieties && plant.varieties.some((v) => v.toLowerCase().includes(q)));

      if (!matchesQuery) return false;

      // 2. Category Filter
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
      if (!matchesCategory) return false;

      // 3. Sun Exposure
      if (sunFilter !== 'all' && plant.sunNeed !== sunFilter) {
        return false;
      }

      // 4. Water Need
      if (waterFilter !== 'all' && plant.waterNeed !== waterFilter) {
        return false;
      }

      // 5. Sowing Method
      if (sowMethodFilter === 'indoor') {
        if (!plant.weeksBeforeFrostSowIndoors) return false;
      } else if (sowMethodFilter === 'direct') {
        if (plant.weeksBeforeFrostSowIndoors && plant.weeksBeforeFrostSowIndoors > 0) return false;
      }

      // 6. Sowing Timing (based on optimalSowDateStart MM-DD)
      if (sowTimingFilter !== 'all' && plant.optimalSowDateStart) {
        const month = parseInt(plant.optimalSowDateStart.slice(0, 2), 10);
        if (sowTimingFilter === 'early-spring' && !(month >= 2 && month <= 4)) return false;
        if (sowTimingFilter === 'late-spring' && month !== 5) return false;
        if (sowTimingFilter === 'summer' && !(month >= 6 && month <= 7)) return false;
        if (sowTimingFilter === 'autumn' && !(month >= 8 && month <= 10)) return false;
      }

      return true;
    });

    // Sort order
    return list.sort((a, b) => {
      const nameA = language === 'en' && a.nameEn ? a.nameEn : a.name;
      const nameB = language === 'en' && b.nameEn ? b.nameEn : b.name;

      switch (sortBy) {
        case 'name-asc':
          return nameA.localeCompare(nameB, 'et');
        case 'name-desc':
          return nameB.localeCompare(nameA, 'et');
        case 'days-asc':
          return (a.daysToMaturity || 999) - (b.daysToMaturity || 999);
        case 'days-desc':
          return (b.daysToMaturity || 0) - (a.daysToMaturity || 0);
        case 'sow-asc':
          return (a.optimalSowDateStart || '12-31').localeCompare(b.optimalSowDateStart || '12-31');
        default:
          return 0;
      }
    });
  }, [
    plants,
    searchQuery,
    selectedCategory,
    sunFilter,
    waterFilter,
    sowMethodFilter,
    sowTimingFilter,
    sortBy,
    language
  ]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              className="font-serif-display"
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--kulv-text, #2A2E24)',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              {language === 'en' ? 'Plant Encyclopedia & Cultivars' : 'Taimede entsüklopeedia & sordid'}
            </h1>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                color: 'var(--kulv-primary, #4F6B45)',
                fontWeight: 700
              }}
            >
              {plants.length} {language === 'en' ? 'species' : 'liiki'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--kulv-text-muted, #5F675A)', margin: '4px 0 0 0' }}>
            {language === 'en'
              ? 'Nordic climate cultivars, Estonian heirloom varieties, frost requirements, and companion synergies.'
              : 'Eesti ja Põhjamaade kliimasse aretatud pärandsordid, idanemis- ja saagiajad ning sobivad naabrid.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            data-testid="toggle_advanced_filters"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: showAdvancedFilters ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface, #FFFDF8)',
              color: showAdvancedFilters ? 'white' : 'var(--kulv-text, #2A2E24)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <SlidersHorizontal size={16} />
            <span>{language === 'en' ? 'Filters' : 'Filtrid'}</span>
            {activeFilterCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: showAdvancedFilters ? 'white' : 'var(--kulv-primary, #4F6B45)',
                  color: showAdvancedFilters ? 'var(--kulv-primary, #4F6B45)' : 'white',
                  borderRadius: '999px',
                  padding: '1px 6px',
                  fontWeight: 700
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

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
      </div>

      {/* Search Field & Sort Row */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: '260px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '10px',
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
                ? 'Search by plant, cultivar (e.g. Malle, Peipsi), family...'
                : 'Otsi taime nime, sordi (nt Malle, Peipsi, Jõgeva) või sugukonna järgi...'
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

        {/* Sort Select */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '10px',
            padding: '0 10px',
            minHeight: '44px'
          }}
        >
          <ArrowUpDown size={16} color="var(--kulv-text-muted, #5F675A)" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label={language === 'en' ? 'Sort plants' : 'Sorteeri taimi'}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              padding: '10px 0'
            }}
          >
            <option value="name-asc">{language === 'en' ? 'Name (A–Z)' : 'Nimi (A–Z)'}</option>
            <option value="name-desc">{language === 'en' ? 'Name (Z–A)' : 'Nimi (Z–A)'}</option>
            <option value="days-asc">
              {language === 'en' ? 'Days to harvest (Shortest)' : 'Kasvupäevad (Kiireim saak)'}
            </option>
            <option value="days-desc">
              {language === 'en' ? 'Days to harvest (Longest)' : 'Kasvupäevad (Pikim)'}
            </option>
            <option value="sow-asc">
              {language === 'en' ? 'Sowing date (Earliest)' : 'Külviaeg (Varaseim)'}
            </option>
          </select>
        </div>
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
                minHeight: '44px',
                border: isSelected ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: isSelected ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface, #FFFDF8)',
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

      {/* Advanced Faceted Filters Panel */}
      {showAdvancedFilters && (
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px'
            }}
          >
            {/* Sunlight Need */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--kulv-text, #2A2E24)',
                  marginBottom: '6px'
                }}
              >
                <Sun size={14} color="var(--kulv-accent, #D97A3D)" />
                <span>{language === 'en' ? 'Sunlight' : 'Valgusvajadus'}</span>
              </label>
              <select
                value={sunFilter}
                onChange={(e) => setSunFilter(e.target.value as SunFilter)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  fontSize: '12px',
                  color: 'var(--kulv-text, #2A2E24)',
                  minHeight: '38px'
                }}
              >
                <option value="all">{language === 'en' ? 'All sun conditions' : 'Kõik tingimused'}</option>
                <option value="full">{language === 'en' ? '☀️ Full Sun (6h+)' : '☀️ Täispäike (6h+)'}</option>
                <option value="partial">{language === 'en' ? '⛅ Part Shade (3-6h)' : '⛅ Poolvari (3–6h)'}</option>
                <option value="shade">{language === 'en' ? '☁️ Shade (<3h)' : '☁️ Vari (<3h)'}</option>
              </select>
            </div>

            {/* Water Need */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--kulv-text, #2A2E24)',
                  marginBottom: '6px'
                }}
              >
                <Droplets size={14} color="var(--kulv-primary, #4F6B45)" />
                <span>{language === 'en' ? 'Water Requirement' : 'Kastmisvajadus'}</span>
              </label>
              <select
                value={waterFilter}
                onChange={(e) => setWaterFilter(e.target.value as WaterFilter)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  fontSize: '12px',
                  color: 'var(--kulv-text, #2A2E24)',
                  minHeight: '38px'
                }}
              >
                <option value="all">{language === 'en' ? 'All water requirements' : 'Kõik kastmisvajadused'}</option>
                <option value="low">{language === 'en' ? '💧 Low (drought-tolerant)' : '💧 Madal (põuakindel)'}</option>
                <option value="medium">{language === 'en' ? '💧💧 Moderate' : '💧💧 Mõõdukas'}</option>
                <option value="high">{language === 'en' ? '💧💧💧 High (moist soil)' : '💧💧💧 Kõrge (niiske muld)'}</option>
              </select>
            </div>

            {/* Sowing Method */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--kulv-text, #2A2E24)',
                  marginBottom: '6px'
                }}
              >
                <Sprout size={14} color="var(--kulv-primary, #4F6B45)" />
                <span>{language === 'en' ? 'Sowing Method' : 'Külviviis'}</span>
              </label>
              <select
                value={sowMethodFilter}
                onChange={(e) => setSowMethodFilter(e.target.value as SowMethodFilter)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  fontSize: '12px',
                  color: 'var(--kulv-text, #2A2E24)',
                  minHeight: '38px'
                }}
              >
                <option value="all">{language === 'en' ? 'All sowing methods' : 'Kõik külviviisid'}</option>
                <option value="indoor">
                  {language === 'en' ? '🌱 Indoor Pre-grow (Ettekasvatus)' : '🌱 Ettekasvatus toas/kasvuhoones'}
                </option>
                <option value="direct">
                  {language === 'en' ? '🌾 Direct Sow outdoors' : '🌾 Otsekülv avamaale'}
                </option>
              </select>
            </div>

            {/* Sowing Timing Window */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--kulv-text, #2A2E24)',
                  marginBottom: '6px'
                }}
              >
                <Calendar size={14} color="var(--kulv-text-muted, #5F675A)" />
                <span>{language === 'en' ? 'Sowing Window' : 'Külviperiood'}</span>
              </label>
              <select
                value={sowTimingFilter}
                onChange={(e) => setSowTimingFilter(e.target.value as SowTimingFilter)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  fontSize: '12px',
                  color: 'var(--kulv-text, #2A2E24)',
                  minHeight: '38px'
                }}
              >
                <option value="all">{language === 'en' ? 'All seasons' : 'Kõik perioodid'}</option>
                <option value="early-spring">
                  {language === 'en' ? 'Varakevad (Märts–Aprill)' : 'Varakevad (Märts–Aprill)'}
                </option>
                <option value="late-spring">
                  {language === 'en' ? 'Hiliskevad (Mai)' : 'Hiliskevad (Mai)'}
                </option>
                <option value="summer">
                  {language === 'en' ? 'Suvi (Juuni–Juuli)' : 'Suvi (Juuni–Juuli)'}
                </option>
                <option value="autumn">
                  {language === 'en' ? 'Sügiskülv (August–Oktoober)' : 'Sügiskülv (August–Oktoober)'}
                </option>
              </select>
            </div>
          </div>

          {/* Reset Filters button inside drawer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--kulv-text-muted, #5F675A)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>{language === 'en' ? 'Reset all filters' : 'Lähtesta filtrid'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 600 }}>
            {language === 'en' ? 'Active filters:' : 'Aktiivsed filtrid:'}
          </span>
          {selectedCategory !== 'all' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              <span>{categories.find((c) => c.id === selectedCategory)?.[language === 'en' ? 'labelEn' : 'labelEt']}</span>
              <button
                onClick={() => setSelectedCategory('all')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {sunFilter !== 'all' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              <span>{sunFilter === 'full' ? 'Täispäike' : sunFilter === 'partial' ? 'Poolvari' : 'Vari'}</span>
              <button
                onClick={() => setSunFilter('all')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {waterFilter !== 'all' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              <span>{waterFilter === 'low' ? 'Madal vesi' : waterFilter === 'medium' ? 'Mõõdukas vesi' : 'Kõrge vesi'}</span>
              <button
                onClick={() => setWaterFilter('all')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {sowMethodFilter !== 'all' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              <span>{sowMethodFilter === 'indoor' ? 'Ettekasvatus' : 'Otsekülv'}</span>
              <button
                onClick={() => setSowMethodFilter('all')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {sowTimingFilter !== 'all' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              <span>{sowTimingFilter}</span>
              <button
                onClick={() => setSowTimingFilter('all')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '11px',
              color: 'var(--kulv-accent, #D97A3D)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 4px'
            }}
          >
            {language === 'en' ? 'Clear all' : 'Puhasta kõik'}
          </button>
        </div>
      )}

      {/* Plants Count info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--kulv-text-muted, #5F675A)',
          fontWeight: 500
        }}
      >
        <span>
          {language === 'en'
            ? `Showing ${filteredPlants.length} of ${plants.length} species`
            : `Kuvatakse ${filteredPlants.length} / ${plants.length} taime`}
        </span>
      </div>

      {/* Responsive Herbarium Grid */}
      {filteredPlants.length === 0 ? (
        <EmptyState
          illustration={<PlantsEmptyIllustration />}
          title={language === 'en' ? 'No matching plants found' : 'Ühtegi taime ei leitud'}
          description={
            language === 'en'
              ? 'No plant species matched your search criteria or active filters.'
              : 'Valitud filtrite või otsingusõnaga ei leitud ühtegi taime.'
          }
          actionLabel={language === 'en' ? 'Reset filters' : 'Tühjenda filtrid'}
          onAction={handleResetFilters}
          testId="plants-catalog-empty"
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '12px'
          }}
        >
          {filteredPlants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} onClick={() => onSelectPlant(plant)} />
          ))}
        </div>
      )}
    </div>
  );
};
