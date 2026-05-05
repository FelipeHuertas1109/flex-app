"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ManageAccountDialog } from "@/features/accounts/components/manage-account-dialog";
import { CopyChip } from "@/features/dashboard/components/copy-chip";
import { cn } from "@/lib/utils";

type MemberOption = {
  id: string;
  name: string;
};

type AccountDetailsButtonProps = {
  accountPsw: string | null;
  accountUser: string | null;
  currentIsShared: boolean;
  currentOwnerId: string;
  currentRoutingPlatform: string | null;
  groupAccountId: string;
  members: MemberOption[];
};

type PopoverPosition = {
  left: number;
  top: number;
  width: number;
};

const POPOVER_WIDTH = 360;
const POPOVER_HEIGHT = 246;
const POPOVER_GAP = 8;
const MASK = "****";

export function AccountDetailsButton({
  accountPsw,
  accountUser,
  currentIsShared,
  currentOwnerId,
  currentRoutingPlatform,
  groupAccountId,
  members,
}: AccountDetailsButtonProps) {
  const [open, setOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const userValue = accountUser?.trim() ?? "";
  const pswValue = accountPsw?.trim() ?? "";

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(POPOVER_WIDTH, viewportWidth - POPOVER_GAP * 2);
    const maxLeft = viewportWidth - width - POPOVER_GAP;
    const left = Math.min(
      Math.max(POPOVER_GAP, rect.right - width),
      Math.max(POPOVER_GAP, maxLeft),
    );
    const belowTop = rect.bottom + POPOVER_GAP;
    const aboveTop = rect.top - POPOVER_HEIGHT - POPOVER_GAP;
    const top = belowTop + POPOVER_HEIGHT <= viewportHeight - POPOVER_GAP
      ? belowTop
      : Math.max(POPOVER_GAP, aboveTop);

    setPosition({ left, top, width });
  };

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (target instanceof Element && target.closest('[role="dialog"]')) return;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-cyan-300/40 bg-cyan-400/8 px-3 text-xs font-black text-cyan-100 shadow-lg shadow-cyan-500/10 transition hover:border-cyan-200/65 hover:bg-cyan-400/14"
        onClick={() => {
          updatePosition();
          setOpen((current) => !current);
        }}
        type="button"
      >
        Detalles
      </button>

      {open && position ? createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 rounded-xl border border-cyan-200/22 bg-[#07111f]/98 p-4 shadow-2xl shadow-cyan-950/50 ring-1 ring-white/8"
          role="menu"
          style={{ left: position.left, top: position.top, width: position.width }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-white">Detalles</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Credenciales guardadas</p>
            </div>
            <button
              aria-label="Cerrar detalles"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-cyan-200/12 bg-white/[0.04] text-sm font-black text-slate-300 transition hover:border-cyan-200/40 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <DetailValue label="Usuario" value={userValue} />
            <div className="rounded-lg border border-cyan-200/12 bg-black/22 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Contraseña</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {pswValue ? (
                    <button
                      className="rounded-md border border-white/14 bg-black/35 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300 transition hover:border-cyan-400/35 hover:text-white"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      type="button"
                    >
                      {passwordVisible ? "Ocultar" : "Ver"}
                    </button>
                  ) : null}
                  <CopyChip ariaLabel="Copiar contraseña" compact value={pswValue} />
                </div>
              </div>
              <p
                className={cn(
                  "mt-2 truncate font-mono text-xs font-semibold text-white",
                  !passwordVisible && pswValue && "tracking-widest text-slate-300",
                )}
              >
                {pswValue ? (passwordVisible ? pswValue : MASK) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-cyan-200/12 pt-3">
            <ManageAccountDialog
              currentAccountPsw={accountPsw ?? ""}
              currentAccountUser={accountUser ?? ""}
              currentIsShared={currentIsShared}
              currentOwnerId={currentOwnerId}
              currentRoutingPlatform={currentRoutingPlatform}
              groupAccountId={groupAccountId}
              members={members}
            />
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan-200/12 bg-black/22 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
        <CopyChip ariaLabel={`Copiar ${label}`} compact value={value} />
      </div>
      <p className="mt-2 truncate font-mono text-xs font-semibold text-white">{value || "—"}</p>
    </div>
  );
}
