"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MemberOption = {
  id: string;
  name: string;
};

type ManageAccountDialogProps = {
  groupAccountId: string;
  currentOwnerId: string;
  currentIsShared: boolean;
  currentAccountUser: string;
  currentAccountPsw: string;
  members: MemberOption[];
};

const loadManageAccountModal = () => import("@/features/accounts/components/manage-account-modal");
const ManageAccountModal = dynamic(() => loadManageAccountModal().then((mod) => mod.ManageAccountModal), {
  ssr: false,
});

export function ManageAccountDialog({
  groupAccountId,
  currentOwnerId,
  currentIsShared,
  currentAccountUser,
  currentAccountPsw,
  members,
}: ManageAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const preload = useCallback(() => {
    void loadManageAccountModal();
  }, []);

  return (
    <>
      <Button
        className={cn(
          "h-11 min-w-24 px-4 text-xs",
          currentIsShared
            ? "border-amber-300/45 bg-amber-400/8 text-amber-100 hover:border-amber-200/70 hover:bg-amber-400/14"
            : "border-cyan-300/40 bg-cyan-400/8 text-cyan-100 hover:border-cyan-200/65 hover:bg-cyan-400/14",
        )}
        variant="secondary"
        onClick={() => setIsOpen(true)}
        onFocus={preload}
        onPointerEnter={preload}
      >
        Editar
      </Button>
      {isOpen ? (
        <ManageAccountModal
          currentAccountPsw={currentAccountPsw}
          currentAccountUser={currentAccountUser}
          currentIsShared={currentIsShared}
          currentOwnerId={currentOwnerId}
          groupAccountId={groupAccountId}
          members={members}
          onClose={close}
          open
        />
      ) : null}
    </>
  );
}
