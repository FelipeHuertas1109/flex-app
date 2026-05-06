"use client";

import { syncAllAccounts } from "@/features/accounts/actions";

/** Minutos entre syncs automáticos si no defines env (5-120). */
const DEFAULT_MINUTES = 5;
const MIN_MINUTES = 5;
const MAX_MINUTES = 120;

export const FIRST_SYNC_DELAY_MS = 120_000;
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
};

const syncCache = new Map<string, SyncCacheEntry>();

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
  };
  syncCache.set(groupId, entry);
  return entry;
}

export async function runCachedGroupSync(
  groupId: string,
  options?: {
    freshMs?: number;
  },
): Promise<CachedSyncResponse> {
  const freshMs = options?.freshMs ?? resolvedSyncIntervalMs();
  const entry = getOrCreateEntry(groupId);
  const now = Date.now();

  if (entry.inFlight) {
    return entry.inFlight;
  }

  if (entry.lastResult && now - entry.lastCompletedAt < freshMs) {
    return {
      fromCache: true,
      result: entry.lastResult,
    };
  }

  const inFlight = syncAllAccounts(groupId)
    .then((result) => {
      entry.lastCompletedAt = Date.now();
      entry.lastResult = result;
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
