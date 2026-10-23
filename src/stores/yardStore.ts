import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import { YardPlan, GardenEntity, YardLayer, DEFAULT_YARD_LAYERS, Point2D } from '../types';
import { GardenSpatialIndex } from '../logic/spatialIndex';
import { SolarSeasonPresetId } from '../logic/solarEngine';

export interface YardState {
  plan: YardPlan;
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  zoom: number; // pixels per metre
  panOffset: { x: number; y: number };
  snapToGrid: boolean;
  solarHour: number;
  solarSeasonId: SolarSeasonPresetId;
  viewMode: '2d' | '3d';
  spatialIndex: GardenSpatialIndex;

  // Plan modification actions (tracked by undo history via temporal)
  setPlan: (plan: YardPlan) => void;
  addEntity: (entity: GardenEntity) => void;
  updateEntity: (id: string, patch: Partial<GardenEntity>) => void;
  moveEntity: (id: string, x: number, y: number) => void;
  rotateEntity: (id: string, degreesDelta: number) => void;
  resizeEntity: (id: string, width: number, length: number) => void;
  deleteEntity: (id: string, soft?: boolean) => void;
  restoreEntity: (id: string) => void;
  permanentlyDeleteEntity: (id: string) => void;
  emptyTrash: () => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  updateYardDimensions: (widthM: number, lengthM: number) => void;
  updateNorthAngle: (angleDeg: number) => void;
  applyCadastralPlot: (data: {
    widthM: number;
    lengthM: number;
    boundaryPolygon?: Point2D[];
    cadastralCode?: string;
    cadastralAreaM2?: number;
    address?: string;
    name?: string;
  }) => void;
  clearCadastralPlot: () => void;

  // UI state actions (untracked by undo history)
  setSelectedEntityId: (id: string | null) => void;
  setHoveredEntityId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setSnapToGrid: (snap: boolean) => void;
  setSolarHour: (hour: number) => void;
  setSolarSeasonId: (seasonId: SolarSeasonPresetId) => void;
  setViewMode: (mode: '2d' | '3d') => void;
}

export const createInitialPlan = (): YardPlan => {
  const now = new Date().toISOString();
  return {
    id: 'yard-plan-default',
    name: 'Minu aia krundiplaan',
    schemaVersion: 3,
    units: 'metric',
    widthM: 20,
    lengthM: 30,
    northAngleDeg: 0,
    entities: [],
    trash: [],
    layers: [...DEFAULT_YARD_LAYERS],
    createdAt: now,
    updatedAt: now
  };
};

