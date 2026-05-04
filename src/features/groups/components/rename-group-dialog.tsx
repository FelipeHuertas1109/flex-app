"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { renameGroup } from "@/features/groups/actions";
import { cn } from "@/lib/utils";

type RenameGroupDialogProps = {
  groupId: string;
  currentName: string;
};

export function RenameGroupButton({ currentName, groupId }: RenameGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="h-9 shrink-0 border-white/14 bg-black/35 px-3 text-xs font-bold text-slate-200 hover:border-cyan-400/35 hover:text-white"
        onClick={() => setIsOpen(true)}
        type="button"
        variant="secondary"
      >
        Renombrar grupo
      </Button>
      <RenameGroupModal
        currentName={currentName}
        groupId={groupId}
        onClose={() => setIsOpen(false)}
        open={isOpen}
      />
    </>
  );
}

function RenameGroupModal({
  currentName,
  groupId,
  onClose,
  open: isOpen,
}: RenameGroupDialogProps & { onClose: () => void; open: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await renameGroup(groupId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
        formRef.current?.reset();
        router.refresh();
      }
    });
  };

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const modal = (
    <div aria-labelledby="rename-group-title" aria-modal="true" className="fixed inset-0 z-[200]" role="dialog">
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
            <h2 id="rename-group-title" className="pr-10 text-lg font-black tracking-tight text-white sm:text-xl">
              Nombre del grupo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Solo el propietario puede cambiarlo. Lo verán todos los miembros del squad.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <form ref={formRef} action={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300" htmlFor="rename-group-name">
                  Nombre
                </label>
                <input
                  required
                  autoComplete="organization"
                  className={inputBase}
                  defaultValue={currentName}
                  disabled={isPending}
                  id="rename-group-name"
                  maxLength={80}
                  minLength={2}
                  name="name"
                  placeholder="Nombre del squad"
                  type="text"
                />
              </div>

              {error ? <p className="text-sm font-medium text-pink-400">{error}</p> : null}

              <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
                <Button disabled={isPending} onClick={onClose} type="button" variant="secondary">
                  Cancelar
                </Button>
                <Button disabled={isPending} type="submit">
                  {isPending ? "Guardando..." : "Guardar nombre"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
