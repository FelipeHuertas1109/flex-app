"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getChampionsByKeyMap, getItemsMap, getSummonerSpellsMap } from "@/lib/lol/ddragon";
import { getStoredRiotApiKeyRecord } from "@/lib/riot/api-key";
import {
  fetchLeagueStatsByPuuid,
  fetchMatchById,
  fetchMatchTimelineById,
  fetchMatchIdsByPuuid,
  fetchRiotAccountByRiotId,
  RiotApiRequestError,
  type RiotMatchDto,
  type RiotMatchParticipantDto,
} from "@/lib/riot/client";
import { routingPlatformToRegionLabel } from "@/lib/riot/routing-platform";
import { CacheService } from "@/lib/redis/cache";
import type {
  MatchHistoryAccount,
  MatchHistoryItem,
  MatchHistoryParticipant,
  MatchHistoryPreviewResult,
  MatchHistoryResult,
} from "@/features/match-history/types";

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

type AuthorizedRiotAccount = {
  id: string;
  game_name: string;
  tag_line: string;
  puuid: string | null;
  routing_platform: string | null;
};

type AuthorizedAccountRow = {
  group_id: string;
  is_shared: boolean | null;
  profiles: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
  riot_accounts: AuthorizedRiotAccount | AuthorizedRiotAccount[] | null;
};

type AuthorizedAccountResult =
  | {
      error: string;
    }
  | {
      error: null;
      groupAccount: AuthorizedAccountRow;
      profile: { full_name: string | null; email: string } | null | undefined;
      riotAccount: AuthorizedRiotAccount;
      row: AuthorizedAccountRow;
    };

type MatchHistoryPreviewEntry = Extract<MatchHistoryPreviewResult, { error: null }>["entries"][number];
type RankSnapshot = NonNullable<MatchHistoryParticipant["rankSnapshot"]>;

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

function rankQueueForQueueId(queueId: number) {
  return queueId === QUEUE_IDS.flex ? "RANKED_FLEX_SR" : "RANKED_SOLO_5x5";
}

function rankSnapshotFromStats(
  stats: Awaited<ReturnType<typeof fetchLeagueStatsByPuuid>>,
  queueId: number,
  snapshotAt: string,
): RankSnapshot {
  const queue = rankQueueForQueueId(queueId);
  const selected = queueId === QUEUE_IDS.flex ? stats.flex : stats.soloDuo;

  return {
    division: selected.rank,
    lp: selected.lp,
    queue,
    snapshotAt,
    tier: selected.tier ?? "UNRANKED",
  };
}

