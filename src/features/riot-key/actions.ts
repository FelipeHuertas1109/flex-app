"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function normalizeApiKey(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isMissingStorageError(code?: string, message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";
  return code === "42P01" || code === "PGRST205" || normalizedMessage.includes("riot_api_keys");
}

export async function saveRiotApiKey(formData: FormData) {
  const apiKey = normalizeApiKey(formData.get("apiKey"));

  if (!apiKey) {
    return { error: "Ingresa un valor para RIOT_API_KEY." };
  }

  if (!apiKey.startsWith("RGAPI-")) {
    return { error: "La Riot API Key debe empezar por RGAPI-." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado" };
  }

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  const updatedAt = new Date().toISOString();
  const { error } = await adminSupabase.from("riot_api_keys").upsert(
    {
      provider: "riot",
      api_key: apiKey,
      updated_at: updatedAt,
      updated_by: user.id,
    },
    { onConflict: "provider" },
  );

  if (error) {
    console.error("saveRiotApiKey:", error);
    if (isMissingStorageError(error.code, error.message)) {
      return { error: "Falta la tabla riot_api_keys en Supabase. Ejecuta las migraciones primero." };
    }
    return { error: "No se pudo guardar la Riot API Key." };
  }

  // Despues de guardar una nueva API Key, invalidamos todos los PUUIDs de las cuentas de Riot
  // para que sean consultados frescos en el proximo ciclo o al presionar "Sincronizar".
  // Esto actualiza TODAS las cuentas de Riot globales reseteando su respectivo PUUID.
  const { error: clearError } = await adminSupabase
    .from("riot_accounts")
    .update({ puuid: null, last_name_updated_at: null })
    .not("id", "is", null); // Supabase exige un filtro, esto aplica a absolutamente todas las filas
  
  if (clearError) {
    console.error("Error al limpiar PUUIDs tras cambio de API Key:", clearError);
  }

  revalidatePath("/");
  revalidatePath("/key");
  return { success: true as const, updatedAt };
}
