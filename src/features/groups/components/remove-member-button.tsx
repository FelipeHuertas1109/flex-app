"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { removeGroupMember } from "@/features/groups/actions";

type RemoveMemberButtonProps = {
  groupId: string;
  memberId: string;
  memberName: string;
};

export function RemoveMemberButton({ groupId, memberId, memberName }: RemoveMemberButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRemove = () => {
    const confirmed = confirm(
      `Esta accion eliminara a ${memberName} del grupo y quitara sus cuentas asociadas. Deseas continuar?`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await removeGroupMember(groupId, memberId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        className="h-8 shrink-0 border-pink-300/20 px-2.5 text-xs text-pink-200 hover:border-pink-300/45 hover:bg-pink-500/12"
        disabled={isPending}
        onClick={handleRemove}
        type="button"
        variant="ghost"
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </Button>
      {error ? <p className="max-w-40 text-right text-[11px] font-medium text-pink-300">{error}</p> : null}
    </div>
  );
}
