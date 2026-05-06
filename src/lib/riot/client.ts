import { cleanRiotIdPart } from "@/lib/riot/format";

export interface AccountStats {
  gameName: string;
  tagLine: string;
  flex: QueueStats;
  isInGame: boolean;
  soloDuo: QueueStats;
  /** Shard LoL donde se resolvieron ligas (ej la1 la2). */
  routingPlatform?: string | null;
}

export interface QueueStats {
  tier: string | null;
  rank: string | null;
  lp: number;
  winRate: number;
  totalGames: number;
}

const REGION_ROUTING = "americas"; // Para Account-V1
const RIOT_FETCH_TIMEOUT_MS = 8_000;
const RIOT_FETCH_RETRIES = 2;

type LeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export type RiotCurrentGameParticipant = {
  bot: boolean;
  championId: number;
  perks?: {
    perkIds?: number[];
    perkStyle?: number;
    perkSubStyle?: number;
  };
  profileIconId: number;
  puuid: string;
  riotId?: string;
  spell1Id: number;
  spell2Id: number;
  teamId: number;
};

export type RiotCurrentGameInfo = {
  bannedChampions?: {
    championId: number;
    pickTurn: number;
    teamId: number;
  }[];
  gameId: number;
  gameLength: number;
  gameMode: string;
  gameQueueConfigId: number;
  gameStartTime: number;
  gameType: string;
  mapId: number;
  participants: RiotCurrentGameParticipant[];
  platformId: string;
};

export type RiotMatchDto = {
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp?: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp?: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: RiotMatchParticipantDto[];
    platformId: string;
    queueId: number;
    teams: {
      objectives?: Record<string, { first: boolean; kills: number }>;
      teamId: number;
      win: boolean;
    }[];
  };
};

export type RiotMatchParticipantDto = {
  assists: number;
  baronKills: number;
  bountyLevel: number;
  champExperience: number;
  champLevel: number;
  championId: number;
  championName: string;
  damageDealtToBuildings: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  deaths: number;
  detectorWardsPlaced: number;
  doubleKills: number;
  dragonKills: number;
  goldEarned: number;
  goldSpent: number;
  individualPosition: string;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  kills: number;
  lane: string;
  magicDamageDealtToChampions: number;
  neutralMinionsKilled: number;
  objectivesStolen: number;
  participantId: number;
  pentaKills: number;
  physicalDamageDealtToChampions: number;
  profileIcon: number;
  puuid: string;
  quadraKills: number;
  riotIdGameName?: string;
  riotIdTagline?: string;
  summoner1Id: number;
  summoner2Id: number;
  teamId: number;
  teamPosition: string;
  timeCCingOthers: number;
  totalAllyJungleMinionsKilled: number;
  totalDamageDealtToChampions: number;
  totalDamageShieldedOnTeammates: number;
  totalDamageTaken: number;
  totalEnemyJungleMinionsKilled: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalMinionsKilled: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  tripleKills: number;
  trueDamageDealtToChampions: number;
  turretKills: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  win: boolean;
  challenges?: Record<string, number>;
};

export type RiotMatchTimelineDto = {
  info: {
    frameInterval: number;
    frames: {
      events: Array<
        | {
            itemId?: number;
            participantId?: number;
            timestamp: number;
            type: string;
          }
        | Record<string, unknown>
      >;
      participantFrames: Record<
        string,
        {
          participantId: number;
          totalGold?: number;
        }
      >;
      timestamp: number;
    }[];
    gameId: number;
    participants: Array<{ participantId: number; puuid: string }>;
  };
  metadata: {
    matchId: string;
  };
};

const EMPTY_QUEUE_STATS: QueueStats = {
  tier: "UNRANKED",
  rank: null,
  lp: 0,
  winRate: 0,
  totalGames: 0,
};

export class RiotApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "RiotApiRequestError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function retryDelayMs(response: Response | null, attempt: number) {
  const retryAfter = response?.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : null;
  if (retryAfterSeconds && Number.isFinite(retryAfterSeconds)) {
    return Math.min(retryAfterSeconds * 1000, 5_000);
  }

  return 350 * 2 ** attempt;
}

function isRetriableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

export async function fetchRiotJson<T>(
  url: string,
  options: {
    headers: { "X-Riot-Token": string };
    notFoundMessage: string;
    requestLabel: string;
  },
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RIOT_FETCH_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RIOT_FETCH_TIMEOUT_MS);
    let response: Response | null = null;

    try {
      response = await fetch(url, {
        headers: options.headers,
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status === 404) {
        throw new RiotApiRequestError(options.notFoundMessage, response.status);
      }

      if (isRetriableStatus(response.status) && attempt < RIOT_FETCH_RETRIES) {
        await sleep(retryDelayMs(response, attempt));
        continue;
      }

      if (response.status === 401) {
        throw new RiotApiRequestError("Riot API Key invalida o expirada. Actualizala en Key.", response.status);
      }

      if (response.status === 403) {
        throw new RiotApiRequestError(
          `${options.requestLabel} devolvio 403 Forbidden. La key puede ser valida, pero Riot no autorizo este endpoint o region para esta key.`,
          response.status,
        );
      }

      if (response.status === 429) {
        throw new RiotApiRequestError("Riot API rechazo la consulta por rate limit. Intenta de nuevo en unos segundos.", response.status);
      }

      if (response.status >= 500) {
        throw new RiotApiRequestError("Riot API esta respondiendo con errores temporales. Intenta de nuevo mas tarde.", response.status);
      }

      throw new RiotApiRequestError(`${options.requestLabel} fallo con status ${response.status}.`, response.status);
    } catch (error) {
      lastError = error;
      if (error instanceof RiotApiRequestError) {
        throw error;
      }

      if (attempt < RIOT_FETCH_RETRIES) {
        await sleep(retryDelayMs(response, attempt));
        continue;
      }

      const isAbort = error instanceof DOMException && error.name === "AbortError";
      throw new RiotApiRequestError(
        isAbort
          ? `${options.requestLabel} no respondio a tiempo.`
          : `${options.requestLabel} fallo por un error de red.`,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new RiotApiRequestError(`${options.requestLabel} fallo por un error desconocido.`);
}

function toQueueStats(entry: LeagueEntry | undefined): QueueStats {
  if (!entry) return EMPTY_QUEUE_STATS;
  const wins = entry.wins || 0;
  const losses = entry.losses || 0;
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  return {
    tier: entry.tier ?? "UNRANKED",
    rank: entry.rank ?? null,
    lp: entry.leaguePoints ?? 0,
    winRate,
    totalGames,
  };
}

export async function fetchRiotAccountByRiotId(
  gameName: string,
  tagLine: string,
  apiKey: string,
): Promise<{ gameName: string; tagLine: string; puuid: string }> {
  const headers = { "X-Riot-Token": apiKey };
  const cleanGameName = cleanRiotIdPart(gameName);
  const cleanTagLine = cleanRiotIdPart(tagLine);

  const accountUrl = `https://${REGION_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(cleanGameName)}/${encodeURIComponent(cleanTagLine)}`;
  return fetchRiotJson<{ gameName: string; tagLine: string; puuid: string }>(accountUrl, {
    headers,
    notFoundMessage: `Riot ID no encontrado: ${cleanGameName}#${cleanTagLine}.`,
    requestLabel: `Account API para ${cleanGameName}#${cleanTagLine}`,
  });
}

export async function fetchRiotAccountByPuuid(
  puuid: string,
  apiKey: string,
): Promise<{ gameName: string; tagLine: string; puuid: string }> {
  const headers = { "X-Riot-Token": apiKey };
  const accountUrl = `https://${REGION_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
  return fetchRiotJson<{ gameName: string; tagLine: string; puuid: string }>(accountUrl, {
    headers,
    notFoundMessage: `Riot Account con PUUID no encontrado.`,
    requestLabel: `Account API by PUUID`,
  });
}

export async function fetchLiveGameByPuuid(
  puuid: string,
  platform: string,
  apiKey: string,
): Promise<boolean> {
  const headers = { "X-Riot-Token": apiKey };
  const spectatorUrl = `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
  try {
    await fetchRiotJson<unknown>(spectatorUrl, {
      headers,
      notFoundMessage: "LIVE_GAME_NOT_FOUND",
      requestLabel: `Spectator API en ${platform}`,
    });
    return true;
  } catch (error) {
    if (error instanceof RiotApiRequestError && error.status === 404) {
      return false;
    }
    throw error;
  }
}

export async function fetchLiveGameDetailsByPuuid(
  puuid: string,
  platform: string,
  apiKey: string,
): Promise<RiotCurrentGameInfo | null> {
  const headers = { "X-Riot-Token": apiKey };
  const spectatorUrl = `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
  try {
    return await fetchRiotJson<RiotCurrentGameInfo>(spectatorUrl, {
      headers,
      notFoundMessage: "LIVE_GAME_NOT_FOUND",
      requestLabel: `Spectator API en ${platform}`,
    });
  } catch (error) {
    if (error instanceof RiotApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchLeagueStatsByPuuid(
  puuid: string,
  platform: string,
  apiKey: string,
): Promise<{ flex: QueueStats; soloDuo: QueueStats }> {
  const headers = { "X-Riot-Token": apiKey };
  const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
  
  try {
    const entries = await fetchRiotJson<LeagueEntry[]>(leagueUrl, {
      headers,
      notFoundMessage: `No hay datos de liga en ${platform}.`,
      requestLabel: `League API by PUUID`,
    });
    
    const flexStats = entries.find((q) => q.queueType === "RANKED_FLEX_SR");
    const soloDuoStats = entries.find((q) => q.queueType === "RANKED_SOLO_5x5");
    
    return {
      flex: toQueueStats(flexStats),
      soloDuo: toQueueStats(soloDuoStats),
    };
  } catch (error) {
    if (error instanceof RiotApiRequestError && error.status === 404) {
      return { flex: EMPTY_QUEUE_STATS, soloDuo: EMPTY_QUEUE_STATS };
    }
    throw error;
  }
}

function regionalRoutingFromPlatform(platform: string): string {
  const normalized = platform.trim().toLowerCase();
  if (normalized === "euw1" || normalized === "eun1" || normalized === "tr1" || normalized === "ru") {
    return "europe";
  }
  if (normalized === "kr" || normalized === "jp1") {
    return "asia";
  }
  if (normalized === "oc1") {
    return "sea";
  }
  return "americas";
}

export async function fetchMatchIdsByPuuid(
  puuid: string,
  platform: string,
  apiKey: string,
  count = 20,
  queue?: number,
): Promise<string[]> {
  const headers = { "X-Riot-Token": apiKey };
  const regionalRouting = regionalRoutingFromPlatform(platform);
  const queueParam = queue ? `&queue=${queue}` : "";
  const matchIdsUrl = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}${queueParam}`;

  return fetchRiotJson<string[]>(matchIdsUrl, {
    headers,
    notFoundMessage: "No se encontro historial para esta cuenta.",
    requestLabel: `Match-V5 IDs en ${regionalRouting}`,
  });
}

export async function fetchMatchById(
  matchId: string,
  platform: string,
  apiKey: string,
): Promise<RiotMatchDto> {
  const headers = { "X-Riot-Token": apiKey };
  const regionalRouting = regionalRoutingFromPlatform(platform);
  const matchUrl = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;

  return fetchRiotJson<RiotMatchDto>(matchUrl, {
    headers,
    notFoundMessage: `Partida ${matchId} no encontrada.`,
    requestLabel: `Match-V5 detalle ${matchId}`,
  });
}

export async function fetchMatchTimelineById(
  matchId: string,
  platform: string,
  apiKey: string,
): Promise<RiotMatchTimelineDto> {
  const headers = { "X-Riot-Token": apiKey };
  const regionalRouting = regionalRoutingFromPlatform(platform);
  const timelineUrl = `https://${regionalRouting}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}/timeline`;

  return fetchRiotJson<RiotMatchTimelineDto>(timelineUrl, {
    headers,
    notFoundMessage: `Timeline ${matchId} no encontrada.`,
    requestLabel: `Match-V5 timeline ${matchId}`,
  });
}
