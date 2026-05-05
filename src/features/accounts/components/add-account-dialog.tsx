"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type AddAccountContextValue = {
  open: () => void;
  preload: () => void;
};

const AddAccountContext = createContext<AddAccountContextValue | null>(null);
const loadAddAccountModal = () => import("@/features/accounts/components/add-account-modal");
const AddAccountModal = dynamic(() => loadAddAccountModal().then((mod) => mod.AddAccountModal), {
  ssr: false,
});

export function AddAccountProvider({ children, groupId }: { children: ReactNode; groupId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const preload = useCallback(() => {
    void loadAddAccountModal();
  }, []);
  const value = useMemo(() => ({ open, preload }), [open, preload]);

  return (
    <AddAccountContext.Provider value={value}>
      {children}
      {isOpen ? <AddAccountModal groupId={groupId} onClose={close} open /> : null}
    </AddAccountContext.Provider>
  );
}

export function AddAccountTrigger({ variant = "hero" }: { variant?: "hero" | "inline" }) {
  const ctx = useContext(AddAccountContext);
  if (!ctx) {
    throw new Error("AddAccountTrigger debe ir dentro de AddAccountProvider.");
  }

  if (variant === "hero") {
    return (
      <Button
        className="min-w-40"
        type="button"
        variant="secondary"
        onClick={ctx.open}
        onFocus={ctx.preload}
        onPointerEnter={ctx.preload}
      >
        <span aria-hidden="true">+</span>
        Registrar cuenta
      </Button>
    );
  }

  return (
    <div className="mt-5 flex w-full justify-center">
      <Button
        className="h-9 px-4 text-sm"
        type="button"
        variant="secondary"
        onClick={ctx.open}
        onFocus={ctx.preload}
        onPointerEnter={ctx.preload}
      >
        <span aria-hidden="true">+</span>
        Registrar cuenta
      </Button>
    </div>
  );
}
