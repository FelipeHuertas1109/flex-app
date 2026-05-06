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

async function fetchIsInGame(
  puuid: string,
  platform: string,
  headers: { "X-Riot-Token": string },
): Promise<boolean> {
  const spectatorUrl = `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
  const spectatorRes = await fetch(spectatorUrl, { headers });

  if (spectatorRes.ok) return true;
  if (spectatorRes.status === 404) return false;

  throw new Error(`Spectator API error: ${spectatorRes.status}`);
}

async function fetchSummonerExists(
  puuid: string,
  platform: string,
  headers: { "X-Riot-Token": string },
): Promise<boolean> {
  const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const summonerRes = await fetch(summonerUrl, { headers });

  if (summonerRes.ok) return true;
  if (summonerRes.status === 404) return false;

  throw new Error(`Summoner API error: ${summonerRes.status}`);
}

export async function fetchRiotAccountStats(
  gameName: string,
  tagLine: string,
  platform: string,
  apiKey: string,
): Promise<AccountStats | null> {
  if (!apiKey) {
    console.error("Missing stored Riot API key");
    return null;
  }

  try {
    const headers = { "X-Riot-Token": apiKey };
    const cleanGameName = cleanRiotIdPart(gameName);
    const cleanTagLine = cleanRiotIdPart(tagLine);

    const accountUrl = `https://${REGION_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(cleanGameName)}/${encodeURIComponent(cleanTagLine)}`;
    const accountRes = await fetch(accountUrl, { headers });
    if (!accountRes.ok) throw new Error(`Account API error: ${accountRes.status} ${accountRes.statusText}`);
    const accountData = await accountRes.json();
    const puuid = accountData.puuid;

    const normalizedPlatform = platform.trim().toLowerCase();
    const platformCandidates = [normalizedPlatform];

    let bestNonEmpty: { entries: LeagueEntry[]; platform: string } | null = null;
    let firstReachablePlatform: string | null = null;

    for (const candidate of platformCandidates) {
      const summonerExists = await fetchSummonerExists(puuid, candidate, headers);
      if (!summonerExists) {
        continue;
      }

      firstReachablePlatform ??= candidate;

      const leagueUrl = `https://${candidate}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
      const leagueRes = await fetch(leagueUrl, { headers });

      if (!leagueRes.ok) {
        if (leagueRes.status !== 404) {
          throw new Error(`League API error: ${leagueRes.status}`);
        }
        continue;
      }

      const entries: LeagueEntry[] = await leagueRes.json();
      const isInGame = await fetchIsInGame(puuid, candidate, headers).catch((error) => {
        console.warn(`No se pudo consultar partida en vivo para ${gameName}#${tagLine} en ${candidate}:`, error);
        return false;
      });
      const flexStats = entries.find((q) => q.queueType === "RANKED_FLEX_SR");
      const soloDuoStats = entries.find((q) => q.queueType === "RANKED_SOLO_5x5");
      if (flexStats || soloDuoStats || isInGame) {
        return {
          gameName: accountData.gameName,
          tagLine: accountData.tagLine,
          flex: toQueueStats(flexStats),
          isInGame,
          soloDuo: toQueueStats(soloDuoStats),
          routingPlatform: candidate,
        };
      }

      if (entries.length > 0 && !bestNonEmpty) {
        bestNonEmpty = { entries, platform: candidate };
      }
    }

    if (bestNonEmpty) {
      return {
        gameName: accountData.gameName,
        tagLine: accountData.tagLine,
        flex: EMPTY_QUEUE_STATS,
        isInGame: false,
        soloDuo: EMPTY_QUEUE_STATS,
        routingPlatform: bestNonEmpty.platform,
      };
    }

    if (normalizedPlatform && !firstReachablePlatform) {
      throw new Error(`Riot ID no existe en la region guardada (${normalizedPlatform})`);
    }

    return {
      gameName: accountData.gameName,
      tagLine: accountData.tagLine,
      flex: EMPTY_QUEUE_STATS,
      isInGame: false,
      soloDuo: EMPTY_QUEUE_STATS,
      routingPlatform: firstReachablePlatform,
    };

  } catch (error) {
    console.error(`Error fetching data for ${cleanRiotIdPart(gameName)}#${cleanRiotIdPart(tagLine)}:`, error);
    return null;
  }
}
