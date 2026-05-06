import type { RiotApiKeySnapshot } from "@/features/riot-key/types";
import { getStoredRiotApiKeyStatus } from "@/lib/riot/api-key";

const RIOT_API_KEY_TTL_MS = 24 * 60 * 60 * 1000;

export async function getRiotApiKeySnapshot(): Promise<RiotApiKeySnapshot> {
  const status = await getStoredRiotApiKeyStatus();

  return {
    error: status.error,
    expiresAt: status.updatedAt ? new Date(new Date(status.updatedAt).getTime() + RIOT_API_KEY_TTL_MS).toISOString() : null,
    hasKey: status.hasKey,
    updatedAt: status.updatedAt,
    updatedByLabel: status.updatedByName ?? status.updatedByEmail ?? null,
  };
}
