"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [
    days > 0 ? `${days}d` : null,
    `${hours.toString().padStart(2, "0")}h`,
    `${minutes.toString().padStart(2, "0")}m`,
    `${seconds.toString().padStart(2, "0")}s`,
  ].filter(Boolean);

  return parts.join(" ");
}

function CounterTile({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "teal";
  value: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-lg shadow-black/20",
        tone === "teal"
          ? "border-cyan-300/22 bg-cyan-400/[0.05]"
          : "border-pink-300/28 bg-pink-500/[0.06]",
      )}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-3 text-2xl font-black tracking-tight sm:text-[2rem]",
          tone === "teal" ? "text-cyan-200" : "text-pink-200",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function KeyAgeCounter({ updatedAt }: { updatedAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!updatedAt) return;

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [updatedAt]);

  if (!updatedAt) {
    return (
      <div className="rounded-xl border border-dashed border-cyan-300/22 bg-cyan-400/[0.05] p-4">
        <p className="text-sm font-bold text-white">Todavía no hay una Riot API Key guardada.</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Cuando la cargues aquí, el contador empezará desde cero y marcará la ventana operativa de 24 horas.
        </p>
      </div>
    );
  }

  const updatedAtMs = new Date(updatedAt).getTime();

  if (Number.isNaN(updatedAtMs)) {
    return (
      <div className="rounded-xl border border-dashed border-pink-300/24 bg-pink-500/[0.06] p-4">
        <p className="text-sm font-bold text-white">No se pudo leer la fecha de la última actualización.</p>
      </div>
    );
  }

  const elapsedMs = Math.max(0, now - updatedAtMs);
  const remainingMs = DAY_MS - elapsedMs;
  const expired = remainingMs <= 0;
  const absoluteLabel = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(updatedAtMs));

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <CounterTile label="Desde la última carga" tone="teal" value={formatDuration(elapsedMs)} />
        <CounterTile
          label={expired ? "Vencida hace" : "Vence en"}
          tone={expired ? "danger" : "teal"}
          value={formatDuration(Math.abs(remainingMs))}
        />
      </div>
      <p className="text-xs font-medium text-slate-400">Última actualización registrada: {absoluteLabel}</p>
    </div>
  );
}