export const useYardStore = create<YardState>()(
  persist(
    temporal(
      immer((set, get) => {
        const spatialIndex = new GardenSpatialIndex();

      return {
        plan: createInitialPlan(),
        selectedEntityId: null,
        hoveredEntityId: null,
        zoom: 24,
        panOffset: { x: 40, y: 40 },
        snapToGrid: true,
        solarHour: 14.0,
        solarSeasonId: 'midsummer',
        viewMode: '2d',
        spatialIndex,

        setPlan: (newPlan: YardPlan) => {
          set((state) => {
            state.plan = newPlan;
            state.spatialIndex.rebuild(newPlan.entities);
          });
        },

        addEntity: (entity: GardenEntity) => {
          const now = new Date().toISOString();
          const normalized: GardenEntity = {
            ...entity,
            createdAt: entity.createdAt || now,
            updatedAt: now,
            deletedAt: null
          };

          set((state) => {
            state.plan.entities.push(normalized);
            state.plan.updatedAt = now;
            state.spatialIndex.rebuild(current(state.plan.entities));
            state.selectedEntityId = normalized.id;
          });
        },

        updateEntity: (id: string, patch: Partial<GardenEntity>) => {
          const now = new Date().toISOString();
          set((state) => {
            const e = state.plan.entities.find((item) => item.id === id);
            if (e) {
              Object.assign(e, patch, { updatedAt: now });
              state.plan.updatedAt = now;
              state.spatialIndex.rebuild(current(state.plan.entities));
            }
          });
        },

        moveEntity: (id: string, x: number, y: number) => {
          const now = new Date().toISOString();
          set((state) => {
            const e = state.plan.entities.find((item) => item.id === id);
            if (e && !e.locked) {
              e.x = Math.max(0, Math.min(x, state.plan.widthM - e.width));
              e.y = Math.max(0, Math.min(y, state.plan.lengthM - e.length));
              e.updatedAt = now;
              state.plan.updatedAt = now;
              state.spatialIndex.rebuild(current(state.plan.entities));
            }
          });
        },

        rotateEntity: (id: string, degreesDelta: number) => {
          const now = new Date().toISOString();
          set((state) => {
            const e = state.plan.entities.find((item) => item.id === id);
            if (e && !e.locked) {
              e.rotation = (e.rotation + degreesDelta + 360) % 360;
              e.updatedAt = now;
              state.plan.updatedAt = now;
              state.spatialIndex.rebuild(current(state.plan.entities));
            }
          });
        },

        resizeEntity: (id: string, width: number, length: number) => {
          const now = new Date().toISOString();
          set((state) => {
            const e = state.plan.entities.find((item) => item.id === id);
            if (e && !e.locked) {
              e.width = Math.max(0.2, width);
              e.length = Math.max(0.2, length);
              e.updatedAt = now;
              state.plan.updatedAt = now;
              state.spatialIndex.rebuild(current(state.plan.entities));
            }
          });
        },

        deleteEntity: (id: string, soft = true) => {
          const now = new Date().toISOString();
          set((state) => {
            const idx = state.plan.entities.findIndex((item) => item.id === id);
            if (idx !== -1) {
              const [removed] = state.plan.entities.splice(idx, 1);
              if (soft) {
                removed.deletedAt = now;
                removed.updatedAt = now;
                if (!state.plan.trash) state.plan.trash = [];
                state.plan.trash.push(removed);
              }
            } else if (state.plan.trash) {
              const t = state.plan.trash.find((item) => item.id === id);
              if (t) {
                t.deletedAt = now;
                t.updatedAt = now;
              }
            }
            if (state.selectedEntityId === id) {
              state.selectedEntityId = null;
            }
            state.plan.updatedAt = now;
            state.spatialIndex.rebuild(current(state.plan.entities));
          });
        },

        restoreEntity: (id: string) => {
          const now = new Date().toISOString();
          set((state) => {
            if (state.plan.trash) {
              const trashIdx = state.plan.trash.findIndex((item) => item.id === id);
              if (trashIdx !== -1) {
                const [restored] = state.plan.trash.splice(trashIdx, 1);
                restored.deletedAt = null;
                restored.updatedAt = now;
                const existingIdx = state.plan.entities.findIndex((item) => item.id === id);
                if (existingIdx !== -1) {
                  state.plan.entities[existingIdx] = restored;
                } else {
                  state.plan.entities.push(restored);
                }
                state.plan.updatedAt = now;
                state.spatialIndex.rebuild(current(state.plan.entities));
                state.selectedEntityId = id;
                return;
              }
            }
            // fallback if entity was still in entities with deletedAt flag
            const e = state.plan.entities.find((item) => item.id === id);
            if (e) {
              e.deletedAt = null;
              e.updatedAt = now;
              state.plan.updatedAt = now;
              state.spatialIndex.rebuild(current(state.plan.entities));
              state.selectedEntityId = id;
            }
          });
        },

        permanentlyDeleteEntity: (id: string) => {
          const now = new Date().toISOString();
          set((state) => {
            state.plan.entities = state.plan.entities.filter((item) => item.id !== id);
            if (state.plan.trash) {
              state.plan.trash = state.plan.trash.filter((item) => item.id !== id);
            }
            if (state.selectedEntityId === id) {
              state.selectedEntityId = null;
            }
            state.plan.updatedAt = now;
            state.spatialIndex.rebuild(current(state.plan.entities));
          });
        },

        emptyTrash: () => {
          const now = new Date().toISOString();
          set((state) => {
            state.plan.trash = [];
            state.plan.entities = state.plan.entities.filter((e) => !e.deletedAt);
            state.plan.updatedAt = now;
            state.spatialIndex.rebuild(current(state.plan.entities));
          });
        },

        toggleLayerVisibility: (layerId: string) => {
          set((state) => {
            const layer = state.plan.layers.find((l) => l.id === layerId);
            if (layer) {
              layer.visible = !layer.visible;
              state.plan.entities.forEach((e) => {
                if (e.layerId === layerId) {
                  e.visible = layer.visible;
                }
              });
              state.spatialIndex.rebuild(current(state.plan.entities));
            }
          });
        },

        toggleLayerLock: (layerId: string) => {
          set((state) => {
            const layer = state.plan.layers.find((l) => l.id === layerId);
            if (layer) {
              layer.locked = !layer.locked;
              state.plan.entities.forEach((e) => {
                if (e.layerId === layerId) {
                  e.locked = layer.locked;
                }
              });
            }
          });
        },

        updateYardDimensions: (widthM: number, lengthM: number) => {
          const now = new Date().toISOString();
          set((state) => {
            state.plan.widthM = Math.max(5, Math.min(widthM, 500));
            state.plan.lengthM = Math.max(5, Math.min(lengthM, 500));
            state.plan.updatedAt = now;
          });
        },

        updateNorthAngle: (angleDeg: number) => {
          const now = new Date().toISOString();
          set((state) => {
            state.plan.northAngleDeg = (angleDeg + 360) % 360;
            state.plan.updatedAt = now;
          });
        },

        applyCadastralPlot: (data) => {
          const now = new Date().toISOString();
          set((state) => {
            state.plan.widthM = Math.max(5, Math.min(data.widthM, 500));
            state.plan.lengthM = Math.max(5, Math.min(data.lengthM, 500));
            state.plan.boundaryPolygon = data.boundaryPolygon;
            state.plan.cadastralCode = data.cadastralCode;
            state.plan.cadastralAreaM2 = data.cadastralAreaM2;
            state.plan.address = data.address;
            if (data.name) {
              state.plan.name = data.name;
            }
            state.plan.updatedAt = now;
          });
        },

        clearCadastralPlot: () => {
          const now = new Date().toISOString();
          set((state) => {
            state.plan.boundaryPolygon = undefined;
            state.plan.cadastralCode = undefined;
            state.plan.cadastralAreaM2 = undefined;
            state.plan.address = undefined;
            state.plan.updatedAt = now;
          });
        },

        // Untracked UI setters
        setSelectedEntityId: (id) => set({ selectedEntityId: id }),
        setHoveredEntityId: (id) => set({ hoveredEntityId: id }),
        setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(zoom, 80)) }),
        setPanOffset: (panOffset) => set({ panOffset }),
        setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
        setSolarHour: (solarHour) => set({ solarHour }),
        setSolarSeasonId: (solarSeasonId) => set({ solarSeasonId }),
        setViewMode: (viewMode) => set({ viewMode })
      };
    }),
    {
      limit: 50,
      partialize: (state) => ({ plan: state.plan }),
      equality: (pastState, currentState) => pastState.plan === currentState.plan
    }
  ),
  {
    name: 'yard-store',
    partialize: (state) => ({ plan: state.plan })
  }
)
);