async function fetchRankSnapshotsByPuuid(
  puuids: string[],
  platform: string,
  apiKey: string,
  queueId: number,
): Promise<Map<string, RankSnapshot>> {
  const uniquePuuids = [...new Set(puuids.filter(Boolean))];
  const snapshotAt = new Date().toISOString();
  const rows = await runWithConcurrency(uniquePuuids, 3, async (puuid) => {
    try {
      const stats = await fetchLeagueStatsByPuuid(puuid, platform, apiKey);
      return { puuid, snapshot: rankSnapshotFromStats(stats, queueId, snapshotAt) };
    } catch (error) {
      console.error("fetchRankSnapshotsByPuuid:", error);
      return {
        puuid,
        snapshot: {
          division: null,
          lp: 0,
          queue: rankQueueForQueueId(queueId),
          snapshotAt,
          tier: "UNRANKED",
        },
      };
    }
  });

  return new Map(rows.map((row) => [row.puuid, row.snapshot]));
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
      rankSnapshot: null,
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
const QUEUE_FILTERS = Object.keys(QUEUE_IDS) as QueueFilter[];

async function getAuthorizedAccount(groupAccountId: string): Promise<AuthorizedAccountResult> {
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

  return { error: null, groupAccount: groupAccount as unknown as AuthorizedAccountRow, profile, riotAccount, row };
}

export async function getCachedMatchHistory(
  groupAccountId: string,
  queue: QueueFilter = "soloq",
  limit = 20,
): Promise<MatchHistoryResult> {
  const cacheKey = `matchHistory:${groupAccountId}:${queue}:${limit}`;
  const ttl = 60; // 1 minute in seconds

  return CacheService.getOrSet(cacheKey, ttl, async () => {
    const authorized = await getAuthorizedAccount(groupAccountId);
    if (authorized.error !== null) return { error: authorized.error };

    try {
      const platform = authorized.riotAccount.routing_platform?.trim().toLowerCase() ?? null;
      const admin = createAdminClient();
      const history = await readMatchHistoryFromDb(
        authorized.riotAccount.id,
        QUEUE_IDS[queue],
        authorized.riotAccount.puuid ?? "",
        admin,
        limit,
      );

      return {
        account: {
          id: groupAccountId,
          label: `${authorized.riotAccount.game_name}#${authorized.riotAccount.tag_line}`,
          ownerLabel: authorized.row.is_shared
            ? "Cuenta compartida"
            : authorized.profile?.full_name || authorized.profile?.email || "Miembro",
          region: platform ? routingPlatformToRegionLabel(platform) : "Sin region",
          routingPlatform: platform,
        },
        error: null,
        matches: history,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("getCachedMatchHistory:", error);
      return { error: "No se pudo leer el historial guardado." };
    }
  });
}

async function syncSelectedMatchHistoryInternal(
  groupAccountId: string,
  queue: QueueFilter = "soloq",
): Promise<MatchHistoryResult> {
  const authorized = await getAuthorizedAccount(groupAccountId);
  if (authorized.error !== null) return { error: authorized.error };

  const { profile, riotAccount, row } = authorized;
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
        console.error("syncSelectedMatchHistory puuid update:", error);
      }
    }

    const admin = createAdminClient();

    const { data: dbRows } = await admin
      .from("matches")
      .select("match_id")
      .eq("riot_account_id", riotAccount.id)
      .eq("queue_id", QUEUE_IDS[queue]);

    const cachedIds = new Set(dbRows?.map((r) => r.match_id as string) ?? []);

    const [champions, itemsMap, summonerSpellsMap, riotMatchIds] = await Promise.all([
      getChampionsByKeyMap(),
      getItemsMap(),
      getSummonerSpellsMap(),
      fetchMatchIdsByPuuid(puuid, platform, riotApiKey.apiKey, 20, QUEUE_IDS[queue]),
    ]);

    const newMatchIds = riotMatchIds.filter((id) => !cachedIds.has(id));

    if (newMatchIds.length > 0) {
      const newRiotMatches = await runWithConcurrency(
        newMatchIds,
        3,
        async (matchId) => fetchMatchById(matchId, platform, riotApiKey.apiKey!),
      );
      const participantPuuids = newRiotMatches.flatMap((match) => match.info.participants.map((participant) => participant.puuid));
      const rankSnapshots = await fetchRankSnapshotsByPuuid(participantPuuids, platform, riotApiKey.apiKey, QUEUE_IDS[queue]);
      await upsertMatchesToDb(newRiotMatches, riotAccount.id, puuid, champions, itemsMap, summonerSpellsMap, platform, admin, rankSnapshots);
    }

    const history = await readMatchHistoryFromDb(riotAccount.id, QUEUE_IDS[queue], puuid, admin);

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
    console.error("syncSelectedMatchHistory:", error);
    return {
      error:
        error instanceof RiotApiRequestError
          ? error.message
          : "No se pudo actualizar el historial de partidas.",
    };
  }
}

export async function syncSelectedMatchHistory(groupAccountId: string, queue: QueueFilter = "soloq"): Promise<MatchHistoryResult> {
  return syncSelectedMatchHistoryInternal(groupAccountId, queue);
}

export async function getMatchHistory(groupAccountId: string, queue: QueueFilter = "soloq"): Promise<MatchHistoryResult> {
  return getCachedMatchHistory(groupAccountId, queue);
}

