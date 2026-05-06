"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import type { AccountProfileStats } from "@/features/profile/actions";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";

export function ProfileAccountDetails({ stats }: { stats: AccountProfileStats }) {
  const router = useRouter();
  const championChart = stats.championStats.slice(0, 8);
  const damageTrend = stats.recentMatches
    .slice()
    .sort((a, b) => a.playedAt - b.playedAt)
    .map((match, index) => ({
      damage: match.damage,
      kda: Number(match.kdaValue.toFixed(2)),
      match: `P${index + 1}`,
    }));
  const wins = stats.recentMatches.filter((m) => m.result === "Victoria").length;
  const losses = Math.max(0, stats.recentMatches.length - wins);
  const totalMatches = Math.max(1, stats.recentMatches.length);
  const winPct = Math.round((wins / totalMatches) * 100);
  const lossPct = Math.round((losses / totalMatches) * 100);
  const pieData = [
    { name: "Victorias", value: wins },
    { name: "Derrotas", value: losses },
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push("/perfil");
          }}
          type="button"
          variant="secondary"
        >
          ← Volver
        </Button>
        <p className="text-xs font-semibold text-slate-400">Cuenta: {stats.accountLabel}</p>
      </div>

      <Panel className="p-5 sm:p-6">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Rendimiento de cuenta</h1>
        <p className="mt-2 text-sm text-slate-300">
          Vista detallada de tu rendimiento reciente con enfoque en mejor campeón, win rate y consistencia.
        </p>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="WR reciente" value={`${stats.recentWinRate}%`} />
        <StatCard label="KDA promedio" value={stats.averageKda.toString()} />
        <StatCard label="Daño promedio" value={stats.averageDamage.toLocaleString("es-CL")} />
        <StatCard label="SoloQ actual" value={`${stats.soloDuo.rank} · ${stats.soloDuo.lp} LP`} />
        <StatCard label="Flex actual" value={`${stats.flex.rank} · ${stats.flex.lp} LP`} />
      </div>

      {stats.bestChampion ? (
        <Panel className="border-amber-300/28 bg-amber-400/6 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-amber-300">Mejor campeón reciente</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-black text-white">{stats.bestChampion.name}</span>
            <span className="font-semibold text-slate-200">{stats.bestChampion.games} partidas</span>
            <span className="font-semibold text-emerald-300">{stats.bestChampion.winRate}% WR</span>
            <span className="font-semibold text-slate-300">KDA {stats.bestChampion.avgKda}</span>
            <span className="font-semibold text-slate-300">Dmg {stats.bestChampion.avgDamage.toLocaleString("es-CL")}</span>
          </div>
        </Panel>
      ) : null}

      {championChart.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartPanel title="Partidas por campeón">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={championChart}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#030712", border: "1px solid rgba(34,211,238,0.35)", borderRadius: "10px" }}
                  formatter={(value) => [`${Number(value ?? 0)}`, "Partidas"]}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="games" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Win rate por campeón">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={championChart}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#030712", border: "1px solid rgba(52,211,153,0.35)", borderRadius: "10px" }}
                  formatter={(value) => [`${Number(value ?? 0)}%`, "WR"]}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="winRate" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      ) : null}

      {damageTrend.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartPanel title="Daño a campeones por partida">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={damageTrend}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
                <XAxis dataKey="match" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#030712", border: "1px solid rgba(34,211,238,0.35)", borderRadius: "10px" }}
                  formatter={(value) => [Number(value ?? 0).toLocaleString("es-CL"), "Daño"]}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line dataKey="damage" dot={{ fill: "#22d3ee", r: 3 }} stroke="#22d3ee" strokeWidth={2.6} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="WR acumulado reciente">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={stats.recentWinRateTrend}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
                <XAxis dataKey="match" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#030712", border: "1px solid rgba(124,58,237,0.35)", borderRadius: "10px" }}
                  formatter={(value) => [`${Number(value ?? 0)}%`, "WR"]}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line dataKey="winRate" dot={{ fill: "#7c3cff", r: 3 }} stroke="#7c3cff" strokeWidth={2.6} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      ) : null}

      {stats.recentMatches.length > 0 ? (
        <ChartPanel title="Distribución de resultados">
          <div className="grid h-full gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="relative">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={62} outerRadius={96} paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell fill={entry.name === "Victorias" ? "#34d399" : "#f43f5e"} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#030712", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "10px" }}
                    formatter={(value) => [`${Number(value ?? 0)}`, "Partidas"]}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{stats.recentMatches.length}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Partidas</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <ResultLegend colorClass="bg-emerald-400" label="Victorias" value={`${wins} (${winPct}%)`} />
              <ResultLegend colorClass="bg-rose-500" label="Derrotas" value={`${losses} (${lossPct}%)`} />
              <p className="pt-1 text-xs text-slate-400">
                Esta gráfica resume tus resultados en las últimas {stats.recentMatches.length} partidas analizadas.
              </p>
            </div>
          </div>
        </ChartPanel>
      ) : (
        <Panel className="p-5 text-sm text-slate-400">No hay historial reciente para graficar en este momento.</Panel>
      )}
    </section>
  );
}

function ChartPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Panel className="p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
      <div className="h-64">{children}</div>
    </Panel>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-100">{value}</p>
    </Panel>
  );
}

function ResultLegend({
  colorClass,
  label,
  value,
}: {
  colorClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-cyan-200/12 bg-black/25 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`size-2.5 rounded-full ${colorClass}`} />
        <span className="text-xs font-semibold text-slate-200">{label}</span>
      </div>
      <span className="text-xs font-black text-white">{value}</span>
    </div>
  );
}
