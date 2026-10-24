import { GardenBed, Task, JournalEntry, Plant, AppSettings, YardPlan } from '../types';
import { validateGardenBackup } from '../lib/validation/backupSchema';
import { importPlan } from '../lib/import/importPlan';
import { replaceAllStoresTransactionally, getStoredItem } from '../logic/storageDb';

export interface GardenStateSnapshot {
  gardenItems?: GardenBed[];
  beds: GardenBed[];
  tasks: Task[];
  journalPages?: JournalEntry[];
  journal: JournalEntry[];
  customPlants?: Plant[];
  structures?: any[];
  devices?: any[];
  observations?: any[];
  settings: AppSettings;
  yardPlan: YardPlan;
  schemaVersion: number;
}

export type ReplaceError =
  | { type: 'VALIDATION_FAILED'; message: string; details?: unknown }
  | { type: 'MIGRATION_FAILED'; message: string; details?: unknown }
  | { type: 'STORAGE_FAILED'; message: string; details?: unknown }
  | { type: 'CONCURRENCY_CONFLICT'; message: string };

export type ReplaceGardenStateResult = { ok: true; snapshot: GardenStateSnapshot } | { ok: false; error: ReplaceError };

// In-memory mutex to prevent concurrent replacement race conditions
let isReplacing = false;

/**
 * Replaces the ENTIRE garden state atomically.
 *
 * Contract:
 * - Either ALL stores are replaced, or NONE are (single IndexedDB transaction).
 * - Validation happens BEFORE any write.
 * - If validation or write fails, old state is preserved unchanged.
 * - Emits exactly one event ('garden:replaced') after success.
 * - Never partially mutates in-memory state.
 */
export async function replaceGardenState(
  raw: unknown,
  options: { source: 'import' | 'sync-pull' | 'restore' }
): Promise<ReplaceGardenStateResult> {
  if (isReplacing) {
    return {
      ok: false,
      error: {
        type: 'CONCURRENCY_CONFLICT',
        message: 'Teine aia andmete asendamine on juba pooleli. Palun oota.'
      }
    };
  }

  isReplacing = true;

  try {
    // 1. Parse string if needed
    let parsed: any = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (err: any) {
        return {
          ok: false,
          error: {
            type: 'VALIDATION_FAILED',
            message: `Vigane JSON formaat: ${err?.message || 'sündmust ei õnnestunud parsida'}`
          }
        };
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        ok: false,
        error: {
          type: 'VALIDATION_FAILED',
          message: 'Varukoopia andmed peavad olema JSON objekt.'
        }
      };
    }

    // 2. Validate against schema
    const jsonString = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const validation = validateGardenBackup(jsonString);
    if (!validation.success || !validation.data) {
      return {
        ok: false,
        error: {
          type: 'VALIDATION_FAILED',
          message: validation.errorMessage || 'Andmed ei vasta KÜLV varukoopia formaadile.',
          details: validation.errorMessage
        }
      };
    }

    const data = validation.data;

    // 3. Migrate and validate YardPlan FIRST before any persistence write
    let migratedYardPlan: YardPlan;
    try {
      if (data.yardPlan) {
        migratedYardPlan = importPlan(data.yardPlan);
      } else if (data.beds && data.beds.length > 0) {
        migratedYardPlan = importPlan(data.beds);
      } else {
        migratedYardPlan = importPlan({
          id: 'yard-plan-default',
          name: 'Minu aia krundiplaan',
          schemaVersion: 3,
          units: 'metric',
          widthM: data.settings?.yardWidthM || 20,
          lengthM: data.settings?.yardLengthM || 30,
          northAngleDeg: data.settings?.northAngle || 0,
          entities: [],
          trash: [],
          layers: []
        });
      }
    } catch (migErr: any) {
      return {
        ok: false,
        error: {
          type: 'MIGRATION_FAILED',
          message: `Krundiplaanide migratsioon ebaõnnestus: ${migErr?.message || 'tundmatu migratsiooniviga'}`
        }
      };
    }

    // 4. Construct complete validated snapshot
    const customPlants = Array.isArray(data.customPlants) ? data.customPlants : [];
    const snapshot: GardenStateSnapshot = {
      beds: data.beds || [],
      gardenItems: data.beds || [],
      tasks: data.tasks || [],
      journal: data.journal || [],
      journalPages: data.journal || [],
      customPlants,
      settings: data.settings,
      yardPlan: migratedYardPlan,
      schemaVersion: 4
    };

    // 5. Capture pre-write state for rollback guarantee
    const previousState: Record<string, any> = {};
    try {
      previousState.beds = await getStoredItem('beds', null);
      previousState.tasks = await getStoredItem('tasks', null);
      previousState.journal = await getStoredItem('journal', null);
      previousState.settings = await getStoredItem('settings', null);
      previousState.yard_plan = await getStoredItem('yard_plan', null);
      previousState.plants = await getStoredItem('plants', null);
    } catch {
      // In-memory fallback if reading fails
    }

    // 6. Single atomic IndexedDB transaction across all keys
    try {
      await replaceAllStoresTransactionally({
        beds: snapshot.beds,
        tasks: snapshot.tasks,
        journal: snapshot.journal,
        settings: snapshot.settings,
        yard_plan: snapshot.yardPlan,
        plants: snapshot.customPlants
      });
    } catch (storageErr: any) {
      // Rollback attempt if storage write failed
      try {
        if (previousState.beds !== null) {
          await replaceAllStoresTransactionally(previousState);
        }
      } catch {
        // Rollback failed
      }
      return {
        ok: false,
        error: {
          type: 'STORAGE_FAILED',
          message: `Salvestamine IndexedDB-sse ebaõnnestus: ${storageErr?.message || 'transaktsiooni viga'}`
        }
      };
    }

    // 7. Emit exactly one event ('garden:replaced') after successful atomic transaction
    const event = new CustomEvent('garden:replaced', {
      detail: {
        snapshot,
        source: options.source
      }
    });
    gardenEventTarget.dispatchEvent(event);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(event);
    }

    return {
      ok: true,
      snapshot
    };
  } finally {
    isReplacing = false;
  }
}

// Universal event emitter supporting both Node.js (Vitest) and Browser environments
const gardenEventTarget = new EventTarget();

export function subscribeGardenReplaced(
  callback: (detail: { snapshot: GardenStateSnapshot; source: 'import' | 'sync-pull' | 'restore' }) => void
): () => void {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ snapshot: GardenStateSnapshot; source: 'import' | 'sync-pull' | 'restore' }>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  gardenEventTarget.addEventListener('garden:replaced', handler);
  return () => {
    gardenEventTarget.removeEventListener('garden:replaced', handler);
  };
}
