import { createAdminClient } from "@/lib/supabase/admin";

type RiotApiKeyRow = {
  api_key: string;
  updated_at: string;
  updated_by: string | null;
};

type RiotApiKeyRecord = {
  apiKey: string | null;
  error: string | null;
  updatedAt: string | null;
  updatedById: string | null;
};

export type RiotApiKeyStatus = {
  error: string | null;
  hasKey: boolean;
  updatedAt: string | null;
  updatedByEmail: string | null;
  updatedByName: string | null;
};

function isMissingStorageError(code?: string, message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";
  return code === "42P01" || code === "PGRST205" || normalizedMessage.includes("riot_api_keys");
}

function storageReadErrorMessage(code?: string, message?: string) {
  if (isMissingStorageError(code, message)) {
    return "Falta la tabla riot_api_keys en Supabase. Ejecuta las migraciones antes de usar la pestaña Key.";
  }
  return "No se pudo consultar la Riot API Key guardada en Supabase.";
}

async function readStoredRiotApiKeyRecord(): Promise<RiotApiKeyRecord> {
  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return {
      apiKey: null,
      error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.",
      updatedAt: null,
      updatedById: null,
    };
  }

  const { data, error } = await adminSupabase
    .from("riot_api_keys")
    .select("api_key, updated_at, updated_by")
    .eq("provider", "riot")
    .maybeSingle<RiotApiKeyRow>();

  if (error) {
    console.error("readStoredRiotApiKeyRecord:", error);
    return {
      apiKey: null,
      error: storageReadErrorMessage(error.code, error.message),
      updatedAt: null,
      updatedById: null,
    };
  }

  const apiKey = data?.api_key?.trim() || null;

  return {
    apiKey,
    error: null,
    updatedAt: data?.updated_at ?? null,
    updatedById: data?.updated_by ?? null,
  };
}

export async function getStoredRiotApiKeyRecord() {
  return readStoredRiotApiKeyRecord();
}

export async function getStoredRiotApiKeyStatus(): Promise<RiotApiKeyStatus> {
  const record = await readStoredRiotApiKeyRecord();

  if (record.error || !record.updatedById) {
    return {
      error: record.error,
      hasKey: Boolean(record.apiKey),
      updatedAt: record.updatedAt,
      updatedByEmail: null,
      updatedByName: null,
    };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data: profile, error } = await adminSupabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.updatedById)
      .maybeSingle<{ email: string; full_name: string | null }>();

    if (error) {
      console.error("getStoredRiotApiKeyStatus profile lookup:", error);
      return {
        error: record.error,
        hasKey: Boolean(record.apiKey),
        updatedAt: record.updatedAt,
        updatedByEmail: null,
        updatedByName: null,
      };
    }

    return {
      error: record.error,
      hasKey: Boolean(record.apiKey),
      updatedAt: record.updatedAt,
      updatedByEmail: profile?.email ?? null,
      updatedByName: profile?.full_name ?? null,
    };
  } catch {
    return {
      error: record.error,
      hasKey: Boolean(record.apiKey),
      updatedAt: record.updatedAt,
      updatedByEmail: null,
      updatedByName: null,
    };
  }
}
