"use server";

import { createClient } from "@/lib/supabase/server";
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
