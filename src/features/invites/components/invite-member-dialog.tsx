"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { GroupInvite } from "@/features/dashboard/types";
import { cancelGroupInvite, inviteMember } from "@/features/invites/actions";
import { cn } from "@/lib/utils";

type InviteMemberDialogProps = {
  groupId: string;
  pendingInvites: GroupInvite[];
};

export function InviteMemberButton({ groupId, pendingInvites }: InviteMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button className="min-w-40" type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        <span aria-hidden="true">+</span>
        Invitar miembro
        {pendingInvites.length > 0 ? (
          <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-400/15 px-2 text-[11px] font-black text-cyan-200">
            {pendingInvites.length}
          </span>
        ) : null}
      </Button>

      <InviteMemberModal
        groupId={groupId}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        pendingInvites={pendingInvites}
      />
    </>
  );
}

function InviteMemberModal({
  groupId,
  onClose,
  open: isOpen,
  pendingInvites,
}: InviteMemberDialogProps & { onClose: () => void; open: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const inputBase =
    "mt-1.5 w-full rounded-lg border border-cyan-600/35 bg-black/55 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20";

  const handleInvite = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await inviteMember(groupId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  };

  const handleRevoke = (inviteId: string) => {
    setRevokeError(null);
    startTransition(async () => {
      const result = await cancelGroupInvite(groupId, inviteId);
      if (result.error) {
        setRevokeError(result.error);
        return;
      }
      router.refresh();
    });
  };

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const formatted = (iso: string) =>
    new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    );

  const modal = (
    <div aria-labelledby="invite-member-title" aria-modal="true" className="fixed inset-0 z-[200]" role="dialog">
      <button
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-[#030712]/88 backdrop-blur-md transition-opacity [&:focus-visible]:ring-2 [&:focus-visible]:ring-inset [&:focus-visible]:ring-cyan-400/50"
        onClick={onClose}
        type="button"
      />
      <div className="pointer-events-none relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={cn(
            "pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-cyan-200/22",
            "bg-[#081520] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_25px_50px_-12px_rgba(0,0,0,0.65)]",
          )}
        >
          <div className="relative border-b border-white/10 bg-linear-to-r from-cyan-500/12 via-transparent to-violet-500/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
            <button
              className="absolute right-4 top-4 rounded-lg border border-white/15 bg-black/35 px-2 py-1 text-xs font-black text-slate-300 hover:border-cyan-400/35 hover:text-white"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
            <h2 id="invite-member-title" className="pr-10 text-lg font-black tracking-tight text-white sm:text-xl">
              Invitar miembro
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Usa el mismo correo con el que la persona inicia sesion con Google. Entrara al grupo al volver a iniciar
              sesion.
            </p>
          </div>

          <div className="max-h-[min(28rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
            <form ref={formRef} action={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300" htmlFor="invite-email">
                  Correo
                </label>
                <input
                  autoComplete="email"
                  className={inputBase}
                  disabled={isPending}
                  id="invite-email"
                  name="email"
                  placeholder="nombre@gmail.com"
                  required
                  type="email"
                />
              </div>
              {error ? <p className="text-sm font-medium text-pink-400">{error}</p> : null}
              <div className="flex flex-wrap justify-end gap-3">
                <Button disabled={isPending} onClick={onClose} type="button" variant="secondary">
                  Cerrar
                </Button>
                <Button disabled={isPending} type="submit">
                  {isPending ? "Enviando..." : "Enviar invitacion"}
                </Button>
              </div>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-300/90">Pendientes</h3>
              {revokeError ? <p className="mt-2 text-sm font-medium text-pink-400">{revokeError}</p> : null}

              {pendingInvites.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No hay invitaciones pendientes.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {pendingInvites.map((inv) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-xl border border-cyan-200/12 bg-black/30 px-3 py-2.5"
                      key={inv.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{inv.email}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{formatted(inv.invitedAt)}</p>
                      </div>
                      <Button
                        className="h-8 shrink-0 px-2.5 text-xs"
                        disabled={isPending}
                        onClick={() => handleRevoke(inv.id)}
                        type="button"
                        variant="ghost"
                      >
                        Revocar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
