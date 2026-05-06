import { createAdminClient } from "@/lib/supabase/admin";
import { getStoredRiotApiKeyRecord } from "@/lib/riot/api-key";
import { fetchMatchById, fetchMatchIdsByPuuid } from "@/lib/riot/client";
import { createClient } from "@/lib/supabase/server";

type RecentMatch = {
  playedAt: number;
  championName: string;
  damage: number;
  durationMinutes: number;
  kda: string;
  kdaValue: number;
  matchId: string;
  result: "Victoria" | "Derrota";
};

export type AccountProfileStats = {
  accountLabel: string;
  averageDamage: number;
  averageKda: number;
  bestChampion: {
    avgDamage: number;
    avgKda: number;
    games: number;
    name: string;
    winRate: number;
  } | null;
  championStats: {
    avgDamage: number;
    avgKda: number;
    games: number;
    name: string;
    wins: number;
    winRate: number;
  }[];
  flex: { lp: number; rank: string; totalGames: number; winRate: number };
  recentMatches: RecentMatch[];
  recentWinRate: number;
  recentWinRateTrend: { match: string; winRate: number }[];
  soloDuo: { lp: number; rank: string; totalGames: number; winRate: number };
};

function formatRank(tier: string | null, division: string | null) {
  const t = (tier ?? "UNRANKED").toUpperCase();
  if (t === "UNRANKED") return "Unranked";
  return `${t}${division ? ` ${division}` : ""}`;
}

function safeNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function getAccountProfileStats(groupAccountId: string): Promise<{ data?: AccountProfileStats; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const { data: membership } = await supabase
    .from("group_accounts")
    .select("group_id")
    .eq("id", groupAccountId)
    .single();

  if (!membership) return { error: "Cuenta no encontrada" };

  const { data: isMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", membership.group_id)
    .eq("user_id", user.id)
    .single();

  if (!isMember) return { error: "No perteneces a este grupo" };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const { data: accountRow } = await admin
    .from("group_accounts")
    .select("id, riot_accounts(game_name, tag_line, puuid, routing_platform, tier, rank, lp, win_rate, total_games, solo_tier, solo_rank, solo_lp, solo_win_rate, solo_total_games)")
    .eq("id", groupAccountId)
    .single();

  const riotRaw = accountRow?.riot_accounts as
    | {
        game_name: string;
        lp: number | null;
        puuid: string | null;
        rank: string | null;
        routing_platform: string | null;
        solo_lp: number | null;
        solo_rank: string | null;
        solo_tier: string | null;
        solo_total_games: number | null;
        solo_win_rate: number | null;
        tag_line: string;
        tier: string | null;
        total_games: number | null;
        win_rate: number | null;
      }
    | undefined;

  if (!riotRaw?.game_name || !riotRaw?.tag_line) return { error: "No se pudo cargar la cuenta Riot" };

  const accountLabel = `${riotRaw.game_name}#${riotRaw.tag_line}`;

  const soloDuo = {
    lp: safeNum(riotRaw.solo_lp),
    rank: formatRank(riotRaw.solo_tier, riotRaw.solo_rank),
    totalGames: safeNum(riotRaw.solo_total_games),
    winRate: safeNum(riotRaw.solo_win_rate),
  };
  const flex = {
    lp: safeNum(riotRaw.lp),
    rank: formatRank(riotRaw.tier, riotRaw.rank),
    totalGames: safeNum(riotRaw.total_games),
    winRate: safeNum(riotRaw.win_rate),
  };

  if (!riotRaw.puuid || !riotRaw.routing_platform) {
    return {
      data: {
        accountLabel,
        averageDamage: 0,
        averageKda: 0,
        bestChampion: null,
        championStats: [],
        flex,
        recentMatches: [],
        recentWinRate: 0,
        recentWinRateTrend: [],
        soloDuo,
      },
    };
  }

  const riotApiKey = await getStoredRiotApiKeyRecord();
  if (riotApiKey.error || !riotApiKey.apiKey) {
    return {
      data: {
        accountLabel,
        averageDamage: 0,
        averageKda: 0,
        bestChampion: null,
        championStats: [],
        flex,
        recentMatches: [],
        recentWinRate: 0,
        recentWinRateTrend: [],
        soloDuo,
      },
    };
  }

  const matchIds = await fetchMatchIdsByPuuid(riotRaw.puuid, riotRaw.routing_platform, riotApiKey.apiKey, 30);
  const matches = await Promise.all(
    matchIds.map(async (matchId) => {
      try {
        return await fetchMatchById(matchId, riotRaw.routing_platform!, riotApiKey.apiKey!);
      } catch {
        return null;
      }
    }),
  );

  const recentMatches = matches
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((match) => {
      const me = match.info.participants.find((p) => p.puuid === riotRaw.puuid);
      if (!me) return null;
      const kdaValue = (me.kills + me.assists) / Math.max(1, me.deaths);
      return {
        playedAt: match.info.gameEndTimestamp ?? match.info.gameStartTimestamp ?? match.info.gameCreation,
        championName: me.championName,
        damage: me.totalDamageDealtToChampions,
        durationMinutes: Math.max(1, Math.round(match.info.gameDuration / 60)),
        kda: `${me.kills}/${me.deaths}/${me.assists}`,
        kdaValue,
        matchId: match.metadata.matchId,
        result: me.win ? ("Victoria" as const) : ("Derrota" as const),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const wins = recentMatches.filter((m) => m.result === "Victoria").length;
  const recentWinRate = recentMatches.length ? Math.round((wins / recentMatches.length) * 100) : 0;
  const averageDamage = recentMatches.length
    ? Math.round(recentMatches.reduce((sum, item) => sum + item.damage, 0) / recentMatches.length)
    : 0;
  const averageKda = recentMatches.length
    ? Number((recentMatches.reduce((sum, item) => sum + item.kdaValue, 0) / recentMatches.length).toFixed(2))
    : 0;

  const championMap = new Map<string, { games: number; totalDamage: number; totalKda: number; wins: number }>();
  for (const match of recentMatches) {
    const current = championMap.get(match.championName) ?? { games: 0, totalDamage: 0, totalKda: 0, wins: 0 };
    championMap.set(match.championName, {
      games: current.games + 1,
      totalDamage: current.totalDamage + match.damage,
      totalKda: current.totalKda + match.kdaValue,
      wins: current.wins + (match.result === "Victoria" ? 1 : 0),
    });
  }

  const championStats = [...championMap.entries()]
    .map(([name, value]) => ({
      avgDamage: Math.round(value.totalDamage / value.games),
      avgKda: Number((value.totalKda / value.games).toFixed(2)),
      games: value.games,
      name,
      wins: value.wins,
      winRate: Math.round((value.wins / value.games) * 100),
    }))
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate);

  const bestChampion = championStats[0] ?? null;

  const chronological = [...recentMatches].sort((a, b) => a.playedAt - b.playedAt);
  let runningWins = 0;
  const recentWinRateTrend = chronological.map((match, index) => {
    if (match.result === "Victoria") runningWins += 1;
    return {
      match: `P${index + 1}`,
      winRate: Math.round((runningWins / (index + 1)) * 100),
    };
  });

  return {
    data: {
      accountLabel,
      averageDamage,
      averageKda,
      bestChampion,
      championStats,
      flex,
      recentMatches,
      recentWinRate,
      recentWinRateTrend,
      soloDuo,
    },
  };
}
