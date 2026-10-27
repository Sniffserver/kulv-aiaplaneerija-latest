import React, { useState, useEffect } from 'react';
import { BedPlantingCell, GardenBed, Plant } from '../types';
import { CompanionEngine, CellSynergyDetails } from '../logic/companionEngine';
import { CropRotationEngine } from '../logic/cropRotationEngine';
import { PlantGrowthProgressChart } from './PlantGrowthProgressChart';
import {
  X,
  Sprout,
  Droplets,
  Scissors,
  LineChart,
  BookOpen,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface MobileCellSheetProps {
  isOpen: boolean;
  cell: BedPlantingCell | null;
  coords: { x: number; y: number } | null;
  bed: GardenBed;
  allPlants: Plant[];
  selectedDockPlant?: Plant | null;
  onClose: () => void;
  onHarvest: (cell: BedPlantingCell, keepPlant: boolean) => void;
  onWater: (cell: BedPlantingCell) => void;
  onAddJournalNote: (plant: Plant, bed: GardenBed) => void;
  onRemove: (cell: BedPlantingCell) => void;
  onPlantCandidate?: (plant: Plant, x: number, y: number) => void;
}

export const MobileCellSheet: React.FC<MobileCellSheetProps> = ({
  isOpen,
  cell,
  coords,
  bed,
  allPlants,
  selectedDockPlant,
  onClose,
  onHarvest,
  onWater,
  onAddJournalNote,
  onRemove,
  onPlantCandidate
}) => {
  const [showGrowthChart, setShowGrowthChart] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clear feedback when cell changes
  useEffect(() => {
    setActionFeedback(null);
    setShowGrowthChart(false);
  }, [cell, coords]);

  if (!isOpen || !coords) return null;

  const plantInfo = cell ? allPlants.find((p) => p.id === cell.plantId) : null;
  const synergyDetails: CellSynergyDetails | null = cell
    ? CompanionEngine.getPlantedCellSynergy(cell, bed.plantings, allPlants)
    : null;

  const prospectiveSynergy =
    !cell && selectedDockPlant
      ? CompanionEngine.getCellSynergy(coords.x, coords.y, selectedDockPlant, bed.plantings, allPlants)
      : null;

  const canonicalFamily = plantInfo ? CropRotationEngine.normalizeFamily(plantInfo.family) : '';

  // Quick action handlers
  const handleHarvestClick = (keep: boolean) => {
    if (!cell) return;
    onHarvest(cell, keep);
    setActionFeedback(
      keep ? 'Saak märgitud koristatuks! Taim jätkab kasvamist.' : 'Saak märgitud ja peenra lahter vabastatud!'
    );
    setTimeout(() => {
      if (!keep) onClose();
    }, 1200);
  };

  const handleWaterClick = () => {
    if (!cell) return;
    onWater(cell);
    setActionFeedback('Kastmiskord märgitud aiapäevikusse!');
    setTimeout(() => setActionFeedback(null), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lahtri kiirtoimingud"
      data-testid="mobile_cell_sheet"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: 'rgba(23, 27, 23, 0.45)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.18)',
          padding: '16px 18px 24px 18px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--kulv-border, #C9BFA9)',
              marginBottom: '4px'
            }}
          />
        </div>

        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: cell ? 'var(--kulv-accent-soft, #F3D8C2)' : 'var(--kulv-surface-muted, #EFE6D4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                border: '1px solid var(--kulv-border, #C9BFA9)'
              }}
            >
              {cell ? cell.plantIcon : '🌱'}
            </div>
            <div>
              <div
                className="font-serif-display"
                style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
              >
                {cell ? cell.plantName : 'Tühi istutuslahter'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                {bed.name} · Lahter: Veerg {coords.x + 1}, Rida {coords.y + 1}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Sulge aken"
            className="touch-target"
            style={{
              background: 'none',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--kulv-text-muted, #5F675A)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div
            style={{
              backgroundColor: 'rgba(79, 107, 69, 0.15)',
              border: '1px solid var(--kulv-primary, #4F6B45)',
              color: 'var(--kulv-primary, #4F6B45)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* CASE 1: PLANTED CELL INSPECTOR */}
        {cell && plantInfo && (
          <>
            {/* Quick stats grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                borderRadius: '12px',
                padding: '10px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Istutatud</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {cell.dateAdded}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Sugukond</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {plantInfo.family}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>Täisküpsuseni</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-primary, #4F6B45)' }}>
                  {plantInfo.daysToMaturity} p
                </span>
              </div>
            </div>

            {/* Companion Synergy Live Status */}
            {synergyDetails && (
              <div
                style={{
                  backgroundColor:
                    synergyDetails.status === 'positive'
                      ? 'rgba(79, 107, 69, 0.1)'
                      : synergyDetails.status === 'negative'
                        ? 'rgba(217, 122, 61, 0.12)'
                        : 'var(--kulv-surface, #FFFDF8)',
                  border: `1px solid ${
                    synergyDetails.status === 'positive'
                      ? 'var(--kulv-primary, #4F6B45)'
                      : synergyDetails.status === 'negative'
                        ? 'var(--kulv-accent, #D97A3D)'
                        : 'var(--kulv-border, #C9BFA9)'
                  }`,
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
                    {synergyDetails.status === 'positive' ? (
                      <CheckCircle2 size={16} color="var(--kulv-primary, #4F6B45)" />
                    ) : synergyDetails.status === 'negative' ? (
                      <AlertTriangle size={16} color="var(--kulv-accent, #D97A3D)" />
                    ) : (
                      <Sparkles size={16} color="var(--kulv-text-muted, #5F675A)" />
                    )}
                    <span>
                      {synergyDetails.status === 'positive' && 'Taimel on soodsad naabrid (+ sünergia)'}
                      {synergyDetails.status === 'negative' && 'Hoiatus: ebasoodne naabrus (- antagonism)'}
                      {synergyDetails.status === 'mixed' && 'Seganaabrus: nii soodsaid kui konfliktseid naabreid'}
                      {synergyDetails.status === 'neutral' && 'Neutraalne naabrus'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                    {synergyDetails.relationships.length} naabrit
                  </span>
                </div>

                {synergyDetails.relationships.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    {synergyDetails.relationships.map((rel, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color:
                            rel.type === 'good'
                              ? 'var(--kulv-primary, #4F6B45)'
                              : rel.type === 'bad'
                                ? 'var(--kulv-accent, #D97A3D)'
                                : 'var(--kulv-text-muted, #5F675A)'
                        }}
                      >
                        <span>{rel.neighborIcon}</span>
                        <span>{rel.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Crop rotation notice */}
            <div
              style={{
                backgroundColor: 'rgba(79, 107, 69, 0.06)',
                border: '1px solid rgba(79, 107, 69, 0.2)',
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--kulv-text, #2A2E24)'
              }}
            >
              <RotateCcw size={14} color="var(--kulv-primary, #4F6B45)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Viljavaheldus ({canonicalFamily}):</strong> järgmisel kevadel ära istuta sellesse lahtrisse
                teisi {canonicalFamily.toLowerCase()} esindajaid.
              </span>
            </div>

            {/* Primary Touch-Friendly Actions Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                Kiirtoimingud taimel:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {/* 1. Log Harvest */}
                <button
                  onClick={() => handleHarvestClick(false)}
                  className="touch-target"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--kulv-accent, #D97A3D)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(217, 122, 61, 0.2)'
                  }}
                >
                  <Scissors size={18} />
                  <span>Korista saak</span>
                </button>

                {/* 2. Log Watering */}
                <button
                  onClick={handleWaterClick}
                  className="touch-target"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                    color: '#2A6F97',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <Droplets size={18} />
                  <span>Märgi kastetuks</span>
                </button>

                {/* 3. Toggle Recharts Growth Chart */}
                <button
                  onClick={() => setShowGrowthChart((prev) => !prev)}
                  className="touch-target"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: showGrowthChart
                      ? 'var(--kulv-primary, #4F6B45)'
                      : 'var(--kulv-surface-muted, #EFE6D4)',
                    color: showGrowthChart ? 'white' : 'var(--kulv-text, #2A2E24)',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <LineChart size={18} />
                  <span>{showGrowthChart ? 'Peida graafik' : 'Kasvu graafik'}</span>
                  {showGrowthChart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* 4. Add Journal Note */}
                <button
                  onClick={() => {
                    onAddJournalNote(plantInfo, bed);
                    onClose();
                  }}
                  className="touch-target"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                    color: 'var(--kulv-text, #2A2E24)',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <BookOpen size={18} />
                  <span>Lisa päevikusse</span>
                </button>
              </div>

              {/* Remove plant button */}
              <button
                onClick={() => {
                  onRemove(cell);
                  onClose();
                }}
                className="touch-target"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: 'var(--kulv-danger, #B85C33)',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                <Trash2 size={15} />
                <span>Eemalda taim ruudustikult</span>
              </button>
            </div>

            {/* Expandable Recharts Growth Chart */}
            {showGrowthChart && (
              <div style={{ marginTop: '8px' }}>
                <PlantGrowthProgressChart planting={cell} plant={plantInfo} />
              </div>
            )}
          </>
        )}

        {/* CASE 2: EMPTY CELL QUICK SOWING */}
        {!cell && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--kulv-text-muted, #5F675A)' }}>
              See lahter on tühi ja valmis uueks külviks või istutamiseks.
            </div>

            {/* Active dock plant quick planter */}
            {selectedDockPlant && onPlantCandidate && (
              <div
                style={{
                  backgroundColor: 'var(--kulv-accent-soft, #F3D8C2)',
                  border: '1.5px solid var(--kulv-accent, #D97A3D)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '28px' }}>{selectedDockPlant.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--kulv-text, #2A2E24)' }}>
                      Istuta aktiivne taim: {selectedDockPlant.name}
                    </div>
                    {prospectiveSynergy && prospectiveSynergy.status !== 'neutral' && (
                      <div
                        style={{
                          fontSize: '11px',
                          color:
                            prospectiveSynergy.status === 'good'
                              ? 'var(--kulv-primary, #4F6B45)'
                              : 'var(--kulv-accent, #D97A3D)',
                          fontWeight: 700
                        }}
                      >
                        {prospectiveSynergy.reason}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onPlantCandidate(selectedDockPlant, coords.x, coords.y);
                    setActionFeedback(`Istutatud: ${selectedDockPlant.name}!`);
                    setTimeout(() => onClose(), 800);
                  }}
                  className="touch-target"
                  style={{
                    backgroundColor: 'var(--kulv-primary, #4F6B45)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Istuta siia
                </button>
              </div>
            )}

            {/* Quick Plant Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                Või vali taim kiiresti nimekirjast:
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                  gap: '8px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  padding: '2px'
                }}
              >
                {allPlants.map((plant) => (
                  <button
                    key={plant.id}
                    onClick={() => {
                      if (onPlantCandidate) {
                        onPlantCandidate(plant, coords.x, coords.y);
                        setActionFeedback(`Istutatud: ${plant.name}!`);
                        setTimeout(() => onClose(), 800);
                      }
                    }}
                    style={{
                      backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                      border: '1px solid var(--kulv-border, #C9BFA9)',
                      borderRadius: '10px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{plant.icon}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--kulv-text, #2A2E24)',
                        textAlign: 'center',
                        maxWidth: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {plant.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
