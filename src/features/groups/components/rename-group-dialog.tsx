"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

type RenameGroupDialogProps = {
  groupId: string;
  currentName: string;
};

const loadRenameGroupModal = () => import("@/features/groups/components/rename-group-modal");
const RenameGroupModal = dynamic(() => loadRenameGroupModal().then((mod) => mod.RenameGroupModal), {
  ssr: false,
});

export function RenameGroupButton({ currentName, groupId }: RenameGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const preload = useCallback(() => {
    void loadRenameGroupModal();
  }, []);

  return (
    <>
      <Button
        className="h-9 shrink-0 border-white/14 bg-black/35 px-3 text-xs font-bold text-slate-200 hover:border-cyan-400/35 hover:text-white"
        onClick={() => setIsOpen(true)}
        onFocus={preload}
        onPointerEnter={preload}
        type="button"
        variant="secondary"
      >
        Renombrar grupo
      </Button>
      {isOpen ? <RenameGroupModal currentName={currentName} groupId={groupId} onClose={close} open /> : null}
    </>
  );
}
