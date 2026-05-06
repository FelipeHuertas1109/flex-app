"use client";

export type TeamBuilderRole = "top" | "jungle" | "mid" | "adc" | "support";
export type TeamBuilderChampionInfo = { id: string; name: string; tags: string[] };
export type TeamBuilderAssignments = Partial<Record<TeamBuilderRole, string>>;
export type TeamBuilderChampAssignments = Partial<Record<TeamBuilderRole, TeamBuilderChampionInfo>>;

type TeamBuilderCachedState = {
  assignments: TeamBuilderAssignments;
  champAssignments: TeamBuilderChampAssignments;
};

const DDRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/16.9.1`;
let championsCache: TeamBuilderChampionInfo[] | null = null;
let championsRequest: Promise<TeamBuilderChampionInfo[]> | null = null;
const builderStateCache = new Map<string, TeamBuilderCachedState>();

export async function fetchCachedTeamBuilderChampions(): Promise<TeamBuilderChampionInfo[]> {
  if (championsCache) return championsCache;
  if (championsRequest) return championsRequest;

  championsRequest = fetch(`${DDRAGON_BASE}/data/en_US/champion.json`)
    .then((res) => res.json())
    .then((json) => {
      const list = Object.values(
        json.data as Record<string, { id: string; name: string; tags: string[] }>,
      ).map((c) => ({ id: c.id, name: c.name, tags: c.tags }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      championsCache = list;
      return list;
    })
    .finally(() => {
      championsRequest = null;
    });

  return championsRequest;
}

export function teamBuilderCacheKey(memberIds: string[]) {
  return [...memberIds].sort().join("|");
}

export function getCachedTeamBuilderState(cacheKey: string): TeamBuilderCachedState {
  return builderStateCache.get(cacheKey) ?? {
    assignments: {},
    champAssignments: {},
  };
}

export function setCachedTeamBuilderAssignments(cacheKey: string, assignments: TeamBuilderAssignments) {
  const current = getCachedTeamBuilderState(cacheKey);
  builderStateCache.set(cacheKey, {
    ...current,
    assignments,
  });
}

export function setCachedTeamBuilderChampAssignments(cacheKey: string, champAssignments: TeamBuilderChampAssignments) {
  const current = getCachedTeamBuilderState(cacheKey);
  builderStateCache.set(cacheKey, {
    ...current,
    champAssignments,
  });
}

export function clearCachedTeamBuilderState(cacheKey: string) {
  builderStateCache.set(cacheKey, {
    assignments: {},
    champAssignments: {},
  });
}

export function championImageUrl(id: string) {
  return `${DDRAGON_BASE}/img/champion/${id}.png`;
}
