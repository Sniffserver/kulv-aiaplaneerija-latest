import { GardenStateSnapshot } from '../gardenState';
import { ConflictResolution, ConflictStrategy } from './syncTypes';

/**
 * Deterministic Conflict Resolver.
 * Given identical inputs and strategy, it is mathematically guaranteed to produce
 * the exact same output every single time.
 */
export function resolveConflict(
  clientState: GardenStateSnapshot,
  serverState: GardenStateSnapshot,
  strategy: ConflictStrategy = 'last-write-wins'
): ConflictResolution {
  if (strategy === 'client-wins') {
    return {
      winner: 'client',
      chosenState: clientState,
      reason: 'Strateegia "client-wins" eelistab alati kohaliku seadme andmeid.'
    };
  }

  if (strategy === 'server-wins') {
    return {
      winner: 'server',
      chosenState: serverState,
      reason: 'Strateegia "server-wins" eelistab alati serveri viimast seisu.'
    };
  }

  // Last-Write-Wins (LWW) evaluation
  const clientTime = getLatestTimestamp(clientState);
  const serverTime = getLatestTimestamp(serverState);

  if (clientTime > serverTime) {
    return {
      winner: 'client',
      chosenState: clientState,
      reason: `Kohalik muudatus (${new Date(clientTime).toISOString()}) on uuem kui serveri seis (${new Date(serverTime).toISOString()}).`
    };
  } else if (serverTime > clientTime) {
    return {
      winner: 'server',
      chosenState: serverState,
      reason: `Serveri seis (${new Date(serverTime).toISOString()}) on uuem kui kohalik muudatus (${new Date(clientTime).toISOString()}).`
    };
  }

  // Tie-breaker: Deterministic fallback based on highest item count or ID comparison
  const clientItemCount =
    (clientState.beds?.length || 0) + (clientState.tasks?.length || 0) + (clientState.journal?.length || 0);
  const serverItemCount =
    (serverState.beds?.length || 0) + (serverState.tasks?.length || 0) + (serverState.journal?.length || 0);

  if (clientItemCount >= serverItemCount) {
    return {
      winner: 'client',
      chosenState: clientState,
      reason: 'Ajatemplid olid võrdsed; eelistati suurema kirjetearvuga kohalikku seisu.'
    };
  }

  return {
    winner: 'server',
    chosenState: serverState,
    reason: 'Ajatemplid olid võrdsed; eelistati suurema kirjetearvuga serveri seisu.'
  };
}

function getLatestTimestamp(snapshot: GardenStateSnapshot): number {
  let maxTime = 0;

  // Check yardPlan updatedAt
  if (snapshot.yardPlan?.updatedAt) {
    const t = new Date(snapshot.yardPlan.updatedAt).getTime();
    if (!isNaN(t) && t > maxTime) maxTime = t;
  }

  // Check journal entries
  if (Array.isArray(snapshot.journal)) {
    for (const entry of snapshot.journal) {
      if (entry.date) {
        const t = new Date(entry.date).getTime();
        if (!isNaN(t) && t > maxTime) maxTime = t;
      }
    }
  }

  // Check tasks createdAt
  if (Array.isArray(snapshot.tasks)) {
    for (const task of snapshot.tasks) {
      if (task.createdAt) {
        const t = new Date(task.createdAt).getTime();
        if (!isNaN(t) && t > maxTime) maxTime = t;
      }
    }
  }

  return maxTime;
}
