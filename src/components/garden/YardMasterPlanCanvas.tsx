import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { YardPlan, GardenEntity, Point2D } from '../../types';
import { SolarEngine } from '../../logic/solarEngine';
import { CompanionEngine } from '../../logic/companionEngine';
import { SoilRecipesDialog } from '../dialogs/SoilRecipesDialog';
import { useGarden } from '../../context/GardenContext';
import { EntityPreset, YARD_PLAN_PRESETS, YardPlanPreset } from '../../data/gardenEntityPresets';
import { useYardStore, useYardTemporal } from '../../stores/yardStore';
import { isSimplePolygon } from '../../lib/validation/yardPlanSchema';
import {
  Sun,
  Compass,
  RotateCw,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Layers,
  ChevronRight,
  ExternalLink,
  Info,
  Clock,
  Undo2,
  Redo2,
  ArchiveRestore,
  Magnet,
  MousePointer,
  Pentagon,
  Spline,
  Copy,
  Sparkles,
  AlertTriangle,
  Box,
  LayoutTemplate,
  Check,
  Package,
  Leaf,
  MapPin,
  Printer,
  BookOpen
} from 'lucide-react';
import { CadastralPlotSearchDialog } from '../dialogs/CadastralPlotSearchDialog';
import { GardenBinderPrintDialog } from '../dialogs/GardenBinderPrintDialog';
import {
  findNearestBoundarySegment,
  BoundarySegmentSnapResult,
  checkEntityBoundaryContainment
} from '../../logic/cadastralSnapping';
import { CompanionOverlayLayer } from './CompanionOverlayLayer';
import { CompanionInspectorPanel } from './CompanionInspectorPanel';
import { CompanionLegend } from './CompanionLegend';

interface YardMasterPlanCanvasProps {
  onSelectBedDetail?: (bedId: string) => void;
  onDropPreset?: (preset: EntityPreset, x: number, y: number) => void;
}

