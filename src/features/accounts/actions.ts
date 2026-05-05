"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRiotAccountStats } from "@/lib/riot/client";
import { revalidatePath } from "next/cache";

async function syncRiotAccountById(
  riotAccountId: string,
  gameName: string,
  tagLine: string,
) {
  const stats = await fetchRiotAccountStats(gameName, tagLine);
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
      solo_tier: stats.soloDuo.tier,
      solo_rank: stats.soloDuo.rank,
      solo_lp: stats.soloDuo.lp,
      solo_win_rate: stats.soloDuo.winRate,
      routing_platform: stats.routingPlatform ?? null,
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
  const gameName = (formData.get("gameName") as string)?.trim();
  const tagLine = (formData.get("tagLine") as string)?.trim().toUpperCase();
  const isShared = formData.get("ownershipMode") === "shared";
  const accountUser = (formData.get("accountUser") as string)?.trim() ?? "";
  const accountPsw = (formData.get("accountPsw") as string)?.trim() ?? "";

  if (!gameName || !tagLine) {
    return { error: "Riot ID (Nombre y Tag) son obligatorios" };
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

  // 1. Insertar o recuperar el registro unico principal (riot_account)
  let riotAccountId;
  
  const { data: existingRiotAccount } = await supabase
    .from("riot_accounts")
    .select("id")
    .eq("game_name", gameName)
    .eq("tag_line", tagLine)
    .single();

  if (existingRiotAccount) {
    riotAccountId = existingRiotAccount.id;
  } else {
    const { data: newRiotAccount, error: riotError } = await supabase
      .from("riot_accounts")
      .insert({ game_name: gameName, tag_line: tagLine })
      .select()
      .single();

    if (riotError || !newRiotAccount) return { error: "Error creando registro Riot" };
    riotAccountId = newRiotAccount.id;
  }

  const syncResult = await syncRiotAccountById(riotAccountId, gameName, tagLine);

  // 2. Relacionar la cuenta con el grupo (service role: mismas reglas que update/delete;
  // el INSERT con anon a veces falla por RLS o por columnas nuevas en entornos desalineados)
  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

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
    .select("riot_account_id, riot_accounts(game_name, tag_line)")
    .eq("group_id", groupId);

  if (error || !accounts) {
    return { error: "No se pudieron cargar las cuentas del grupo" };
  }

  let synced = 0;
  let failed = 0;

  for (const account of accounts) {
    const riotAccount = Array.isArray(account.riot_accounts)
      ? account.riot_accounts[0]
      : account.riot_accounts;

    if (!riotAccount?.game_name || !riotAccount?.tag_line) {
      failed += 1;
      continue;
    }

    const syncResult = await syncRiotAccountById(
      account.riot_account_id,
      riotAccount.game_name,
      riotAccount.tag_line,
    );

    if (syncResult.ok) synced += 1;
    else failed += 1;
  }

  revalidatePath("/");
  return { success: true, synced, failed };
}

export async function updateAccount(groupAccountId: string, formData: FormData) {
  const ownerId = (formData.get("ownerId") as string)?.trim();
  const isShared = ownerId === "__shared__";
  const accountUser = (formData.get("accountUser") as string)?.trim() ?? "";
  const accountPsw = (formData.get("accountPsw") as string)?.trim() ?? "";
  if (!ownerId) return { error: "Selecciona un dueno valido" };

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
