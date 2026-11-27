import React, { useState, Suspense, lazy } from 'react';
import { useGarden } from '../context/GardenContext';
import { YardObjectDock } from '../components/garden/YardObjectDock';
import { YardMasterPlanCanvas } from '../components/garden/YardMasterPlanCanvas';
import { ConfirmDeleteDialog } from '../components/dialogs/ConfirmDeleteDialog';
import { GardenBed } from '../types';
import { EntityPreset } from '../data/gardenEntityPresets';
import { PrintableGardenReport } from '../components/garden/PrintableGardenReport';
import { Map, Grid, ArrowLeft, Calendar, Printer } from 'lucide-react';

const BedDetailDrawer = lazy(() =>
  import('../components/garden/BedDetailDrawer').then((m) => ({ default: m.BedDetailDrawer }))
);
const CropRotationTimeline = lazy(() =>
  import('../components/garden/CropRotationTimeline').then((m) => ({ default: m.CropRotationTimeline }))
);

interface GardenCanvasScreenProps {
  onOpenAddBed: () => void;
}

export const GardenCanvasScreen: React.FC<GardenCanvasScreenProps> = ({ onOpenAddBed }) => {
  const { beds, plants, deleteBed, plantInBed, removePlantFromBed, addYardEntity, yardPlan, language } = useGarden();

  // Primary modes: 'yard' (2D master layout) vs 'timeline' (multi-year crop rotation)
  const [plannerMode, setPlannerMode] = useState<'yard' | 'timeline'>('yard');
  const [isBedDrawerOpen, setIsBedDrawerOpen] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string>(() => beds[0]?.id || '');
  const [bedToDelete, setBedToDelete] = useState<GardenBed | null>(null);

  // Keep selected bed valid
  const currentBed = beds.find((b) => b.id === selectedBedId) || beds[0] || null;

  const handleAddPreset = (preset: EntityPreset) => {
    addYardEntity(preset);
  };

  const handleDropPreset = (preset: EntityPreset, x: number, y: number) => {
    addYardEntity(preset, x, y);
  };

  const handleOpenBedDetail = (bedId: string) => {
    setSelectedBedId(bedId);
    setIsBedDrawerOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '14px 16px', gap: '12px' }}>
      {/* Top Workspace Header & Planner Mode Switcher */}
      <div
        className="kulv-paper-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h1
            className="font-serif-display"
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--kulv-text, #2A2E24)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}
          >
            {language === 'en' ? '2D Yard Master Plan' : '2D Aiakrundiplaan'}
          </h1>

          <div
            role="tablist"
            aria-label={language === 'en' ? 'Planner view mode' : 'Planeerija vaate režiim'}
            className="kulv-segmented-control"
          >
            {/* 2D Plan Button */}
            <button
              type="button"
              role="tab"
              aria-selected={plannerMode === 'yard'}
              onClick={() => setPlannerMode('yard')}
              data-testid="planner_mode_yard_btn"
              className={`kulv-segmented-control__item ${
                plannerMode === 'yard' ? 'kulv-segmented-control__item--active' : ''
              }`}
            >
              <Map size={15} aria-hidden="true" />
              <span>
                {language === 'en'
                  ? `2D Layout (${yardPlan.widthM}m × ${yardPlan.lengthM}m)`
                  : `2D Plaan (${yardPlan.widthM}m × ${yardPlan.lengthM}m)`}
              </span>
            </button>

            {/* Crop Rotation & Succession Timeline Button */}
            <button
              type="button"
              role="tab"
              aria-selected={plannerMode === 'timeline'}
              onClick={() => setPlannerMode('timeline')}
              data-testid="planner_mode_timeline_btn"
              className={`kulv-segmented-control__item ${
                plannerMode === 'timeline' ? 'kulv-segmented-control__item--active' : ''
              }`}
            >
              <Calendar size={15} aria-hidden="true" />
              <span>{language === 'en' ? 'Crop Rotation & Timeline' : 'Külvikord & Ajajoon'}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {plannerMode !== 'yard' && (
            <button
              type="button"
              onClick={() => setPlannerMode('yard')}
              className="kulv-button kulv-button--secondary"
              style={{ minHeight: '40px', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>{language === 'en' ? 'Back to Yard Plan' : 'Tagasi krundiplaanile'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsBedDrawerOpen(true)}
            data-testid="planner_mode_bed_btn"
            aria-expanded={isBedDrawerOpen}
            className="kulv-button kulv-button--secondary"
            style={{ minHeight: '40px', padding: '6px 14px', fontSize: '0.85rem' }}
          >
            <Grid size={15} aria-hidden="true" />
            <span>{language === 'en' ? 'Bed Detail Grid' : 'Peenra detailvaade'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="kulv-button kulv-button--secondary"
            style={{ minHeight: '40px', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <Printer size={15} aria-hidden="true" />
            <span>{language === 'en' ? 'Print Report' : 'Trüki raport'}</span>
          </button>
        </div>
      </div>

      {/* MODE 1: YARD MASTER PLAN (Authoritative 2D Metric Canvas) */}
      {plannerMode === 'yard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <YardObjectDock
            onAddPreset={handleAddPreset}
            onDragStartPreset={(e, preset) => {
              e.dataTransfer.setData('application/json', JSON.stringify(preset));
            }}
          />

          <YardMasterPlanCanvas onSelectBedDetail={handleOpenBedDetail} onDropPreset={handleDropPreset} />
        </div>
      )}

      {/* MODE 2: MULTI-YEAR CROP ROTATION & SUCCESSION TIMELINE */}
      {plannerMode === 'timeline' && (
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="min-h-[320px] rounded-2xl bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] animate-pulse motion-reduce:animate-none"
            />
          }
        >
          <CropRotationTimeline beds={beds} plants={plants} language={language} />
        </Suspense>
      )}

      {/* Contextual Quick Bed Detail Drawer */}
      {isBedDrawerOpen && (
        <Suspense fallback={null}>
          <BedDetailDrawer
            isOpen={isBedDrawerOpen}
            onClose={() => setIsBedDrawerOpen(false)}
            beds={beds}
            currentBed={currentBed}
            onSelectBed={(bedId) => setSelectedBedId(bedId)}
            onOpenAddBed={onOpenAddBed}
            onRequestDeleteBed={(bed) => setBedToDelete(bed)}
            allPlants={plants}
            onPlantInCell={plantInBed}
            onRemoveFromCell={removePlantFromBed}
            language={language}
          />
        </Suspense>
      )}

      {/* Delete confirmation modal */}
      <ConfirmDeleteDialog
        isOpen={bedToDelete !== null}
        title={language === 'en' ? 'Delete bed' : 'Kustuta peenar'}
        message={
          language === 'en'
            ? `Are you sure you want to delete "${bedToDelete?.name}" and its planted crops? This action cannot be undone.`
            : `Kas soovid kindlasti peenra "${bedToDelete?.name}" ja sellele istutatud taimed kustutada? Seda tegevust ei saa tagasi võtta.`
        }
        confirmLabel={language === 'en' ? 'Delete bed' : 'Kustuta peenar'}
        cancelLabel={language === 'en' ? 'Cancel' : 'Loobu'}
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
