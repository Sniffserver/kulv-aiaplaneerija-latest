import React, { useState, Suspense, lazy } from 'react';
import { useGarden } from '../context/GardenContext';
import { InteractiveGardenCanvas } from '../components/InteractiveGardenCanvas';
import { YardObjectDock } from '../components/garden/YardObjectDock';
import { YardMasterPlanCanvas } from '../components/garden/YardMasterPlanCanvas';
import { ConfirmDeleteDialog } from '../components/dialogs/ConfirmDeleteDialog';
import { GardenBed } from '../types';
import { EntityPreset } from '../data/gardenEntityPresets';
import { useYardStore } from '../stores/yardStore';
import { CropRotationTimeline } from '../components/garden/CropRotationTimeline';
import { PrintableGardenReport } from '../components/garden/PrintableGardenReport';
import { Plus, Trash2, Sun, Map, Grid, ArrowLeft, Sparkles, Loader2, Calendar, Printer } from 'lucide-react';

import { EmptyState } from '../components/common/EmptyState';
import { GardenEmptyIllustration } from '../components/common/EmptyStateIllustrations';
import emptyGardenImg from '../assets/images/kulv_empty_garden_1793083975050.jpg';

interface GardenCanvasScreenProps {
  onOpenAddBed: () => void;
}

