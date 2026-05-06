"use client";

import type { QueueFilter } from "@/features/match-history/actions";
import type { MatchHistoryItem, MatchHistoryResult } from "@/features/match-history/types";

type PreviewCacheEntry = {
  matches: MatchHistoryItem[];
  updatedAt: string;
};

const previewCache = new Map<string, PreviewCacheEntry>();

function cacheKey(accountId: string, queue: QueueFilter) {
  return `${accountId}:${queue}`;
}

export function getCachedPreview(accountId: string, queue: QueueFilter): MatchHistoryResult | null {
  const entry = previewCache.get(cacheKey(accountId, queue));
  if (!entry) return null;

  return {
    account: {
      id: accountId,
      label: "",
      ownerLabel: "",
      region: "",
      routingPlatform: null,
    },
    error: null,
    matches: entry.matches,
    updatedAt: entry.updatedAt,
  };
}

export function setCachedPreview(accountId: string, queue: QueueFilter, matches: MatchHistoryItem[], updatedAt: string) {
  previewCache.set(cacheKey(accountId, queue), { matches, updatedAt });
}

export function setCachedPreviews(
  entries: Array<{ accountId: string; matches: MatchHistoryItem[]; queue: QueueFilter }>,
  updatedAt: string,
) {
  entries.forEach((entry) => setCachedPreview(entry.accountId, entry.queue, entry.matches, updatedAt));
}
