"use client";

import { useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useModalEffects } from "@/components/ui/use-modal-effects";
import { addAccount } from "@/features/accounts/actions";
import { cn } from "@/lib/utils";

type AddAccountModalProps = {
  groupId: string;
  onClose: () => void;
  open: boolean;
};

export function AddAccountModal({ groupId, onClose, open }: AddAccountModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useModalEffects(open, onClose);

  const inputBase =
    "mt-1.5 w-full rounded-lg border border-cyan-600/35 bg-black/55 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20";

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await addAccount(groupId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
        formRef.current?.reset();
      }
    });
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div aria-labelledby="add-account-title" aria-modal="true" className="fixed inset-0 z-[200]" role="dialog">
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
              x
            </button>
            <h2 id="add-account-title" className="pr-10 text-lg font-black tracking-tight text-white sm:text-xl">
              Registrar nueva cuenta
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Riot ID, propiedad visible y textos opcionales (User / Psw) que quieras ver en la tabla.
            </p>
          </div>

          <div className="max-h-[min(28rem,calc(100vh-10rem))] overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
            <form ref={formRef} action={handleSubmit} className="space-y-6">
              <fieldset className="space-y-4">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300/90">Riot ID</legend>
                <div>
                  <label className="block text-sm font-semibold text-slate-300" htmlFor="add-game-name">
                    Riot ID (Game Name)
                  </label>
                  <input
                    autoComplete="off"
                    className={inputBase}
                    id="add-game-name"
                    name="gameName"
                    placeholder="ej: Hide on bush"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300" htmlFor="add-tag">
                    Tag Line
                  </label>
                  <input autoComplete="off" className={inputBase} id="add-tag" name="tagLine" placeholder="ej: LAN" required />
                </div>
              </fieldset>

              <fieldset className="space-y-3 border-t border-white/10 pt-5">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300/90">
                  Propiedad visible
                </legend>
                <label className="flex cursor-pointer gap-3 rounded-xl border border-cyan-200/12 bg-black/26 p-3 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-400/8">
                  <input className="mt-1 size-4 accent-cyan-300" defaultChecked name="ownershipMode" type="radio" value="owned" />
                  <span>
                    <span className="block font-bold text-white">Cuenta propia</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                      Se mostrara bajo tu usuario en miembros y leaderboard.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-xl border border-cyan-200/12 bg-black/26 p-3 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-400/8">
                  <input className="mt-1 size-4 accent-cyan-300" name="ownershipMode" type="radio" value="shared" />
                  <span>
                    <span className="block font-bold text-white">Cuenta compartida / sin dueno</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                      Queda registrada por ti, pero se muestra como cuenta sin dueno visual.
                    </span>
                  </span>
                </label>
              </fieldset>

              <fieldset className="space-y-4 border-t border-white/10 pt-5">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-300/90">
                  Textos guardados
                </legend>
                <div>
                  <label className="block text-sm font-semibold text-slate-300" htmlFor="add-user">
                    User
                  </label>
                  <input autoComplete="off" className={inputBase} id="add-user" name="accountUser" placeholder="Main" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300" htmlFor="add-psw">
                    Psw
                  </label>
                  <input autoComplete="off" className={inputBase} id="add-psw" name="accountPsw" placeholder="Main" type="text" />
                </div>
              </fieldset>

              {error ? <p className="text-sm font-medium text-pink-400">{error}</p> : null}

              <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
                <Button disabled={isPending} onClick={onClose} type="button" variant="secondary">
                  Cancelar
                </Button>
                <Button disabled={isPending} type="submit">
                  {isPending ? "Guardando..." : "Guardar cuenta"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
