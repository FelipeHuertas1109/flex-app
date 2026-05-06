"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getChampionsByKeyMap, getItemsMap, getSummonerSpellsMap } from "@/lib/lol/ddragon";
import { getStoredRiotApiKeyRecord } from "@/lib/riot/api-key";
import {
  fetchLeagueStatsByPuuid,
  fetchMatchById,
  fetchMatchIdsByPuuid,
  fetchRiotAccountByRiotId,
  RiotApiRequestError,
  type RiotMatchDto,
  type RiotMatchParticipantDto,
} from "@/lib/riot/client";
import { routingPlatformToRegionLabel } from "@/lib/riot/routing-platform";
import type { MatchHistoryItem, MatchHistoryParticipant, MatchHistoryResult } from "@/features/match-history/types";

const QUEUE_LABELS: Record<number, string> = {
  400: "Normal Draft",
  420: "Ranked Solo/Duo",
  430: "Normal Blind",
  440: "Ranked Flex",
  450: "ARAM",
  490: "Quickplay",
  700: "Clash",
  830: "Co-op vs AI Intro",
  840: "Co-op vs AI Beginner",
  850: "Co-op vs AI Intermediate",
  900: "URF",
  1020: "One for All",
  1700: "Arena",
  1900: "URF",
};

const TEAM_LABELS: Record<number, string> = {
  100: "Azul",
  200: "Rojo",
};

type AuthorizedAccountRow = {
  group_id: string;
  is_shared: boolean | null;
  profiles: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
  riot_accounts:
    | {
        id: string;
        game_name: string;
        tag_line: string;
        puuid: string | null;
        routing_platform: string | null;
      }
    | {
        id: string;
        game_name: string;
        tag_line: string;
        puuid: string | null;
        routing_platform: string | null;
      }[]
    | null;
};

function normalizeJoinedRow<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatDate(timestamp: number | undefined) {
  if (!timestamp) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(timestamp));
}

function largestMultiKill(participant: RiotMatchParticipantDto) {
  if (participant.pentaKills > 0) return "Penta";
  if (participant.quadraKills > 0) return "Quadra";
  if (participant.tripleKills > 0) return "Triple";
  if (participant.doubleKills > 0) return "Doble";
  return null;
}

function participantItems(
  participant: RiotMatchParticipantDto,
  itemsMap: Map<string, { name: string; imageUrl: string }>,
) {
  return [
    participant.item0,
    participant.item1,
    participant.item2,
    participant.item3,
    participant.item4,
    participant.item5,
    participant.item6,
  ]
    .filter((itemId) => Number.isFinite(itemId) && itemId > 0)
    .map((itemId) => {
      const item = itemsMap.get(String(itemId));
      return {
        id: itemId,
        imageUrl: item?.imageUrl ?? null,
        name: item?.name ?? `Item ${itemId}`,
      };
    });
}

function participantSpells(
  participant: RiotMatchParticipantDto,
  summonerSpellsMap: Map<number, { name: string; imageUrl: string }>,
) {
  return [participant.summoner1Id, participant.summoner2Id]
    .filter((spellId) => Number.isFinite(spellId) && spellId > 0)
    .map((spellId) => {
      const spell = summonerSpellsMap.get(spellId);
      return {
        id: spellId,
        imageUrl: spell?.imageUrl ?? null,
        name: spell?.name ?? `Spell ${spellId}`,
      };
    });
}

function participantKda(participant: RiotMatchParticipantDto) {
  const deaths = participant.deaths || 0;
  if (deaths === 0) return "Perfect";
  return ((participant.kills + participant.assists) / deaths).toFixed(2);
}

function riotId(participant: RiotMatchParticipantDto) {
  if (participant.riotIdGameName && participant.riotIdTagline) {
    return `${participant.riotIdGameName}#${participant.riotIdTagline}`;
  }
  return "Invocador oculto";
}

