import { GardenStateSnapshot, replaceGardenState } from '../gardenState';
import { getStoredItem, setStoredItem } from '../../logic/storageDb';
import { INITIAL_BEDS, INITIAL_TASKS, INITIAL_JOURNAL, INITIAL_SETTINGS, INITIAL_YARD_PLAN } from '../../data/defaultData';

export class SyncRepository {
  /**
   * Reads complete local state snapshot from durable storage.
   */
  async getLocalSnapshot(): Promise<GardenStateSnapshot> {
    const beds = await getStoredItem('beds', INITIAL_BEDS);
    const tasks = await getStoredItem('tasks', INITIAL_TASKS);
    const journal = await getStoredItem('journal', INITIAL_JOURNAL);
    const settings = await getStoredItem('settings', INITIAL_SETTINGS);
    const yardPlan = await getStoredItem('yard_plan', INITIAL_YARD_PLAN);
    const customPlants = await getStoredItem('plants', []);

    return {
      beds,
      gardenItems: beds,
      tasks,
      journal,
      journalPages: journal,
      customPlants,
      settings,
      yardPlan,
      schemaVersion: 4
    };
  }

  /**
   * Writes the state snapshot atomically via replaceGardenState contract.
   */
  async saveLocalSnapshot(
    snapshot: any,
    source: 'import' | 'sync-pull' | 'restore'
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await replaceGardenState(snapshot, { source });
    if (res.ok) {
      return { ok: true };
    }
    return { ok: false, error: res.error.message };
  }

  /**
   * Gets the last known server revision number.
   */
  async getLocalRevision(): Promise<number> {
    return getStoredItem<number>('sync_revision', 0);
  }

  /**
   * Persists the current server revision number.
   */
  async setLocalRevision(revision: number): Promise<void> {
    await setStoredItem('sync_revision', revision);
  }
}
