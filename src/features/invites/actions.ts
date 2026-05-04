"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function isProbablyValidEmail(value: string) {
  const v = normalizeEmail(value);
  if (v.length < 3 || !v.includes("@") || !v.includes(".")) return false;
  const [local, domain] = v.split("@");
  return Boolean(local && domain?.includes("."));
}

export async function inviteMember(groupId: string, formData: FormData) {
  const raw = (formData.get("email") as string)?.trim() ?? "";
  const email = normalizeEmail(raw);

  if (!email) {
    return { error: "Indica el correo de Google del invitado" };
  }
  if (!isProbablyValidEmail(email)) {
    return { error: "Correo no valido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("id, invite_admin")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership?.invite_admin) {
    return { error: "Solo los administradores de invitaciones pueden enviar invitaciones" };
  }

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();

  const myEmail = normalizeEmail(profile?.email ?? "");
  if (myEmail && myEmail === email) {
    return { error: "No puedes invitarte a ti mismo" };
  }

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  const ids = [...new Set((members ?? []).map((m) => m.user_id).filter(Boolean))];
  if (ids.length === 0) {
    return { error: "No se pudo validar miembros del grupo" };
  }

  const { data: profiles } = await supabase.from("profiles").select("email").in("id", ids);

  const taken = (profiles ?? []).some((row) => normalizeEmail(row.email ?? "") === email);
  if (taken) {
    return { error: "Ese correo ya pertenece al grupo" };
  }

  const { error } = await supabase.from("group_invites").insert({
    group_id: groupId,
    email,
    invited_by: user.id,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya hay una invitacion pendiente para ese correo" };
    }
    console.error("inviteMember insert:", error);
    return { error: "No se pudo crear la invitacion" };
  }

  revalidatePath("/");
  revalidatePath("/invitaciones");
  return { success: true as const };
}

export async function cancelGroupInvite(groupId: string, inviteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("id, invite_admin")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership?.invite_admin) {
    return { error: "Solo los administradores de invitaciones pueden revocar invitaciones" };
  }

  const { error } = await supabase.from("group_invites").delete().eq("id", inviteId).eq("group_id", groupId).eq(
    "status",
    "pending",
  );

  if (error) {
    console.error("cancelGroupInvite:", error);
    return { error: "No se pudo cancelar la invitacion" };
  }

  revalidatePath("/");
  revalidatePath("/invitaciones");
  return { success: true as const };
}

export async function acceptMyPendingInvites() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  const { error } = await supabase.rpc("accept_invites_for_current_user");
  if (error) {
    console.error("accept_invites_for_current_user:", error);
    return { error: "No se pudieron aplicar las invitaciones" };
  }

  revalidatePath("/");
  revalidatePath("/invitaciones");
  return { success: true as const };
}
