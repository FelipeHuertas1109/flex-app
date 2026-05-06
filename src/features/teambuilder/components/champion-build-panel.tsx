"use client";

import { useEffect, useState } from "react";
import type { ChampionBuild, LolRole } from "@/lib/lol/types";
import { cn } from "@/lib/utils";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: ChampionBuild }
  | { status: "error"; message: string };

export function ChampionBuildPanel({
  championId,
  championName,
  role,
  onClose,
}: {
  championId: string;
  championName: string;
  role: LolRole;
  onClose: () => void;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setState({ status: "loading" });
    });
    fetch(`/api/champions/${encodeURIComponent(championId)}/build?role=${role}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.ok) setState({ status: "ok", data: json.data });
        else setState({ status: "error", message: json.error ?? "Error desconocido" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "Error de red al obtener la build." });
      });

    return () => {
      cancelled = true;
    };
  }, [championId, role]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-200/20 bg-[#07111f] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-200/10 bg-[radial-gradient(circle_at_0%_0%,rgba(25,216,255,0.10),transparent_50%)] px-5 py-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={championName}
              className="size-11 rounded-xl border border-cyan-300/30 object-cover"
              src={`https://ddragon.leagueoflegends.com/cdn/16.9.1/img/champion/${championId}.png`}
            />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                Build — {role.toUpperCase()}
              </p>
              <p className="text-lg font-black text-white">{championName}</p>
            </div>
          </div>
          <button
            className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-lg text-slate-400 transition-colors hover:border-white/20 hover:text-white"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {state.status === "loading" && (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          )}

          {state.status === "error" && (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
              <span className="text-3xl">⚠</span>
              <p className="text-sm font-bold text-rose-400">{state.message}</p>
            </div>
          )}

          {state.status === "ok" && <BuildContent build={state.data} />}
        </div>

        {state.status === "ok" && (
          <div className="border-t border-cyan-200/10 px-5 py-3 text-xs text-slate-600">
            Fuente: {state.data.source} · Parche {state.data.patch} · Actualizado hace menos de 5 min
          </div>
        )}
      </div>
    </div>
  );
}

function BuildContent({ build }: { build: ChampionBuild }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatChip label="Win Rate" value={build.winRate !== null ? `${build.winRate}%` : "—"} tone="teal" />
        <StatChip label="Pick Rate" value={build.pickRate !== null ? `${build.pickRate}%` : "—"} tone="indigo" />
        <StatChip label="Rol" value={build.role.toUpperCase()} tone="gold" />
      </div>

      {/* Items */}
      {build.items.length > 0 && (
        <Section title="Build principal">
          <div className="flex flex-wrap gap-2">
            {build.items.map((item, i) => (
              <ItemChip imageUrl={item.imageUrl} key={i} name={item.name} />
            ))}
          </div>
        </Section>
      )}

      {/* Starter items */}
      {build.starterItems.length > 0 && (
        <Section title="Items iniciales">
          <div className="flex flex-wrap gap-2">
            {build.starterItems.map((item, i) => (
              <ItemChip imageUrl={item.imageUrl} key={i} name={item.name} small />
            ))}
          </div>
        </Section>
      )}

      {/* Runes */}
      {build.runes.length > 0 && (
        <Section title="Runas">
          <div className="flex flex-wrap gap-2">
            {build.runes.map((rune, i) => (
              <RuneChip imageUrl={rune.imageUrl} isKeystone={rune.isKeystone} key={i} name={rune.name} />
            ))}
          </div>
        </Section>
      )}

      {/* Counters */}
      {build.counters.length > 0 && (
        <Section title="Difíciles de enfrentar">
          <div className="flex flex-wrap gap-2">
            {build.counters.map((m, i) => (
              <MatchupChip key={i} matchup={m} tone="danger" />
            ))}
          </div>
        </Section>
      )}

      {/* Strong against */}
      {build.strongAgainst.length > 0 && (
        <Section title="Fáciles de vencer">
          <div className="flex flex-wrap gap-2">
            {build.strongAgainst.map((m, i) => (
              <MatchupChip key={i} matchup={m} tone="good" />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function StatChip({ label, value, tone }: { label: string; value: string; tone: "teal" | "indigo" | "gold" }) {
  const colors = {
    teal: "border-cyan-300/22 bg-cyan-400/8 text-cyan-200",
    indigo: "border-violet-300/22 bg-violet-500/8 text-violet-200",
    gold: "border-amber-300/22 bg-amber-400/8 text-amber-200",
  };
  return (
    <div className={cn("rounded-xl border p-3", colors[tone])}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 text-xl font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

function ItemChip({ imageUrl, name, small }: { imageUrl: string; name: string; small?: boolean }) {
  return (
    <div className="group relative" title={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={name}
        className={cn(
          "rounded-lg border border-white/10 object-cover transition-all group-hover:border-cyan-300/50 group-hover:scale-105",
          small ? "size-9" : "size-12",
        )}
        src={imageUrl}
      />
      <span className="pointer-events-none absolute -bottom-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-cyan-200/20 bg-[#07111f] px-2 py-0.5 text-[10px] text-white group-hover:block">
        {name}
      </span>
    </div>
  );
}

function RuneChip({ imageUrl, name, isKeystone }: { imageUrl: string; name: string; isKeystone: boolean }) {
  return (
    <div className="group relative flex flex-col items-center gap-1" title={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={name}
        className={cn(
          "rounded-full border object-cover transition-all group-hover:scale-105",
          isKeystone
            ? "size-12 border-amber-300/40 bg-amber-400/10 p-0.5 shadow-lg shadow-amber-500/20"
            : "size-8 border-cyan-200/20 bg-cyan-400/8",
        )}
        src={imageUrl}
      />
      <span className="max-w-[4rem] truncate text-center text-[8px] text-slate-500 group-hover:text-cyan-300">
        {name}
      </span>
    </div>
  );
}

function MatchupChip({ matchup, tone }: { matchup: { championName: string; imageUrl: string; winRate: number }; tone: "danger" | "good" }) {
  return (
    <div className="group flex flex-col items-center gap-1" title={`${matchup.championName} — ${matchup.winRate}% WR`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={matchup.championName}
        className={cn(
          "size-11 rounded-xl border object-cover transition-all group-hover:scale-105",
          tone === "danger" ? "border-rose-400/35" : "border-emerald-400/35",
        )}
        src={matchup.imageUrl}
      />
      <span className="max-w-[4rem] truncate text-center text-[9px] text-slate-400">
        {matchup.championName.split(" ")[0]}
      </span>
      <span className={cn("text-[9px] font-black", tone === "danger" ? "text-rose-400" : "text-emerald-400")}>
        {matchup.winRate}%
      </span>
    </div>
  );
}
