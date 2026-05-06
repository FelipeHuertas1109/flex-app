"use client";

import { getLiveGameDetails } from "@/features/live-game/actions";

type LiveGameDetailsResult = Awaited<ReturnType<typeof getLiveGameDetails>>;
export type LiveGameInfo = Extract<LiveGameDetailsResult, { inGame: true }>["game"];
export type LiveGameCachedState =
  | { error: string; game: null }
  | { error: null; game: LiveGameInfo };

type CacheEntry = {
  state: LiveGameCachedState;
  version: number;
};

const liveGameDetailsCache = new Map<string, CacheEntry>();

function cacheKey(groupId: string, accountId: string) {
  return `${groupId}:${accountId}`;
}

export function getCachedLiveGameDetails(groupId: string, accountId: string, syncVersion: number) {
  const entry = liveGameDetailsCache.get(cacheKey(groupId, accountId));
  if (!entry || entry.version !== syncVersion) {
    return null;
  }
  return entry.state;
}

export function setCachedLiveGameDetails(
  groupId: string,
  accountId: string,
  syncVersion: number,
  state: LiveGameCachedState,
) {
  liveGameDetailsCache.set(cacheKey(groupId, accountId), {
    state,
    version: syncVersion,
  });
}

export function pruneStaleLiveGameDetails(groupId: string, accountIds: string[]) {
  const validKeys = new Set(accountIds.map((accountId) => cacheKey(groupId, accountId)));

  liveGameDetailsCache.forEach((_, key) => {
    if (key.startsWith(`${groupId}:`) && !validKeys.has(key)) {
      liveGameDetailsCache.delete(key);
    }
  });
}
