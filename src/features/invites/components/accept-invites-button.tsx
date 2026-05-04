"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptMyPendingInvites } from "@/features/invites/actions";

export function AcceptPendingInvitesButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm font-medium text-pink-400">{error}</p> : null}
      <Button
        disabled={disabled || isPending}
        type="button"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await acceptMyPendingInvites();
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {isPending ? "Uniendo..." : "Unirme a los grupos invitados"}
      </Button>
    </div>
  );
}
