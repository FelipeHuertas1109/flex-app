"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createGroup } from "@/features/groups/actions";

export function CreateGroupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await createGroup(formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Nombre del Grupo"
        className="w-full rounded-md border border-cyan-800/40 bg-black/50 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
        required
      />
      {error && <p className="mt-2 text-sm text-pink-400">{error}</p>}
      <Button className="mt-3 w-full" type="submit" disabled={isPending}>
        {isPending ? "Creando..." : "Crear Grupo"}
      </Button>
    </form>
  );
}
