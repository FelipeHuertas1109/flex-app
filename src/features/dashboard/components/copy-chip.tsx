"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CopyChipProps = {
  value: string;
  ariaLabel: string;
  className?: string;
  compact?: boolean;
};

export function CopyChip({ value, ariaLabel, className, compact = false }: CopyChipProps) {
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
        "shrink-0 rounded-md border border-cyan-300/35 bg-cyan-400/12 text-[10px] font-black uppercase tracking-wider text-cyan-200 transition hover:border-cyan-200/55 hover:bg-cyan-400/20 disabled:opacity-35",
        compact ? "inline-flex size-8 items-center justify-center p-0" : "px-2 py-1",
        state === "copied" && "border-teal-300/55 text-teal-200",
        state === "error" && "border-pink-300/55 text-pink-200",
        className,
      )}
      disabled={disabled}
      onClick={handleCopy}
      type="button"
    >
      {compact ? (
        <>
          <CopyIcon className="size-4" />
          <span className="sr-only">{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M8 8.5h8.5v10H8z" />
      <path d="M5.5 15.5h-1v-12H16v1" />
    </svg>
  );
}