export const GardenCanvasScreen: React.FC<GardenCanvasScreenProps> = ({ onOpenAddBed }) => {
  const { beds, plants, deleteBed, plantInBed, removePlantFromBed, addYardEntity, yardPlan, language } = useGarden();

  // Mode: 'yard' (overall property layout) vs 'timeline' (multi-year crop rotation) vs 'bed' (individual bed cell grid)
  const [plannerMode, setPlannerMode] = useState<'yard' | 'timeline' | 'bed'>('yard');
  const [selectedBedId, setSelectedBedId] = useState<string>(() => beds[0]?.id || '');
  const [bedToDelete, setBedToDelete] = useState<GardenBed | null>(null);

  // Keep selected bed valid
  const currentBed = beds.find((b) => b.id === selectedBedId) || beds[0] || null;

  // Handle adding preset from dock
  const handleAddPreset = (preset: EntityPreset) => {
    addYardEntity(preset);
  };

  const handleDropPreset = (preset: EntityPreset, x: number, y: number) => {
    addYardEntity(preset, x, y);
  };

  const handleOpenBedDetail = (bedId: string) => {
    setSelectedBedId(bedId);
    setPlannerMode('bed');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '14px 16px', gap: '12px' }}>
      {/* Top Planner Mode Switcher */}
      <div
        className="kulv-paper-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '8px 12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Segmented Control */}
          <div
            role="tablist"
            aria-label={language === 'en' ? 'Planner view mode' : 'Planeerija vaate režiim'}
            className="kulv-segmented-control"
          >
            {/* 2D Plan Button */}
            <button
              role="tab"
              aria-selected={plannerMode === 'yard'}
              onClick={() => setPlannerMode('yard')}
              data-testid="planner_mode_yard_btn"
              className={`kulv-segmented-control__item ${
                plannerMode === 'yard' ? 'kulv-segmented-control__item--active' : ''
              }`}
            >
              <Map size={15} />
              <span>
                {language === 'en'
                  ? `2D Layout (${yardPlan.widthM}m × ${yardPlan.lengthM}m)`
                  : `2D Plaan (${yardPlan.widthM}m × ${yardPlan.lengthM}m)`}
              </span>
            </button>

            {/* Crop Rotation & Succession Timeline Button */}
            <button
              role="tab"
              aria-selected={plannerMode === 'timeline'}
              onClick={() => setPlannerMode('timeline')}
              data-testid="planner_mode_timeline_btn"
              className={`kulv-segmented-control__item ${
                plannerMode === 'timeline' ? 'kulv-segmented-control__item--active' : ''
              }`}
            >
              <Calendar size={15} />
              <span>{language === 'en' ? 'Crop Rotation & Timeline' : 'Külvikord & Ajajoon'}</span>
            </button>

            {/* Bed Detail Grid Button */}
            <button
              role="tab"
              aria-selected={plannerMode === 'bed'}
              onClick={() => setPlannerMode('bed')}
              data-testid="planner_mode_bed_btn"
              className={`kulv-segmented-control__item ${
                plannerMode === 'bed' ? 'kulv-segmented-control__item--active' : ''
              }`}
            >
              <Grid size={15} />
              <span>{language === 'en' ? 'Bed Detail Grid' : 'Peenra detailvaade'}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {plannerMode !== 'yard' && (
            <button
              onClick={() => setPlannerMode('yard')}
              className="kulv-button kulv-button--secondary"
              style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={14} />
              <span>{language === 'en' ? 'Back to Yard Plan' : 'Tagasi krundiplaanile'}</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="kulv-button kulv-button--secondary"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <Printer size={15} />
            <span>{language === 'en' ? 'Print Report' : 'Trüki raport'}</span>
          </button>
        </div>
      </div>

      {/* MODE 1: YARD MASTER PLAN (Authoritative 2D Metric Canvas) */}
      {plannerMode === 'yard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Object Palette Dock */}
          <YardObjectDock
            onAddPreset={handleAddPreset}
            onDragStartPreset={(e, preset) => {
              e.dataTransfer.setData('application/json', JSON.stringify(preset));
            }}
          />

          {/* Master 2D Metric Canvas */}
          <YardMasterPlanCanvas onSelectBedDetail={handleOpenBedDetail} onDropPreset={handleDropPreset} />
        </div>
      )}

      {/* MODE 2: MULTI-YEAR CROP ROTATION & SUCCESSION TIMELINE */}
      {plannerMode === 'timeline' && <CropRotationTimeline beds={beds} plants={plants} language={language} />}

      {/* MODE 3: INDIVIDUAL BED PLANTING CELLS */}
      {plannerMode === 'bed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Bed Selector Tabs & Actions */}
          {beds.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                borderRadius: '12px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto'
              }}
            >
              <div style={{ display: 'flex', gap: '6px', flex: 1, overflowX: 'auto', alignItems: 'center' }}>
                {beds.map((bed) => {
                  const isSelected = bed.id === currentBed?.id;
                  return (
                    <button
                      key={bed.id}
                      data-testid={`bed_chip_${bed.id}`}
                      onClick={() => setSelectedBedId(bed.id)}
                      style={{
                        display: 'flex',
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
                          : 'var(--kulv-surface-muted, #EFE6D4)',
                        color: isSelected ? 'white' : 'var(--kulv-text, #2A2E24)'
                      }}
                    >
                      {isSelected && <Sun size={13} color="var(--kulv-accent, #D97A3D)" />}
                      <span>{bed.name}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onOpenAddBed}
                data-testid="fab_add_bed"
                title="Lisa uus peenar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--kulv-primary, #4F6B45)',
                  color: 'white',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  minHeight: '40px'
                }}
              >
                <Plus size={15} />
                <span>Lisa peenar</span>
              </button>

              {currentBed && (
                <button
                  onClick={() => setBedToDelete(currentBed)}
                  data-testid="delete_current_bed_btn"
                  title="Kustuta aktiivne peenar"
                  aria-label={`Kustuta peenar ${currentBed.name}`}
                  className="touch-target"
                  style={{
                    background: 'none',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    borderRadius: '8px',
                    color: 'var(--kulv-danger, #B85C33)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    minWidth: '40px',
                    minHeight: '40px'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}

          {currentBed ? (
            <InteractiveGardenCanvas
              bed={currentBed}
              allPlants={plants}
              onPlantInCell={plantInBed}
              onRemoveFromCell={removePlantFromBed}
            />
          ) : (
            <EmptyState
              illustration={<GardenEmptyIllustration />}
              title={language === 'en' ? 'No garden beds yet' : 'Aiaplaan on tühi'}
              description={
                language === 'en'
                  ? 'Add your first raised bed or greenhouse to start planning plant placements.'
                  : 'Lisa esimene peenar ja alusta oma aia planeerimist.'
              }
              actionLabel={language === 'en' ? 'Add bed' : 'Lisa peenar'}
              onAction={onOpenAddBed}
              testId="garden-empty-state"
            />
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmDeleteDialog
        isOpen={bedToDelete !== null}
        title="Kustuta peenar"
        message={`Kas soovid kindlasti peenra "${bedToDelete?.name}" ja sellele istutatud taimed kustutada? Seda tegevust ei saa tagasi võtta.`}
        confirmLabel="Kustuta peenar"
        cancelLabel="Loobu"
        onConfirm={() => {
          if (bedToDelete) {
            deleteBed(bedToDelete.id);
            setBedToDelete(null);
          }
        }}
        onCancel={() => setBedToDelete(null)}
      />
      <PrintableGardenReport />
    </div>
  );
};
