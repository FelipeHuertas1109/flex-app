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
