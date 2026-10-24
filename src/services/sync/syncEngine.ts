import { SyncQueue } from './syncQueue';
import { SyncRepository } from './syncRepository';
import { resolveConflict } from './conflictResolver';
import { SyncTransport, SyncResult, ConflictStrategy } from './syncTypes';

export class SyncEngine {
  private queue: SyncQueue;
  private repository: SyncRepository;
  private transport?: SyncTransport;
  private isSyncing = false;

  constructor(dependencies?: { queue?: SyncQueue; repository?: SyncRepository; transport?: SyncTransport }) {
    this.queue = dependencies?.queue || new SyncQueue();
    this.repository = dependencies?.repository || new SyncRepository();
    this.transport = dependencies?.transport;
  }

  setTransport(transport: SyncTransport): void {
    this.transport = transport;
  }

  /**
   * Main synchronization entry point.
   */
  async sync(options?: { forcePull?: boolean; strategy?: ConflictStrategy }): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        message: 'Sünkroonimine on juba töös.'
      };
    }

    if (!this.transport) {
      return {
        success: false,
        message: 'Serveri ühendus pole seadistatud (transport puudub).'
      };
    }

    this.isSyncing = true;

    try {
      // 1. Force pull path
      if (options?.forcePull) {
        return await this.executePull();
      }

      // 2. Process push queue or latest local changes
      const currentRevision = await this.repository.getLocalRevision();
      const localSnapshot = await this.repository.getLocalSnapshot();

      const pushResponse = await this.transport.push(localSnapshot, currentRevision);

      if (pushResponse.status === 200) {
        const newRev = pushResponse.newRevision ?? currentRevision + 1;
        await this.repository.setLocalRevision(newRev);
        await this.queue.clear();
        return {
          success: true,
          revision: newRev,
          message: `Sünkroonimine õnnestus! Uus revisjon: ${newRev}`
        };
      }

      // 3. Handle 409 Conflict
      if (pushResponse.status === 409 && pushResponse.serverState) {
        const strategy = options?.strategy || 'last-write-wins';
        const resolution = resolveConflict(localSnapshot, pushResponse.serverState, strategy);

        if (resolution.winner === 'server') {
          // Replace local state with server state atomically
          const saveRes = await this.repository.saveLocalSnapshot(pushResponse.serverState, 'sync-pull');
          if (!saveRes.ok) {
            return {
              success: false,
              message: `Konflikti lahendamisel serveri seisu salvestamine ebaõnnestus: ${saveRes.error}`
            };
          }
          const serverRev = pushResponse.newRevision ?? currentRevision + 1;
          await this.repository.setLocalRevision(serverRev);
          await this.queue.clear();

          return {
            success: true,
            conflictResolved: true,
            strategyUsed: strategy,
            revision: serverRev,
            message: `409 konflikt lahendatud (${resolution.reason}). Kohalik seis asendati serveri seisuga.`
          };
        } else {
          // Client wins: force push with the new server revision
          const serverRev = pushResponse.newRevision ?? currentRevision + 1;
          const retryPush = await this.transport.push(localSnapshot, serverRev);
          if (retryPush.status === 200) {
            const finalRev = retryPush.newRevision ?? serverRev + 1;
            await this.repository.setLocalRevision(finalRev);
            await this.queue.clear();
            return {
              success: true,
              conflictResolved: true,
              strategyUsed: strategy,
              revision: finalRev,
              message: `409 konflikt lahendatud (${resolution.reason}). Kohalik seis salvestati serverisse.`
            };
          }
        }
      }

      // 4. Network or server error (e.g. 500 or offline)
      await this.queue.enqueue({
        action: 'push',
        payload: localSnapshot,
        clientRevision: currentRevision
      });

      return {
        success: false,
        error: pushResponse.error || 'Serveri viga',
        message: 'Võrgu või serveri tõrge. Muudatused salvestati lokaalsesse järjekorda ja sünkroonitakse hiljem.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message,
        message: `Sünkroonimise viga: ${err?.message || 'ühendus katkes'}`
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pulls remote garden state from server and replaces local state atomically.
   */
  private async executePull(): Promise<SyncResult> {
    if (!this.transport) {
      return { success: false, message: 'Transport puudub' };
    }

    const pullRes = await this.transport.pull();
    if (pullRes.status !== 200 || !pullRes.serverState) {
      return {
        success: false,
        error: pullRes.error,
        message: `Serveri seisu tõmbamine ebaõnnestus: ${pullRes.error || 'viga serveris'}`
      };
    }

    // Replace entire local garden state atomically via replaceGardenState contract
    const saveRes = await this.repository.saveLocalSnapshot(pullRes.serverState, 'sync-pull');
    if (!saveRes.ok) {
      return {
        success: false,
        message: `Serveri andmete rakendamine ebaõnnestus: ${saveRes.error}`
      };
    }

    await this.repository.setLocalRevision(pullRes.revision);
    return {
      success: true,
      revision: pullRes.revision,
      message: `Serveri seis edukalt tõmmatud ja aatomiliselt rakendatud (revisjon ${pullRes.revision})`
    };
  }
}