function calculateOpScore(
  player: RiotMatchParticipantDto,
  teamStats: { kills: number; totalDamage: number; totalGold: number },
  gameDurationMinutes: number,
) {
  const kills = player.kills || 0;
  const deaths = Math.max(1, player.deaths || 0);
  const assists = player.assists || 0;
  const kda = (kills + assists) / deaths;
  const killParticipation = teamStats.kills > 0 ? (kills + assists) / teamStats.kills : 0;
  const cs = (player.totalMinionsKilled || 0) + (player.neutralMinionsKilled || 0);
  const csPerMinute = cs / gameDurationMinutes;
  const visionPerMinute = (player.visionScore || 0) / gameDurationMinutes;
  const damageShare = teamStats.totalDamage > 0 ? (player.totalDamageDealtToChampions || 0) / teamStats.totalDamage : 0;
  const goldShare = teamStats.totalGold > 0 ? (player.goldEarned || 0) / teamStats.totalGold : 0;
  const objectiveScore = Math.min(
    10,
    ((player.damageDealtToObjectives || 0) / 1000) +
      ((player.damageDealtToTurrets || 0) / 1000) +
      ((player.objectivesStolen || 0) * 2),
  );

  const kdaScore = Math.min(10, kda * 1.2);
  const kpScore = Math.min(10, killParticipation * 10);
  const damageScore = Math.min(10, damageShare * 40);
  const goldScore = Math.min(10, goldShare * 40);
  const csScore = Math.min(10, csPerMinute * 1.2);
  const visionScore = Math.min(10, visionPerMinute * 5);
  const winBonus = player.win ? 10 : 0;
  const opScore =
    kdaScore * 0.2 +
    kpScore * 0.15 +
    damageScore * 0.2 +
    goldScore * 0.12 +
    csScore * 0.1 +
    visionScore * 0.1 +
    objectiveScore * 0.05 +
    winBonus * 0.08;

  return Number(opScore.toFixed(2));
}

function teamStats(match: RiotMatchDto, teamId: number) {
  const players = match.info.participants.filter((item) => item.teamId === teamId);
  return {
    kills: players.reduce((sum, item) => sum + (item.kills || 0), 0),
    totalDamage: players.reduce((sum, item) => sum + (item.totalDamageDealtToChampions || 0), 0),
    totalGold: players.reduce((sum, item) => sum + (item.goldEarned || 0), 0),
  };
}

function opScoreMap(match: RiotMatchDto) {
  const gameDurationMinutes = Math.max(1, (match.info.gameDuration || 0) / 60);
  const statsByTeam = new Map([100, 200].map((teamId) => [teamId, teamStats(match, teamId)]));
  const scores = new Map<number, number>();

  match.info.participants.forEach((participant) => {
    scores.set(
      participant.participantId,
      calculateOpScore(
        participant,
        statsByTeam.get(participant.teamId) ?? { kills: 0, totalDamage: 0, totalGold: 0 },
        gameDurationMinutes,
      ),
    );
  });

  return scores;
}

function opAwards(match: RiotMatchDto, scores: Map<number, number>) {
  const bestByWin = (win: boolean) =>
    match.info.participants
      .filter((item) => item.win === win)
      .toSorted((a, b) => (scores.get(b.participantId) ?? 0) - (scores.get(a.participantId) ?? 0))[0]
      ?.participantId ?? null;

  return {
    aceParticipantId: bestByWin(false),
    mvpParticipantId: bestByWin(true),
  };
}

