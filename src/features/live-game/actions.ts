"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getChampionsByKeyMap, getRunesMap, getSummonerSpellsMap } from "@/lib/lol/ddragon";
import { getStoredRiotApiKeyRecord } from "@/lib/riot/api-key";
import {
  fetchLiveGameDetailsByPuuid,
  fetchRiotAccountByRiotId,
  RiotApiRequestError,
} from "@/lib/riot/client";
import { routingPlatformToRegionLabel } from "@/lib/riot/routing-platform";

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

function normalizeRiotAccount(row: AuthorizedAccountRow) {
  return Array.isArray(row.riot_accounts) ? row.riot_accounts[0] : row.riot_accounts;
}

function formatGameDuration(gameStartTime: number, fallbackSeconds: number) {
  const startMs = Number(gameStartTime);
  const elapsedSeconds =
    Number.isFinite(startMs) && startMs > 0
      ? Math.max(0, Math.floor((Date.now() - startMs) / 1000))
      : Math.max(0, Math.floor(fallbackSeconds));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export async function getLiveGameDetails(groupAccountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: groupAccount, error: groupAccountError } = await supabase
    .from("group_accounts")
    .select("group_id, riot_accounts(id, game_name, tag_line, puuid, routing_platform)")
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

  const riotAccount = normalizeRiotAccount(groupAccount as AuthorizedAccountRow);
  if (!riotAccount?.game_name || !riotAccount?.tag_line) {
    return { error: "Cuenta sin Riot ID" };
  }

  const platform = riotAccount.routing_platform?.trim().toLowerCase();
  if (!platform) {
    return { error: "Cuenta sin region definida." };
  }

  const riotApiKey = await getStoredRiotApiKeyRecord();
  if (riotApiKey.error) {
    return { error: riotApiKey.error };
  }
  if (!riotApiKey.apiKey) {
    return { error: "No hay una Riot API Key activa. Actualizala en Key." };
  }

  let puuid = riotAccount.puuid;

  try {
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
        console.error("getLiveGameDetails puuid update:", error);
      }
    }

    const liveGame = await fetchLiveGameDetailsByPuuid(puuid, platform, riotApiKey.apiKey);
    const adminSupabase = createAdminClient();
    await adminSupabase
      .from("riot_accounts")
      .update({
        is_in_game: Boolean(liveGame),
        live_game_checked_at: new Date().toISOString(),
      })
      .eq("id", riotAccount.id);
    revalidatePath("/");

    if (!liveGame) {
      return { inGame: false as const };
    }

    const [champions, runes, summonerSpells] = await Promise.all([
      getChampionsByKeyMap(),
      getRunesMap(),
      getSummonerSpellsMap(),
    ]);
    const participants = liveGame.participants.map((participant) => {
      const champion = champions.get(participant.championId);
      return {
        bot: participant.bot,
        championId: participant.championId,
        championImageUrl: champion?.imageUrl ?? null,
        championName: champion?.name ?? `Champion ${participant.championId}`,
        isSelectedAccount: participant.puuid === puuid,
        perks: (participant.perks?.perkIds?.slice(0, 2) ?? []).map((perkId) => {
          const rune = runes.get(perkId);
          return {
            id: perkId,
            imageUrl: rune?.imageUrl ?? null,
            name: rune?.name ?? `Runa ${perkId}`,
          };
        }),
        profileIconId: participant.profileIconId,
        puuid: participant.puuid,
        riotId: participant.riotId ?? "Invocador oculto",
        spells: [participant.spell1Id, participant.spell2Id].map((spellId) => {
          const spell = summonerSpells.get(spellId);
          return {
            id: spellId,
            imageUrl: spell?.imageUrl ?? null,
            name: spell?.name ?? `Spell ${spellId}`,
          };
        }),
        teamId: participant.teamId,
        teamLabel: TEAM_LABELS[participant.teamId] ?? `Equipo ${participant.teamId}`,
      };
    });

    return {
      inGame: true as const,
      game: {
        duration: formatGameDuration(liveGame.gameStartTime, liveGame.gameLength),
        gameId: liveGame.gameId.toString(),
        gameMode: liveGame.gameMode,
        mapId: liveGame.mapId,
        platform: routingPlatformToRegionLabel(platform),
        queue: QUEUE_LABELS[liveGame.gameQueueConfigId] ?? `Queue ${liveGame.gameQueueConfigId}`,
        teams: [100, 200].map((teamId) => ({
          id: teamId,
          label: TEAM_LABELS[teamId] ?? `Equipo ${teamId}`,
          participants: participants.filter((participant) => participant.teamId === teamId),
        })),
      },
    };
  } catch (error) {
    console.error("getLiveGameDetails:", error);
    return {
      error:
        error instanceof RiotApiRequestError
          ? error.message
          : "No se pudo consultar la partida en vivo.",
    };
  }
}
