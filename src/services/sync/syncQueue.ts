import { SyncQueueItem } from './syncTypes';
import { getStoredItem, setStoredItem } from '../../logic/storageDb';

const QUEUE_STORAGE_KEY = 'sync_queue';

export class SyncQueue {
  async getAll(): Promise<SyncQueueItem[]> {
    return getStoredItem<SyncQueueItem[]>(QUEUE_STORAGE_KEY, []);
  }

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount' | 'status'>): Promise<SyncQueueItem> {
    const queue = await this.getAll();
    const newItem: SyncQueueItem = {
      ...item,
      id: `sync_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };
    queue.push(newItem);
    await setStoredItem(QUEUE_STORAGE_KEY, queue);
    return newItem;
  }

  async peek(): Promise<SyncQueueItem | null> {
    const queue = await this.getAll();
    return queue.find((i) => i.status === 'pending' || i.status === 'in_progress') || null;
  }

  async dequeue(id: string): Promise<void> {
    const queue = await this.getAll();
    const filtered = queue.filter((i) => i.id !== id);
    await setStoredItem(QUEUE_STORAGE_KEY, filtered);
  }

  async markFailed(id: string, error: string): Promise<void> {
    const queue = await this.getAll();
    const item = queue.find((i) => i.id === id);
    if (item) {
      item.retryCount += 1;
      item.lastAttempt = new Date().toISOString();
      item.error = error;
      item.status = item.retryCount >= 5 ? 'failed' : 'pending';
      await setStoredItem(QUEUE_STORAGE_KEY, queue);
    }
  }

  async clear(): Promise<void> {
    await setStoredItem(QUEUE_STORAGE_KEY, []);
  }
}
