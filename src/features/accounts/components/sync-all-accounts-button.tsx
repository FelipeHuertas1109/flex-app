"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncAllAccounts } from "@/features/accounts/actions";

type SyncAllAccountsButtonProps = {
  groupId: string;
};

export function SyncAllAccountsButton({ groupId }: SyncAllAccountsButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSyncAll = () => {
    setError(null);
    startTransition(async () => {
      const result = await syncAllAccounts(groupId);
      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button className="h-8 px-3 text-xs" variant="secondary" onClick={handleSyncAll} disabled={isPending}>
        {isPending ? "Sincronizando..." : "Sincronizar todo"}
      </Button>
      {error ? <p className="text-right text-[11px] text-pink-400">{error}</p> : null}
    </div>
  );
}
