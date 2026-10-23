import { GardenStateSnapshot } from '../gardenState';

export type SyncAction = 'push' | 'pull';

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  payload?: any;
  clientRevision: number;
  createdAt: string;
  retryCount: number;
  lastAttempt?: string;
  error?: string;
  status: 'pending' | 'in_progress' | 'failed';
}

export interface SyncResult {
  success: boolean;
  revision?: number;
  message: string;
  conflictResolved?: boolean;
  strategyUsed?: 'client-wins' | 'server-wins' | 'last-write-wins';
  error?: string;
}

export type ConflictStrategy = 'client-wins' | 'server-wins' | 'last-write-wins';

export interface ConflictResolution {
  winner: 'client' | 'server';
  chosenState: GardenStateSnapshot;
  reason: string;
}

export interface SyncTransport {
  push: (payload: any, expectedRevision: number) => Promise<{ status: 200 | 409 | 500; newRevision?: number; serverState?: any; error?: string }>;
  pull: () => Promise<{ status: 200 | 500; revision: number; serverState: any; error?: string }>;
}
