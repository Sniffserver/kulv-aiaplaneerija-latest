import { describe, it, expect, beforeEach } from 'vitest';
import { SyncQueue } from './syncQueue';

describe('SyncQueue', () => {
  let queue: SyncQueue;

  beforeEach(async () => {
    queue = new SyncQueue();
    await queue.clear();
  });

  it('starts with an empty queue', async () => {
    const items = await queue.getAll();
    expect(items).toEqual([]);
    const peeked = await queue.peek();
    expect(peeked).toBeNull();
  });

  it('enqueues items with default pending status and generated metadata', async () => {
    const item = await queue.enqueue({
      action: 'push',
      clientRevision: 1,
      payload: { name: 'Peenar 1' }
    });

    expect(item.id).toMatch(/^sync_item_/);
    expect(item.status).toBe('pending');
    expect(item.retryCount).toBe(0);
    expect(item.createdAt).toBeDefined();

    const all = await queue.getAll();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(item.id);
  });

  it('peeks the first pending or in_progress item in FIFO order', async () => {
    const first = await queue.enqueue({
      action: 'push',
      clientRevision: 1,
      payload: { type: 'bed' }
    });

    await queue.enqueue({
      action: 'push',
      clientRevision: 2,
      payload: { type: 'task' }
    });

    const peeked = await queue.peek();
    expect(peeked).toBeDefined();
    expect(peeked?.id).toBe(first.id);
  });

  it('dequeues processed items by id', async () => {
    const item1 = await queue.enqueue({
      action: 'push',
      clientRevision: 1,
      payload: { item: 1 }
    });
    const item2 = await queue.enqueue({
      action: 'pull',
      clientRevision: 1
    });

    await queue.dequeue(item1.id);

    const remaining = await queue.getAll();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(item2.id);
  });

  it('increments retryCount and transitions to failed on retry threshold exhaustion', async () => {
    const item = await queue.enqueue({
      action: 'push',
      clientRevision: 1,
      payload: { journalId: 'j1' }
    });

    // 4 retries should keep it pending
    for (let i = 1; i <= 4; i++) {
      await queue.markFailed(item.id, `Network timeout ${i}`);
      const current = (await queue.getAll()).find((q) => q.id === item.id);
      expect(current?.retryCount).toBe(i);
      expect(current?.status).toBe('pending');
      expect(current?.error).toBe(`Network timeout ${i}`);
    }

    // 5th retry marks it permanently failed
    await queue.markFailed(item.id, 'Permanent failure');
    const failedItem = (await queue.getAll()).find((q) => q.id === item.id);
    expect(failedItem?.retryCount).toBe(5);
    expect(failedItem?.status).toBe('failed');

    // Failed item is skipped by peek
    const peeked = await queue.peek();
    expect(peeked).toBeNull();
  });

  it('clears all items from the queue', async () => {
    await queue.enqueue({ action: 'push', clientRevision: 1, payload: {} });
    await queue.enqueue({ action: 'pull', clientRevision: 2 });

    await queue.clear();
    const all = await queue.getAll();
    expect(all).toEqual([]);
  });
});
