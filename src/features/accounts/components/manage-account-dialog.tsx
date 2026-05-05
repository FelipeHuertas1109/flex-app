"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { deleteAccount, updateAccount } from "@/features/accounts/actions";
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

export function ManageAccountDialog({
  groupAccountId,
  currentOwnerId,
  currentIsShared,
  currentAccountUser,
  currentAccountPsw,
  members,
}: ManageAccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const inputBase =
    "mt-1.5 w-full rounded-lg border border-cyan-600/35 bg-black/55 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20";

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleUpdate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateAccount(groupAccountId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
    });
  };

  const handleDelete = () => {
    if (!confirm("Esta accion eliminara la cuenta del grupo. Deseas continuar?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(groupAccountId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
    });
  };

  const modal = isOpen ? (
    <div aria-labelledby={`edit-account-title-${groupAccountId}`} aria-modal="true" className="fixed inset-0 z-[200]" role="dialog">
      <button
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-[#030712]/88 backdrop-blur-md transition-opacity [&:focus-visible]:ring-2 [&:focus-visible]:ring-inset [&:focus-visible]:ring-cyan-400/50"
        onClick={() => setIsOpen(false)}
        type="button"
      />
      <div className="pointer-events-none relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={cn(
            "pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border border-cyan-200/22",
            "bg-[#081520] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_25px_50px_-12px_rgba(0,0,0,0.65)]",
          )}
        >
          <div className="relative border-b border-white/10 bg-linear-to-r from-cyan-500/12 via-transparent to-violet-500/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
            <button
              className="absolute right-4 top-4 rounded-lg border border-white/15 bg-black/35 px-2 py-1 text-xs font-black text-slate-300 hover:border-cyan-400/35 hover:text-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ✕
            </button>
            <h3 id={`edit-account-title-${groupAccountId}`} className="pr-10 text-lg font-black tracking-tight text-white sm:text-xl">
              Editar cuenta
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">Propiedad visible en el grupo y textos opcionales (User / Psw).</p>
          </div>

          <div className="max-h-[min(30rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
            <form action={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300">Dueno</label>
                <select
                  className={`${inputBase} cursor-pointer`}
                  defaultValue={currentIsShared ? "__shared__" : currentOwnerId}
                  name="ownerId"
                >
                  <option value="__shared__">Cuenta compartida / sin dueno</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="space-y-4 border-t border-white/10 pt-5">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-300/90">Textos guardados</legend>
                <div>
                  <label className="block text-sm font-semibold text-slate-300" htmlFor={`edit-user-${groupAccountId}`}>
                    User
                  </label>
                  <input
                    autoComplete="off"
                    className={inputBase}
                    defaultValue={currentAccountUser}
                    id={`edit-user-${groupAccountId}`}
                    name="accountUser"
                    placeholder="Main"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300" htmlFor={`edit-psw-${groupAccountId}`}>
                    Psw
                  </label>
                  <input
                    autoComplete="off"
                    className={inputBase}
                    defaultValue={currentAccountPsw}
                    id={`edit-psw-${groupAccountId}`}
                    name="accountPsw"
                    placeholder="Main"
                    type="text"
                  />
                </div>
              </fieldset>

              {error ? <p className="text-sm font-medium text-pink-400">{error}</p> : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <Button type="button" variant="ghost" disabled={isPending} onClick={handleDelete}>
                  Eliminar cuenta
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" disabled={isPending} onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button disabled={isPending} type="submit">
                    {isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => setIsOpen(true)}>
        Editar
      </Button>
      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
