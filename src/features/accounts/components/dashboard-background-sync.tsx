"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  FIRST_SYNC_DELAY_MS,
  resolvedSyncIntervalMs,
  runCachedGroupSync,
} from "@/features/accounts/lib/sync-all-cache";

/**
 * Mientras el usuario mantiene el dashboard abierto, llama periodicamente a
 * syncAllAccounts y refresca datos solo cuando hubo una sincronizacion real.
 *
 * Opcional en `.env.local`: NEXT_PUBLIC_DASHBOARD_RIOT_SYNC_MINUTES=15
 *
 * Limitacion: no corre con la pestana cerrada. Para automatizar siempre usar
 * un cron/Edge Function en infraestructura.
 */
export function DashboardBackgroundSync({ groupId }: { groupId: string }) {
  const router = useRouter();
  const running = useRef(false);

  useEffect(() => {
    const period = resolvedSyncIntervalMs();

    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      if (running.current) return;
      running.current = true;
      try {
        const response = await runCachedGroupSync(groupId, { freshMs: period });
        if (response.result.error) {
          return;
        }
        if (!response.fromCache) {
          router.refresh();
        }
      } finally {
        running.current = false;
      }
    };

    const firstId = window.setTimeout(() => void tick(), FIRST_SYNC_DELAY_MS);
    const repeatId = window.setInterval(() => void tick(), period);

    return () => {
      window.clearTimeout(firstId);
      window.clearInterval(repeatId);
    };
  }, [groupId, router]);

  return null;
}
