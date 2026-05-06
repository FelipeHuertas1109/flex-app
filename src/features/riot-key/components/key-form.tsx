"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveRiotApiKey } from "@/features/riot-key/actions";

type RiotApiKeyFormProps = {
  disabled?: boolean;
  hasKey: boolean;
};

export function RiotApiKeyForm({ disabled = false, hasKey }: RiotApiKeyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const inputBase =
    "mt-1.5 w-full rounded-lg border border-cyan-600/35 bg-black/55 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20";

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setStatus(null);

    startTransition(async () => {
      const result = await saveRiotApiKey(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      setStatus("Riot API Key actualizada. El contador se reinició.");
      formRef.current?.reset();
      router.refresh();
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5" ref={formRef}>
      <div>
        <label className="block text-sm font-semibold text-slate-300" htmlFor="riot-api-key">
          RIOT_API_KEY
        </label>
        <input
          autoCapitalize="off"
          autoComplete="off"
          className={inputBase}
          disabled={disabled || isPending}
          id="riot-api-key"
          name="apiKey"
          placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          required
          spellCheck={false}
          type="password"
        />
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Se guarda en Supabase y solo se usa desde el servidor para sincronizar cuentas con Riot.
        </p>
      </div>

      {error ? <p className="text-sm font-medium text-pink-400">{error}</p> : null}
      {status ? <p className="text-sm font-medium text-cyan-300">{status}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="text-xs text-slate-500">
          {hasKey ? "La siguiente carga reemplaza la clave activa." : "Todavía no hay una clave activa guardada."}
        </p>
        <Button disabled={disabled || isPending} type="submit">
          {isPending ? "Guardando..." : hasKey ? "Actualizar key" : "Guardar key"}
        </Button>
      </div>
    </form>
  );
}
