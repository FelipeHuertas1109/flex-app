"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { syncAllAccounts } from "@/features/accounts/actions";

type SyncAllAccountsButtonProps = {
  groupId: string;
};

export function SyncAllAccountsButton({ groupId }: SyncAllAccountsButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [failedAccounts, setFailedAccounts] = useState<Array<{ error: string; label: string }>>([]);
  const [status, setStatus] = useState<string | null>(null);

  const handleSyncAll = () => {
    setError(null);
    setFailedAccounts([]);
    setStatus(null);
    startTransition(async () => {
      const result = await syncAllAccounts(groupId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFailedAccounts(result.failedAccounts ?? []);
      setStatus(`Actualizadas: ${result.synced}. Fallidas: ${result.failed}.`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button className="h-8 px-3 text-xs" variant="secondary" onClick={handleSyncAll} disabled={isPending}>
        {isPending ? "Sincronizando..." : "Sincronizar todo"}
      </Button>
      {error ? <p className="text-right text-[11px] text-pink-400">{error}</p> : null}
      {status ? (
        <div className="group relative">
          <p className="text-right text-[11px] text-cyan-300">{status}</p>
          {failedAccounts.length > 0 ? (
            <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden w-72 rounded-lg border border-pink-300/24 bg-[#07111f] p-3 text-left shadow-2xl shadow-black/40 ring-1 ring-white/8 group-hover:block">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-pink-300">Fallaron</p>
              <div className="mt-2 grid gap-2">
                {failedAccounts.map((account) => (
                  <div className="rounded-md border border-white/10 bg-black/24 p-2" key={account.label}>
                    <p className="truncate text-xs font-black text-white">{account.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-400">{account.error}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
