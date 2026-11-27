import React from 'react';
import {
  ArchiveRestore,
  Trash2,
  Lock,
  Unlock,
  RotateCw,
  Copy,
  Package,
  Sparkles,
  ExternalLink,
  Info,
  Layers,
  Eye,
  EyeOff,
  Sun
} from 'lucide-react';
import { GardenEntity, GardenBed, Plant, YardLayer } from '../../types';
import { CompanionEngine } from '../../logic/companionEngine';
import { SolarEngine, SunExposureHeatmap } from '../../logic/solarEngine';

interface YardEntityInspectorProps {
  language: 'et' | 'en';
  selectedEntity: GardenEntity | null;
  deletedEntities: GardenEntity[];
  showTrashDrawer: boolean;
  onCloseTrashDrawer: () => void;
  onEmptyTrash: () => void;
  onRestoreEntity: (id: string) => void;
  onPermanentlyDeleteEntity: (id: string) => void;
  onToggleEntityLock: (id: string) => void;
  onRotateSelected: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  beds: GardenBed[];
  plants: Plant[];
  sunHeatmap: SunExposureHeatmap;
  onOpenSoilDialog: (dims: { widthM: number; lengthM: number; heightM: number; label?: string }) => void;
  onSelectBedDetail?: (bedId: string) => void;
  layers: YardLayer[];
  onToggleLayerVisibility: (layerId: string) => void;
  onToggleLayerLock: (layerId: string) => void;
}

