"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { syncAllAccounts } from "@/features/accounts/actions";
import { RECENT_SYNC_CACHE_MS, runCachedGroupSync } from "@/features/accounts/lib/sync-all-cache";

type SyncAllAccountsButtonProps = {
  groupId: string;
};

export function SyncAllAccountsButton({ groupId }: SyncAllAccountsButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  async function showSyncModal(result: Awaited<ReturnType<typeof syncAllAccounts>>, fromCache: boolean) {
    if (result.error) {
      await Swal.fire({
        background: "#07111f",
        buttonsStyling: false,
        color: "#f7fbff",
        confirmButtonText: "Entendido",
        customClass: {
          confirmButton: "swal-neon-confirm",
          htmlContainer: "swal-neon-html",
          popup: "swal-neon-popup",
          title: "swal-neon-title",
        },
        icon: "error",
        text: result.error,
        title: "No se pudo sincronizar",
      });
      return;
    }

    const failedAccounts = result.failedAccounts ?? [];
    const hasFailures = failedAccounts.length > 0;
    const cacheHtml = fromCache
      ? '<p class="swal-sync-summary" style="margin-top:0.6rem;">Usando el resultado reciente del cache del dashboard.</p>'
      : "";
    const failedHtml = hasFailures
      ? `<div class="swal-sync-list">${failedAccounts
          .map(
            (account) =>
              `<div class="swal-sync-card"><strong>${escapeHtml(account.label)}</strong><span>${escapeHtml(account.error)}</span></div>`,
          )
          .join("")}</div>`
      : "";

    await Swal.fire({
      background: "#07111f",
      buttonsStyling: false,
      color: "#f7fbff",
      confirmButtonText: hasFailures ? "Revisar" : "Aceptar",
      customClass: {
        confirmButton: "swal-neon-confirm",
        htmlContainer: "swal-neon-html",
        popup: "swal-neon-popup",
        title: "swal-neon-title",
      },
      html: `<p class="swal-sync-summary">Actualizadas: <strong>${result.synced}</strong>. Fallidas: <strong>${result.failed}</strong>.</p>${cacheHtml}${failedHtml}`,
      icon: hasFailures ? "warning" : "success",
      title: hasFailures ? "Sincronizacion completada con fallas" : "Sincronizacion completada",
    });
  }

  const handleSyncAll = () => {
    startTransition(async () => {
      const response = await runCachedGroupSync(groupId, { freshMs: RECENT_SYNC_CACHE_MS });
      if (!response.fromCache && !response.result.error) {
        router.refresh();
      }
      await showSyncModal(response.result, response.fromCache);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button className="h-8 px-3 text-xs" variant="secondary" onClick={handleSyncAll} disabled={isPending}>
        {isPending ? "Sincronizando..." : "Sincronizar todo"}
      </Button>
    </div>
  );
}
