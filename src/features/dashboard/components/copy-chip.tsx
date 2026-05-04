"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CopyChipProps = {
  value: string;
  ariaLabel: string;
  className?: string;
};

export function CopyChip({ value, ariaLabel, className }: CopyChipProps) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      await navigator.clipboard.writeText(trimmed);
      setState("copied");
      setTimeout(() => setState("idle"), 1600);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  };

  const disabled = !value.trim();
  const label =
    state === "copied" ? "Copiado" : state === "error" ? "Error" : "Copiar";

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "shrink-0 rounded-md border border-cyan-300/35 bg-cyan-400/12 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200 transition hover:border-cyan-200/55 hover:bg-cyan-400/20 disabled:opacity-35",
        state === "copied" && "border-teal-300/55 text-teal-200",
        state === "error" && "border-pink-300/55 text-pink-200",
        className,
      )}
      disabled={disabled}
      onClick={handleCopy}
      type="button"
    >
      {label}
    </button>
  );
}
