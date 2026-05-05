"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GroupInvite } from "@/features/dashboard/types";

type InviteMemberDialogProps = {
  groupId: string;
  pendingInvites: GroupInvite[];
};

const loadInviteMemberModal = () => import("@/features/invites/components/invite-member-modal");
const InviteMemberModal = dynamic(() => loadInviteMemberModal().then((mod) => mod.InviteMemberModal), {
  ssr: false,
});

export function InviteMemberButton({ groupId, pendingInvites }: InviteMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const preload = useCallback(() => {
    void loadInviteMemberModal();
  }, []);

  return (
    <>
      <Button
        className="min-w-40"
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        onFocus={preload}
        onPointerEnter={preload}
      >
        <span aria-hidden="true">+</span>
        Invitar miembro
        {pendingInvites.length > 0 ? (
          <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-400/15 px-2 text-[11px] font-black text-cyan-200">
            {pendingInvites.length}
          </span>
        ) : null}
      </Button>

      {isOpen ? <InviteMemberModal groupId={groupId} onClose={close} open pendingInvites={pendingInvites} /> : null}
    </>
  );
}
