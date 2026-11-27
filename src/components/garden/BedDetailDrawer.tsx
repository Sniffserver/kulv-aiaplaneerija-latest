import React, { useEffect } from 'react';
import { GardenBed, Plant } from '../../types';
import { InteractiveGardenCanvas } from '../InteractiveGardenCanvas';
import { X, Plus, Trash2, Sun, Grid } from 'lucide-react';

interface BedDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  beds: GardenBed[];
  currentBed: GardenBed | null;
  onSelectBed: (bedId: string) => void;
  onOpenAddBed: () => void;
  onRequestDeleteBed: (bed: GardenBed) => void;
  allPlants: Plant[];
  onPlantInCell: (bedId: string, plant: Plant, gridX: number, gridY: number) => void;
  onRemoveFromCell: (bedId: string, gridX: number, gridY: number) => void;
  language: 'et' | 'en';
}

export const BedDetailDrawer: React.FC<BedDetailDrawerProps> = ({
  isOpen,
  onClose,
  beds,
  currentBed,
  onSelectBed,
  onOpenAddBed,
  onRequestDeleteBed,
  allPlants,
  onPlantInCell,
  onRemoveFromCell,
  language
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="bed_detail_drawer_backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 34, 24, 0.38)',
        backdropFilter: 'blur(2px)',
        zIndex: 80,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <aside
        data-testid="bed_detail_drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bed-detail-drawer-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(820px, 100vw)',
          height: '100%',
          backgroundColor: 'var(--kulv-bg, #FAF6ED)',
          borderLeft: '1px solid var(--kulv-border, #C9BFA9)',
          boxShadow: '-12px 0 36px rgba(0, 0, 0, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(79, 107, 69, 0.12)',
                color: 'var(--kulv-primary, #385A40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Grid size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2
                id="bed-detail-drawer-title"
                className="font-serif-display"
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--kulv-text, #2A2E24)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {currentBed
                  ? currentBed.name
                  : language === 'en'
                    ? 'Bed Planting Grid'
                    : 'Peenra külviplaan'}
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                {language === 'en'
                  ? '50cm planting cells · Companion heatmap · Quick harvest log'
                  : '50cm istutusruudud · Kaaslastaimede kaart · Kiire hoolduslogi'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close_bed_drawer_btn"
            aria-label={language === 'en' ? 'Close bed drawer' : 'Sulge peenra sahtel'}
            style={{
              minWidth: '40px',
              minHeight: '40px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              color: 'var(--kulv-text, #2A2E24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Bed Switcher Strip */}
        <div
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            borderBottom: '1px solid var(--kulv-border, #C9BFA9)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flex: 1, overflowX: 'auto', alignItems: 'center' }}>
            {beds.map((bed) => {
              const isSelected = bed.id === currentBed?.id;
              return (
                <button
                  key={bed.id}
                  type="button"
                  data-testid={`bed_chip_${bed.id}`}
                  onClick={() => onSelectBed(bed.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
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
                    color: isSelected ? 'var(--kulv-button-text, #FFFFFF)' : 'var(--kulv-text, #2A2E24)'
                  }}
                >
                  {isSelected && (
                    <Sun size={13} color="var(--kulv-button-text, #FFFFFF)" aria-hidden="true" />
                  )}
                  <span>{bed.name}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAddBed}
            data-testid="fab_add_bed"
            title={language === 'en' ? 'Add new bed' : 'Lisa uus peenar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--kulv-primary, #4F6B45)',
              color: 'var(--kulv-button-text, #FFFFFF)',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              minHeight: '40px'
            }}
          >
            <Plus size={15} aria-hidden="true" />
            <span>{language === 'en' ? 'Add Bed' : 'Lisa peenar'}</span>
          </button>

          {currentBed && (
            <button
              type="button"
              onClick={() => onRequestDeleteBed(currentBed)}
              data-testid="delete_current_bed_btn"
              title={language === 'en' ? 'Delete active bed' : 'Kustuta aktiivne peenar'}
              aria-label={`${language === 'en' ? 'Delete bed' : 'Kustuta peenar'} ${currentBed.name}`}
              style={{
                background: 'none',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                borderRadius: '8px',
                color: 'var(--kulv-danger-text, #8C1D18)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                minWidth: '40px',
                minHeight: '40px'
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {currentBed ? (
            <InteractiveGardenCanvas
              bed={currentBed}
              allPlants={allPlants}
              onPlantInCell={onPlantInCell}
              onRemoveFromCell={onRemoveFromCell}
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
                justifyContent: 'center'
              }}
            >
              <h3
                style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--kulv-text, #2A2E24)' }}
              >
                {language === 'en' ? 'No beds in your garden yet' : 'Aias pole veel ühtegi peenart'}
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  maxWidth: '340px',
                  margin: '0 0 16px 0'
                }}
              >
                {language === 'en'
                  ? 'Add your first raised bed or greenhouse to start placing crops onto the 50cm grid.'
                  : 'Lisa esimene peenar või kasvuhoone, et alustada taimede paigutamist ruudustikule.'}
              </p>
              <button
                type="button"
                onClick={onOpenAddBed}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  minHeight: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--kulv-primary, #4F6B45)',
                  color: 'var(--kulv-button-text, #FFFFFF)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} aria-hidden="true" />
                <span>{language === 'en' ? 'Add Bed' : 'Lisa peenar'}</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
