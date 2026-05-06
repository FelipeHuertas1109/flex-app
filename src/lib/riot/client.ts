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

async function fetchRiotJson<T>(
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

      if (response.status === 401 || response.status === 403) {
        throw new RiotApiRequestError("Riot API Key rechazada o expirada. Actualizala en Key.", response.status);
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
  const spectatorUrl = `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-puuid/${puuid}`;
  const spectatorRes = await fetch(spectatorUrl, { headers });

  if (spectatorRes.ok) return true;
  if (spectatorRes.status === 404) return false;

  throw new Error(`Spectator API error: ${spectatorRes.status}`);
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

