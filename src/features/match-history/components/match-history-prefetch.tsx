"use client";

import { useEffect, useRef } from "react";
import { getGroupMatchHistoryPreview } from "@/features/match-history/actions";
import { setCachedPreviews } from "@/features/match-history/lib/match-history-client-cache";

const prefetchedGroups = new Set<string>();

export function MatchHistoryPrefetch({ groupId }: { groupId: string }) {
  const running = useRef(false);

  useEffect(() => {
    if (prefetchedGroups.has(groupId)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (running.current) return;
      running.current = true;

      getGroupMatchHistoryPreview(groupId, 3)
        .then((result) => {
          if (result.error !== null) return;
          setCachedPreviews(result.entries, result.updatedAt);
          prefetchedGroups.add(groupId);
        })
        .catch((error) => {
          console.error("MatchHistoryPrefetch:", error);
        })
        .finally(() => {
          running.current = false;
        });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [groupId]);

  return null;
}
