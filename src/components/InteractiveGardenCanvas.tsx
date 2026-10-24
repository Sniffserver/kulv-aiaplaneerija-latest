import React, { useState } from 'react';
import { GardenBed, Plant, BedPlantingCell } from '../types';
import { CompanionEngine, CompanionConflict } from '../logic/companionEngine';
import { CropRotationEngine } from '../logic/cropRotationEngine';
import { useGarden } from '../context/GardenContext';
import { MobileCellSheet } from './MobileCellSheet';

const PlantGrowthProgressChart = React.lazy(() =>
  import('./PlantGrowthProgressChart').then((m) => ({ default: m.PlantGrowthProgressChart }))
);
import {
  Sun,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Trash2,
  Sprout,
  RotateCcw,
  Flame,
  LineChart,
  Scissors,
  Droplets,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface InteractiveGardenCanvasProps {
  bed: GardenBed;
  allPlants: Plant[];
  onPlantInCell: (bedId: string, plant: Plant, gridX: number, gridY: number) => void;
  onRemoveFromCell: (bedId: string, gridX: number, gridY: number) => void;
}

export const InteractiveGardenCanvas: React.FC<InteractiveGardenCanvasProps> = ({
  bed,
  allPlants,
  onPlantInCell,
  onRemoveFromCell
}) => {
  const { addJournalEntry, addTask, language, t } = useGarden();

  const cols = Math.max(3, Math.round(bed.length / 0.5));
  const rows = Math.max(2, Math.round(bed.width / 0.5));

  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(allPlants[0] || null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [inspectingCell, setInspectingCell] = useState<{ x: number; y: number; planting: BedPlantingCell } | null>(
    null
  );
  const [activeCellCoords, setActiveCellCoords] = useState<{ x: number; y: number } | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [showDesktopGrowthChart, setShowDesktopGrowthChart] = useState(false);

  // Overall bed harmony
  const bedHarmony = CompanionEngine.calculateBedHarmony(bed.plantings, allPlants);

  // Suggested companion helpers for the currently selected dock plant
  const suggestedCompanions = React.useMemo(() => {
    if (!selectedPlant) return { good: [], bad: [] };
    return CompanionEngine.getSuggestedCompanions(selectedPlant.id, allPlants);
  }, [selectedPlant, allPlants]);

  const companionConflicts: CompanionConflict[] = CompanionEngine.evaluateBedCompanions(bed.plantings, allPlants);

  const handleDragStart = (e: React.DragEvent, plant: Plant) => {
    e.dataTransfer.setData('text/plain', plant.id);
    setSelectedPlant(plant);
  };

  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    setHoveredCell({ x, y });
  };

  const handleDragLeave = () => {
    setHoveredCell(null);
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    setHoveredCell(null);
    const plantId = e.dataTransfer.getData('text/plain');
    const plant = allPlants.find((p) => p.id === plantId) || selectedPlant;
    if (plant) {
      onPlantInCell(bed.id, plant, x, y);
      setInspectingCell(null);
    }
  };

  const handleCellClick = (x: number, y: number) => {
    setActiveCellCoords({ x, y });
    const planted = bed.plantings.find((p) => p.gridX === x && p.gridY === y);
    if (planted) {
      setInspectingCell({ x, y, planting: planted });
      setIsMobileSheetOpen(true);
    } else {
      // Empty cell clicked: if a plant is already selected in dock, plant directly
      if (selectedPlant) {
        onPlantInCell(bed.id, selectedPlant, x, y);
      } else {
        // Open sheet to pick a plant
        setInspectingCell(null);
        setIsMobileSheetOpen(true);
      }
    }
  };

  // Keyboard navigation support for grid (WCAG 2.1 AA)
  const handleKeyDown = (e: React.KeyboardEvent, x: number, y: number) => {
    let nextX = x;
    let nextY = y;

    if (e.key === 'ArrowRight') {
      nextX = Math.min(cols - 1, x + 1);
    } else if (e.key === 'ArrowLeft') {
      nextX = Math.max(0, x - 1);
    } else if (e.key === 'ArrowDown') {
      nextY = Math.min(rows - 1, y + 1);
    } else if (e.key === 'ArrowUp') {
      nextY = Math.max(0, y - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(x, y);
      return;
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      const planted = bed.plantings.find((p) => p.gridX === x && p.gridY === y);
      if (planted) {
        onRemoveFromCell(bed.id, x, y);
        if (inspectingCell?.x === x && inspectingCell?.y === y) {
          setInspectingCell(null);
          setIsMobileSheetOpen(false);
        }
      }
      return;
    } else {
      return;
    }

    e.preventDefault();
    const nextElem = document.querySelector(`[data-cell-coord="${nextX}-${nextY}"]`) as HTMLElement;
    if (nextElem) {
      nextElem.focus();
    }
  };

  // Quick Action: Log Harvest
  const handleHarvest = (planting: BedPlantingCell, keepPlant: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    addJournalEntry(
      `Saagikoristus: ${planting.plantName}`,
      `Koristatud värske saak peenrast "${bed.name}" (lahter: rida ${planting.gridY + 1}, veerg ${planting.gridX + 1}).`,
      'harvest',
      todayStr
    );
    if (!keepPlant) {
      onRemoveFromCell(bed.id, planting.gridX, planting.gridY);
      setInspectingCell(null);
    }
  };

  // Quick Action: Log Water
  const handleWater = (planting: BedPlantingCell) => {
    const todayStr = new Date().toISOString().split('T')[0];
    addJournalEntry(
      `Kastetud: ${planting.plantName}`,
      `Taime "${planting.plantName}" kastetud peenras "${bed.name}". Muld niisutatud.`,
      'observation',
      todayStr
    );
  };

  // Quick Action: Add Journal Note
  const handleAddJournalNote = (plant: Plant, currentBed: GardenBed) => {
    const todayStr = new Date().toISOString().split('T')[0];
    addJournalEntry(
      `Tähelepanek: ${plant.name}`,
      `Märkus peenra "${currentBed.name}" taime "${plant.name}" kohta.`,
      'observation',
      todayStr
    );
  };

  // Live companion synergy preview if cell is empty and plant is selected
  const activeSynergy =
    hoveredCell && selectedPlant
      ? CompanionEngine.getCellSynergy(hoveredCell.x, hoveredCell.y, selectedPlant, bed.plantings, allPlants)
      : null;

  return (
    <div
      data-testid="interactive_garden_canvas"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%'
      }}
    >
      {/* Bed Header & Controls */}
      <div
        style={{
          backgroundColor: 'var(--kulv-surface, #FFFDF8)',
          border: '1px solid var(--kulv-border, #C9BFA9)',
          borderRadius: '14px',
          padding: '12px 14px',
          boxShadow: 'var(--kulv-shadow-card, 0 1px 2px rgba(0,0,0,0.06))'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div>
            <div
              className="font-serif-display"
              style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
            >
              {bed.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
              Mõõdud: {bed.width} m × {bed.length} m · Ruudustik: {cols} × {rows} lahtrit (50cm ruudud)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Companion Heatmap Toggle */}
            <button
              onClick={() => setHeatmapActive((prev) => !prev)}
              data-testid="toggle_companion_heatmap_btn"
              title="Lülita sisse kaaslastaimede sünergia soojuskaart"
              className="touch-target"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                border: heatmapActive
                  ? '1px solid var(--kulv-primary, #4F6B45)'
                  : '1px solid var(--kulv-border, #C9BFA9)',
                backgroundColor: heatmapActive ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface-muted, #EFE6D4)',
                color: heatmapActive ? 'white' : 'var(--kulv-text, #2A2E24)',
                transition: 'all 0.15s ease'
              }}
            >
              <Flame size={14} color={heatmapActive ? 'white' : 'var(--kulv-accent, #D97A3D)'} />
              <span>Sünergia soojuskaart</span>
              {heatmapActive && <span style={{ fontSize: '10px', opacity: 0.9 }}>· Aktiivne</span>}
            </button>

            {/* Sun hours indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'var(--kulv-accent-soft, #F3D8C2)',
                color: 'var(--kulv-accent, #D97A3D)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <Sun size={14} />
              <span>Päike: {bed.calculatedSunHours}h/p</span>
            </div>
          </div>
        </div>

        {/* Selected Plant Stamp Hint & Synergy preview */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '11px',
            flexWrap: 'wrap',
            gap: '6px'
          }}
        >
          <div style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>
            Vali dokist taim ja puuduta ruudustiku lahtrit. Taimel klõpsates avaneb kiirtoimingute kaart.
          </div>
          {activeSynergy && activeSynergy.status !== 'neutral' && (
            <div
              style={{
                fontWeight: 700,
                color: activeSynergy.status === 'good' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-accent, #D97A3D)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {activeSynergy.status === 'good' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
              <span>{activeSynergy.reason}</span>
            </div>
          )}
        </div>

        {/* Companion Synergy Live Heatmap Overview Bar */}
        {heatmapActive && (
          <div
            style={{
              marginTop: '10px',
              backgroundColor: 'rgba(79, 107, 69, 0.08)',
              border: '1px solid rgba(79, 107, 69, 0.25)',
              borderRadius: '10px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--kulv-primary, #4F6B45)" />
              <div style={{ fontSize: '11px', color: 'var(--kulv-text, #2A2E24)' }}>
                <strong>Peenra harmoonia skoor: {bedHarmony.harmonyPercentage}%</strong> — {bedHarmony.summary}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--kulv-primary, #4F6B45)' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--kulv-primary, #4F6B45)'
                  }}
                />
                <span>Toetav sünergia ({bedHarmony.positivePairs})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--kulv-accent, #D97A3D)' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--kulv-accent, #D97A3D)'
                  }}
                />
                <span>Ebasoodne konflikt ({bedHarmony.negativePairs})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responsive 2-Column Workspace Grid (Mobile stacks, Tablet & Desktop side-by-side) */}
      <div className="garden-workspace-grid">
        {/* Left Column: 2D Soil Grid & Cell Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '16px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--kulv-text-muted, #5F675A)',
                marginBottom: '8px'
              }}
            >
              ↔ Pikkus: {bed.length} m
            </div>

            <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '440px', gap: '8px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--kulv-text-muted, #5F675A)',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)'
                }}
              >
                ↕ {bed.width} m
              </div>

              <div
                role="grid"
                aria-label={`${bed.name} istutusruudustik`}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(93, 64, 55, 0.12)',
                  border: '2px dashed rgba(93, 64, 55, 0.5)',
                  borderRadius: '14px',
                  padding: '10px',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: '8px',
                  minHeight: '160px'
                }}
              >
                {Array.from({ length: rows }).map((_, r) =>
                  Array.from({ length: cols }).map((_, c) => {
                    const planted = bed.plantings.find((p) => p.gridX === c && p.gridY === r);
                    const isHovered = hoveredCell?.x === c && hoveredCell?.y === r;
                    const isInspected = inspectingCell?.x === c && inspectingCell?.y === r;

                    // Evaluate planted cell synergy for live heatmap
                    const cellSynergy = planted
                      ? CompanionEngine.getPlantedCellSynergy(planted, bed.plantings, allPlants)
                      : null;

                    // Determine cell background, border, and shadow cleanly without mixing shorthand 'border' and 'borderColor'
                    let cellBg = isInspected
                      ? 'var(--kulv-accent-soft, #F3D8C2)'
                      : isHovered
                        ? 'rgba(79, 107, 69, 0.35)'
                        : planted
                          ? 'rgba(79, 107, 69, 0.18)'
                          : 'var(--kulv-surface, #FFFDF8)';

                    let cellBorderWidth = isInspected ? '2px' : isHovered ? '2px' : planted ? '1.5px' : '1px';

                    let cellBorderColor = isInspected
                      ? 'var(--kulv-accent, #D97A3D)'
                      : isHovered
                        ? 'var(--kulv-primary, #4F6B45)'
                        : planted
                          ? 'var(--kulv-primary, #4F6B45)'
                          : 'var(--kulv-border, #C9BFA9)';

                    let cellBoxShadow: string | undefined = undefined;

                    // Prospective synergy preview for empty cell
                    if (!planted && isHovered && selectedPlant) {
                      const syn = CompanionEngine.getCellSynergy(c, r, selectedPlant, bed.plantings, allPlants);
                      if (syn.status === 'good') {
                        cellBorderColor = 'var(--kulv-primary, #4F6B45)';
                        cellBorderWidth = '2px';
                        cellBoxShadow = '0 0 0 3px rgba(79, 107, 69, 0.3)';
                      } else if (syn.status === 'bad') {
                        cellBorderColor = 'var(--kulv-accent, #D97A3D)';
                        cellBorderWidth = '2px';
                        cellBoxShadow = '0 0 0 3px rgba(217, 122, 61, 0.3)';
                      }
                    }

                    // Visual styles for heatmap mode
                    if (heatmapActive && planted && cellSynergy) {
                      if (cellSynergy.status === 'positive') {
                        cellBg = 'rgba(79, 107, 69, 0.32)';
                        cellBorderColor = 'var(--kulv-primary, #4F6B45)';
                        cellBorderWidth = '2px';
                        cellBoxShadow = '0 0 10px rgba(79, 107, 69, 0.35)';
                      } else if (cellSynergy.status === 'negative') {
                        cellBg = 'rgba(217, 122, 61, 0.32)';
                        cellBorderColor = 'var(--kulv-accent, #D97A3D)';
                        cellBorderWidth = '2px';
                        cellBoxShadow = '0 0 10px rgba(217, 122, 61, 0.4)';
                      } else if (cellSynergy.status === 'mixed') {
                        cellBg = 'rgba(217, 180, 61, 0.28)';
                        cellBorderColor = '#D9A03D';
                        cellBorderWidth = '2px';
                      }
                    }

                    return (
                      <div
                        key={`cell_${c}_${r}`}
                        role="gridcell"
                        tabIndex={0}
                        data-cell-coord={`${c}-${r}`}
                        data-testid={`canvas_cell_${c}_${r}`}
                        aria-label={`Rida ${r + 1}, veerg ${c + 1}: ${planted ? planted.plantName : 'Tühi muld, valmis istutamiseks'}`}
                        onClick={() => handleCellClick(c, r)}
                        onKeyDown={(e) => handleKeyDown(e, c, r)}
                        onMouseEnter={() => setHoveredCell({ x: c, y: r })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onDragOver={(e) => handleDragOver(e, c, r)}
                        onDrop={(e) => handleDrop(e, c, r)}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '8px',
                          backgroundColor: cellBg,
                          borderWidth: cellBorderWidth,
                          borderStyle: 'solid',
                          borderColor: cellBorderColor,
                          boxShadow: cellBoxShadow,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'all 0.15s ease',
                          outline: 'none'
                        }}
                      >
                        {planted ? (
                          <>
                            <span style={{ fontSize: '22px' }}>{planted.plantIcon}</span>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                color: 'var(--kulv-text, #2A2E24)',
                                marginTop: '2px',
                                maxWidth: '90%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {planted.plantName}
                            </span>

                            {/* Heatmap synergy badge indicator */}
                            {heatmapActive && cellSynergy && cellSynergy.status !== 'neutral' && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: '2px',
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  color: cellSynergy.status === 'positive' ? 'white' : 'white',
                                  backgroundColor:
                                    cellSynergy.status === 'positive'
                                      ? 'var(--kulv-primary, #4F6B45)'
                                      : 'var(--kulv-accent, #D97A3D)',
                                  borderRadius: '6px',
                                  padding: '1px 4px',
                                  lineHeight: 1.2
                                }}
                              >
                                {cellSynergy.status === 'positive' ? `+${cellSynergy.goodCount}` : '!'}
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveFromCell(bed.id, c, r);
                                if (inspectingCell?.x === c && inspectingCell?.y === r) {
                                  setInspectingCell(null);
                                  setIsMobileSheetOpen(false);
                                }
                              }}
                              title="Eemalda taim"
                              aria-label={`Eemalda ${planted.plantName}`}
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: 'var(--kulv-surface, #FFFDF8)',
                                color: 'var(--kulv-danger, #B85C33)',
                                border: '1px solid var(--kulv-border, #C9BFA9)',
                                borderRadius: '50%',
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'center',
                                fontSize: '10px',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <X size={10} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              style={{ color: 'var(--kulv-text-muted, #5F675A)', fontSize: '14px', fontWeight: 600 }}
                            >
                              {isHovered ? 'Istuta!' : '+'}
                            </span>
                            <span style={{ fontSize: '8px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                              {Math.round((bed.width / rows) * 100)}cm
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Desktop Occupied Cell Inspector Card */}
            {inspectingCell && (
              <div
                style={{
                  marginTop: '10px',
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '440px',
                  boxShadow: 'var(--kulv-shadow-card, 0 2px 6px rgba(0,0,0,0.08))'
                }}
              >
                {(() => {
                  const plantInfo = allPlants.find((p) => p.id === inspectingCell.planting.plantId);
                  const familyName = plantInfo?.family || 'Taim';
                  const canonicalFam = CropRotationEngine.normalizeFamily(familyName);

                  return (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '26px' }}>{inspectingCell.planting.plantIcon}</span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                              {inspectingCell.planting.plantName}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                              Sugukond: <strong>{familyName}</strong> · Lahtris ({inspectingCell.x + 1},{' '}
                              {inspectingCell.y + 1})
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setShowDesktopGrowthChart((prev) => !prev)}
                            className="touch-target"
                            title="Vaata Recharts kasvu edenemise graafikut"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: showDesktopGrowthChart
                                ? 'var(--kulv-primary, #4F6B45)'
                                : 'var(--kulv-surface-muted, #EFE6D4)',
                              color: showDesktopGrowthChart ? 'white' : 'var(--kulv-text, #2A2E24)',
                              border: '1px solid var(--kulv-border, #C9BFA9)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <LineChart size={13} />
                            <span>Kasv</span>
                          </button>

                          <button
                            onClick={() => {
                              onRemoveFromCell(bed.id, inspectingCell.x, inspectingCell.y);
                              setInspectingCell(null);
                            }}
                            className="touch-target"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--kulv-accent-soft, #F3D8C2)',
                              color: 'var(--kulv-danger, #B85C33)',
                              border: '1px solid var(--kulv-border, #C9BFA9)',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Eemalda</span>
                          </button>

                          <button
                            onClick={() => setInspectingCell(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--kulv-text-muted, #5F675A)',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Crop rotation notice */}
                      <div
                        style={{
                          backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--kulv-text, #2A2E24)'
                        }}
                      >
                        <RotateCcw size={14} color="var(--kulv-primary, #4F6B45)" />
                        <span>
                          Viljavaheldus ({canonicalFam}): ära istuta samasse kohta järgmisel aastal sama sugukonna
                          liike.
                        </span>
                      </div>

                      {/* Desktop Growth Chart inline preview */}
                      {showDesktopGrowthChart && plantInfo && (
                        <div style={{ marginTop: '4px' }}>
                          <React.Suspense
                            fallback={
                              <div
                                style={{ padding: '12px', fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}
                              >
                                Laadin kasvuprognoosi graafikut...
                              </div>
                            }
                          >
                            <PlantGrowthProgressChart planting={inspectingCell.planting} plant={plantInfo} />
                          </React.Suspense>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Plant Dock & Horticultural Compatibility Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Draggable & Tap-to-Select Plant Tray / Dock */}
          <div
            data-testid="plant_tray_dock"
            style={{
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '14px',
              padding: '12px'
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                Taimede dokk (Puuduta valimiseks või lohista)
              </div>
              {selectedPlant && (
                <div style={{ fontSize: '11px', color: 'var(--kulv-primary, #4F6B45)', fontWeight: 700 }}>
                  Aktiivne: {selectedPlant.name} ({selectedPlant.spacingCm}cm vahe)
                </div>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                gap: '8px',
                maxHeight: '320px',
                overflowY: 'auto',
                padding: '2px'
              }}
            >
              {allPlants.map((plant) => {
                const isSelected = selectedPlant?.id === plant.id;
                return (
                  <div
                    key={plant.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    data-testid={`dock_plant_${plant.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, plant)}
                    onClick={() => setSelectedPlant(plant)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedPlant(plant);
                      }
                    }}
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--kulv-accent-soft, #F3D8C2)'
                        : 'var(--kulv-surface-muted, #EFE6D4)',
                      border: isSelected
                        ? '2px solid var(--kulv-accent, #D97A3D)'
                        : '1px solid var(--kulv-border, #C9BFA9)',
                      borderRadius: '10px',
                      padding: '8px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      userSelect: 'none',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '26px' }}>{plant.icon}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        marginTop: '2px',
                        textAlign: 'center',
                        maxWidth: '64px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--kulv-text, #2A2E24)'
                      }}
                    >
                      {plant.name}
                    </span>
                    <span style={{ fontSize: '8px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                      {plant.spacingCm}cm
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Suggested Companion Quick-Pick Helpers */}
            {selectedPlant && (suggestedCompanions.good.length > 0 || suggestedCompanions.bad.length > 0) && (
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--kulv-surface-muted, #EFE6D4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                  {language === 'en'
                    ? `Companions for ${selectedPlant.name}:`
                    : `Kaaslased taimele ${selectedPlant.name}:`}
                </div>
                {suggestedCompanions.good.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', color: 'var(--kulv-primary, #4F6B45)', fontWeight: 700 }}>
                      ✓ {language === 'en' ? 'Synergies:' : 'Toetavad:'}
                    </span>
                    {suggestedCompanions.good.slice(0, 4).map((gp) => (
                      <button
                        key={gp.id}
                        type="button"
                        onClick={() => setSelectedPlant(gp)}
                        title={language === 'en' ? `Select ${gp.name}` : `Vali ${gp.name}`}
                        style={{
                          backgroundColor: 'rgba(79, 107, 69, 0.12)',
                          color: 'var(--kulv-primary, #4F6B45)',
                          border: '1px solid var(--kulv-primary, #4F6B45)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <span>{gp.icon}</span>
                        <span>{gp.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {suggestedCompanions.bad.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', color: 'var(--kulv-danger, #B85C33)', fontWeight: 700 }}>
                      ✕ {language === 'en' ? 'Avoid:' : 'Väldi kõrval:'}
                    </span>
                    {suggestedCompanions.bad.slice(0, 3).map((bp) => (
                      <span
                        key={bp.id}
                        style={{
                          backgroundColor: 'rgba(184, 92, 51, 0.1)',
                          color: 'var(--kulv-danger, #B85C33)',
                          border: '1px solid var(--kulv-danger, #B85C33)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <span>{bp.icon}</span>
                        <span>{bp.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Companion Plant Compatibility Feedback */}
          {companionConflicts.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                borderRadius: '10px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--kulv-text, #2A2E24)',
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>
                  {language === 'en'
                    ? '🌿 Companion Synergy & Agronomy Insights:'
                    : '🌿 Naabrustaimede sünergia ja botaaniline agronoomia:'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--kulv-text-muted, #5F675A)' }}>
                  {companionConflicts.filter((c) => !c.isHarmful).length} {language === 'en' ? 'synergies' : 'toetavat'}{' '}
                  · {companionConflicts.filter((c) => c.isHarmful).length} {language === 'en' ? 'warnings' : 'hoiatust'}
                </span>
              </div>
              {companionConflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: conflict.isHarmful ? 'rgba(184, 92, 51, 0.08)' : 'rgba(79, 107, 69, 0.08)',
                    border: `1px solid ${conflict.isHarmful ? 'rgba(184, 92, 51, 0.25)' : 'rgba(79, 107, 69, 0.25)'}`
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: conflict.isHarmful ? 'var(--kulv-danger, #B85C33)' : 'var(--kulv-primary, #4F6B45)'
                    }}
                  >
                    {conflict.isHarmful ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                    <span style={{ flex: 1 }}>{conflict.message}</span>
                    {conflict.category && (
                      <span
                        style={{
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: conflict.isHarmful ? 'rgba(184, 92, 51, 0.15)' : 'rgba(79, 107, 69, 0.15)',
                          letterSpacing: '0.4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {conflict.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  {conflict.botanicalReason && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--kulv-text-muted, #5F675A)',
                        paddingLeft: '20px',
                        lineHeight: 1.35
                      }}
                    >
                      💡 {conflict.botanicalReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick-action bottom sheet for mobile cell inspection & harvesting */}
      <MobileCellSheet
        isOpen={isMobileSheetOpen}
        cell={inspectingCell?.planting || null}
        coords={activeCellCoords}
        bed={bed}
        allPlants={allPlants}
        selectedDockPlant={selectedPlant}
        onClose={() => setIsMobileSheetOpen(false)}
        onHarvest={handleHarvest}
        onWater={handleWater}
        onAddJournalNote={handleAddJournalNote}
        onRemove={(cellToRemove) => {
          onRemoveFromCell(bed.id, cellToRemove.gridX, cellToRemove.gridY);
          setInspectingCell(null);
        }}
        onPlantCandidate={(plant, x, y) => {
          onPlantInCell(bed.id, plant, x, y);
        }}
      />
    </div>
  );
};
