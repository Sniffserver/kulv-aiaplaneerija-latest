/**
 * IndexedDB storage utility for KÜLV with automatic migration from localStorage.
 * Handles browser privacy modes and provides durable offline storage exceeding 5MB localStorage quota.
 */

const DB_NAME = 'kulv_indexed_db';
const DB_VERSION = 1;
const STORE_NAME = 'garden_store';

let dbPromise: Promise<IDBDatabase> | null = null;

function getIndexedDB(): IDBFactory | undefined {
  if (typeof indexedDB !== 'undefined') return indexedDB;
  if (typeof window !== 'undefined' && window.indexedDB) return window.indexedDB;
  if (typeof globalThis !== 'undefined' && (globalThis as any).indexedDB) return (globalThis as any).indexedDB;
  return undefined;
}

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const idb = getIndexedDB();
    if (!idb) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}


/**
 * Retrieves a key from IndexedDB, automatically migrating from localStorage if missing in IndexedDB.
 */
export async function getStoredItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDatabase();
    const value = await new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });

    if (value !== undefined && value !== null) {
      return value;
    }
  } catch {
    // If IndexedDB fails (e.g. security block or private mode), continue to localStorage fallback
  }

  // Automatic Migration from localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const legacyItem = localStorage.getItem(`kulv_${key}`);
      if (legacyItem) {
        const parsed = JSON.parse(legacyItem) as T;
        // Asynchronously migrate to IndexedDB in the background
        setStoredItem(key, parsed).catch(() => {});
        return parsed;
      }
    }
  } catch {
    // Fall back to default value
  }

  return defaultValue;
}

/**
 * Stores a value in IndexedDB and keeps a mirror in localStorage if within reasonable size.
 */
export async function setStoredItem<T>(key: string, value: T): Promise<void> {
  let idbSuccess = false;

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    idbSuccess = true;
  } catch {
    // IndexedDB write failed (e.g. private mode or storage locked)
  }

  // Also write to localStorage as fallback cache
  try {
    if (typeof localStorage !== 'undefined') {
      const serialized = JSON.stringify(value);
      // If string is smaller than 2MB, store in localStorage
      if (serialized.length < 2 * 1024 * 1024) {
        localStorage.setItem(`kulv_${key}`, serialized);
      }
    }
  } catch {
    if (!idbSuccess) {
      throw new Error(`Salvestamine ebaõnnestus (nii IndexedDB kui localStorage limiit täis)`);
    }
  }
}

/**
 * Atomically replaces multiple stores/keys in IndexedDB within a single readwrite transaction.
 * If any operation fails or transaction aborts, all writes are rolled back automatically.
 */
export async function replaceAllStoresTransactionally(entries: Record<string, any>): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const [key, value] of Object.entries(entries)) {
      store.put(value, key);
    }

    tx.oncomplete = () => {
      try {
        if (typeof localStorage !== 'undefined') {
          for (const [key, value] of Object.entries(entries)) {
            const serialized = JSON.stringify(value);
            if (serialized.length < 2 * 1024 * 1024) {
              localStorage.setItem(`kulv_${key}`, serialized);
            }
          }
        }
      } catch {
        // localStorage mirror is optional
      }
      resolve();
    };

    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

/**
 * Deletes a key from both IndexedDB and localStorage.
 */
export async function removeStoredItem(key: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore IndexedDB delete error
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`kulv_${key}`);
    }
  } catch {
    // Ignore localStorage delete error
  }
}

/**
 * Resets the cached IndexedDB database connection promise (for testing and migrations).
 */
export function resetDatabaseConnection(): void {
  dbPromise = null;
}