export const YardMasterPlanCanvas: React.FC<YardMasterPlanCanvasProps> = ({
  onSelectBedDetail,
  onDropPreset
}) => {
  const { settings, updateYardEntity: syncGardenBed, language, t, beds, plants } = useGarden();

  // Soil recipe modal state
  const [showSoilDialog, setShowSoilDialog] = useState<boolean>(false);
  const [soilDialogDims, setSoilDialogDims] = useState<{ widthM: number; lengthM: number; heightM: number; label?: string } | undefined>(undefined);
  const [presetToConfirm, setPresetToConfirm] = useState<YardPlanPreset | null>(null);
  const [showCadastralDialog, setShowCadastralDialog] = useState<boolean>(false);
  const [showBinderDialog, setShowBinderDialog] = useState<boolean>(false);
  const [activeBoundarySnap, setActiveBoundarySnap] = useState<BoundarySegmentSnapResult | null>(null);

  // Zustand yard store
  const plan = useYardStore((state) => state.plan);
  const setPlan = useYardStore((state) => state.setPlan);
  const addEntity = useYardStore((state) => state.addEntity);
  const moveEntity = useYardStore((state) => state.moveEntity);
  const updateEntity = useYardStore((state) => state.updateEntity);
  const rotateEntity = useYardStore((state) => state.rotateEntity);
  const resizeEntity = useYardStore((state) => state.resizeEntity);
  const deleteEntity = useYardStore((state) => state.deleteEntity);
  const restoreEntity = useYardStore((state) => state.restoreEntity);
  const permanentlyDeleteEntity = useYardStore((state) => state.permanentlyDeleteEntity);
  const emptyTrash = useYardStore((state) => state.emptyTrash);
  const toggleLayerVisibility = useYardStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useYardStore((state) => state.toggleLayerLock);
  const spatialIndex = useYardStore((state) => state.spatialIndex);

  // Undo / Redo temporal middleware hook
  const { undo, redo, canUndo, canRedo } = useYardTemporal();

  // Viewport scale & pan
  const [zoom, setZoom] = useState<number>(24); // pixels per metre
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);

  // Interactive Polygon & Polyline drawing tool state
  const [toolMode, setToolMode] = useState<'select' | 'polygon' | 'polyline'>('select');
  const [drawPoints, setDrawPoints] = useState<Point2D[]>([]);
  const [drawError, setDrawError] = useState<string | null>(null);

  // Magnetic snap visual guide
  const [snapGuide, setSnapGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  // Solar simulation state (hour of day: 7.0 to 21.0)
  const [solarHour, setSolarHour] = useState<number>(14.0); // 14:00 default
  const [isSimulatingSun, setIsSimulatingSun] = useState<boolean>(true);
  const [showTrashDrawer, setShowTrashDrawer] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [presetToast, setPresetToast] = useState<string | null>(null);

  // Companion Intelligence overlay state
  const [showCompanionOverlay, setShowCompanionOverlay] = useState<boolean>(false);
  const [companionFilter, setCompanionFilter] = useState<'all' | 'beneficial' | 'incompatible' | 'uncertain'>('all');

  // Dragging state (with high-performance preview to avoid rebuilding RBush during pointermove)
  const [draggedEntityId, setDraggedEntityId] = useState<string | null>(null);
  const [dragPreviewPos, setDragPreviewPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [entityOrigPos, setEntityOrigPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);

  // Active vs Soft-deleted entities (trash array Variant B + deletedAt fallback)
  const activeEntities = useMemo(() => {
    return plan.entities.filter((e) => !e.deletedAt);
  }, [plan.entities]);

  const deletedEntities = useMemo(() => {
    return [
      ...(plan.trash || []),
      ...plan.entities.filter((e) => Boolean(e.deletedAt))
    ];
  }, [plan.entities, plan.trash]);

  // Yard dimensions
  const yardWidth = plan.widthM || 20;
  const yardLength = plan.lengthM || 30;

  // Selected entity
  const selectedEntity = useMemo(() => {
    return activeEntities.find((e) => e.id === selectedEntityId) || null;
  }, [activeEntities, selectedEntityId]);

  // Finish polygon / polyline drawing
  const finishDrawingShape = useCallback(() => {
    if (toolMode === 'polygon') {
      if (drawPoints.length < 3) {
        setDrawError('Polügoon vajab vähemalt 3 punkti.');
        return;
      }
      if (!isSimplePolygon(drawPoints)) {
        setDrawError('Eneselõikuv polügoon ei ole lubatud. Palun joonista lihtpolügoon.');
        return;
      }
      const xs = drawPoints.map((p) => p.x);
      const ys = drawPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = Math.max(0.4, Math.round((maxX - minX) * 10) / 10);
      const length = Math.max(0.4, Math.round((maxY - minY) * 10) / 10);
      const localPolygon = drawPoints.map((p) => ({
        x: Math.round((p.x - minX) * 100) / 100,
        y: Math.round((p.y - minY) * 100) / 100
      }));
      const now = new Date().toISOString();
      const newPolyEntity: GardenEntity = {
        id: `entity_poly_${Date.now().toString(36)}`,
        name: 'Vabakujuline peenar',
        category: 'bed',
        subType: 'raisedBed',
        icon: '📐',
        x: minX,
        y: minY,
        rotation: 0,
        shapeType: 'polygon',
        width,
        length,
        heightM: 0.35,
        customPolygon: localPolygon,
        shadowCasting: true,
        materialType: 'soil',
        color: '#556B2F',
        zIndex: 20,
        layerId: 'beds',
        locked: false,
        visible: true,
        createdAt: now,
        updatedAt: now
      };
      addEntity(newPolyEntity);
      setSelectedEntityId(newPolyEntity.id);
      setDrawPoints([]);
      setToolMode('select');
      setDrawError(null);
    } else if (toolMode === 'polyline') {
      if (drawPoints.length < 2) {
        setDrawError('Rada vajab vähemalt 2 punkti.');
        return;
      }
      const xs = drawPoints.map((p) => p.x);
      const ys = drawPoints.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = Math.max(0.4, Math.round((maxX - minX) * 10) / 10);
      const length = Math.max(0.4, Math.round((maxY - minY) * 10) / 10);
      const localPoints = drawPoints.map((p) => ({
        x: Math.round((p.x - minX) * 100) / 100,
        y: Math.round((p.y - minY) * 100) / 100
      }));
      const now = new Date().toISOString();
      const newLineEntity: GardenEntity = {
        id: `entity_line_${Date.now().toString(36)}`,
        name: 'Aiatee / rada',
        category: 'path',
        subType: 'gravel_path',
        icon: '🛤️',
        x: minX,
        y: minY,
        rotation: 0,
        shapeType: 'polyline',
        width,
        length,
        heightM: 0.05,
        pathPoints: localPoints,
        pathWidthM: 0.8,
        shadowCasting: false,
        materialType: 'stone',
        color: '#8A857B',
        zIndex: 10,
        layerId: 'infrastructure',
        locked: false,
        visible: true,
        createdAt: now,
        updatedAt: now
      };
      addEntity(newLineEntity);
      setSelectedEntityId(newLineEntity.id);
      setDrawPoints([]);
      setToolMode('select');
      setDrawError(null);
    }
  }, [toolMode, drawPoints, addEntity]);

  // Global Keyboard Shortcuts (Undo, Redo, Delete, Duplicate, Nudge, Tool Switch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
        return;
      }
      // Redo: Ctrl+Y / Cmd+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D or Ctrl+Shift+D (preventDefault blocks browser bookmark modal)
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        if (selectedEntity) {
          const now = new Date().toISOString();
          const clone: GardenEntity = {
            ...selectedEntity,
            id: `entity_clone_${Date.now().toString(36)}`,
            name: `${selectedEntity.name} (koopia)`,
            x: Math.min(yardWidth - selectedEntity.width, selectedEntity.x + 0.5),
            y: Math.min(yardLength - selectedEntity.length, selectedEntity.y + 0.5),
            createdAt: now,
            updatedAt: now
          };
          addEntity(clone);
          setSelectedEntityId(clone.id);
        }
        return;
      }

      // Keyboard shortcuts cheat sheet (? or Shift+/)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // Delete: Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEntity && !selectedEntity.locked) {
          e.preventDefault();
          deleteEntity(selectedEntity.id, true);
          setSelectedEntityId(null);
        }
        return;
      }

      // Rotate: R
      if (e.key.toLowerCase() === 'r') {
        if (selectedEntity && !selectedEntity.locked) {
          e.preventDefault();
          rotateEntity(selectedEntity.id, 45);
        }
        return;
      }

      // Mode shortcuts: V (select), P (polygon)
      if (e.key.toLowerCase() === 'v') {
        setToolMode('select');
        setDrawPoints([]);
        setDrawError(null);
        return;
      }
      if (e.key.toLowerCase() === 'p') {
        setToolMode('polygon');
        setDrawPoints([]);
        setDrawError(null);
        return;
      }

      // Escape: deselect / cancel drawing
      if (e.key === 'Escape') {
        setSelectedEntityId(null);
        setToolMode('select');
        setDrawPoints([]);
        setDrawError(null);
        return;
      }

      // Arrow keys: Nudge selected object (0.1m, Shift+arrow 1.0m)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (selectedEntity && !selectedEntity.locked) {
          e.preventDefault();
          const step = e.shiftKey ? 1.0 : 0.1;
          let nx = selectedEntity.x;
          let ny = selectedEntity.y;
          if (e.key === 'ArrowLeft') nx = Math.max(0, nx - step);
          if (e.key === 'ArrowRight') nx = Math.min(yardWidth - selectedEntity.width, nx + step);
          if (e.key === 'ArrowUp') ny = Math.max(0, ny - step);
          if (e.key === 'ArrowDown') ny = Math.min(yardLength - selectedEntity.length, ny + step);
          moveEntity(selectedEntity.id, Math.round(nx * 10) / 10, Math.round(ny * 10) / 10);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo, selectedEntity, yardWidth, yardLength, addEntity, deleteEntity, rotateEntity, moveEntity]);

  // Sun azimuth & altitude for midsummer (day 172) at local latitude
  const { solarAltitude, solarAzimuth } = useMemo(() => {
    const lat = settings.lat || 59.437;
    const hourDelta = solarHour - 13.25;
    const peakAltitude = SolarEngine.calculateSolarNoonAltitude(lat, 172);
    const altitude = Math.max(5.0, peakAltitude - Math.pow(hourDelta, 2) * 1.05);
    const azimuth = 180 + hourDelta * 15;

    return {
      solarAltitude: altitude,
      solarAzimuth: azimuth
    };
  }, [settings.lat, solarHour]);

  // Convert SVG client mouse point to world metres
  const svgPointToWorld = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (clientX - rect.left - panOffset.x) / zoom;
      const rawY = (clientY - rect.top - panOffset.y) / zoom;

      if (snapToGrid) {
        return {
          x: Math.round(rawX * 2) / 2,
          y: Math.round(rawY * 2) / 2
        };
      }
      return {
        x: Math.round(rawX * 10) / 10,
        y: Math.round(rawY * 10) / 10
      };
    },
    [panOffset, zoom, snapToGrid]
  );

  // Drag handlers
  const handleEntityMouseDown = (e: React.MouseEvent, entity: GardenEntity) => {
    e.stopPropagation();
    if (entity.locked) {
      setSelectedEntityId(entity.id);
      return;
    }

    setSelectedEntityId(entity.id);
    setDraggedEntityId(entity.id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setEntityOrigPos({ x: entity.x, y: entity.y });
  };

  // Unified drag coordinate calculation with grid snap, RBush magnetic snap, and cadastral edge alignment
  const processDragMove = useCallback((clientX: number, clientY: number) => {
    if (!draggedEntityId) return;

    const currentEntity = activeEntities.find((item) => item.id === draggedEntityId);
    if (!currentEntity) return;

    const dxMetres = (clientX - dragStartPos.x) / zoom;
    const dyMetres = (clientY - dragStartPos.y) / zoom;

    let targetX = entityOrigPos.x + dxMetres;
    let targetY = entityOrigPos.y + dyMetres;

    // Grid snap baseline
    if (snapToGrid) {
      targetX = Math.round(targetX * 2) / 2;
      targetY = Math.round(targetY * 2) / 2;
    } else {
      targetX = Math.round(targetX * 10) / 10;
      targetY = Math.round(targetY * 10) / 10;
    }

    // Spatial Index candidate snapping (magnetic edge & center alignment)
    const snapCandidates = spatialIndex.findSnapCandidates(
      targetX,
      targetY,
      currentEntity.width,
      currentEntity.length,
      0.35,
      currentEntity.id
    );

    let guideX: number | null = null;
    let guideY: number | null = null;

    if (snapCandidates.snapX !== null) {
      targetX = snapCandidates.snapX;
      guideX = targetX;
    }
    if (snapCandidates.snapY !== null) {
      targetY = snapCandidates.snapY;
      guideY = targetY;
    }
    setSnapGuide({ x: guideX, y: guideY });

    // Cadastral Boundary Edge Snapping (when property polygon exists)
    if (snapToGrid && plan.boundaryPolygon && plan.boundaryPolygon.length >= 3) {
      const testPoints: Point2D[] = [
        { x: targetX, y: targetY },
        { x: targetX + currentEntity.width, y: targetY },
        { x: targetX + currentEntity.width, y: targetY + currentEntity.length },
        { x: targetX, y: targetY + currentEntity.length },
        { x: targetX + currentEntity.width / 2, y: targetY + currentEntity.length / 2 }
      ];

      let bestSnap: BoundarySegmentSnapResult | null = null;
      let minDistance = Infinity;

      for (const pt of testPoints) {
        const snap = findNearestBoundarySegment(pt, plan.boundaryPolygon, 0.75);
        if (snap && snap.distanceM < minDistance) {
          minDistance = snap.distanceM;
          bestSnap = snap;
        }
      }

      setActiveBoundarySnap(bestSnap);
    } else if (activeBoundarySnap) {
      setActiveBoundarySnap(null);
    }

    // Clamp inside yard boundaries
    targetX = Math.max(0, Math.min(yardWidth - currentEntity.width, targetX));
    targetY = Math.max(0, Math.min(yardLength - currentEntity.length, targetY));

    // High-performance visual preview: DO NOT rebuild spatial index on every pointermove
    setDragPreviewPos({ id: draggedEntityId, x: targetX, y: targetY });
  }, [draggedEntityId, activeEntities, dragStartPos, zoom, entityOrigPos, snapToGrid, spatialIndex, plan.boundaryPolygon, activeBoundarySnap, yardWidth, yardLength]);

  const commitDragEnd = useCallback(() => {
    setActiveBoundarySnap(null);
    if (dragPreviewPos) {
      let finalX = dragPreviewPos.x;
      let finalY = dragPreviewPos.y;
      if (snapToGrid) {
        finalX = Math.round(finalX * 2) / 2;
        finalY = Math.round(finalY * 2) / 2;
      }
      moveEntity(dragPreviewPos.id, finalX, finalY);
      setDragPreviewPos(null);
    }
    setDraggedEntityId(null);
    setSnapGuide({ x: null, y: null });
  }, [dragPreviewPos, moveEntity, snapToGrid]);

  // Touch gesture refs for responsive iPad, iPhone, and Android canvas interaction
  const touchStateRef = useRef<{
    isPinching: boolean;
    initialPinchDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    initialMidpoint: { x: number; y: number };
    touchStartPos: { x: number; y: number };
    isPanningCanvas: boolean;
  }>({
    isPinching: false,
    initialPinchDist: 0,
    initialZoom: 24,
    initialPan: { x: 40, y: 40 },
    initialMidpoint: { x: 0, y: 0 },
    touchStartPos: { x: 0, y: 0 },
    isPanningCanvas: false
  });

  const handleEntityTouchStart = (e: React.TouchEvent, entity: GardenEntity) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setSelectedEntityId(entity.id);
      if (!entity.locked) {
        setDraggedEntityId(entity.id);
        setDragStartPos({ x: touch.clientX, y: touch.clientY });
        setEntityOrigPos({ x: entity.x, y: entity.y });
      }
    }
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two-finger pinch zoom & canvas pan
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;

      // Cancel any ongoing entity drag so pinch takes over cleanly
      if (draggedEntityId) {
        setDraggedEntityId(null);
        setDragPreviewPos(null);
      }

      touchStateRef.current = {
        isPinching: true,
        initialPinchDist: Math.max(10, dist),
        initialZoom: zoom,
        initialPan: { ...panOffset },
        initialMidpoint: { x: midX, y: midY },
        touchStartPos: { x: midX, y: midY },
        isPanningCanvas: false
      };
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (!draggedEntityId) {
        // Single finger touch on empty canvas starts canvas pan
        touchStateRef.current.isPanningCanvas = true;
        touchStateRef.current.touchStartPos = { x: touch.clientX, y: touch.clientY };
        touchStateRef.current.initialPan = { ...panOffset };
      }
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      // Two-finger pinch zoom & pan
      if (e.cancelable) e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const scale = currentDist / touchStateRef.current.initialPinchDist;
      const newZoom = Math.max(12, Math.min(56, Math.round(touchStateRef.current.initialZoom * scale)));

      const currentMidX = (t0.clientX + t1.clientX) / 2;
      const currentMidY = (t0.clientY + t1.clientY) / 2;
      const dMidX = currentMidX - touchStateRef.current.initialMidpoint.x;
      const dMidY = currentMidY - touchStateRef.current.initialMidpoint.y;

      setZoom(newZoom);
      setPanOffset({
        x: Math.round(touchStateRef.current.initialPan.x + dMidX),
        y: Math.round(touchStateRef.current.initialPan.y + dMidY)
      });
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (draggedEntityId) {
        // Dragging an entity
        if (e.cancelable) e.preventDefault();
        processDragMove(touch.clientX, touch.clientY);
      } else if (touchStateRef.current.isPanningCanvas) {
        // Panning canvas on background
        if (e.cancelable) e.preventDefault();
        const dx = touch.clientX - touchStateRef.current.touchStartPos.x;
        const dy = touch.clientY - touchStateRef.current.touchStartPos.y;
        setPanOffset({
          x: Math.round(touchStateRef.current.initialPan.x + dx),
          y: Math.round(touchStateRef.current.initialPan.y + dy)
        });
      }
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      touchStateRef.current.isPinching = false;
      touchStateRef.current.isPanningCanvas = false;
      if (draggedEntityId) {
        commitDragEnd();
      }
    } else if (e.touches.length === 1 && touchStateRef.current.isPinching) {
      touchStateRef.current.isPinching = false;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;

    // 1. RBush Spatial Index Hover Query (sub-millisecond O(log N) lookup)
    if (!draggedEntityId) {
      const rect = svgRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - panOffset.x) / zoom;
      const worldY = (e.clientY - rect.top - panOffset.y) / zoom;
      const hits = spatialIndex.searchPoint(worldX, worldY, 0.35);
      const topHit = hits.find((h) => isLayerVisible(h.layerId));
      setHoveredEntityId(topHit ? topHit.id : null);
      return;
    }

    // 2. Dragging & Snapping calculation
    processDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    commitDragEnd();
  };

  // Drag and drop preset from dock onto canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!onDropPreset) return;
    try {
      const presetDataStr = e.dataTransfer.getData('application/json');
      if (presetDataStr) {
        const preset: EntityPreset = JSON.parse(presetDataStr);
        const pt = svgPointToWorld(e.clientX, e.clientY);
        const x = snapToGrid ? Math.round(pt.x * 2) / 2 : pt.x;
        const y = snapToGrid ? Math.round(pt.y * 2) / 2 : pt.y;
        onDropPreset(preset, Math.max(0, x), Math.max(0, y));
      }
    } catch {
      // ignore
    }
  };

  // Rotate selected entity
  const handleRotateSelected = () => {
    if (!selectedEntity) return;
    rotateEntity(selectedEntity.id, 45);
  };

  // Check layer visibility
  const isLayerVisible = useCallback((layerId?: string) => {
    if (!layerId) return true;
    const layer = plan.layers.find((l) => l.id === layerId);
    return layer ? layer.visible : true;
  }, [plan.layers]);

  // Effective solar azimuth on the plan taking compass north orientation (northAngleDeg) into account
  const effSolarAzimuth = ((solarAzimuth - (plan.northAngleDeg || 0)) % 360 + 360) % 360;

  // Memoized solar shadow projections: depends on [isSimulatingSun, solarAltitude, solarAzimuth, plan.northAngleDeg, activeEntities, dragPreviewPos, zoom, isLayerVisible]
  const renderedShadows = useMemo(() => {
    if (!isSimulatingSun) return [];
    const shadowAngleRad = ((effSolarAzimuth + 180) * Math.PI) / 180;
    const tanAlt = Math.tan((Math.max(10, solarAltitude) * Math.PI) / 180);

    return activeEntities
      .filter((entity) => entity.shadowCasting && isLayerVisible(entity.layerId))
      .map((entity) => {
        const shadowLenM = entity.heightM / tanAlt;
        const dxPx = Math.sin(shadowAngleRad) * shadowLenM * zoom;
        const dyPx = -Math.cos(shadowAngleRad) * shadowLenM * zoom;

        const effX = dragPreviewPos && dragPreviewPos.id === entity.id ? dragPreviewPos.x : entity.x;
        const effY = dragPreviewPos && dragPreviewPos.id === entity.id ? dragPreviewPos.y : entity.y;
        const posX = effX * zoom;
        const posY = effY * zoom;
        const widthPx = entity.width * zoom;
        const lengthPx = entity.length * zoom;

        return {
          id: entity.id,
          shapeType: entity.shapeType,
          foliageOpacity: entity.foliageOpacity,
          posX,
          posY,
          widthPx,
          lengthPx,
          dxPx,
          dyPx,
          shadowLenM,
          effSolarAzimuth
        };
      });
  }, [
    isSimulatingSun,
    solarAltitude,
    solarAzimuth,
    plan.northAngleDeg,
    activeEntities,
    dragPreviewPos,
    zoom,
    isLayerVisible
  ]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'var(--kulv-surface, #FFFDF8)',
        border: '1px solid var(--kulv-border, #C9BFA9)',
        borderRadius: '14px',
        padding: '12px',
        boxShadow: 'var(--kulv-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
        position: 'relative'
      }}
    >
      {/* Top Toolbar: View Controls, Undo/Redo & Solar Simulation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--kulv-border, #C9BFA9)'
        }}
      >
        {/* Left: Undo/Redo, Zoom, Snap, Fit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Undo Button */}
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            data-testid="yard_undo_btn"
            title="Pööra tagasi (Ctrl+Z)"
            aria-label="Pööra tagasi"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: canUndo ? 'var(--kulv-surface-muted, #EFE6D4)' : 'transparent',
              color: canUndo ? 'var(--kulv-text, #2A2E24)' : 'var(--kulv-text-muted, #A0A59C)',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              opacity: canUndo ? 1 : 0.4
            }}
          >
            <Undo2 size={14} />
            <span>Tagasi</span>
          </button>

          {/* Redo Button */}
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            data-testid="yard_redo_btn"
            title="Tee uuesti (Ctrl+Y)"
            aria-label="Tee uuesti"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: canRedo ? 'var(--kulv-surface-muted, #EFE6D4)' : 'transparent',
              color: canRedo ? 'var(--kulv-text, #2A2E24)' : 'var(--kulv-text-muted, #A0A59C)',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              opacity: canRedo ? 1 : 0.4
            }}
          >
            <Redo2 size={14} />
            <span>Uuesti</span>
          </button>

          {/* Keyboard Shortcuts Help Button */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            data-testid="keyboard_shortcuts_btn"
            title="Klaviatuuri kiirklahvid (?)"
            aria-label="Klaviatuuri kiirklahvid"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: showShortcutsModal ? 'rgba(79, 107, 69, 0.15)' : 'var(--kulv-surface-muted, #EFE6D4)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            <span>?</span>
            <span>{language === 'en' ? 'Shortcuts' : 'Otseteed'}</span>
          </button>

          {/* Starter Yard Presets Modal Trigger */}
          <button
            onClick={() => setShowPresetsModal(true)}
            data-testid="starter_presets_btn"
            title={t('action_templates')}
            aria-label={t('action_templates')}
            style={{
              padding: '6px 11px',
              borderRadius: '6px',
              border: '1.5px solid var(--kulv-primary, #4F6B45)',
              backgroundColor: showPresetsModal ? 'var(--kulv-primary, #4F6B45)' : 'rgba(79, 107, 69, 0.12)',
              color: showPresetsModal ? '#FFFFFF' : 'var(--kulv-primary, #4F6B45)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 700,
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutTemplate size={14} />
            <span>{t('action_templates')}</span>
          </button>

          {/* Cadastral / Plot Boundary Search Button */}
          <button
            onClick={() => setShowCadastralDialog(true)}
            data-testid="yard_open_cadastral_search_btn"
            title="Leia oma krunt (katastritunnus ja ametlikud krundipiirid)"
            aria-label="Leia krunt"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 11px',
              borderRadius: '6px',
              border: plan.cadastralCode ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: plan.cadastralCode ? 'rgba(79, 107, 69, 0.12)' : 'var(--kulv-surface-muted, #EFE6D4)',
              color: plan.cadastralCode ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              transition: 'all 0.15s ease'
            }}
          >
            <MapPin size={14} />
            <span>{plan.cadastralCode ? `Krunt: ${plan.cadastralCode}` : (language === 'en' ? 'Find Parcel' : 'Leia krunt')}</span>
          </button>

          {/* High-Resolution Printable Garden Binder Button */}
          <button
            onClick={() => setShowBinderDialog(true)}
            data-testid="yard_open_binder_dialog_btn"
            title="Ava ja trüki aia täisköide (krundipass, peenrad, seltsilised ja kalender)"
            aria-label="Aiamapp"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 11px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={14} />
            <span>{language === 'en' ? 'Binder' : 'Aiamapp'}</span>
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--kulv-border, #C9BFA9)', margin: '0 2px' }} />

          <button
            onClick={() => setZoom((z) => Math.min(48, z + 4))}
            title="Suurenda"
            aria-label="Suurenda"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            <ZoomIn size={14} />
            <span>Suurenda</span>
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(14, z - 4))}
            title="Vähenda"
            aria-label="Vähenda"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            <ZoomOut size={14} />
            <span>Vähenda</span>
          </button>

          <button
            onClick={() => {
              setZoom(22);
              setPanOffset({ x: 30, y: 30 });
            }}
            title="Lähtesta vaade"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Sobita
          </button>

          <button
            onClick={() => setSnapToGrid((s) => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: snapToGrid ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: snapToGrid ? 'rgba(79, 107, 69, 0.15)' : 'transparent',
              color: snapToGrid ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text-muted, #5F675A)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: snapToGrid ? 700 : 500
            }}
          >
            <Magnet size={14} />
            <span>Nakkumine (0.5m)</span>
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--kulv-border, #C9BFA9)', margin: '0 2px' }} />

          {/* Drawing Tool Buttons */}
          <button
            onClick={() => {
              setToolMode('select');
              setDrawPoints([]);
              setDrawError(null);
            }}
            data-testid="tool_select_btn"
            title="Valimistööriist (V)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: toolMode === 'select' ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: toolMode === 'select' ? 'var(--kulv-surface-muted, #EFE6D4)' : 'transparent',
              color: toolMode === 'select' ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: toolMode === 'select' ? 700 : 500
            }}
          >
            <MousePointer size={14} />
            <span>Vali (V)</span>
          </button>

          <button
            onClick={() => {
              setToolMode('polygon');
              setDrawPoints([]);
              setDrawError(null);
              setSelectedEntityId(null);
            }}
            data-testid="tool_polygon_btn"
            title="Vabakujuline polügoon-peenar (P)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: toolMode === 'polygon' ? '1px solid var(--kulv-accent, #D97A3D)' : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: toolMode === 'polygon' ? 'rgba(217, 122, 61, 0.15)' : 'transparent',
              color: toolMode === 'polygon' ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: toolMode === 'polygon' ? 700 : 500
            }}
          >
            <Pentagon size={14} />
            <span>Polügoon (P)</span>
          </button>

          <button
            onClick={() => {
              setToolMode('polyline');
              setDrawPoints([]);
              setDrawError(null);
              setSelectedEntityId(null);
            }}
            data-testid="tool_polyline_btn"
            title="Aiarada / jooneline hekk"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: toolMode === 'polyline' ? '1px solid var(--kulv-accent, #D97A3D)' : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: toolMode === 'polyline' ? 'rgba(217, 122, 61, 0.15)' : 'transparent',
              color: toolMode === 'polyline' ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: toolMode === 'polyline' ? 700 : 500
            }}
          >
            <Spline size={14} />
            <span>Rada / joon</span>
          </button>

          {/* Soft-deleted Trash recovery button */}
          {deletedEntities.length > 0 && (
            <button
              onClick={() => setShowTrashDrawer((prev) => !prev)}
              data-testid="trash_drawer_toggle_btn"
              title="Vaata ja taasta kustutatud objektid"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--kulv-accent, #D97A3D)',
                backgroundColor: showTrashDrawer ? 'rgba(217, 122, 61, 0.15)' : 'transparent',
                color: 'var(--kulv-accent, #D97A3D)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <ArchiveRestore size={14} />
              <span>Prügikast ({deletedEntities.length})</span>
            </button>
          )}

          {/* Switch to 3D View */}
          <button
            onClick={() => useYardStore.getState().setViewMode('3d')}
            data-testid="yard_canvas_3d_toggle_btn"
            title="Lülitu interaktiivsesse 3D aiavaatesse"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--kulv-primary, #4F6B45)',
              backgroundColor: 'rgba(79, 107, 69, 0.1)',
              color: 'var(--kulv-primary, #4F6B45)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            <Box size={14} />
            <span>3D Vaade</span>
          </button>

          {/* Toggleable Companion Intelligence Overlay */}
          <button
            type="button"
            onClick={() => setShowCompanionOverlay((prev) => !prev)}
            data-testid="companion_overlay_toggle_btn"
            title={
              showCompanionOverlay
                ? (language === 'en' ? 'Hide Companion Intelligence Overlay' : 'Peida kaaslastaimede kiht')
                : (language === 'en' ? 'Show Companion Intelligence' : 'Kaaslastaimede sünergia ja seosed')
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: showCompanionOverlay ? '1px solid var(--kulv-primary, #4F6B45)' : '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: showCompanionOverlay ? 'var(--kulv-primary, #4F6B45)' : 'transparent',
              color: showCompanionOverlay ? '#FFFDF8' : 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: showCompanionOverlay ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Leaf size={14} />
            <span>{language === 'en' ? 'Companions' : 'Kaaslased'}</span>
          </button>
        </div>

        {/* Right: Real-time Sun Simulation Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '11px'
          }}
        >
          <Sun size={15} color="var(--kulv-accent, #D97A3D)" />
          <span style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
            Päike ja varjud:
          </span>
          <input
            type="range"
            min="7"
            max="21"
            step="0.5"
            value={solarHour}
            onChange={(e) => setSolarHour(parseFloat(e.target.value))}
            style={{ width: '90px', accentColor: 'var(--kulv-accent, #D97A3D)', cursor: 'pointer' }}
          />
          <span className="tabular-nums" style={{ fontWeight: 800, color: 'var(--kulv-accent, #D97A3D)' }}>
            {Math.floor(solarHour)}:{solarHour % 1 !== 0 ? '30' : '00'}
          </span>
          <span style={{ color: 'var(--kulv-text-muted, #5F675A)', fontSize: '10px' }}>
            ({Math.round(solarAltitude)}° kõrgus)
          </span>
        </div>
      </div>

      {/* Active Drawing Tool Helper Bar */}
      {toolMode !== 'select' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'rgba(217, 122, 61, 0.12)',
            border: '1px solid var(--kulv-accent, #D97A3D)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--kulv-accent, #D97A3D)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pentagon size={15} />
            <span>
              <strong>{toolMode === 'polygon' ? 'Polügooni joonistamine:' : 'Raja joonistamine:'}</strong> Klõpsa krundil punktide märkimiseks ({drawPoints.length} punkti). Topeltklõps lõpetab kujundi.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={finishDrawingShape}
              disabled={toolMode === 'polygon' ? drawPoints.length < 3 : drawPoints.length < 2}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              Lõpeta kujund
            </button>
            <button
              onClick={() => {
                setToolMode('select');
                setDrawPoints([]);
                setDrawError(null);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                color: 'var(--kulv-text-muted, #5F675A)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Tühista
            </button>
          </div>
        </div>
      )}

      {/* Drawing Error Banner */}
      {drawError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(180, 35, 58, 0.1)',
            border: '1px solid var(--kulv-danger, #B4233A)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--kulv-danger, #B4233A)'
          }}
        >
          <AlertTriangle size={15} />
          <span>{drawError}</span>
        </div>
      )}

      {/* Main Layout: Canvas + Right Inspector (Responsive stacking for iPad/iPhone/Android) */}
      <div className="flex flex-col lg:flex-row gap-3 min-h-[520px] relative">
        {/* SVG Interactive Plan Canvas */}
        <div
          data-testid="yard_canvas_touch_wrapper"
          style={{
            flex: 1,
            height: '560px',
            backgroundColor: '#F5F2EB', // Warm grass-field neutral
            borderRadius: '10px',
            border: '1.5px solid var(--kulv-border, #C9BFA9)',
            overflow: 'auto',
            position: 'relative',
            touchAction: 'none',
            cursor: draggedEntityId ? 'grabbing' : 'default'
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchCancel={handleCanvasTouchEnd}
        >
          <svg
            ref={svgRef}
            width={Math.max(800, yardWidth * zoom + panOffset.x * 2)}
            height={Math.max(600, yardLength * zoom + panOffset.y * 2)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
            onTouchCancel={handleCanvasTouchEnd}
            onClick={(e) => {
              if (toolMode !== 'select') {
                const pt = svgPointToWorld(e.clientX, e.clientY);
                setDrawPoints((prev) => [...prev, pt]);
                setDrawError(null);
              } else {
                setSelectedEntityId(null);
              }
            }}
            onDoubleClick={(e) => {
              if (toolMode !== 'select') {
                e.stopPropagation();
                finishDrawingShape();
              }
            }}
            style={{
              userSelect: 'none',
              touchAction: 'none',
              cursor: toolMode !== 'select' ? 'crosshair' : draggedEntityId ? 'grabbing' : 'default'
            }}
          >
            <defs>
              {/* Pattern for 1m and 5m grid */}
              <pattern id="yardGrid1m" width={zoom} height={zoom} patternUnits="userSpaceOnUse">
                <path d={`M ${zoom} 0 L 0 0 0 ${zoom}`} fill="none" stroke="rgba(149, 139, 121, 0.25)" strokeWidth="0.5" />
              </pattern>
              <pattern id="yardGrid5m" width={zoom * 5} height={zoom * 5} patternUnits="userSpaceOnUse">
                <rect width={zoom * 5} height={zoom * 5} fill="url(#yardGrid1m)" />
                <path d={`M ${zoom * 5} 0 L 0 0 0 ${zoom * 5}`} fill="none" stroke="rgba(149, 139, 121, 0.5)" strokeWidth="1.2" />
              </pattern>

              {/* Water texture pattern */}
              <linearGradient id="pondGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4A90A4" />
                <stop offset="100%" stopColor="#2E6F84" />
              </linearGradient>

              {/* Shadow gradient */}
              <linearGradient id="shadowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(30, 40, 30, 0.35)" />
                <stop offset="100%" stopColor="rgba(30, 40, 30, 0.12)" />
              </linearGradient>
            </defs>

            {/* Yard boundary rect */}
            <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
              {/* Green yard base */}
              <rect
                x={0}
                y={0}
                width={yardWidth * zoom}
                height={yardLength * zoom}
                fill="#EDF2E8"
                stroke="#6E7F65"
                strokeWidth={2}
              />

              {/* Grid overlay */}
              <rect
                x={0}
                y={0}
                width={yardWidth * zoom}
                height={yardLength * zoom}
                fill="url(#yardGrid5m)"
                pointerEvents="none"
              />

              {/* Cadastral Boundary Polygon (if present on plan) */}
              {plan.boundaryPolygon && plan.boundaryPolygon.length >= 3 && (
                <g data-testid="cadastral_boundary_group" pointerEvents="none">
                  <polygon
                    points={plan.boundaryPolygon.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
                    fill="rgba(79, 107, 69, 0.12)"
                    stroke="#4F6B45"
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                  />
                  {plan.boundaryPolygon.map((p, idx) => (
                    <circle
                      key={`cadastral_vertex_${idx}`}
                      cx={p.x * zoom}
                      cy={p.y * zoom}
                      r={3.5}
                      fill="#4F6B45"
                      stroke="#FFFDF8"
                      strokeWidth={1.5}
                    />
                  ))}
                  {plan.cadastralCode && (
                    <text
                      x={plan.boundaryPolygon[0].x * zoom + 8}
                      y={plan.boundaryPolygon[0].y * zoom + 18}
                      fill="#385A40"
                      fontSize={11}
                      fontWeight={700}
                    >
                      {`📍 ${plan.cadastralCode}${plan.cadastralAreaM2 ? ` · ${plan.cadastralAreaM2.toLocaleString('et-EE')} m²` : ''}`}
                    </text>
                  )}
                </g>
              )}

              {/* Active Cadastral Boundary Snap Line & Guideline */}
              {activeBoundarySnap && (
                <g data-testid="active_boundary_snap_line" pointerEvents="none">
                  <line
                    x1={activeBoundarySnap.segmentStart.x * zoom}
                    y1={activeBoundarySnap.segmentStart.y * zoom}
                    x2={activeBoundarySnap.segmentEnd.x * zoom}
                    y2={activeBoundarySnap.segmentEnd.y * zoom}
                    stroke="var(--kulv-accent, #D97A3D)"
                    strokeWidth={3}
                    strokeDasharray="5 3"
                  />
                  <circle
                    cx={activeBoundarySnap.snappedPoint.x * zoom}
                    cy={activeBoundarySnap.snappedPoint.y * zoom}
                    r={5}
                    fill="var(--kulv-accent, #D97A3D)"
                    stroke="#FFFDF8"
                    strokeWidth={1.5}
                  />
                </g>
              )}

              {/* Grid scale markers along top & left */}
              {Array.from({ length: Math.floor(yardWidth / 5) + 1 }).map((_, i) => (
                <text
                  key={`scale_x_${i}`}
                  x={i * 5 * zoom}
                  y={-8}
                  fill="var(--kulv-text-muted, #5F675A)"
                  fontSize={10}
                  fontWeight={600}
                  textAnchor="middle"
                >
                  {i * 5}m
                </text>
              ))}

              {Array.from({ length: Math.floor(yardLength / 5) + 1 }).map((_, i) => (
                <text
                  key={`scale_y_${i}`}
                  x={-8}
                  y={i * 5 * zoom + 4}
                  fill="var(--kulv-text-muted, #5F675A)"
                  fontSize={10}
                  fontWeight={600}
                  textAnchor="end"
                >
                  {i * 5}m
                </text>
              ))}

              {/* North Indicator Needle & Sun Direction (turns with northAngleDeg) */}
              <g transform={`translate(${yardWidth * zoom - 34}, 34)`} data-testid="compass_rose">
                <circle r={24} fill="var(--kulv-surface, #FFFDF8)" stroke="var(--kulv-border, #C9BFA9)" strokeWidth={1.5} />
                {/* Sun position indicator rotating according to effective solar azimuth (northAngleDeg aware) */}
                {isSimulatingSun && (
                  <g transform={`rotate(${effSolarAzimuth})`}>
                    <title>{`Päikese suund plaani suhtes (${Math.round(effSolarAzimuth)}°)`}</title>
                    <line x1={0} y1={0} x2={0} y2={-20} stroke="#E5A93C" strokeWidth={1.5} strokeDasharray="2,2" />
                    <circle cx={0} cy={-20} r={4.5} fill="#F4B942" stroke="#B87320" strokeWidth={1} />
                  </g>
                )}
                {/* Compass needle rotating with -plan.northAngleDeg */}
                <g transform={`rotate(${-plan.northAngleDeg})`}>
                  <title>{`Põhjasuund (${plan.northAngleDeg}°)`}</title>
                  <polygon points="0,-18 5,0 -5,0" fill="#B4233A" />
                  <polygon points="0,18 5,0 -5,0" fill="#6B705C" />
                  <text y={-8} fill="white" fontSize={8} fontWeight={800} textAnchor="middle">
                    N
                  </text>
                </g>
              </g>

              {/* 1. RENDER SHADOWS (Ground shadow projection using memoized renderedShadows) */}
              {isSimulatingSun &&
                renderedShadows.map((s) => (
                  <g
                    key={`shadow_${s.id}`}
                    transform={`translate(${s.posX}, ${s.posY})`}
                    pointerEvents="none"
                    opacity={s.foliageOpacity ? 0.35 : 0.45}
                  >
                    {s.shapeType === 'circle' ? (
                      <ellipse
                        cx={s.widthPx / 2 + s.dxPx}
                        cy={s.lengthPx / 2 + s.dyPx}
                        rx={s.widthPx / 2 + s.shadowLenM * zoom * 0.4}
                        ry={s.lengthPx / 2}
                        transform={`rotate(${s.effSolarAzimuth}, ${s.widthPx / 2 + s.dxPx}, ${s.lengthPx / 2 + s.dyPx})`}
                        fill="rgba(25, 35, 20, 0.22)"
                      />
                    ) : (
                      <polygon
                        points={`
                          0,0
                          ${s.widthPx},0
                          ${s.widthPx + s.dxPx},${s.dyPx}
                          ${s.widthPx + s.dxPx},${s.lengthPx + s.dyPx}
                          ${s.dxPx},${s.lengthPx + s.dyPx}
                          0,${s.lengthPx}
                        `}
                        fill="rgba(25, 35, 20, 0.22)"
                      />
                    )}
                  </g>
                ))}

              {/* 2. RENDER ACTIVE ENTITIES */}
              {activeEntities.map((entity) => {
                if (!isLayerVisible(entity.layerId)) return null;

                const isSelected = selectedEntityId === entity.id;
                const isHovered = hoveredEntityId === entity.id;
                const effX = dragPreviewPos && dragPreviewPos.id === entity.id ? dragPreviewPos.x : entity.x;
                const effY = dragPreviewPos && dragPreviewPos.id === entity.id ? dragPreviewPos.y : entity.y;
                const widthPx = entity.width * zoom;
                const lengthPx = entity.length * zoom;
                const posX = effX * zoom;
                const posY = effY * zoom;

                const boundaryStatus = plan.boundaryPolygon && plan.boundaryPolygon.length >= 3
                  ? checkEntityBoundaryContainment(effX, effY, entity.width, entity.length, plan.boundaryPolygon)
                  : { isFullyInside: true, isPartiallyOutside: false };

                return (
                  <g
                    key={entity.id}
                    data-testid={`yard_entity_${entity.id}`}
                    transform={`translate(${posX}, ${posY}) rotate(${entity.rotation}, ${widthPx / 2}, ${lengthPx / 2})`}
                    onMouseDown={(e) => handleEntityMouseDown(e, entity)}
                    onTouchStart={(e) => handleEntityTouchStart(e, entity)}
                    style={{ cursor: entity.locked ? 'pointer' : 'grab', touchAction: 'none' }}
                  >
                    {/* Gentle boundary crossing dashed indicator (free placement allowed everywhere) */}
                    {boundaryStatus.isPartiallyOutside && (
                      <rect
                        x={-2}
                        y={-2}
                        width={widthPx + 4}
                        height={lengthPx + 4}
                        fill="none"
                        stroke="#E5A93C"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                        rx={3}
                        pointerEvents="none"
                      />
                    )}
                    {/* Polygon Shapes */}
                    {entity.shapeType === 'polygon' && entity.customPolygon && entity.customPolygon.length >= 3 ? (
                      <g>
                        <polygon
                          points={entity.customPolygon.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
                          fill={entity.color || '#556B2F'}
                          stroke={isSelected ? 'var(--kulv-accent, #D97A3D)' : isHovered ? 'var(--kulv-primary, #4F6B45)' : '#33442C'}
                          strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.5}
                        />
                      </g>
                    ) : entity.shapeType === 'polyline' && entity.pathPoints && entity.pathPoints.length >= 2 ? (
                      /* Polyline Shapes (Paths, Hedges, Fences) */
                      <g>
                        <polyline
                          points={entity.pathPoints.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
                          fill="none"
                          stroke={entity.color || '#8A857B'}
                          strokeWidth={Math.max(4, (entity.pathWidthM || 0.8) * zoom)}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={isSelected ? '6 3' : undefined}
                        />
                      </g>
                    ) : entity.shapeType === 'circle' ? (
                      /* Circle Shapes (Trees, Ponds, Wells) */
                      <g>
                        <circle
                          cx={widthPx / 2}
                          cy={lengthPx / 2}
                          r={Math.min(widthPx, lengthPx) / 2}
                          fill={entity.category === 'water' ? 'url(#pondGradient)' : entity.color}
                          stroke={isSelected ? 'var(--kulv-accent, #D97A3D)' : isHovered ? 'var(--kulv-primary, #4F6B45)' : '#33442C'}
                          strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.5}
                        />

                        {entity.category === 'tree' && (
                          <circle
                            cx={widthPx / 2}
                            cy={lengthPx / 2}
                            r={Math.max(3, zoom * 0.2)}
                            fill="#5A3D28"
                          />
                        )}
                      </g>
                    ) : (
                      /* Rectangle Shapes (Houses, Beds, Sheds, Paths) */
                      <g>
                        <rect
                          width={widthPx}
                          height={lengthPx}
                          rx={entity.category === 'bed' ? 4 : 2}
                          fill={entity.color}
                          stroke={isSelected ? 'var(--kulv-accent, #D97A3D)' : isHovered ? 'var(--kulv-primary, #4F6B45)' : '#33442C'}
                          strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.5}
                        />

                        {entity.category === 'bed' && (
                          <rect
                            x={3}
                            y={3}
                            width={Math.max(2, widthPx - 6)}
                            height={Math.max(2, lengthPx - 6)}
                            fill="#4A3B32"
                            opacity={0.8}
                          />
                        )}

                        {entity.category === 'structure' && entity.subType === 'dwelling_house' && (
                          <line
                            x1={widthPx / 2}
                            y1={0}
                            x2={widthPx / 2}
                            y2={lengthPx}
                            stroke="rgba(255,255,255,0.4)"
                            strokeWidth={2}
                          />
                        )}
                      </g>
                    )}

                    {/* Icon & Label */}
                    <text
                      x={widthPx / 2}
                      y={lengthPx / 2 + 4}
                      textAnchor="middle"
                      fontSize={Math.max(12, Math.min(22, zoom * 0.7))}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {entity.icon || '🌱'}
                    </text>

                    {/* Name label badge if large enough */}
                    {zoom >= 18 && (
                      <text
                        x={widthPx / 2}
                        y={lengthPx + 12}
                        textAnchor="middle"
                        fill="var(--kulv-text, #2A2E24)"
                        fontSize={9}
                        fontWeight={700}
                        style={{ pointerEvents: 'none' }}
                      >
                        {entity.name}
                      </text>
                    )}

                    {/* Selection bounding box handles */}
                    {isSelected && (
                      <rect
                        x={-3}
                        y={-3}
                        width={widthPx + 6}
                        height={lengthPx + 6}
                        fill="none"
                        stroke="var(--kulv-accent, #D97A3D)"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              })}

              {/* Toggleable Companion Intelligence Overlay Layer */}
              {showCompanionOverlay && (
                <CompanionOverlayLayer
                  entities={activeEntities}
                  selectedEntityId={selectedEntityId}
                  hoveredEntityId={hoveredEntityId}
                  zoom={zoom}
                  allPlants={plants || []}
                  language={language}
                  filter={companionFilter}
                  onSelectEntity={(id) => setSelectedEntityId(id)}
                />
              )}

              {/* In-progress interactive drawing preview */}
              {toolMode !== 'select' && drawPoints.length > 0 && (
                <g pointerEvents="none">
                  {toolMode === 'polygon' && drawPoints.length >= 3 && (
                    <polygon
                      points={drawPoints.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
                      fill="rgba(217, 122, 61, 0.2)"
                      stroke="var(--kulv-accent, #D97A3D)"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                    />
                  )}
                  <polyline
                    points={drawPoints.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
                    fill="none"
                    stroke="var(--kulv-accent, #D97A3D)"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                  />
                  {drawPoints.map((p, idx) => (
                    <circle
                      key={`draw_pt_${idx}`}
                      cx={p.x * zoom}
                      cy={p.y * zoom}
                      r={5}
                      fill="var(--kulv-accent, #D97A3D)"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                  ))}
                </g>
              )}

              {/* Magnetic Alignment Snap Guidelines & Crosshair */}
              {snapGuide.x !== null && (
                <line
                  x1={snapGuide.x * zoom}
                  y1={0}
                  x2={snapGuide.x * zoom}
                  y2={yardLength * zoom}
                  stroke="var(--kulv-accent, #D97A3D)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  pointerEvents="none"
                />
              )}
              {snapGuide.y !== null && (
                <line
                  x1={0}
                  y1={snapGuide.y * zoom}
                  x2={yardWidth * zoom}
                  y2={snapGuide.y * zoom}
                  stroke="var(--kulv-accent, #D97A3D)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  pointerEvents="none"
                />
              )}
              {snapGuide.x !== null && snapGuide.y !== null && (
                <g transform={`translate(${snapGuide.x * zoom}, ${snapGuide.y * zoom})`} pointerEvents="none">
                  <circle r={6} fill="none" stroke="var(--kulv-accent, #D97A3D)" strokeWidth={1.5} />
                  <line x1={-8} y1={0} x2={8} y2={0} stroke="var(--kulv-accent, #D97A3D)" strokeWidth={1.5} />
                  <line x1={0} y1={-8} x2={0} y2={8} stroke="var(--kulv-accent, #D97A3D)" strokeWidth={1.5} />
                </g>
              )}
            </g>
          </svg>

          {/* Contextual Companion Intelligence Inspector Panel */}
          {showCompanionOverlay && (
            <>
              <CompanionInspectorPanel
                selectedEntity={selectedEntity}
                allEntities={activeEntities}
                allPlants={plants || []}
                language={language}
                filter={companionFilter}
                onFilterChange={setCompanionFilter}
                onClose={() => setShowCompanionOverlay(false)}
                onSelectEntity={(id) => setSelectedEntityId(id)}
              />
              <CompanionLegend language={language} visible={showCompanionOverlay} />
            </>
          )}

          {/* Always-visible Ground Distance Scale Bar */}
          <div
            data-testid="canvas_scale_bar"
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              backgroundColor: 'rgba(255, 253, 248, 0.94)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '6px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              pointerEvents: 'none',
              zIndex: 5,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}
          >
            <div
              style={{
                width: `${Math.round(5 * zoom)}px`,
                height: '4px',
                backgroundColor: 'var(--kulv-primary, #4F6B45)',
                borderRadius: '2px',
                position: 'relative'
              }}
            >
              <div style={{ position: 'absolute', left: 0, top: '-3px', width: '2px', height: '10px', backgroundColor: 'var(--kulv-primary, #4F6B45)' }} />
              <div style={{ position: 'absolute', right: 0, top: '-3px', width: '2px', height: '10px', backgroundColor: 'var(--kulv-primary, #4F6B45)' }} />
            </div>
            <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
              5 m
            </span>
          </div>

          {/* Active Cadastral Parcel Badge (Top Left of Canvas) */}
          {plan.cadastralCode && (
            <div
              data-testid="canvas_cadastral_badge"
              onClick={() => setShowCadastralDialog(true)}
              title="Vaata ja muuda krundipiire"
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'rgba(255, 253, 248, 0.95)',
                border: '1px solid var(--kulv-primary, #4F6B45)',
                borderRadius: '6px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--kulv-primary, #4F6B45)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                zIndex: 5
              }}
            >
              <MapPin size={13} />
              <span>{plan.address || plan.cadastralCode}</span>
              {plan.cadastralAreaM2 && (
                <span style={{ color: 'var(--kulv-text-muted, #5F675A)', fontWeight: 500 }}>
                  · {plan.cadastralAreaM2.toLocaleString('et-EE')} m²
                </span>
              )}
            </div>
          )}

          {/* Empty State Overlay */}
          {activeEntities.length === 0 && (
            <div
              data-testid="empty_yard_plan_overlay"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 253, 248, 0.95)',
                border: '1.5px dashed var(--kulv-primary, #4F6B45)',
                borderRadius: '12px',
                padding: '24px 32px',
                textAlign: 'center',
                maxWidth: '420px',
                boxShadow: 'var(--kulv-shadow-card, 0 4px 16px rgba(0,0,0,0.08))',
                pointerEvents: 'none',
                zIndex: 4
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌱</div>
              <div className="font-serif-display" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)', marginBottom: '4px' }}>
                Alusta siit — lohista peenar krundile
              </div>
              <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', lineHeight: 1.5 }}>
                Lohista peenar, kasvuhoone või viljapuu allolevast dokist otse aia krundile.
              </div>
            </div>
          )}

          {/* Mobile Touch Quick Controls (Floating bottom-left dock with 44x44px touch targets) */}
          <div
            data-testid="canvas_mobile_touch_dock"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 253, 248, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              zIndex: 6
            }}
          >
            <button
              onClick={() => setZoom((z) => Math.min(56, z + 4))}
              title="Suurenda vaadet (+)"
              aria-label="Suurenda"
              style={{
                width: '40px',
                height: '40px',
                minWidth: '40px',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                color: 'var(--kulv-text, #2A2E24)',
                cursor: 'pointer'
              }}
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(12, z - 4))}
              title="Vähenda vaadet (-)"
              aria-label="Vähenda"
              style={{
                width: '40px',
                height: '40px',
                minWidth: '40px',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                color: 'var(--kulv-text, #2A2E24)',
                cursor: 'pointer'
              }}
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => {
                setZoom(22);
                setPanOffset({ x: 30, y: 30 });
              }}
              title="Sobita vaade krundile"
              aria-label="Sobita"
              style={{
                padding: '0 10px',
                height: '40px',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                borderRadius: '8px',
                backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                color: 'var(--kulv-text, #2A2E24)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Maximize2 size={16} />
              <span className="hidden sm:inline">Sobita</span>
            </button>

            {/* Quick action controls when an entity is selected */}
            {selectedEntity && (
              <>
                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--kulv-border, #C9BFA9)', margin: '0 2px' }} />
                {!selectedEntity.locked && (
                  <button
                    onClick={handleRotateSelected}
                    title="Pööra 45°"
                    aria-label="Pööra"
                    style={{
                      width: '40px',
                      height: '40px',
                      minWidth: '40px',
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(217, 122, 61, 0.15)',
                      border: '1px solid var(--kulv-accent, #D97A3D)',
                      color: 'var(--kulv-accent, #D97A3D)',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCw size={18} />
                  </button>
                )}
                {!selectedEntity.locked && (
                  <button
                    onClick={() => {
                      deleteEntity(selectedEntity.id, true);
                      setSelectedEntityId(null);
                    }}
                    title="Kustuta valitud objekt"
                    aria-label="Kustuta"
                    style={{
                      width: '40px',
                      height: '40px',
                      minWidth: '40px',
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(180, 35, 58, 0.12)',
                      border: '1px solid var(--kulv-danger, #B4233A)',
                      color: 'var(--kulv-danger, #B4233A)',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Inspector & Layer Control Panel */}
        <div
          data-testid="yard_entity_inspector"
          className="w-full lg:w-[290px] shrink-0"
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
                  <span>Kustutatud objektid ({deletedEntities.length})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {deletedEntities.length > 0 && (
                    <button
                      onClick={emptyTrash}
                      data-testid="empty_trash_btn"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--kulv-danger, #B85C33)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: 'var(--kulv-danger, #B85C33)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                      title="Kustuta kõik prügikasti objektid lõplikult"
                    >
                      Tühjenda
                    </button>
                  )}
                  <button
                    onClick={() => setShowTrashDrawer(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '11px',
                      color: 'var(--kulv-text-muted, #5F675A)',
                      cursor: 'pointer'
                    }}
                  >
                    Sulge
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
                        onClick={() => restoreEntity(item.id)}
                        title="Taasta aia krundiplaanile"
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
                        Taasta
                      </button>
                      <button
                        onClick={() => permanentlyDeleteEntity(item.id)}
                        title="Kustuta lõplikult"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '20px' }}>{selectedEntity.icon || '🌱'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--kulv-text, #2A2E24)' }}>
                      {selectedEntity.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                      Tüüp: {selectedEntity.subType}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleLayerLock(selectedEntity.layerId || 'structures')}
                  title={selectedEntity.locked ? 'Objekt on lukustatud' : 'Lukusta objekt'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: selectedEntity.locked ? 'var(--kulv-accent, #D97A3D)' : 'var(--kulv-text-muted, #5F675A)'
                  }}
                >
                  {selectedEntity.locked ? <Lock size={16} /> : <Unlock size={16} />}
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
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              >
                <div>
                  <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Asukoht X: </span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
                    {selectedEntity.x.toFixed(1)} m
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Asukoht Y: </span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
                    {selectedEntity.y.toFixed(1)} m
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>Mõõtmed: </span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
                    {selectedEntity.width}m × {selectedEntity.length}m
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--kulv-text-muted, #5F675A)' }}>3D Kõrgus: </span>
                  <span className="tabular-nums" style={{ fontWeight: 700 }}>
                    {selectedEntity.heightM} m
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleRotateSelected}
                  data-testid="rotate_selected_entity_btn"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--kulv-border, #C9BFA9)',
                    backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                    color: 'var(--kulv-text, #2A2E24)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  <RotateCw size={13} />
                  <span>Pööra 45° ({selectedEntity.rotation}°)</span>
                </button>

                <button
                  onClick={() => {
                    deleteEntity(selectedEntity.id, true);
                    setSelectedEntityId(null);
                  }}
                  data-testid="delete_selected_entity_btn"
                  title="Kustuta objekt (saad hiljem prügikastist taastada)"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--kulv-danger, #B85C33)',
                    backgroundColor: 'transparent',
                    color: 'var(--kulv-danger, #B85C33)',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* If it's a bed, provide agronomy calculations, companion harmony, and drill-down into planting cells */}
              {selectedEntity.category === 'bed' && (() => {
                const matchingBed = beds?.find((b) => b.id === selectedEntity.id);
                const bedVolumeL = Math.round(
                  selectedEntity.width * selectedEntity.length * (selectedEntity.heightM || 0.4) * 1000
                );
                const bags50L = Math.ceil(bedVolumeL / 50);
                const activePlantings =
                  matchingBed?.plantings || selectedEntity.bedData?.plantings || [];
                const plantedCount = activePlantings.length;
                const harmony =
                  plantedCount > 0 && plants
                    ? CompanionEngine.calculateBedHarmony(activePlantings, plants, language)
                    : null;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    {/* Soil & Volume Card */}
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
                        <span className="font-mono" style={{ color: 'var(--kulv-primary, #4F6B45)' }}>
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
                        onClick={() => {
                          setSoilDialogDims({
                            widthM: selectedEntity.width,
                            lengthM: selectedEntity.length,
                            heightM: selectedEntity.heightM || 0.4,
                            label: selectedEntity.name
                          });
                          setShowSoilDialog(true);
                        }}
                        data-testid="open_bed_soil_recipes_btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
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
                          {language === 'en'
                            ? 'Soil Recipe & Bag Calculator'
                            : 'Mullaretsept ja kihiline ehitus'}
                        </span>
                      </button>
                    </div>

                    {/* Companion Plant Harmony Card (if bed has plantings) */}
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
                        <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                          {plantedCount}{' '}
                          {language === 'en' ? 'planted cells' : 'külviruutu'} (
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
                      matchingBed && (
                        <div style={{ fontSize: '10px', color: 'var(--kulv-text-muted, #5F675A)', fontStyle: 'italic', padding: '0 4px' }}>
                          {language === 'en'
                            ? 'Peenar on tühi. Ava külviplaan taimede paigutamiseks.'
                            : 'Peenar on tühi. Ava külviplaan taimede paigutamiseks.'}
                        </div>
                      )
                    )}

                    {onSelectBedDetail && (
                      <button
                        onClick={() => onSelectBedDetail(selectedEntity.id)}
                        data-testid="open_bed_planting_cells_btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 12px',
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
                        <span>{language === 'en' ? 'Open Bed Planting Grid' : 'Ava peenra külviplaan'}</span>
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
                fontSize: '12px'
              }}
            >
              <Info size={28} color="var(--kulv-primary, #4F6B45)" />
              <div style={{ fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>Objekt valimata</div>
              <div>Klõpsa krundiplaanil mõnel ehitisel, puul või peenral selle asukoha ja parameetrite muutmiseks.</div>
            </div>
          )}

          {/* Layers Quick Toggle */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--kulv-border, #C9BFA9)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
              <Layers size={13} color="var(--kulv-primary, #4F6B45)" />
              <span>Krundi kihid:</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {plan.layers.map((layer) => (
                <div
                  key={layer.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px'
                  }}
                >
                  <span>{layer.name}</span>
                  <button
                    onClick={() => toggleLayerVisibility(layer.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kulv-text-muted, #5F675A)' }}
                  >
                    {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          data-testid="shortcuts_modal_overlay"
          onClick={() => setShowShortcutsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '12px',
              padding: '20px 24px',
              maxWidth: '460px',
              width: '90%',
              boxShadow: 'var(--kulv-shadow-card, 0 8px 32px rgba(0,0,0,0.18))'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                Klaviatuuri kiirklahvid
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--kulv-text-muted, #5F675A)'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>V</kbd> Vali tööriist</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>P</kbd> Polügoon-peenar</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>R</kbd> Pööra 45°</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Del / Backspace</kbd> Kustuta</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Ctrl+Shift+D</kbd> Duplikeeri</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Cmd+D</kbd> Duplikeeri (Mac)</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Ctrl+Z</kbd> Tagasi (Undo)</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Ctrl+Y</kbd> Uuesti (Redo)</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Noolenupud</kbd> Nihuta 0.1m</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Shift+Nool</kbd> Nihuta 1.0m</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Esc</kbd> Tühista valik</div>
              <div><kbd style={{ backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>?</kbd> Otseteede spikker</div>
            </div>
          </div>
        </div>
      )}

      {/* Starter Yard Presets Modal */}
      {showPresetsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('template_modal_title')}
          onClick={() => setShowPresetsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '760px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--kulv-shadow-card, 0 10px 36px rgba(0,0,0,0.22))',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3
                  className="font-serif-display"
                  style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
                >
                  {t('template_modal_title')}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', marginTop: '2px' }}>
                  {t('template_modal_desc')}
                </div>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                aria-label={t('btn_close')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--kulv-text-muted, #5F675A)',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {YARD_PLAN_PRESETS.map((preset) => {
                const title = language === 'en' ? preset.nameEn : preset.name;
                const desc = language === 'en' ? preset.descriptionEn : preset.description;
                const bedCount = preset.entities.filter((e) => e.category === 'bed').length;
                const treeCount = preset.entities.filter((e) => e.category === 'tree' || e.category === 'shrub').length;
                const structCount = preset.entities.filter((e) => e.category === 'structure').length;

                return (
                  <div
                    key={preset.id}
                    style={{
                      border: '1px solid var(--kulv-border, #C9BFA9)',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '24px' }}>{preset.icon}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}>
                            {title}
                          </h4>
                          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--kulv-primary, #4F6B45)', fontWeight: 600 }}>
                            {preset.widthM}m × {preset.lengthM}m ({preset.widthM * preset.lengthM} m²)
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: '6px 0', fontSize: '12px', color: 'var(--kulv-text-muted, #5F675A)', lineHeight: 1.4 }}>
                        {desc}
                      </p>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px', marginTop: '8px', color: 'var(--kulv-text, #2A2E24)' }}>
                        <span style={{ backgroundColor: 'var(--kulv-surface, #FFFDF8)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--kulv-border, #C9BFA9)' }}>
                          🪵 {bedCount} {language === 'en' ? 'beds' : 'peenart'}
                        </span>
                        <span style={{ backgroundColor: 'var(--kulv-surface, #FFFDF8)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--kulv-border, #C9BFA9)' }}>
                          🌳 {treeCount} {language === 'en' ? 'trees' : 'puud/põõsast'}
                        </span>
                        <span style={{ backgroundColor: 'var(--kulv-surface, #FFFDF8)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--kulv-border, #C9BFA9)' }}>
                          🏠 {structCount} {language === 'en' ? 'structures' : 'hoonet'}
                        </span>
                      </div>
                    </div>

                    {presetToConfirm?.id === preset.id ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          backgroundColor: 'rgba(184, 92, 51, 0.1)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--kulv-danger, #B85C33)'
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kulv-danger, #B85C33)' }}>
                          {language === 'en'
                            ? 'Replace current plan and entities?'
                            : 'Asenda praegune plaan ja objektid?'}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date().toISOString();
                              const newPlan: YardPlan = {
                                ...plan,
                                name: title,
                                widthM: preset.widthM,
                                lengthM: preset.lengthM,
                                northAngleDeg: preset.northAngleDeg,
                                entities: preset.entities,
                                trash: [],
                                updatedAt: now
                              };
                              setPlan(newPlan);
                              setPresetToConfirm(null);
                              setShowPresetsModal(false);
                              setPresetToast(
                                language === 'en'
                                  ? `Preset "${title}" loaded successfully!`
                                  : `Näidismall "${title}" edukalt laaditud!`
                              );
                              setTimeout(() => setPresetToast(null), 3500);
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: 'var(--kulv-danger, #B85C33)',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            {language === 'en' ? 'Yes, Replace' : 'Jah, asenda'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPresetToConfirm(null)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--kulv-border, #C9BFA9)',
                              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                              color: 'var(--kulv-text, #2A2E24)',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            {language === 'en' ? 'Cancel' : 'Loobu'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (plan.entities.length === 0) {
                            const now = new Date().toISOString();
                            const newPlan: YardPlan = {
                              ...plan,
                              name: title,
                              widthM: preset.widthM,
                              lengthM: preset.lengthM,
                              northAngleDeg: preset.northAngleDeg,
                              entities: preset.entities,
                              trash: [],
                              updatedAt: now
                            };
                            setPlan(newPlan);
                            setShowPresetsModal(false);
                            setPresetToast(
                              language === 'en'
                                ? `Preset "${title}" loaded successfully!`
                                : `Näidismall "${title}" edukalt laaditud!`
                            );
                            setTimeout(() => setPresetToast(null), 3500);
                          } else {
                            setPresetToConfirm(preset);
                          }
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'var(--kulv-primary, #4F6B45)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {t('template_apply_btn')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Preset Toast Notification */}
      {presetToast && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--kulv-primary, #4F6B45)',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1200
          }}
        >
          <Check size={16} />
          <span>{presetToast}</span>
        </div>
      )}

      {/* Soil Recipes & Bag Calculator Dialog for Bed Entities */}
      <SoilRecipesDialog
        isOpen={showSoilDialog}
        onDismiss={() => {
          setShowSoilDialog(false);
          setSoilDialogDims(undefined);
        }}
        initialBedDimensions={soilDialogDims}
      />

      {/* Cadastral Plot Search & Boundary Import Dialog */}
      <CadastralPlotSearchDialog
        isOpen={showCadastralDialog}
        onClose={() => setShowCadastralDialog(false)}
        language={language}
      />

      {/* High-Resolution Printable Garden Binder Dialog */}
      <GardenBinderPrintDialog
        isOpen={showBinderDialog}
        onClose={() => setShowBinderDialog(false)}
        language={language}
      />
    </div>
  );
};
