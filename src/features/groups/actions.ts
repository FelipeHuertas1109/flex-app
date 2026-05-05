"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createGroup(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "El nombre del grupo es obligatorio" };

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Usuario no autenticado" };
  }

  // 1. Crear el grupo
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name, created_by: user.id })
    .select()
    .single();

  if (groupError) {
    console.error("Supabase Error (grupos):", groupError);
    return { error: `Error al crear el grupo: ${groupError.message}` };
  }

  // 2. Agregar al creador como owner en group_members
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "owner",
      invite_admin: true,
    });

  if (memberError) {
    return { error: "Error al unirte al grupo creado" };
  }

  revalidatePath("/");
  return { success: true, groupId: group.id };
}

function normalizeGroupName(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

export async function renameGroup(groupId: string, formData: FormData) {
  const raw = formData.get("name") as string | null;
  const name = normalizeGroupName(raw ?? "");

  if (name.length < 2) {
    return { error: "El nombre debe tener al menos 2 caracteres" };
  }
  if (name.length > 80) {
    return { error: "El nombre no puede superar 80 caracteres" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: row } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (row?.role !== "owner") {
    return { error: "Solo el propietario del grupo puede cambiar el nombre" };
  }

  const { error } = await supabase.from("groups").update({ name }).eq("id", groupId);

  if (error) {
    console.error("renameGroup:", error);
    return { error: "No se pudo actualizar el nombre" };
  }

  revalidatePath("/");
  return { success: true as const };
}

export async function removeGroupMember(groupId: string, memberId: string) {
  const targetMemberId = memberId.trim();

  if (!groupId || !targetMemberId) {
    return { error: "Miembro invalido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  if (user.id === targetMemberId) {
    return { error: "No puedes eliminarte desde gestion de miembros" };
  }

  const { data: actorMembership } = await supabase
    .from("group_members")
    .select("role, invite_admin")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  const canManageMembers = actorMembership?.role === "owner" || Boolean(actorMembership?.invite_admin);
  if (!canManageMembers) {
    return { error: "Solo los administradores pueden eliminar miembros" };
  }

  const { data: targetMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", targetMemberId)
    .single();

  if (!targetMembership) {
    return { error: "El miembro no pertenece al grupo" };
  }

  if (targetMembership.role === "owner") {
    return { error: "No se puede eliminar al propietario del grupo" };
  }

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const { data: linkedAccounts, error: linkedAccountsError } = await adminSupabase
    .from("group_accounts")
    .select("id, riot_account_id")
    .eq("group_id", groupId)
    .eq("user_id", targetMemberId)
    .eq("is_shared", false);

  if (linkedAccountsError) {
    console.error("removeGroupMember linked accounts:", linkedAccountsError);
    return { error: "No se pudieron validar las cuentas del miembro" };
  }

  const riotAccountIds = [...new Set((linkedAccounts ?? []).map((account) => account.riot_account_id).filter(Boolean))];

  const { error: accountsError } = await adminSupabase
    .from("group_accounts")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetMemberId)
    .eq("is_shared", false);

  if (accountsError) {
    console.error("removeGroupMember group_accounts:", accountsError);
    return { error: "No se pudieron eliminar las cuentas del miembro" };
  }

  const { error: memberError } = await adminSupabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetMemberId);

  if (memberError) {
    console.error("removeGroupMember group_members:", memberError);
    return { error: "No se pudo eliminar el miembro" };
  }

  for (const riotAccountId of riotAccountIds) {
    const { count } = await adminSupabase
      .from("group_accounts")
      .select("id", { count: "exact", head: true })
      .eq("riot_account_id", riotAccountId);

    if (count === 0) {
      await adminSupabase.from("riot_accounts").delete().eq("id", riotAccountId);
    }
  }

  revalidatePath("/");
  return { success: true as const };
}