export async function getGroupMatchHistoryPreview(groupId: string, limit = 3): Promise<MatchHistoryPreviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  const { data: isMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!isMember) {
    return { error: "No perteneces a este grupo" };
  }

  try {
    const admin = createAdminClient();
    const { data: accountsData, error: accountsError } = await admin
      .from("group_accounts")
      .select("id, riot_accounts(id, puuid)")
      .eq("group_id", groupId);

    if (accountsError) return { error: "No se pudieron leer las cuentas del grupo." };

    const accountRows = (accountsData ?? []).flatMap((row) => {
      const riot = normalizeJoinedRow(row.riot_accounts as { id: string; puuid: string | null } | { id: string; puuid: string | null }[] | null);
      return riot?.id ? [{ groupAccountId: row.id as string, riotAccountId: riot.id, puuid: riot.puuid ?? "" }] : [];
    });

    const entries: MatchHistoryPreviewEntry[] = [];

    await Promise.all(accountRows.map(async (account) => {
      await Promise.all(QUEUE_FILTERS.map(async (queueFilter) => {
        const result = await readMatchHistoryFromDb(
          account.riotAccountId,
          QUEUE_IDS[queueFilter],
          account.puuid,
          admin,
          limit,
        );
        entries.push({
          accountId: account.groupAccountId,
          matches: result,
          queue: queueFilter,
        });
      }));
    }));

    return { entries, error: null, updatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("getGroupMatchHistoryPreview:", error);
    return { error: "No se pudo precargar el historial guardado." };
  }
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function upsertMatchesToDb(
  riotMatches: RiotMatchDto[],
  riotAccountId: string,
  selectedPuuid: string,
  champions: Map<number, { name: string; imageUrl: string }>,
  itemsMap: Map<string, { name: string; imageUrl: string }>,
  summonerSpellsMap: Map<number, { name: string; imageUrl: string }>,
  platform: string,
  admin: AdminClient,
  rankSnapshots: Map<string, RankSnapshot>,
): Promise<void> {
  const matchRows = [];
  const participantRows = [];

  for (const match of riotMatches) {
    const participant = match.info.participants.find((p) => p.puuid === selectedPuuid);
    if (!participant) continue;

    const historyItem = toHistoryItem(match, participant, champions, itemsMap, summonerSpellsMap);
    const queueId = match.info.queueId;
    const playedAt = match.info.gameEndTimestamp
      ? new Date(match.info.gameEndTimestamp).toISOString()
      : new Date(match.info.gameStartTimestamp ?? match.info.gameCreation ?? 0).toISOString();

    matchRows.push({
      riot_account_id: riotAccountId,
      match_id: historyItem.matchId,
      queue_id: queueId,
      queue_label: historyItem.queue,
      game_duration: match.info.gameDuration,
      game_mode: match.info.gameMode,
      platform,
      champion: historyItem.championName,
      champion_image_url: historyItem.championImageUrl,
      lane_role: historyItem.lane,
      win: historyItem.result === "Victoria",
      kills: historyItem.kills,
      deaths: historyItem.deaths,
      assists: historyItem.assists,
      cs: historyItem.creepScore,
      cs_per_minute: historyItem.creepScorePerMinute,
      kda: historyItem.kda,
      kill_participation: historyItem.killParticipation,
      op_score: null,
      op_label: null,
      lp_change: historyItem.lpChange,
      damage: historyItem.damageDealtToChampions,
      damage_taken: historyItem.damageTaken,
      gold: historyItem.goldEarned,
      vision: historyItem.visionScore,
      wards_placed: historyItem.wardsPlaced,
      wards_killed: historyItem.wardsKilled,
      largest_multi_kill: historyItem.largestMultiKill,
      items: historyItem.items,
      summoner_spells: historyItem.summonerSpells,
      played_at: playedAt,
    });

    participantRows.push(...historyItem.teams.flatMap((team) =>
      team.participants.map((p) => ({
        match_id: historyItem.matchId,
        puuid: p.puuid,
        riot_id: p.riotId,
        champion_name: p.championName,
        champion_image_url: p.championImageUrl,
        team_id: team.id,
        win: team.result === "Victoria",
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        cs: p.creepScore,
        damage_dealt: p.damageDealtToChampions,
        gold_earned: p.goldEarned,
        vision_score: p.visionScore,
        op_score: p.opScore,
        op_label: p.opLabel,
        lane: p.lane,
        kda: p.kda,
        items: p.items,
        rank_division: rankSnapshots.get(p.puuid)?.division ?? null,
        rank_lp: rankSnapshots.get(p.puuid)?.lp ?? null,
        rank_queue: rankSnapshots.get(p.puuid)?.queue ?? rankQueueForQueueId(queueId),
        rank_snapshot_at: rankSnapshots.get(p.puuid)?.snapshotAt ?? null,
        rank_tier: rankSnapshots.get(p.puuid)?.tier ?? "UNRANKED",
        summoner_spells: p.summonerSpells,
      })),
    ));
  }

  if (matchRows.length > 0) {
    const { error } = await admin.from("matches").upsert(matchRows, { onConflict: "riot_account_id,match_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  if (participantRows.length > 0) {
    const { error } = await admin.from("match_participants").upsert(participantRows, { onConflict: "match_id,puuid", ignoreDuplicates: true });
    if (error) throw error;
  }
}

async function readMatchHistoryFromDb(
  riotAccountId: string,
  queueId: number,
  selectedPuuid: string,
  admin: AdminClient,
  limit = 20,
): Promise<MatchHistoryItem[]> {
  const { data: matchRows } = await admin
    .from("matches")
    .select("*")
    .eq("riot_account_id", riotAccountId)
    .eq("queue_id", queueId)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (!matchRows?.length) return [];

  const matchIds = matchRows.map((r) => r.match_id as string);

  const { data: participantRows } = await admin
    .from("match_participants")
    .select("*")
    .in("match_id", matchIds);

  const participantsByMatch = new Map<string, typeof participantRows>();
  for (const p of participantRows ?? []) {
    const list = participantsByMatch.get(p.match_id) ?? [];
    list.push(p);
    participantsByMatch.set(p.match_id, list);
  }

  return matchRows.map((row): MatchHistoryItem => {
    const allParticipants = participantsByMatch.get(row.match_id) ?? [];

    const teams = [100, 200].map((teamId) => {
      const teamPs = allParticipants.filter((p) => p.team_id === teamId);
      const teamWin = teamPs[0]?.win ?? false;
      return {
        id: teamId,
        label: TEAM_LABELS[teamId] ?? String(teamId),
        result: (teamWin ? "Victoria" : "Derrota") as "Victoria" | "Derrota",
        participants: teamPs.map((p): MatchHistoryParticipant => ({
          assists: p.assists ?? 0,
          championImageUrl: p.champion_image_url ?? null,
          championName: p.champion_name ?? "",
          creepScore: p.cs ?? 0,
          damageDealtToChampions: p.damage_dealt ?? 0,
          deaths: p.deaths ?? 0,
          goldEarned: p.gold_earned ?? 0,
          items: (p.items as MatchHistoryParticipant["items"]) ?? [],
          kda: p.kda ?? "0.00",
          kills: p.kills ?? 0,
          lane: p.lane ?? "",
          opLabel: (p.op_label as "MVP" | "ACE" | null) ?? null,
          opScore: p.op_score ?? 0,
          participantId: 0,
          puuid: p.puuid ?? "",
          rankSnapshot: p.rank_tier
            ? {
                division: p.rank_division ?? null,
                lp: p.rank_lp ?? null,
                queue: p.rank_queue ?? null,
                snapshotAt: p.rank_snapshot_at ?? null,
                tier: p.rank_tier,
              }
            : null,
          riotId: p.riot_id ?? "",
          selected: p.puuid === selectedPuuid,
          summonerSpells: (p.summoner_spells as MatchHistoryParticipant["summonerSpells"]) ?? [],
          visionScore: p.vision_score ?? 0,
        })),
      };
    });

    const gameEndTs = row.played_at ? new Date(row.played_at as string).getTime() : 0;

    return {
      id: row.match_id,
      championImageUrl: row.champion_image_url ?? null,
      championName: row.champion ?? "",
      creepScore: row.cs ?? 0,
      creepScorePerMinute: row.cs_per_minute ?? "0.0",
      damageDealtToChampions: row.damage ?? 0,
      damageTaken: row.damage_taken ?? 0,
      dateLabel: formatDate(gameEndTs),
      duration: formatDuration(row.game_duration ?? 0),
      gameMode: row.game_mode ?? "",
      goldEarned: row.gold ?? 0,
      items: (row.items as MatchHistoryItem["items"]) ?? [],
      kda: row.kda ?? "0.00",
      killParticipation: row.kill_participation ?? 0,
      kills: row.kills ?? 0,
      deaths: row.deaths ?? 0,
      assists: row.assists ?? 0,
      lane: row.lane_role ?? "",
      lpChange: row.lp_change ?? null,
      largestMultiKill: row.largest_multi_kill ?? null,
      matchId: row.match_id,
      queue: row.queue_label ?? "",
      result: row.win ? "Victoria" : "Derrota",
      summonerSpells: (row.summoner_spells as MatchHistoryItem["summonerSpells"]) ?? [],
      teams,
      visionScore: row.vision ?? 0,
      wardsKilled: row.wards_killed ?? 0,
      wardsPlaced: row.wards_placed ?? 0,
    };
  });
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

export async function getMatchHistoryItem(
  groupAccountId: string,
  queue: QueueFilter,
  matchId: string,
): Promise<{ account?: MatchHistoryAccount; error?: string; match?: MatchHistoryItem }> {
  const result = await getMatchHistory(groupAccountId, queue);
  if (!("matches" in result)) return { error: result.error };

  const match = result.matches.find((item: MatchHistoryItem) => item.matchId === matchId);
  if (!match) {
    return { error: "No se encontro la partida solicitada para esta cuenta/cola." };
  }

  return { account: result.account, match };
}

type DeepAnalysis = {
  damageByPlayer: { championName: string; damage: number; participantId: number; riotId: string; teamId: number }[];
  goldAdvantage: { goldDiff: number; minute: number }[];
  itemTimeline: { itemId: number; itemImageUrl: string | null; itemName: string; minute: number }[];
  summary: {
    csPerMinute: number;
    gold: number;
    killParticipation: number;
    kda: string;
    role: string;
    visionScore: number;
  };
  teamObjectives: {
    blue: { baron: number; dragon: number; herald: number; inhibitor: number; tower: number };
    red: { baron: number; dragon: number; herald: number; inhibitor: number; tower: number };
  };
};

export async function getMatchDeepAnalysis(
  groupAccountId: string,
  queue: QueueFilter,
  matchId: string,
): Promise<{ account?: MatchHistoryAccount; error?: string; match?: MatchHistoryItem; analysis?: DeepAnalysis }> {
  const basic = await getMatchHistoryItem(groupAccountId, queue, matchId);
  if (basic.error || !basic.match || !basic.account) return { error: basic.error ?? "No se pudo cargar la partida" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: groupAccount } = await supabase
    .from("group_accounts")
    .select("group_id, riot_accounts(puuid, routing_platform)")
    .eq("id", groupAccountId)
    .single();
  if (!groupAccount) return { error: "Cuenta no encontrada" };

  const { data: isMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupAccount.group_id)
    .eq("user_id", user.id)
    .single();
  if (!isMember) return { error: "No perteneces a este grupo" };

  const riotAccRaw = normalizeJoinedRow(groupAccount.riot_accounts as { puuid: string | null; routing_platform: string | null } | { puuid: string | null; routing_platform: string | null }[] | null);
  const puuid = riotAccRaw?.puuid;
  const platform = riotAccRaw?.routing_platform?.toLowerCase() ?? null;
  if (!puuid || !platform) return { error: "Cuenta sin PUUID o region valida." };

  const riotApiKey = await getStoredRiotApiKeyRecord();
  if (riotApiKey.error || !riotApiKey.apiKey) return { error: riotApiKey.error ?? "No hay Riot API Key activa." };

  try {
    const [matchRaw, timeline, itemsMap] = await Promise.all([
      fetchMatchById(matchId, platform, riotApiKey.apiKey),
      fetchMatchTimelineById(matchId, platform, riotApiKey.apiKey),
      getItemsMap(),
    ]);
    const participant = matchRaw.info.participants.find((p) => p.puuid === puuid);
    if (!participant) return { error: "No se encontro al jugador dentro de la partida." };

    const teamKills = matchRaw.info.participants
      .filter((p) => p.teamId === participant.teamId)
      .reduce((sum, p) => sum + (p.kills || 0), 0);
    const summary = {
      csPerMinute: Number((((participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0)) / Math.max(1, (matchRaw.info.gameDuration || 0) / 60)).toFixed(2)),
      gold: participant.goldEarned || 0,
      killParticipation: teamKills > 0 ? Math.round(((participant.kills + participant.assists) / teamKills) * 100) : 0,
      kda: participantKda(participant),
      role: participant.teamPosition || participant.individualPosition || participant.lane || "Sin rol",
      visionScore: participant.visionScore || 0,
    };

    const teamByParticipantId = new Map(matchRaw.info.participants.map((p) => [p.participantId, p.teamId]));
    const goldAdvantage = timeline.info.frames.map((frame) => {
      let blue = 0;
      let red = 0;
      Object.values(frame.participantFrames ?? {}).forEach((entry) => {
        const teamId = teamByParticipantId.get(entry.participantId) ?? 100;
        const gold = entry.totalGold ?? 0;
        if (teamId === 100) blue += gold;
        else red += gold;
      });
      return {
        goldDiff: blue - red,
        minute: Math.round((frame.timestamp || 0) / 60000),
      };
    });

    const selectedParticipantId = participant.participantId;
    const itemTimeline = timeline.info.frames.flatMap((frame) =>
      (frame.events ?? [])
        .filter((event) =>
          typeof event === "object" &&
          event !== null &&
          (event as { type?: string }).type === "ITEM_PURCHASED" &&
          (event as { participantId?: number }).participantId === selectedParticipantId &&
          typeof (event as { itemId?: number }).itemId === "number",
        )
        .map((event) => {
          const itemId = (event as { itemId: number }).itemId;
          const item = itemsMap.get(String(itemId));
          return {
            itemId,
            itemImageUrl: item?.imageUrl ?? null,
            itemName: item?.name ?? `Item #${itemId}`,
            minute: Math.round(((event as { timestamp?: number }).timestamp ?? frame.timestamp) / 60000),
          };
        }),
    );

    const team100 = matchRaw.info.teams.find((t) => t.teamId === 100);
    const team200 = matchRaw.info.teams.find((t) => t.teamId === 200);
    const objectives = {
      blue: {
        baron: team100?.objectives?.baron?.kills ?? 0,
        dragon: team100?.objectives?.dragon?.kills ?? 0,
        herald: team100?.objectives?.riftHerald?.kills ?? 0,
        inhibitor: team100?.objectives?.inhibitor?.kills ?? 0,
        tower: team100?.objectives?.tower?.kills ?? 0,
      },
      red: {
        baron: team200?.objectives?.baron?.kills ?? 0,
        dragon: team200?.objectives?.dragon?.kills ?? 0,
        herald: team200?.objectives?.riftHerald?.kills ?? 0,
        inhibitor: team200?.objectives?.inhibitor?.kills ?? 0,
        tower: team200?.objectives?.tower?.kills ?? 0,
      },
    };

    const damageByPlayer = matchRaw.info.participants.map((p) => ({
      championName: p.championName,
      damage: p.totalDamageDealtToChampions || 0,
      participantId: p.participantId,
      riotId: riotId(p),
      teamId: p.teamId,
    }));

    return {
      account: basic.account,
      analysis: {
        damageByPlayer,
        goldAdvantage,
        itemTimeline,
        summary,
        teamObjectives: objectives,
      },
      match: basic.match,
    };
  } catch (error) {
    return {
      error:
        error instanceof RiotApiRequestError
          ? error.message
          : "No se pudo calcular el analisis profundo de la partida.",
    };
  }
}