async function runWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function toHistoryItem(
  match: RiotMatchDto,
  participant: RiotMatchParticipantDto,
  champions: Map<number, { name: string; imageUrl: string }>,
  itemsMap: Map<string, { name: string; imageUrl: string }>,
  summonerSpellsMap: Map<number, { name: string; imageUrl: string }>,
): MatchHistoryItem {
  const champion = champions.get(participant.championId);
  const scores = opScoreMap(match);
  const awards = opAwards(match, scores);
  const team = match.info.teams.find((item) => item.teamId === participant.teamId);
  const teamKills = match.info.participants
    .filter((item) => item.teamId === participant.teamId)
    .reduce((sum, item) => sum + (item.kills || 0), 0);
  const creepScore = (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
  const minutes = Math.max(1, (match.info.gameDuration || 0) / 60);
  const killParticipation = teamKills > 0 ? Math.round(((participant.kills + participant.assists) / teamKills) * 100) : 0;
  const deaths = participant.deaths || 0;
  const participantToDetail = (item: RiotMatchParticipantDto): MatchHistoryParticipant => {
    const detailChampion = champions.get(item.championId);
    return {
      assists: item.assists || 0,
      championImageUrl: detailChampion?.imageUrl ?? null,
      championName: detailChampion?.name ?? item.championName,
      creepScore: (item.totalMinionsKilled || 0) + (item.neutralMinionsKilled || 0),
      damageDealtToChampions: item.totalDamageDealtToChampions || 0,
      deaths: item.deaths || 0,
      goldEarned: item.goldEarned || 0,
      items: participantItems(item, itemsMap),
      kda: participantKda(item),
      kills: item.kills || 0,
      lane: item.teamPosition || item.individualPosition || item.lane || "Sin rol",
      opLabel:
        item.participantId === awards.mvpParticipantId
          ? "MVP"
          : item.participantId === awards.aceParticipantId
            ? "ACE"
            : null,
      opScore: scores.get(item.participantId) ?? 0,
      participantId: item.participantId,
      puuid: item.puuid,
      riotId: riotId(item),
      selected: item.puuid === participant.puuid,
      summonerSpells: participantSpells(item, summonerSpellsMap),
      visionScore: item.visionScore || 0,
    };
  };

  return {
    id: match.metadata.matchId,
    championImageUrl: champion?.imageUrl ?? null,
    championName: champion?.name ?? participant.championName,
    creepScore,
    creepScorePerMinute: (creepScore / minutes).toFixed(1),
    damageDealtToChampions: participant.totalDamageDealtToChampions || 0,
    damageTaken: participant.totalDamageTaken || 0,
    dateLabel: formatDate(match.info.gameEndTimestamp ?? match.info.gameStartTimestamp ?? match.info.gameCreation),
    duration: formatDuration(match.info.gameDuration),
    gameMode: match.info.gameMode,
    goldEarned: participant.goldEarned || 0,
    items: participantItems(participant, itemsMap),
    kda: participantKda(participant),
    killParticipation,
    kills: participant.kills || 0,
    deaths,
    assists: participant.assists || 0,
    lane: participant.teamPosition || participant.individualPosition || participant.lane || "Sin rol",
    lpChange: typeof participant.challenges?.lpChange === "number" ? participant.challenges.lpChange : null,
    largestMultiKill: largestMultiKill(participant),
    matchId: match.metadata.matchId,
    queue: QUEUE_LABELS[match.info.queueId] ?? `Queue ${match.info.queueId}`,
    result: (team?.win ?? participant.win) ? "Victoria" : "Derrota",
    summonerSpells: participantSpells(participant, summonerSpellsMap),
    teams: [100, 200].map((teamId) => {
      const matchTeam = match.info.teams.find((item) => item.teamId === teamId);
      return {
        id: teamId,
        label: TEAM_LABELS[teamId] ?? `Equipo ${teamId}`,
        participants: match.info.participants
          .filter((item) => item.teamId === teamId)
          .map(participantToDetail),
        result: (matchTeam?.win ?? false) ? "Victoria" : "Derrota",
      };
    }),
    visionScore: participant.visionScore || 0,
    wardsKilled: participant.wardsKilled || 0,
    wardsPlaced: participant.wardsPlaced || 0,
  };
}

export type QueueFilter = "soloq" | "flex";
const QUEUE_IDS: Record<QueueFilter, number> = { soloq: 420, flex: 440 };

export async function getMatchHistory(groupAccountId: string, queue: QueueFilter = "soloq"): Promise<MatchHistoryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const { data: groupAccount, error: groupAccountError } = await supabase
    .from("group_accounts")
    .select("group_id, is_shared, profiles(full_name, email), riot_accounts(id, game_name, tag_line, puuid, routing_platform)")
    .eq("id", groupAccountId)
    .single();

  if (groupAccountError || !groupAccount) {
    return { error: "Cuenta no encontrada" };
  }

  const { data: isMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupAccount.group_id)
    .eq("user_id", user.id)
    .single();

  if (!isMember) {
    return { error: "No perteneces a este grupo" };
  }

  const row = groupAccount as unknown as AuthorizedAccountRow;
  const riotAccount = normalizeJoinedRow(row.riot_accounts);
  const profile = normalizeJoinedRow(row.profiles);

  if (!riotAccount?.game_name || !riotAccount?.tag_line) {
    return { error: "Cuenta sin Riot ID" };
  }

  const platform = riotAccount.routing_platform?.trim().toLowerCase();
  if (!platform) {
    return { error: "Cuenta sin region definida." };
  }

  const riotApiKey = await getStoredRiotApiKeyRecord();
  if (riotApiKey.error) return { error: riotApiKey.error };
  if (!riotApiKey.apiKey) return { error: "No hay una Riot API Key activa. Actualizala en Key." };

  try {
    let puuid = riotAccount.puuid;

    if (!puuid) {
      const accountInfo = await fetchRiotAccountByRiotId(riotAccount.game_name, riotAccount.tag_line, riotApiKey.apiKey);
      puuid = accountInfo.puuid;

      try {
        await createAdminClient()
          .from("riot_accounts")
          .update({
            game_name: accountInfo.gameName,
            last_name_updated_at: new Date().toISOString(),
            puuid: accountInfo.puuid,
            tag_line: accountInfo.tagLine,
          })
          .eq("id", riotAccount.id);
      } catch (error) {
        console.error("getMatchHistory puuid update:", error);
      }
    }

    const [champions, itemsMap, summonerSpellsMap, matchIds] = await Promise.all([
      getChampionsByKeyMap(),
      getItemsMap(),
      getSummonerSpellsMap(),
      fetchMatchIdsByPuuid(puuid, platform, riotApiKey.apiKey, 20, QUEUE_IDS[queue]),
    ]);

    const matches = await runWithConcurrency(matchIds, 3, async (matchId) => fetchMatchById(matchId, platform, riotApiKey.apiKey!));
    const history = matches.flatMap((match) => {
      const participant = match.info.participants.find((item) => item.puuid === puuid);
      if (!participant) return [];
      return [toHistoryItem(match, participant, champions, itemsMap, summonerSpellsMap)];
    });

    return {
      account: {
        id: groupAccountId,
        label: `${riotAccount.game_name}#${riotAccount.tag_line}`,
        ownerLabel: row.is_shared ? "Cuenta compartida" : profile?.full_name || profile?.email || "Miembro",
        region: routingPlatformToRegionLabel(platform),
        routingPlatform: platform,
      },
      error: null,
      matches: history,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("getMatchHistory:", error);
    return {
      error:
        error instanceof RiotApiRequestError
          ? error.message
          : "No se pudo consultar el historial de partidas.",
    };
  }
}

export type ParticipantRankInfo = { tier: string; division: string | null };

export async function getMatchParticipantTiers(
  puuids: string[],
  platform: string,
): Promise<Record<string, ParticipantRankInfo>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const riotApiKey = await getStoredRiotApiKeyRecord();
  if (riotApiKey.error || !riotApiKey.apiKey) return {};

  const results = await runWithConcurrency(puuids, 3, async (puuid) => {
    try {
      const stats = await fetchLeagueStatsByPuuid(puuid, platform, riotApiKey.apiKey!);
      const useSoloDuo = stats.soloDuo.tier !== "UNRANKED";
      const chosen = useSoloDuo ? stats.soloDuo : stats.flex;
      return { puuid, tier: chosen.tier ?? "UNRANKED", division: chosen.rank };
    } catch {
      return { puuid, tier: "UNRANKED", division: null };
    }
  });

  return Object.fromEntries(results.map((r) => [r.puuid, { tier: r.tier, division: r.division }]));
}
