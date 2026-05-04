"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { syncAllAccounts } from "@/features/accounts/actions";

/** Minutos entre syncs automaticos si no defines env (5–120). */
const DEFAULT_MINUTES = 5;

const FIRST_DELAY_MS = 120_000;

function resolvedIntervalMs(): number {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_RIOT_SYNC_MINUTES;
  const n = raw !== undefined ? Number(raw) : DEFAULT_MINUTES;
  const bounded = Number.isFinite(n)
    ? Math.min(120, Math.max(5, Math.floor(n)))
    : DEFAULT_MINUTES;
  return bounded * 60 * 1000;
}

/**
 * Mientras el usuario mantiene el dashboard abierto, llama periodicamente a
 * syncAllAccounts (misma logica que «Sincronizar todo») y refresca datos.
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
    const period = resolvedIntervalMs();

    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      if (running.current) return;
      running.current = true;
      try {
        const result = await syncAllAccounts(groupId);
        if ("error" in result && result.error) {
          return;
        }
        router.refresh();
      } finally {
        running.current = false;
      }
    };

    const firstId = window.setTimeout(() => void tick(), FIRST_DELAY_MS);
    const repeatId = window.setInterval(() => void tick(), period);

    return () => {
      window.clearTimeout(firstId);
      window.clearInterval(repeatId);
    };
  }, [groupId, router]);

  return null;
}
