"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoredRiotApiKeyRecord } from "@/lib/riot/api-key";
import { fetchLiveGameByPuuid, fetchLeagueStatsByPuuid, fetchRiotAccountByRiotId, RiotApiRequestError } from "@/lib/riot/client";
import { cleanRiotIdPart } from "@/lib/riot/format";
import { revalidatePath } from "next/cache";

const VALID_ROUTING_PLATFORMS = new Set([
  "la1",
  "la2",
  "br1",
  "na1",
  "euw1",
  "eun1",
  "kr",
  "jp1",
  "oc1",
  "tr1",
  "ru",
]);

function normalizeRoutingPlatform(value: FormDataEntryValue | null) {
  const platform = typeof value === "string" ? value.trim().toLowerCase() : "";
  return VALID_ROUTING_PLATFORMS.has(platform) ? platform : null;
}

function normalizeSavedRoutingPlatform(value: string | null | undefined) {
  const platform = value?.trim().toLowerCase() ?? "";
  return VALID_ROUTING_PLATFORMS.has(platform) ? platform : null;
}

async function syncRiotAccountById(
  riotAccount: {
    id: string;
    game_name: string;
    tag_line: string;
    puuid: string | null;
    routing_platform: string | null;
    last_name_updated_at: string | null;
    last_synced_at: string | null;
    live_game_checked_at: string | null;
  },
  apiKey: string,
  isManual: boolean = false
) {
  const savedRoutingPlatform = normalizeSavedRoutingPlatform(riotAccount.routing_platform);
  if (!savedRoutingPlatform) {
    return { ok: false as const, error: "Cuenta sin region definida." };
  }

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { ok: false as const, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const now = new Date();
  const ONE_MINUTE = 60 * 1000;
  
  // Limites de actualizacion
  const LIVE_GAME_THRESHOLD = isManual ? 20 * 1000 : 5 * ONE_MINUTE;
  const STATS_THRESHOLD = isManual ? ONE_MINUTE : 10 * ONE_MINUTE;

  let currentPuuid = riotAccount.puuid;
  let currentGameName = riotAccount.game_name;
  let currentTagLine = riotAccount.tag_line;
  const updates: Record<string, boolean | number | string | null> = {};
  const syncIssues = new Set<string>();

  const needsNameSync = !currentPuuid;

  try {
    // 1. Account API (PUUID y Nombre)
    // Solo ocurre si no hay PUUID. Al cambiar la API Key globalmente, se limpian estos PUUIDs
    // para forzar la re-sincronizacion.
    if (needsNameSync) {
      // Siempre buscaremos por Riot ID si el PUUID es nulo
      // Primera vez buscando PUUID a partir del Riot ID actual
      const accInfo = await fetchRiotAccountByRiotId(currentGameName, currentTagLine, apiKey);
      currentPuuid = accInfo.puuid;
      currentGameName = accInfo.gameName;
      currentTagLine = accInfo.tagLine;
      updates.puuid = accInfo.puuid;
      updates.game_name = accInfo.gameName;
      updates.tag_line = accInfo.tagLine;
      updates.last_name_updated_at = now.toISOString();
    }
  } catch (error) {
    console.error(`Error Account API para ${currentGameName}#${currentTagLine}:`, error);
    // Si falla y no tenemos PUUID todavia, no podemos continuar con el resto
    if (!currentPuuid) {
      return { ok: false as const, error: error instanceof RiotApiRequestError ? error.message : "Error encontrando el Riot ID global." };
    }
  }

  // 2. League API (Rangos)
  const timeSinceStatsSync = now.getTime() - (riotAccount.last_synced_at ? new Date(riotAccount.last_synced_at).getTime() : 0);
  if (timeSinceStatsSync > STATS_THRESHOLD) {
    try {
      const stats = await fetchLeagueStatsByPuuid(currentPuuid!, savedRoutingPlatform, apiKey);
      updates.tier = stats.flex.tier;
      updates.rank = stats.flex.rank;
      updates.lp = stats.flex.lp;
      updates.win_rate = stats.flex.winRate;
      updates.total_games = stats.flex.totalGames;
      updates.solo_tier = stats.soloDuo.tier;
      updates.solo_rank = stats.soloDuo.rank;
      updates.solo_lp = stats.soloDuo.lp;
      updates.solo_win_rate = stats.soloDuo.winRate;
      updates.solo_total_games = stats.soloDuo.totalGames;
      updates.last_synced_at = now.toISOString();
    } catch (error) {
      console.error(`Error League API para ${currentGameName}#${currentTagLine}:`, error);
      syncIssues.add(error instanceof RiotApiRequestError ? error.message : "No se pudieron actualizar los rangos.");
    }
  }

  // 3. Spectator API (Partida en Vivo)
  const timeSinceLiveCheck = now.getTime() - (riotAccount.live_game_checked_at ? new Date(riotAccount.live_game_checked_at).getTime() : 0);
  if (timeSinceLiveCheck > LIVE_GAME_THRESHOLD) {
    try {
      const isInGame = await fetchLiveGameByPuuid(currentPuuid!, savedRoutingPlatform, apiKey);
      updates.is_in_game = isInGame;
      updates.live_game_checked_at = now.toISOString();
    } catch (error) {
      console.error(`Error Spectator API para ${currentGameName}#${currentTagLine}:`, error);
      syncIssues.add(error instanceof RiotApiRequestError ? error.message : "No se pudo revisar la partida en vivo.");
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await adminSupabase
      .from("riot_accounts")
      .update(updates)
      .eq("id", riotAccount.id);

    if (error) {
      console.error("Error sincronizando riot_accounts en BD:", error);
      return { ok: false as const, error: "No se pudo guardar la sincronizacion parcial o total." };
    }
  }

  if (syncIssues.size > 0) {
    return { ok: false as const, error: [...syncIssues].join(" ") };
  }

  return { ok: true as const };
}

async function getAuthorizedGroupAccount(groupAccountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" as const };
  }

  const { data: groupAccount, error: groupAccountError } = await supabase
    .from("group_accounts")
    .select("id, group_id, riot_account_id")
    .eq("id", groupAccountId)
    .single();

  if (groupAccountError || !groupAccount) {
    return { error: "Cuenta no encontrada" as const };
  }

  const { data: isMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupAccount.group_id)
    .eq("user_id", user.id)
    .single();

  if (!isMember) {
    return { error: "No perteneces a este grupo" as const };
  }

  return { groupAccount };
}

export async function addAccount(groupId: string, formData: FormData) {
  const gameName = cleanRiotIdPart((formData.get("gameName") as string) ?? "");
  const tagLine = cleanRiotIdPart((formData.get("tagLine") as string) ?? "").toUpperCase();
  const routingPlatform = normalizeRoutingPlatform(formData.get("routingPlatform"));
  const isShared = formData.get("ownershipMode") === "shared";
  const accountUser = (formData.get("accountUser") as string)?.trim() ?? "";
  const accountPsw = (formData.get("accountPsw") as string)?.trim() ?? "";

  if (!gameName || !tagLine) {
    return { error: "Riot ID (Nombre y Tag) son obligatorios" };
  }

  if (!routingPlatform) {
    return { error: "Selecciona una region valida" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "No autorizado" };

  // Verificar que el usuario pertenece al grupo
  const { data: isMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!isMember) {
    return { error: "No perteneces a este grupo" };
  }

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  // 1. Insertar o recuperar el registro unico principal (riot_account)
  let riotAccountId;
  
  const { data: existingRiotAccount } = await supabase
    .from("riot_accounts")
    .select("id, routing_platform, puuid, last_name_updated_at, last_synced_at")
    .eq("game_name", gameName)
    .eq("tag_line", tagLine)
    .single();

  if (existingRiotAccount) {
    riotAccountId = existingRiotAccount.id;
    if (existingRiotAccount.routing_platform !== routingPlatform) {
      await adminSupabase
        .from("riot_accounts")
        .update({ routing_platform: routingPlatform })
        .eq("id", riotAccountId);
    }
  } else {
    const { data: newRiotAccount, error: riotError } = await supabase
      .from("riot_accounts")
      .insert({ game_name: gameName, tag_line: tagLine, routing_platform: routingPlatform })
      .select()
      .single();

    if (riotError || !newRiotAccount) return { error: "Error creando registro Riot" };
    riotAccountId = newRiotAccount.id;
  }

  const riotApiKey = await getStoredRiotApiKeyRecord();
  
  // Cuando se añade, usamos un objeto dummy para forzar update inmediato de sus datos iniciales
  const dummyAccountState = {
    id: riotAccountId,
    game_name: gameName,
    tag_line: tagLine,
    puuid: existingRiotAccount?.puuid ?? null,
    routing_platform: routingPlatform,
    last_name_updated_at: existingRiotAccount?.last_name_updated_at ?? null,
    last_synced_at: existingRiotAccount?.last_synced_at ?? null,
    live_game_checked_at: null, // Forzar check in-game
  };

  const syncResult =
    riotApiKey.apiKey && !riotApiKey.error
      ? await syncRiotAccountById(dummyAccountState, riotApiKey.apiKey, true)
      : { ok: false as const, error: riotApiKey.error ?? "No hay una Riot API Key activa. Actualizala en Key." };

  // 2. Relacionar la cuenta con el grupo (service role: mismas reglas que update/delete;
  // el INSERT con anon a veces falla por RLS o por columnas nuevas en entornos desalineados)
  const { error } = await adminSupabase.from("group_accounts").insert({
    group_id: groupId,
    user_id: user.id,
    is_shared: isShared,
    riot_account_id: riotAccountId,
    custom_name: null,
    credential_user: accountUser || null,
    credential_psw: accountPsw || null,
  });

  if (error) {
    console.error("addAccount group_accounts insert:", error.code, error.message, error.details);
    if (error.code === "23505") {
      return { error: "Esta cuenta ya esta registrada en este grupo" };
    }
    if (error.code === "23503") {
      return {
        error:
          "No se pudo vincular la cuenta (perfil o grupo invalido). Cierra sesion y vuelve a entrar.",
      };
    }
    if (
      error.code === "42703" ||
      (typeof error.message === "string" &&
        (error.message.includes("credential_") || error.message.includes("is_shared")))
    ) {
      return {
        error:
          "Faltan columnas de cuentas en la base de datos. Ejecuta las migraciones Supabase correspondientes.",
      };
    }
    return { error: "Error al agregar cuenta" };
  }

  revalidatePath("/");
  if (!syncResult.ok) console.warn("Sync inicial de cuenta fallido:", syncResult.error);
  return { success: true };
}

export async function syncAllAccounts(groupId: string, isManual: boolean = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: isMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!isMember) {
    return { error: "No perteneces a este grupo" };
  }

  const riotApiKey = await getStoredRiotApiKeyRecord();
  if (riotApiKey.error) {
    return { error: riotApiKey.error };
  }
  if (!riotApiKey.apiKey) {
    return { error: "No hay una Riot API Key activa. Actualizala en Key antes de sincronizar." };
  }
  const activeRiotApiKey = riotApiKey.apiKey;

  const { data: accounts, error } = await supabase
    .from("group_accounts")
    .select("riot_account_id, riot_accounts(id, game_name, tag_line, puuid, routing_platform, last_name_updated_at, last_synced_at, live_game_checked_at)")
    .eq("group_id", groupId);

  if (error || !accounts) {
    return { error: "No se pudieron cargar las cuentas del grupo" };
  }

  const syncOneAccount = async (account: (typeof accounts)[number]) => {
    const riotAccount = Array.isArray(account.riot_accounts)
      ? account.riot_accounts[0]
      : account.riot_accounts;

    if (!riotAccount?.game_name || !riotAccount?.tag_line) {
      return { ok: false, label: "Cuenta sin Riot ID" };
    }

    const label = `${riotAccount.game_name}#${riotAccount.tag_line}`;
    try {
      const syncResult = await syncRiotAccountById(
        riotAccount,
        activeRiotApiKey,
        isManual
      );

      return { ok: syncResult.ok, label, error: syncResult.ok ? undefined : syncResult.error };
    } catch (error) {
      console.error(`Sync fallido para ${label}:`, error);
      return { ok: false, label, error: "Error inesperado durante la sincronizacion" };
    }
  };

  const results = await runWithConcurrency(accounts, 2, syncOneAccount, (account) => {
    const riotAccount = Array.isArray(account.riot_accounts)
      ? account.riot_accounts[0]
      : account.riot_accounts;
    const label = riotAccount?.game_name && riotAccount?.tag_line
      ? `${riotAccount.game_name}#${riotAccount.tag_line}`
      : "Cuenta sin Riot ID";
    return { ok: false, label, error: "Error inesperado durante la sincronizacion" };
  });
  const synced = results.filter((result) => result.ok).length;
  const failed = results.length - synced;
  const failedAccounts = results
    .filter((result) => !result.ok)
    .map((result) => ({
      label: result.label,
      error: result.error ?? "No se pudo sincronizar",
    }));

  revalidatePath("/");
  return { success: true, synced, failed, failedAccounts };
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
  onError: (item: T, error: unknown) => R,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        results[index] = await task(items[index]);
      } catch (error) {
        console.error("Error en tarea concurrente:", error);
        results[index] = onError(items[index], error);
      }
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function updateAccount(groupAccountId: string, formData: FormData) {
  const ownerId = (formData.get("ownerId") as string)?.trim();
  const routingPlatform = normalizeRoutingPlatform(formData.get("routingPlatform"));
  const isShared = ownerId === "__shared__";
  const accountUser = (formData.get("accountUser") as string)?.trim() ?? "";
  const accountPsw = (formData.get("accountPsw") as string)?.trim() ?? "";
  if (!ownerId) return { error: "Selecciona un dueno valido" };
  if (!routingPlatform) return { error: "Selecciona una region valida" };

  const authCheck = await getAuthorizedGroupAccount(groupAccountId);
  if ("error" in authCheck) return { error: authCheck.error };
  const { groupAccount } = authCheck;

  if (!isShared) {
    const supabase = await createClient();
    const { data: ownerMembership } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupAccount.group_id)
      .eq("user_id", ownerId)
      .single();

    if (!ownerMembership) return { error: "El dueno debe pertenecer al grupo" };
  }

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const { error } = await adminSupabase
    .from("group_accounts")
    .update({
      ...(isShared ? {} : { user_id: ownerId }),
      is_shared: isShared,
      credential_user: accountUser || null,
      credential_psw: accountPsw || null,
    })
    .eq("id", groupAccountId);

  if (error) {
    return { error: "No se pudo actualizar la cuenta" };
  }

  const { error: riotAccountError } = await adminSupabase
    .from("riot_accounts")
    .update({ routing_platform: routingPlatform })
    .eq("id", groupAccount.riot_account_id);

  if (riotAccountError) {
    return { error: "No se pudo actualizar la region" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteAccount(groupAccountId: string) {
  const authCheck = await getAuthorizedGroupAccount(groupAccountId);
  if ("error" in authCheck) return { error: authCheck.error };
  const { groupAccount } = authCheck;

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const { error } = await adminSupabase
    .from("group_accounts")
    .delete()
    .eq("id", groupAccountId);

  if (error) return { error: "No se pudo eliminar la cuenta" };

  const { count } = await adminSupabase
    .from("group_accounts")
    .select("id", { count: "exact", head: true })
    .eq("riot_account_id", groupAccount.riot_account_id);

  if (count === 0) {
    await adminSupabase
      .from("riot_accounts")
      .delete()
      .eq("id", groupAccount.riot_account_id);
  }

  revalidatePath("/");
  revalidatePath("/perfil");
  return { success: true };
}

export async function setAccountMainStatus(groupAccountId: string, isMain: boolean) {
  const authCheck = await getAuthorizedGroupAccount(groupAccountId);
  if ("error" in authCheck) return { error: authCheck.error };

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const { error } = await adminSupabase
    .from("group_accounts")
    .update({ custom_name: isMain ? "main" : null })
    .eq("id", groupAccountId);

  if (error) {
    return { error: "No se pudo actualizar el estado principal de la cuenta" };
  }

  revalidatePath("/");
  revalidatePath("/perfil");
  return { success: true };
}
