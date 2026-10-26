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
import { Plus, Trash2, Sun, Map, Grid, ArrowLeft, Sparkles, Box, Loader2, Calendar, Printer } from 'lucide-react';

import { ThreeErrorBoundary } from '../components/garden3d/ThreeErrorBoundary';

const LazyYard3DViewWrapper = lazy(() => import('../components/garden3d/Yard3DViewWrapper'));

interface GardenCanvasScreenProps {
  onOpenAddBed: () => void;
}

export const GardenCanvasScreen: React.FC<GardenCanvasScreenProps> = ({ onOpenAddBed }) => {
  const { beds, plants, deleteBed, plantInBed, removePlantFromBed, addYardEntity, yardPlan, language } = useGarden();

  // Mode: 'yard' (overall property layout) vs 'timeline' (multi-year crop rotation) vs 'bed' (individual bed cell grid)
  const [plannerMode, setPlannerMode] = useState<'yard' | 'timeline' | 'bed'>('yard');
  const viewMode = useYardStore((s) => s.viewMode);
  const setViewMode = useYardStore((s) => s.setViewMode);
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
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '12px',
          padding: '8px 12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Segmented Control */}
          <div
            role="tablist"
            aria-label={language === 'en' ? 'Planner view mode' : 'Planeerija vaate režiim'}
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              borderRadius: '8px',
              padding: '3px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              gap: '2px',
              flexWrap: 'wrap'
            }}
          >
            {/* 2D Plan Button */}
            <button
              role="tab"
              aria-selected={plannerMode === 'yard' && viewMode === '2d'}
              onClick={() => {
                setPlannerMode('yard');
                setViewMode('2d');
              }}
              data-testid="planner_mode_yard_btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '40px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: plannerMode === 'yard' && viewMode === '2d' ? 700 : 500,
                backgroundColor:
                  plannerMode === 'yard' && viewMode === '2d' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color:
                  plannerMode === 'yard' && viewMode === '2d'
                    ? 'var(--kulv-primary, #4F6B45)'
                    : 'var(--kulv-text, #2A2E24)',
                boxShadow: plannerMode === 'yard' && viewMode === '2d' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Map size={15} />
              <span>
                {language === 'en'
                  ? `2D Layout (${yardPlan.widthM}m × ${yardPlan.lengthM}m)`
                  : `2D Plaan (${yardPlan.widthM}m × ${yardPlan.lengthM}m)`}
              </span>
            </button>

            {/* 3D View Button */}
            <button
              role="tab"
              aria-selected={plannerMode === 'yard' && viewMode === '3d'}
              onClick={() => {
                setPlannerMode('yard');
                setViewMode('3d');
              }}
              data-testid="planner_mode_3d_btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '40px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: plannerMode === 'yard' && viewMode === '3d' ? 700 : 500,
                backgroundColor:
                  plannerMode === 'yard' && viewMode === '3d' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color:
                  plannerMode === 'yard' && viewMode === '3d'
                    ? 'var(--kulv-primary, #4F6B45)'
                    : 'var(--kulv-text, #2A2E24)',
                boxShadow: plannerMode === 'yard' && viewMode === '3d' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Box size={15} />
              <span>{language === 'en' ? '3D View' : '3D Vaade'}</span>
            </button>

            {/* Crop Rotation & Succession Timeline Button */}
            <button
              role="tab"
              aria-selected={plannerMode === 'timeline'}
              onClick={() => setPlannerMode('timeline')}
              data-testid="planner_mode_timeline_btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '40px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: plannerMode === 'timeline' ? 700 : 500,
                backgroundColor: plannerMode === 'timeline' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: plannerMode === 'timeline' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                boxShadow: plannerMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                minHeight: '40px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: plannerMode === 'bed' ? 700 : 500,
                backgroundColor: plannerMode === 'bed' ? 'var(--kulv-surface, #FFFDF8)' : 'transparent',
                color: plannerMode === 'bed' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
                boxShadow: plannerMode === 'bed' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Grid size={15} />
              <span>{language === 'en' ? 'Bed Detail Grid' : 'Peenra detailvaade'}</span>
            </button>
          </div>
        </div>

        {plannerMode !== 'yard' && (
          <button
            onClick={() => setPlannerMode('yard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              minHeight: '40px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={14} />
            <span>{language === 'en' ? 'Back to Yard Plan' : 'Tagasi krundiplaanile'}</span>
          </button>
        )}
        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <Printer size={15} />
          <span>Print Report</span>
        </button>
      </div>

      {/* MODE 1: YARD MASTER PLAN (2D Canvas or 3D R3F View) */}
      {plannerMode === 'yard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {viewMode === '3d' ? (
            <ThreeErrorBoundary onFallbackTo2D={() => setViewMode('2d')}>
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] min-h-[500px] bg-slate-900 rounded-xl border border-slate-700 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                    <p className="text-sm">Laadin 3D komponenti...</p>
                  </div>
                }
              >
                <LazyYard3DViewWrapper onBackTo2D={() => setViewMode('2d')} />
              </Suspense>
            </ThreeErrorBoundary>
          ) : (
            <>
              {/* Object Palette Dock */}
              <YardObjectDock
                onAddPreset={handleAddPreset}
                onDragStartPreset={(e, preset) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(preset));
                }}
              />

              {/* Master 2D Metric Canvas */}
              <YardMasterPlanCanvas onSelectBedDetail={handleOpenBedDetail} onDropPreset={handleDropPreset} />
            </>
          )}
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
            <div
              style={{
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                borderRadius: '16px',
                padding: '32px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto 0'
              }}
            >
              <h3
                style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--kulv-text, #2A2E24)' }}
              >
                Aias pole veel ühtegi peenart
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  maxWidth: '340px',
                  margin: '0 0 16px 0'
                }}
              >
                Lisa esimene peenar või kasvuhoone, et alustada taimede paigutamist ruudustikule.
              </p>
              <button
                onClick={onOpenAddBed}
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
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Lisa peenar</span>
              </button>
            </div>
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
