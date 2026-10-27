import React from 'react';
import { Sheet } from '../ui/Sheet';
import { Button, PrimaryButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GardenEntity, GardenBed } from '../../types';
import {
  RotateCw,
  Lock,
  Unlock,
  Trash2,
  Sprout,
  FlaskConical,
  Grid,
  Droplets,
  Layers
} from 'lucide-react';

export interface BedInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  entity: GardenEntity | null;
  bed?: GardenBed | null;
  onOpenBedDetail?: (bedId: string) => void;
  onOpenSoilRecipes?: (dims: { widthM: number; lengthM: number; heightM: number; label?: string }) => void;
  onRotate?: (id: string, deg: number) => void;
  onToggleLock?: (id: string) => void;
  onDelete?: (id: string) => void;
  language: 'et' | 'en';
}

export const BedInspector: React.FC<BedInspectorProps> = ({
  isOpen,
  onClose,
  entity,
  bed,
  onOpenBedDetail,
  onOpenSoilRecipes,
  onRotate,
  onToggleLock,
  onDelete,
  language
}) => {
  if (!entity) return null;

  const areaM2 = (entity.width * entity.length).toFixed(2);
  const volumeM3 = (entity.width * entity.length * (entity.heightM || 0.4)).toFixed(2);
  const volumeLiters = Math.round(Number(volumeM3) * 1000);

  const categoryLabel = {
    bed: language === 'en' ? 'Garden Bed' : 'Peenar',
    structure: language === 'en' ? 'Structure' : 'Ehitis',
    tree: language === 'en' ? 'Tree' : 'Puu',
    shrub: language === 'en' ? 'Shrub' : 'Põõsas',
    hedge: language === 'en' ? 'Hedge' : 'Hekk',
    path: language === 'en' ? 'Path / Paving' : 'Tee / Sillutis',
    water: language === 'en' ? 'Water Feature' : 'Veesilm',
    furniture: language === 'en' ? 'Outdoor Furniture' : 'Aiamööbel'
  }[entity.category] || entity.category;

  const plantings = bed?.plantings || [];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={entity.name || (language === 'en' ? 'Bed Inspector' : 'Peenra inspektor')}
      description={`${categoryLabel} · ${entity.width}m × ${entity.length}m (${areaM2} m²)`}
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button
            data-testid="inspector_delete_btn"
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
            onClick={() => {
              if (onDelete) onDelete(entity.id);
              onClose();
            }}
          >
            {language === 'en' ? 'Delete' : 'Kustuta'}
          </Button>

          <Button data-testid="inspector_close_btn" variant="secondary" size="sm" onClick={onClose}>
            {language === 'en' ? 'Close' : 'Sulge'}
          </Button>
        </div>
      }
    >
      {/* Metrics Section */}
      <div className="bg-[var(--kulv-surface-muted,#EFE6D4)] p-3.5 rounded-xl border border-[var(--kulv-border,#C9BFA9)] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
          <span>{language === 'en' ? 'Dimensions (W × L × H)' : 'Mõõtmed (L × P × K)'}</span>
          <span className="font-mono font-bold text-[var(--kulv-text,#2A2E24)]">
            {entity.width}m × {entity.length}m × {entity.heightM || 0.4}m
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
          <span>{language === 'en' ? 'Area footprint' : 'Pindala'}</span>
          <span className="font-mono font-bold text-[var(--kulv-text,#2A2E24)]">{areaM2} m²</span>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
          <span>{language === 'en' ? 'Soil volume capacity' : 'Mullamaht'}</span>
          <span className="font-mono font-bold text-[var(--kulv-primary,#4F6B45)]">
            {volumeM3} m³ ({volumeLiters.toLocaleString()} L)
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--kulv-text-muted,#5F675A)]">
          <span>{language === 'en' ? 'Rotation angle' : 'Pöördenurk'}</span>
          <span className="font-mono font-bold text-[var(--kulv-text,#2A2E24)]">{entity.rotation}°</span>
        </div>
      </div>

      {/* Bed Planting Inventory */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--kulv-text,#2A2E24)] m-0 flex items-center gap-1.5">
            <Sprout size={16} className="text-[var(--kulv-primary,#4F6B45)]" />
            <span>{language === 'en' ? 'Planted Crops' : 'Istutatud taimed'}</span>
          </h3>
          <Badge variant="primary">
            {plantings.length} {language === 'en' ? 'plants' : 'taime'}
          </Badge>
        </div>

        {plantings.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[var(--kulv-border,#C9BFA9)] text-center text-xs text-[var(--kulv-text-muted,#5F675A)] bg-[var(--kulv-surface,#FFFDF8)]">
            {language === 'en'
              ? 'This bed has no plantings yet. Open detail grid to place seeds.'
              : 'Selles peenras pole veel taimi. Ava ruudustik seemnete paigutamiseks.'}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {plantings.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--kulv-surface,#FFFDF8)] border border-[var(--kulv-border,#C9BFA9)] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{p.plantIcon || '🌱'}</span>
                  <span className="font-semibold text-[var(--kulv-text,#2A2E24)]">{p.plantName}</span>
                </div>
                <span className="text-[11px] text-[var(--kulv-text-muted,#5F675A)] font-mono">
                  Ruut ({p.gridX + 1}, {p.gridY + 1})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <h3 className="text-xs uppercase font-bold tracking-wider text-[var(--kulv-text-muted,#5F675A)] m-0">
          {language === 'en' ? 'Actions' : 'Toimingud'}
        </h3>

        {onOpenBedDetail && (
          <PrimaryButton
            data-testid="inspector_grid_btn"
            icon={<Grid size={16} />}
            fullWidth
            onClick={() => {
              onOpenBedDetail(entity.id);
              onClose();
            }}
          >
            {language === 'en' ? 'Open Bed Cell Grid' : 'Ava peenra ruudustik'}
          </PrimaryButton>
        )}

        {onOpenSoilRecipes && (
          <Button
            data-testid="inspector_soil_btn"
            variant="secondary"
            icon={<FlaskConical size={16} />}
            fullWidth
            onClick={() => {
              onOpenSoilRecipes({
                widthM: entity.width,
                lengthM: entity.length,
                heightM: entity.heightM || 0.4,
                label: entity.name
              });
              onClose();
            }}
          >
            {language === 'en' ? 'Calculate Soil Recipe' : 'Arvuta mullasegu & retsept'}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          {onRotate && (
            <Button
              data-testid="inspector_rotate_btn"
              variant="secondary"
              icon={<RotateCw size={15} />}
              onClick={() => onRotate(entity.id, 90)}
            >
              {language === 'en' ? 'Rotate 90°' : 'Pööra 90°'}
            </Button>
          )}

          {onToggleLock && (
            <Button
              data-testid="inspector_lock_btn"
              variant="secondary"
              icon={entity.locked ? <Unlock size={15} /> : <Lock size={15} />}
              onClick={() => onToggleLock(entity.id)}
            >
              {entity.locked
                ? language === 'en'
                  ? 'Unlock'
                  : 'Vabasta'
                : language === 'en'
                ? 'Lock'
                : 'Lukusta'}
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
};
