import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredItem, setStoredItem, removeStoredItem } from './storageDb';

// Ensure localStorage is polyfilled for Node.js test environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MockLocalStorage();
}

describe('StorageDb & LocalStorage Migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates existing data from localStorage when IndexedDB does not have it yet', async () => {
    const legacyGardenData = [{ id: 'bed_1', name: 'Porgandipeenar', width: 1.2, length: 3.0 }];
    localStorage.setItem('kulv_beds', JSON.stringify(legacyGardenData));

    const loaded = await getStoredItem('beds', []);
    expect(loaded).toEqual(legacyGardenData);
  });

  it('returns default value when neither IndexedDB nor localStorage have data', async () => {
    const loaded = await getStoredItem('non_existent_key', { test: true });
    expect(loaded).toEqual({ test: true });
  });

  it('saves and reads data properly', async () => {
    const testTask = [{ id: 'task_1', title: 'Kasta kasvuhoonet', completed: false }];
    await setStoredItem('test_tasks', testTask);

    const loaded = await getStoredItem('test_tasks', []);
    expect(loaded).toEqual(testTask);
  });

  it('cleans up data with removeStoredItem', async () => {
    await setStoredItem('temp_item', { val: 42 });
    await removeStoredItem('temp_item');

    const loaded = await getStoredItem('temp_item', null);
    expect(loaded).toBeNull();
  });
});
