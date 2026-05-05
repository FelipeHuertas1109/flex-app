"use client";

import { useState } from "react";
import { CopyChip } from "@/features/dashboard/components/copy-chip";
import { cn } from "@/lib/utils";

const MASK = "****";

type MaskedPswTableCellProps = {
  value: string | null;
};

/** Celda tabla leaderboard: texto enmascarado, copiar valor real, Ver/Ocultar. */
export function MaskedPswTableCell({ value }: MaskedPswTableCellProps) {
  const raw = value?.trim() ?? "";
  const [visible, setVisible] = useState(false);

  return (
    <td className="px-4 py-5">
      <div className={cn("flex max-w-[12rem] items-center gap-2")}>
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-mono text-xs font-black tabular-nums text-white",
            !visible && raw && "tracking-widest text-slate-300",
          )}
          title={visible ? raw : undefined}
        >
          {raw ? (visible ? raw : MASK) : "—"}
        </span>
        {raw ? (
          <>
            <button
              aria-label={visible ? "Ocultar Psw" : "Ver Psw"}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-white/14 bg-black/35 text-slate-300 transition hover:border-cyan-400/35 hover:text-white"
              onClick={() => setVisible((v) => !v)}
              type="button"
            >
              <EyeIcon className="size-4" />
            </button>
            <CopyChip ariaLabel="Copiar valor Psw" compact value={raw} />
          </>
        ) : (
          <CopyChip ariaLabel="Copiar valor Psw" compact value="" />
        )}
      </div>
    </td>
  );
}

/** Bloque Psw en cards móvil del leaderboard. */
export function MaskedPswCardBlock({ value }: MaskedPswTableCellProps) {
  const raw = value?.trim() ?? "";
  const [visible, setVisible] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-t border-cyan-200/10 pt-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Psw</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {raw ? (
            <>
              <button
                className="rounded-md border border-white/14 bg-black/35 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300 transition hover:border-cyan-400/35 hover:text-white"
                onClick={() => setVisible((v) => !v)}
                type="button"
              >
                {visible ? "Ocultar" : "Ver"}
              </button>
              <CopyChip ariaLabel="Copiar valor Psw" value={raw} />
            </>
          ) : (
            <CopyChip ariaLabel="Copiar valor Psw" value="" />
          )}
        </div>
      </div>
      <p
        className={cn(
          "truncate font-mono text-xs font-semibold text-white",
          !visible && raw && "tracking-widest text-slate-300",
        )}
      >
        {raw ? (visible ? raw : MASK) : "—"}
      </p>
    </>
  );
}

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M2.8 12s3.25-6 9.2-6 9.2 6 9.2 6-3.25 6-9.2 6-9.2-6-9.2-6Z" />
      <path d="M12 15.1a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
    </svg>
  );
}
