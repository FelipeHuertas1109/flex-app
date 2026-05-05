export interface AccountStats {
  gameName: string;
  tagLine: string;
  tier: string | null;
  rank: string | null;
  lp: number;
  winRate: number;
  soloTier: string | null;
  soloRank: string | null;
  soloLp: number;
  soloWinRate: number;
  flexTier: string | null;
  flexRank: string | null;
  flexLp: number;
  flexWinRate: number;
  /** Shard LoL donde se resolvieron ligas (ej la1 la2). */
  routingPlatform?: string | null;
}

const REGION_ROUTING = "americas"; // Para Account-V1
const DEFAULT_PLATFORM = "la2"; // LAS

const TAG_TO_PLATFORM: Record<string, string> = {
  LAS: "la2",
  LAN: "la1",
  BR: "br1",
  NA: "na1",
  EUW: "euw1",
  EUNE: "eun1",
  KR: "kr",
  JP: "jp1",
  OCE: "oc1",
  RU: "ru",
  TR: "tr1",
};

const PLATFORM_FALLBACK_ORDER = [
  "la2",
  "la1",
  "br1",
  "na1",
  "euw1",
  "eun1",
  "kr",
  "jp1",
  "oc1",
  "tr1",
  "ru",
];

type LeagueEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

function getPlatformCandidates(tagLine: string) {
  const normalizedTag = tagLine.toUpperCase();
  const inferred = TAG_TO_PLATFORM[normalizedTag];

  if (!inferred) {
    return PLATFORM_FALLBACK_ORDER;
  }

  return [inferred, ...PLATFORM_FALLBACK_ORDER.filter((platform) => platform !== inferred)];
}

export async function fetchRiotAccountStats(
  gameName: string,
  tagLine: string,
  platform: string = DEFAULT_PLATFORM
): Promise<AccountStats | null> {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    console.error("Missing RIOT_API_KEY environment variable");
    return null;
  }

  try {
    const headers = { "X-Riot-Token": apiKey };

    const accountUrl = `https://${REGION_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const accountRes = await fetch(accountUrl, { headers });
    if (!accountRes.ok) throw new Error(`Account API error: ${accountRes.status} ${accountRes.statusText}`);
    const accountData = await accountRes.json();
    const puuid = accountData.puuid;

    const platformCandidates = [
      platform,
      ...getPlatformCandidates(tagLine).filter((candidate) => candidate !== platform),
    ];

    let bestNonEmpty: { entries: LeagueEntry[]; platform: string } | null = null;

    for (const candidate of platformCandidates) {
      const leagueUrl = `https://${candidate}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
      const leagueRes = await fetch(leagueUrl, { headers });

      if (!leagueRes.ok) {
        if (leagueRes.status !== 404) {
          throw new Error(`League API error: ${leagueRes.status}`);
        }
        continue;
      }

      const entries: LeagueEntry[] = await leagueRes.json();
      const flexStats = entries.find((q) => q.queueType === "RANKED_FLEX_SR");
      const soloStats = entries.find((q) => q.queueType === "RANKED_SOLO_5x5");

      if (flexStats || soloStats) {
        const computeWinRate = (wins: number, losses: number) => {
          const totalGames = wins + losses;
          return totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
        };

        const flexWinRate = flexStats ? computeWinRate(flexStats.wins || 0, flexStats.losses || 0) : 0;
        const soloWinRate = soloStats ? computeWinRate(soloStats.wins || 0, soloStats.losses || 0) : 0;

        return {
          gameName: accountData.gameName,
          tagLine: accountData.tagLine,
          tier: flexStats?.tier ?? soloStats?.tier ?? "UNRANKED",
          rank: flexStats?.rank ?? soloStats?.rank ?? null,
          lp: flexStats?.leaguePoints ?? soloStats?.leaguePoints ?? 0,
          winRate: flexWinRate,
          soloTier: soloStats?.tier ?? null,
          soloRank: soloStats?.rank ?? null,
          soloLp: soloStats?.leaguePoints ?? 0,
          soloWinRate,
          flexTier: flexStats?.tier ?? null,
          flexRank: flexStats?.rank ?? null,
          flexLp: flexStats?.leaguePoints ?? 0,
          flexWinRate,
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
        tier: "UNRANKED",
        rank: null,
        lp: 0,
        winRate: 0,
        soloTier: null,
        soloRank: null,
        soloLp: 0,
        soloWinRate: 0,
        flexTier: null,
        flexRank: null,
        flexLp: 0,
        flexWinRate: 0,
        routingPlatform: bestNonEmpty.platform,
      };
    }

    return {
      gameName: accountData.gameName,
      tagLine: accountData.tagLine,
      tier: "UNRANKED",
      rank: null,
      lp: 0,
      winRate: 0,
      soloTier: null,
      soloRank: null,
      soloLp: 0,
      soloWinRate: 0,
      flexTier: null,
      flexRank: null,
      flexLp: 0,
      flexWinRate: 0,
      routingPlatform: null,
    };

  } catch (error) {
    console.error(`Error fetching data for ${gameName}#${tagLine}:`, error);
    return null;
  }
}
