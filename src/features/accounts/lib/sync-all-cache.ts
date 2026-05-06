"use client";

import { syncAllAccounts } from "@/features/accounts/actions";

/** Minutos entre ticks automáticos si no defines env (5-120). */
const DEFAULT_MINUTES = 5;
const MIN_MINUTES = 5;
const MAX_MINUTES = 120;

export const RECENT_SYNC_CACHE_MS = 30_000;

type SyncAllAccountsResult = Awaited<ReturnType<typeof syncAllAccounts>>;

type CachedSyncResponse = {
  fromCache: boolean;
  result: SyncAllAccountsResult;
};

type SyncCacheEntry = {
  inFlight: Promise<CachedSyncResponse> | null;
  lastCompletedAt: number;
  lastResult: SyncAllAccountsResult | null;
  version: number;
};

const syncCache = new Map<string, SyncCacheEntry>();
const syncListeners = new Map<string, Set<() => void>>();

export function resolvedSyncIntervalMs(): number {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_RIOT_SYNC_MINUTES;
  const n = raw !== undefined ? Number(raw) : DEFAULT_MINUTES;
  const bounded = Number.isFinite(n)
    ? Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.floor(n)))
    : DEFAULT_MINUTES;
  return bounded * 60 * 1000;
}

function getOrCreateEntry(groupId: string): SyncCacheEntry {
  const current = syncCache.get(groupId);
  if (current) return current;

  const entry: SyncCacheEntry = {
    inFlight: null,
    lastCompletedAt: 0,
    lastResult: null,
    version: 0,
  };
  syncCache.set(groupId, entry);
  return entry;
}

function notifySyncListeners(groupId: string) {
  const listeners = syncListeners.get(groupId);
  listeners?.forEach((listener) => listener());
}

export function getGroupSyncVersion(groupId: string): number {
  return getOrCreateEntry(groupId).version;
}

export function subscribeToGroupSync(groupId: string, listener: () => void) {
  const listeners = syncListeners.get(groupId) ?? new Set<() => void>();
  listeners.add(listener);
  syncListeners.set(groupId, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      syncListeners.delete(groupId);
    }
  };
}

export async function runCachedGroupSync(
  groupId: string,
  options?: {
    freshMs?: number;
    isManual?: boolean;
  },
): Promise<CachedSyncResponse> {
  const freshMs = options?.freshMs ?? resolvedSyncIntervalMs();
  const entry = getOrCreateEntry(groupId);
  const now = Date.now();

  if (entry.inFlight) {
    return entry.inFlight;
  }

  // Si es manual, omitimos el caché de react-cache y hacemos un bypass controlado si es necesario (el server maneja los thresholds).
  if (!options?.isManual && entry.lastResult && now - entry.lastCompletedAt < freshMs) {
    return {
      fromCache: true,
      result: entry.lastResult,
    };
  }

  const inFlight = syncAllAccounts(groupId, options?.isManual ?? false)
    .then((result) => {
      entry.lastCompletedAt = Date.now();
      entry.lastResult = result;
      entry.version += 1;
      notifySyncListeners(groupId);
      return {
        fromCache: false,
        result,
      };
    })
    .finally(() => {
      entry.inFlight = null;
    });

  entry.inFlight = inFlight;
  return inFlight;
}