export const YardEntityInspector: React.FC<YardEntityInspectorProps> = ({
  language,
  selectedEntity,
  deletedEntities,
  showTrashDrawer,
  onCloseTrashDrawer,
  onEmptyTrash,
  onRestoreEntity,
  onPermanentlyDeleteEntity,
  onToggleEntityLock,
  onRotateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  beds,
  plants,
  sunHeatmap,
  onOpenSoilDialog,
  onSelectBedDetail,
  layers,
  onToggleLayerVisibility,
  onToggleLayerLock
}) => {
  const selectedExposure = selectedEntity ? SolarEngine.getEntitySunExposure(selectedEntity, sunHeatmap) : null;

  const sunCategoryLabel = (cat: string) => {
    if (language === 'en') {
      if (cat === 'full_sun') return 'Full Sun';
      if (cat === 'partial_sun') return 'Partial Sun';
      if (cat === 'partial_shade') return 'Partial Shade';
      return 'Deep Shade';
    }
    if (cat === 'full_sun') return 'Täispäike';
    if (cat === 'partial_sun') return 'Poolpäike';
    if (cat === 'partial_shade') return 'Poolvari';
    return 'Täisvari';
  };

  return (
    <div
      data-testid="yard_entity_inspector"
      className="w-full lg:w-[300px] shrink-0"
      style={{
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflowY: 'auto',
        maxHeight: '560px'
      }}
    >
      {showTrashDrawer ? (
        /* Trash / Soft-deleted Entities Drawer */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
              <ArchiveRestore size={16} color="var(--kulv-accent, #D97A3D)" />
              <span>
                {language === 'en' ? 'Deleted Objects' : 'Kustutatud objektid'} ({deletedEntities.length})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {deletedEntities.length > 0 && (
                <button
                  type="button"
                  onClick={onEmptyTrash}
                  data-testid="empty_trash_btn"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--kulv-danger, #B85C33)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: 'var(--kulv-danger, #B85C33)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title={
                    language === 'en'
                      ? 'Permanently delete all items in trash'
                      : 'Kustuta kõik prügikasti objektid lõplikult'
                  }
                >
                  {language === 'en' ? 'Empty' : 'Tühjenda'}
                </button>
              )}
              <button
                type="button"
                onClick={onCloseTrashDrawer}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '11px',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  cursor: 'pointer'
                }}
              >
                {language === 'en' ? 'Close' : 'Sulge'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
            {deletedEntities.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px',
                  backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{item.icon || '🌱'}</span>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => onRestoreEntity(item.id)}
                    title={language === 'en' ? 'Restore to yard plan' : 'Taasta aia krundiplaanile'}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--kulv-primary, #4F6B45)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {language === 'en' ? 'Restore' : 'Taasta'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPermanentlyDeleteEntity(item.id)}
                    title={language === 'en' ? 'Delete permanently' : 'Kustuta lõplikult'}
                    aria-label={language === 'en' ? 'Delete permanently' : 'Kustuta lõplikult'}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      color: 'var(--kulv-danger, #B85C33)',
                      border: '1px solid var(--kulv-danger, #B85C33)',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selectedEntity ? (
        /* Selected Object Inspector */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ fontSize: '20px' }}>{selectedEntity.icon || '🌱'}</span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--kulv-text, #2A2E24)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {selectedEntity.name}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                  {language === 'en' ? 'Type' : 'Tüüp'}: {selectedEntity.subType}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleEntityLock(selectedEntity.id)}
              data-testid="toggle_entity_lock_btn"
              title={
                selectedEntity.locked
                  ? language === 'en'
                    ? 'Unlock object'
                    : 'Ava objekti lukk'
                  : language === 'en'
                    ? 'Lock object position'
                    : 'Lukusta objekti asukoht'
              }
              aria-label={
                selectedEntity.locked
                  ? language === 'en'
                    ? 'Unlock object'
                    : 'Ava objekti lukk'
                  : language === 'en'
                    ? 'Lock object'
                    : 'Lukusta objekt'
              }
              aria-pressed={Boolean(selectedEntity.locked)}
              style={{
                minWidth: '40px',
                minHeight: '40px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: selectedEntity.locked ? 'rgba(217, 122, 61, 0.14)' : 'var(--kulv-surface-muted, #EFE6D4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedEntity.locked ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-text-muted, #5F675A)'
              }}
            >
              {selectedEntity.locked ? <Lock size={15} /> : <Unlock size={15} />}
            </button>
          </div>

          {/* Coordinates & Dimensions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              padding: '8px',
              borderRadius: '8px',
              fontSize: '11px'
            }}
          >
            <div>
              <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>X: </span>
              <span className="tabular-nums" style={{ fontWeight: 700 }}>
                {selectedEntity.x.toFixed(1)} m
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Y: </span>
              <span className="tabular-nums" style={{ fontWeight: 700 }}>
                {selectedEntity.y.toFixed(1)} m
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>
                {language === 'en' ? 'Size: ' : 'Mõõdud: '}
              </span>
              <span className="tabular-nums" style={{ fontWeight: 700 }}>
                {selectedEntity.width}m × {selectedEntity.length}m
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>
                {language === 'en' ? 'Height: ' : 'Kõrgus: '}
              </span>
              <span className="tabular-nums" style={{ fontWeight: 700 }}>
                {selectedEntity.heightM} m
              </span>
            </div>
          </div>

          {/* Computed Seasonal Sun Exposure Card */}
          {selectedExposure && (
            <div
              data-testid="inspector_sun_exposure_card"
              style={{
                backgroundColor: 'rgba(217, 122, 61, 0.08)',
                border: '1px solid rgba(217, 122, 61, 0.3)',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '11px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
                  <Sun size={13} color="var(--kulv-accent, #D97A3D)" />
                  <span>{language === 'en' ? 'Sun Exposure' : 'Päikesevalgus'}</span>
                </span>
                <span className="tabular-nums" style={{ fontWeight: 800, color: 'var(--kulv-accent, #D97A3D)' }}>
                  {selectedExposure.averageHours.toFixed(1)} h · {sunCategoryLabel(selectedExposure.category)}
                </span>
              </div>
              {selectedEntity.category === 'bed' && (
                <div style={{ fontSize: '10.5px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                  {SolarEngine.evaluateSunScore(selectedExposure.averageHours, 6, language)}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={onRotateSelected}
              disabled={Boolean(selectedEntity.locked)}
              data-testid="rotate_selected_entity_btn"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                minHeight: '40px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                color: 'var(--kulv-text, #2A2E24)',
                cursor: selectedEntity.locked ? 'not-allowed' : 'pointer',
                opacity: selectedEntity.locked ? 0.5 : 1,
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              <RotateCw size={13} />
              <span className="tabular-nums">
                {language === 'en' ? `Rotate (${selectedEntity.rotation}°)` : `Pööra 45° (${selectedEntity.rotation}°)`}
              </span>
            </button>

            <button
              type="button"
              onClick={onDuplicateSelected}
              data-testid="duplicate_selected_entity_btn"
              title={language === 'en' ? 'Duplicate (Ctrl+D)' : 'Duplikeeri (Ctrl+D)'}
              aria-label={language === 'en' ? 'Duplicate' : 'Duplikeeri'}
              style={{
                minWidth: '40px',
                minHeight: '40px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                color: 'var(--kulv-text, #2A2E24)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Copy size={14} />
            </button>

            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={Boolean(selectedEntity.locked)}
              data-testid="delete_selected_entity_btn"
              title={
                language === 'en'
                  ? 'Delete object (can be restored from Trash)'
                  : 'Kustuta objekt (saad hiljem prügikastist taastada)'
              }
              aria-label={language === 'en' ? 'Delete object' : 'Kustuta objekt'}
              style={{
                minWidth: '40px',
                minHeight: '40px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--kulv-danger, #B85C33)',
                backgroundColor: 'transparent',
                color: 'var(--kulv-danger, #B85C33)',
                cursor: selectedEntity.locked ? 'not-allowed' : 'pointer',
                opacity: selectedEntity.locked ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Bed-specific Soil Volume, Companion Harmony, and Quick Bed Drawer CTA */}
          {selectedEntity.category === 'bed' &&
            (() => {
              const matchingBed = beds.find((b) => b.id === selectedEntity.id);
              const bedVolumeL = Math.round(
                selectedEntity.width * selectedEntity.length * (selectedEntity.heightM || 0.4) * 1000
              );
              const bags50L = Math.ceil(bedVolumeL / 50);
              const activePlantings = matchingBed?.plantings || selectedEntity.bedData?.plantings || [];
              const plantedCount = activePlantings.length;
              const harmony =
                plantedCount > 0 && plants.length > 0
                  ? CompanionEngine.calculateBedHarmony(activePlantings, plants, language)
                  : null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div
                    style={{
                      backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--kulv-border, #C9BFA9)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--kulv-text, #2A2E24)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={13} color="var(--kulv-primary, #4F6B45)" />
                        <span>{language === 'en' ? 'Soil Volume & Bags:' : 'Pinnase maht ja kotid:'}</span>
                      </span>
                      <span className="tabular-nums font-mono" style={{ color: 'var(--kulv-primary, #4F6B45)' }}>
                        {bedVolumeL} L
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                      {language === 'en'
                        ? `Requires approx. ~${bags50L} standard 50L soil bags`
                        : `Vajab u ~${bags50L} standardset 50L mullakotti`}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenSoilDialog({
                          widthM: selectedEntity.width,
                          lengthM: selectedEntity.length,
                          heightM: selectedEntity.heightM || 0.4,
                          label: selectedEntity.name
                        })
                      }
                      data-testid="open_bed_soil_recipes_btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        minHeight: '40px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--kulv-primary, #4F6B45)',
                        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                        color: 'var(--kulv-primary, #4F6B45)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                        marginTop: '2px'
                      }}
                    >
                      <Sparkles size={13} />
                      <span>
                        {language === 'en' ? 'Soil Recipe & Bag Calculator' : 'Mullaretsept ja kihiline ehitus'}
                      </span>
                    </button>
                  </div>

                  {harmony ? (
                    <div
                      style={{
                        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--kulv-border, #C9BFA9)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px'
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                          🌿 {language === 'en' ? 'Companion Harmony' : 'Naabrustaimede sünergia'}
                        </span>
                        <span
                          className="tabular-nums"
                          style={{
                            fontWeight: 800,
                            fontSize: '12px',
                            color:
                              harmony.harmonyPercentage >= 80
                                ? 'var(--kulv-primary, #4F6B45)'
                                : harmony.harmonyPercentage >= 50
                                  ? 'var(--kulv-accent, #D97A3D)'
                                  : 'var(--kulv-danger, #B85C33)'
                          }}
                        >
                          {harmony.harmonyPercentage}%
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                        {plantedCount} {language === 'en' ? 'planted cells' : 'külviruutu'} (
                        <span style={{ color: 'var(--kulv-primary, #4F6B45)', fontWeight: 700 }}>
                          +{harmony.positivePairs} {language === 'en' ? 'synergies' : 'toetavat'}
                        </span>
                        {harmony.negativePairs > 0 && (
                          <span style={{ color: 'var(--kulv-danger, #B85C33)', fontWeight: 700, marginLeft: '4px' }}>
                            -{harmony.negativePairs} {language === 'en' ? 'conflicts' : 'hoiatust'}
                          </span>
                        )}
                        )
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--kulv-text-muted, #5F675A)',
                        fontStyle: 'italic',
                        padding: '0 4px'
                      }}
                    >
                      {language === 'en'
                        ? 'This bed is empty. Open the planting drawer to assign crops.'
                        : 'Peenar on tühi. Ava külviplaan taimede paigutamiseks.'}
                    </div>
                  )}

                  {onSelectBedDetail && (
                    <button
                      type="button"
                      onClick={() => onSelectBedDetail(selectedEntity.id)}
                      data-testid="open_bed_planting_cells_btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        minHeight: '40px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--kulv-primary, #4F6B45)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>{language === 'en' ? 'Open Bed Planting Drawer' : 'Ava peenra külviplaan'}</span>
                    </button>
                  )}
                </div>
              );
            })()}
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '8px',
            textAlign: 'center',
            color: 'var(--kulv-text-muted, #5F675A)',
            fontSize: '12px',
            padding: '12px 4px'
          }}
        >
          <Info size={28} color="var(--kulv-primary, #4F6B45)" />
          <div style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
            {language === 'en' ? 'No Object Selected' : 'Objekt valimata'}
          </div>
          <div>
            {language === 'en'
              ? 'Click any building, tree, or garden bed on the 2D plan to inspect its solar exposure and parameters. Double-click a bed to plant.'
              : 'Klõpsa krundiplaanil ehitisel, puul või peenral selle parameetrite ja päikesevalguse nägemiseks. Topeltklõps peenral avab külviplaani.'}
          </div>
        </div>
      )}

      {/* Layers Quick Toggle */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--kulv-border, #C9BFA9)', paddingTop: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 700,
            marginBottom: '6px'
          }}
        >
          <Layers size={13} color="var(--kulv-primary, #4F6B45)" />
          <span>{language === 'en' ? 'Plot Layers' : 'Krundi kihid'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {layers.map((layer) => (
            <div
              key={layer.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                padding: '2px 0'
              }}
            >
              <span>{layer.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => onToggleLayerLock(layer.id)}
                  aria-label={`${layer.locked ? 'Unlock' : 'Lock'} ${layer.name}`}
                  title={
                    layer.locked
                      ? language === 'en'
                        ? 'Unlock layer'
                        : 'Ava kihi lukk'
                      : language === 'en'
                        ? 'Lock layer'
                        : 'Lukusta kiht'
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '3px',
                    color: layer.locked ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-text-muted, #5F675A)'
                  }}
                >
                  {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleLayerVisibility(layer.id)}
                  aria-label={`${layer.visible ? 'Hide' : 'Show'} ${layer.name}`}
                  title={
                    layer.visible
                      ? language === 'en'
                        ? 'Hide layer'
                        : 'Peida kiht'
                      : language === 'en'
                        ? 'Show layer'
                        : 'Näita kihti'
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '3px',
                    color: 'var(--kulv-text-muted, #5F675A)'
                  }}
                >
                  {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
