"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRiotAccountStats } from "@/lib/riot/client";
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
  riotAccountId: string,
  gameName: string,
  tagLine: string,
  routingPlatform?: string | null,
) {
  const savedRoutingPlatform = normalizeSavedRoutingPlatform(routingPlatform);
  if (!savedRoutingPlatform) {
    return { ok: false as const, error: "Cuenta sin region definida." };
  }

  const stats = await fetchRiotAccountStats(gameName, tagLine, savedRoutingPlatform);
  if (!stats) {
    return { ok: false as const, error: "No se pudo consultar Riot API." };
  }

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { ok: false as const, error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }
  const { error } = await adminSupabase
    .from("riot_accounts")
    .update({
      game_name: stats.gameName,
      tag_line: stats.tagLine,
      tier: stats.flex.tier,
      rank: stats.flex.rank,
      lp: stats.flex.lp,
      win_rate: stats.flex.winRate,
      total_games: stats.flex.totalGames,
      solo_tier: stats.soloDuo.tier,
      solo_rank: stats.soloDuo.rank,
      solo_lp: stats.soloDuo.lp,
      solo_win_rate: stats.soloDuo.winRate,
      solo_total_games: stats.soloDuo.totalGames,
      is_in_game: stats.isInGame,
      live_game_checked_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", riotAccountId);

  if (error) {
    console.error("Error sincronizando riot_accounts:", error);
    return { ok: false as const, error: "No se pudo guardar la sincronizacion." };
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
    .select("id, routing_platform")
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

  const syncResult = await syncRiotAccountById(riotAccountId, gameName, tagLine, routingPlatform);

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

export async function syncAllAccounts(groupId: string) {
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

  const { data: accounts, error } = await supabase
    .from("group_accounts")
    .select("riot_account_id, riot_accounts(game_name, tag_line, routing_platform)")
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
        account.riot_account_id,
        riotAccount.game_name,
        riotAccount.tag_line,
        riotAccount.routing_platform,
      );

      return { ok: syncResult.ok, label, error: syncResult.ok ? undefined : syncResult.error };
    } catch (error) {
      console.error(`Sync fallido para ${label}:`, error);
      return { ok: false, label, error: "Error inesperado durante la sincronizacion" };
    }
  };

  const results = await runWithConcurrency(accounts, 4, syncOneAccount, (account) => {
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
  return { success: true };
}
