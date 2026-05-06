"use client";

import type { SynergyResult, PairSynergy } from "@/lib/lol/synergy";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  top: "TOP", jungle: "JGL", mid: "MID", adc: "ADC", support: "SUP",
};

const GRADE_STYLES: Record<string, string> = {
  S: "border-amber-400/50 bg-amber-400/15 text-amber-300",
  A: "border-emerald-400/50 bg-emerald-400/15 text-emerald-300",
  B: "border-cyan-400/50 bg-cyan-400/15 text-cyan-300",
  C: "border-amber-500/50 bg-amber-500/15 text-amber-400",
  D: "border-rose-400/50 bg-rose-400/15 text-rose-400",
};

function scoreColor(score: number) {
  if (score >= 82) return "text-emerald-400";
  if (score >= 70) return "text-cyan-400";
  if (score >= 57) return "text-amber-400";
  return "text-rose-400";
}

function barColor(score: number) {
  if (score >= 82) return "bg-emerald-500";
  if (score >= 70) return "bg-cyan-500";
  if (score >= 57) return "bg-amber-500";
  return "bg-rose-500";
}

function PairRow({ pair, highlight }: { pair: PairSynergy; highlight: "good" | "bad" }) {
  const roleA = ROLE_LABELS[pair.roleA] ?? pair.roleA.toUpperCase();
  const roleB = ROLE_LABELS[pair.roleB] ?? pair.roleB.toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1 py-px text-[8px] font-black text-slate-400">
          {roleA}
        </span>
        <span className="truncate text-[10px] font-bold text-white">{pair.champA.split(" ")[0]}</span>
        <span className="shrink-0 text-[8px] text-slate-600">+</span>
        <span className="truncate text-[10px] font-bold text-white">{pair.champB.split(" ")[0]}</span>
        <span className="shrink-0 rounded border border-white/10 bg-white/5 px-1 py-px text-[8px] font-black text-slate-400">
          {roleB}
        </span>
      </div>
      <span className={cn("shrink-0 text-[11px] font-black tabular-nums", highlight === "good" ? "text-emerald-400" : "text-rose-400")}>
        {pair.score}
      </span>
    </div>
  );
}

export function SynergyPanel({ result }: { result: SynergyResult }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
      {/* ── Score header ────────────────────────────────────────────────── */}
      <div className="border-b border-white/6 px-3 pt-3 pb-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
            Sinergia del equipo
          </span>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-black tabular-nums leading-none", scoreColor(result.score))}>
              {result.score}
            </span>
            <span className={cn("rounded-lg border px-2 py-0.5 text-sm font-black leading-tight", GRADE_STYLES[result.grade])}>
              {result.grade}
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className={cn("h-full rounded-full transition-all duration-700", barColor(result.score))}
            style={{ width: `${result.score}%` }}
          />
        </div>

        {/* Composition type */}
        <div className="mt-2 flex items-start justify-between gap-2">
          <span className="rounded-md border border-cyan-300/20 bg-cyan-400/8 px-2 py-0.5 text-[10px] font-black text-cyan-300">
            {result.compositionType}
          </span>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-slate-500">{result.compositionDescription}</p>
      </div>

      {/* ── Best synergies ───────────────────────────────────────────────── */}
      {result.topPairs.length > 0 && (
        <div className="border-b border-white/6 px-3 py-2.5">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-500/70">
            Mejores sinergias
          </p>
          <div className="flex flex-col gap-1.5">
            {result.topPairs.map((p, i) => (
              <PairRow key={i} pair={p} highlight="good" />
            ))}
          </div>
        </div>
      )}

      {/* ── Worst synergies ──────────────────────────────────────────────── */}
      {result.worstPairs.length > 0 && (
        <div className="border-b border-white/6 px-3 py-2.5">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.12em] text-rose-500/70">
            Sinergias débiles
          </p>
          <div className="flex flex-col gap-1.5">
            {result.worstPairs.map((p, i) => (
              <PairRow key={i} pair={p} highlight="bad" />
            ))}
          </div>
        </div>
      )}

      {/* ── Strengths ────────────────────────────────────────────────────── */}
      {result.strengths.length > 0 && (
        <div className="border-b border-white/6 px-3 py-2.5">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-500/70">
            Fortalezas
          </p>
          <div className="flex flex-col gap-1.5">
            {result.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="mt-px shrink-0 text-[10px] text-emerald-500">✓</span>
                <p className="text-[10px] leading-snug text-slate-300">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Issues ───────────────────────────────────────────────────────── */}
      {result.issues.length > 0 && (
        <div className="px-3 py-2.5">
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.12em] text-rose-500/70">
            Problemas detectados
          </p>
          <div className="flex flex-col gap-1.5">
            {result.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="mt-px shrink-0 text-[10px] text-amber-400">⚠</span>
                <p className="text-[10px] leading-snug text-slate-400">{issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