// Variant B: Patch temporal undo/redo at the engine level to ensure plan.trash is never touched
const rawTemporalUndo = useYardStore.temporal.getState().undo;
const rawTemporalRedo = useYardStore.temporal.getState().redo;

useYardStore.temporal.getState().undo = (steps?: number) => {
  const currentTrash = useYardStore.getState().plan.trash || [];
  rawTemporalUndo(steps);
  useYardStore.temporal.getState().pause();
  useYardStore.setState((s) => ({
    plan: {
      ...s.plan,
      trash: currentTrash
    }
  }));
  useYardStore.temporal.getState().resume();
};

useYardStore.temporal.getState().redo = (steps?: number) => {
  const currentTrash = useYardStore.getState().plan.trash || [];
  rawTemporalRedo(steps);
  useYardStore.temporal.getState().pause();
  useYardStore.setState((s) => ({
    plan: {
      ...s.plan,
      trash: currentTrash
    }
  }));
  useYardStore.temporal.getState().resume();
};

/**
 * Convenient reactive hook for Undo / Redo buttons and status.
 * Variant B: Undo and redo modify active entities, but do not touch the trash collection.
 */
export function useYardTemporal() {
  const temporal = useYardStore.temporal;
  const pastCount = useStore(temporal, (state) => state.pastStates.length);
  const futureCount = useStore(temporal, (state) => state.futureStates.length);
  const undo = useStore(temporal, (state) => state.undo);
  const redo = useStore(temporal, (state) => state.redo);
  const clear = useStore(temporal, (state) => state.clear);

  return {
    undo,
    redo,
    clear,
    canUndo: pastCount > 0,
    canRedo: futureCount > 0,
    pastCount,
    futureCount
  };
}
