"use client";

import Image from "next/image";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/ui/panel";

type Props = {
  analysis: {
    damageByPlayer: { championName: string; damage: number; participantId: number; riotId: string; teamId: number }[];
    goldAdvantage: { goldDiff: number; minute: number }[];
    itemTimeline: { itemId: number; itemImageUrl: string | null; itemName: string; minute: number }[];
    summary: {
      csPerMinute: number;
      gold: number;
      killParticipation: number;
      kda: string;
      role: string;
      visionScore: number;
    };
    teamObjectives: {
      blue: { baron: number; dragon: number; herald: number; inhibitor: number; tower: number };
      red: { baron: number; dragon: number; herald: number; inhibitor: number; tower: number };
    };
  };
};

export function MatchDeepAnalysis({ analysis }: Props) {
  const damage = analysis.damageByPlayer.map((p) => ({
    champion: p.championName,
    damage: p.damage,
    team: p.teamId === 100 ? "Azul" : "Rojo",
  }));
  const objectives = [
    { name: "Dragones", azul: analysis.teamObjectives.blue.dragon, rojo: analysis.teamObjectives.red.dragon },
    { name: "Barones", azul: analysis.teamObjectives.blue.baron, rojo: analysis.teamObjectives.red.baron },
    { name: "Torres", azul: analysis.teamObjectives.blue.tower, rojo: analysis.teamObjectives.red.tower },
    { name: "Inhibidores", azul: analysis.teamObjectives.blue.inhibitor, rojo: analysis.teamObjectives.red.inhibitor },
    { name: "Heraldos", azul: analysis.teamObjectives.blue.herald, rojo: analysis.teamObjectives.red.herald },
  ];
  const groupedTimeline = analysis.itemTimeline.reduce<Map<number, typeof analysis.itemTimeline>>((acc, item) => {
    const list = acc.get(item.minute) ?? [];
    list.push(item);
    acc.set(item.minute, list);
    return acc;
  }, new Map());
  const timelineRows = [...groupedTimeline.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, 14);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="KDA" value={analysis.summary.kda} />
        <Metric label="KP" value={`${analysis.summary.killParticipation}%`} />
        <Metric label="CS/min" value={analysis.summary.csPerMinute.toString()} />
        <Metric label="Visión" value={analysis.summary.visionScore.toString()} />
        <Metric label="Oro" value={new Intl.NumberFormat("es-CO").format(analysis.summary.gold)} />
        <Metric label="Rol" value={analysis.summary.role} />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <ChartPanel title="Ventaja de oro del equipo (Azul - Rojo)">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={analysis.goldAdvantage}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
              <XAxis dataKey="minute" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#030712", border: "1px solid rgba(34,211,238,0.35)", borderRadius: "10px" }}
                formatter={(value) => [new Intl.NumberFormat("es-CO").format(Number(value ?? 0)), "Gold diff"]}
                labelFormatter={(label) => `Min ${label}`}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Line dataKey="goldDiff" dot={false} stroke="#22d3ee" strokeWidth={2.5} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Daño infligido por jugador">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={damage}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
              <XAxis dataKey="champion" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#030712", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "10px" }}
                formatter={(value) => [new Intl.NumberFormat("es-CO").format(Number(value ?? 0)), "Daño"]}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="damage" fill="#38bdf8" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <ChartPanel title="Objetivos por equipo">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={objectives}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" strokeDasharray="4 4" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#030712", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "10px" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="azul" fill="#22d3ee" radius={[5, 5, 0, 0]} />
              <Bar dataKey="rojo" fill="#f43f5e" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <Panel className="p-4">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Timeline de ítems (jugador seleccionado)</p>
          {timelineRows.length > 0 ? (
            <div className="space-y-2">
              {timelineRows.map(([minute, items]) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-cyan-200/10 bg-black/25 px-3 py-2" key={`min-${minute}`}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {items.map((item, index) => (
                      <div
                        className="relative size-8 overflow-hidden rounded-md border border-cyan-200/15 bg-black/30"
                        key={`${item.itemId}-${minute}-${index}`}
                        title={item.itemName}
                      >
                        {item.itemImageUrl ? (
                          <Image
                            alt={item.itemName}
                            className="object-cover"
                            fill
                            sizes="32px"
                            src={item.itemImageUrl}
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[9px] font-bold text-slate-500">
                            {item.itemId}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="shrink-0 text-xs font-black text-cyan-200">Min {minute}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No se detectaron compras de items en timeline para esta partida.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function ChartPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <Panel className="p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
      <div className="h-64">{children}</div>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </Panel>
  );
}
