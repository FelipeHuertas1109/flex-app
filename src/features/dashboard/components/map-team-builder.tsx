"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { GroupMember } from "@/features/dashboard/types";
import { Panel } from "@/components/ui/panel";
import { ChampionBuildPanel } from "@/features/teambuilder/components/champion-build-panel";
import { SynergyPanel } from "@/features/teambuilder/components/synergy-panel";
import {
  championImageUrl,
  clearCachedTeamBuilderState,
  fetchCachedTeamBuilderChampions,
  getCachedTeamBuilderState,
  setCachedTeamBuilderAssignments,
  setCachedTeamBuilderChampAssignments,
  teamBuilderCacheKey,
  type TeamBuilderAssignments,
  type TeamBuilderChampAssignments,
  type TeamBuilderChampionInfo,
  type TeamBuilderRole,
} from "@/features/teambuilder/lib/team-builder-cache";
import { calcTeamSynergy } from "@/lib/lol/synergy";
import type { TeamEntry } from "@/lib/lol/synergy";
import type { LolRole } from "@/lib/lol/types";
import { cn } from "@/lib/utils";

type Role = TeamBuilderRole;
type Assignments = TeamBuilderAssignments;
type ChampAssignments = TeamBuilderChampAssignments;
type ChampionInfo = TeamBuilderChampionInfo;

const ROLE_TAG_FILTER: Record<Role, string[]> = {
  top:     ["Fighter", "Tank"],
  jungle:  ["Fighter", "Assassin", "Tank"],
  mid:     ["Mage", "Assassin"],
  adc:     ["Marksman"],
  support: ["Support"],
};

const ROLES: {
  id: Role;
  label: string;
  abbr: string;
  top: string;
  left: string;
  color: string;
  dot: string;
}[] = [
  { id: "top",     label: "Top",     abbr: "TOP", top: "18%", left: "16%", color: "text-amber-300",   dot: "bg-amber-400 shadow-amber-400/60"   },
  { id: "jungle",  label: "Jungla",  abbr: "JGL", top: "43%", left: "27%", color: "text-emerald-300", dot: "bg-emerald-400 shadow-emerald-400/60"},
  { id: "mid",     label: "Mid",     abbr: "MID", top: "49%", left: "49%", color: "text-violet-300",  dot: "bg-violet-400 shadow-violet-400/60"  },
  { id: "adc",     label: "ADC",     abbr: "ADC", top: "71%", left: "71%", color: "text-rose-300",    dot: "bg-rose-400 shadow-rose-400/60"      },
  { id: "support", label: "Support", abbr: "SUP", top: "79%", left: "80%", color: "text-cyan-300",    dot: "bg-cyan-400 shadow-cyan-400/60"      },
];

const champImg = championImageUrl;

// ─────────────────────────────────────────────────────────────────────────────

type PendingDrop = {
  incomingId: string;
  targetRole: Role;
  occupantId: string;
  incomingCurrentRole: Role | null;
};

export function MapTeamBuilder({ members }: { members: GroupMember[] }) {
  const cacheKey = useMemo(() => teamBuilderCacheKey(members.map((member) => member.id)), [members]);
  const cachedState = useMemo(() => getCachedTeamBuilderState(cacheKey), [cacheKey]);
  const [assignments, setAssignments] = useState<Assignments>(() => cachedState.assignments);
  const [champAssignments, setChampAssignments] = useState<ChampAssignments>(() => cachedState.champAssignments);
  const [draggingId,  setDraggingId]  = useState<string | null>(null);
  const [dragOverRole, setDragOverRole] = useState<Role | null>(null);
  const [champions, setChampions]     = useState<ChampionInfo[]>([]);
  const [pickingFor, setPickingFor]   = useState<Role | null>(null);
  const [search, setSearch]           = useState("");
  const [showAll, setShowAll]         = useState(false);
  const [buildPanel, setBuildPanel]   = useState<{ champId: string; champName: string; role: Role } | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  useEffect(() => { fetchCachedTeamBuilderChampions().then(setChampions); }, []);
  useEffect(() => {
    if (pickingFor) { const t = setTimeout(() => searchRef.current?.focus(), 60); return () => clearTimeout(t); }
  }, [pickingFor]);

  const filteredChamps = useMemo(() => {
    let list = champions;
    if (pickingFor && !showAll) {
      const allowed = ROLE_TAG_FILTER[pickingFor];
      list = list.filter((c) => c.tags.some((t) => allowed.includes(t)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [champions, pickingFor, showAll, search]);

  const filledCount  = Object.keys(assignments).length;
  const champsCount  = Object.keys(champAssignments).length;

  const synergyResult = useMemo(() => {
    if (champsCount < 5) return null;
    const team: TeamEntry[] = ROLES.flatMap((role) => {
      const champ = champAssignments[role.id];
      if (!champ) return [];
      return [{ role: role.id as LolRole, championId: champ.id, championName: champ.name, tags: champ.tags }];
    });
    if (team.length < 5) return null;
    return calcTeamSynergy(team);
  }, [champAssignments, champsCount]);

  // ── Drag & drop ──────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("memberId", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(id);
  }
  function onDragEnd() { setDraggingId(null); setDragOverRole(null); }
  function onDrop(e: React.DragEvent, role: Role) {
    e.preventDefault();
    setDragOverRole(null);
    const member = members.find((m) => m.id === e.dataTransfer.getData("memberId"));
    if (!member) return;
    // Same slot — no-op
    if (assignments[role] === member.id) return;
    // Conflict: another player already in this role
    const occupantId = assignments[role];
    if (occupantId) {
      const incomingCurrentRole = (Object.keys(assignments) as Role[]).find(
        (r) => assignments[r] === member.id,
      ) ?? null;
      setPendingDrop({ incomingId: member.id, targetRole: role, occupantId, incomingCurrentRole });
      return;
    }
    applyMove(member.id, role);
  }

  function applyMove(memberId: string, targetRole: Role) {
    setAssignments((prev) => {
      const next = { ...prev };
      for (const r of Object.keys(next) as Role[]) { if (next[r] === memberId) delete next[r]; }
      next[targetRole] = memberId;
      setCachedTeamBuilderAssignments(cacheKey, next);
      return next;
    });
  }

  function confirmSwap() {
    if (!pendingDrop) return;
    const { incomingId, targetRole, occupantId, incomingCurrentRole } = pendingDrop;
    setAssignments((prev) => {
      const next = { ...prev };
      next[targetRole] = incomingId;
      if (incomingCurrentRole) {
        next[incomingCurrentRole] = occupantId;
      } else {
        for (const r of Object.keys(next) as Role[]) { if (next[r] === occupantId && r !== targetRole) delete next[r]; }
      }
      setCachedTeamBuilderAssignments(cacheKey, next);
      return next;
    });
    setPendingDrop(null);
  }

  function confirmReplace() {
    if (!pendingDrop) return;
    const { incomingId, targetRole, occupantId } = pendingDrop;
    setAssignments((prev) => {
      const next = { ...prev };
      for (const r of Object.keys(next) as Role[]) {
        if (next[r] === incomingId || next[r] === occupantId) delete next[r];
      }
      next[targetRole] = incomingId;
      setCachedTeamBuilderAssignments(cacheKey, next);
      return next;
    });
    setChampAssignments((prev) => {
      const next = { ...prev };
      delete next[targetRole];
      setCachedTeamBuilderChampAssignments(cacheKey, next);
      return next;
    });
    setPendingDrop(null);
  }

  function cancelDrop() { setPendingDrop(null); }
  function onDragOver(e: React.DragEvent, role: Role) {
    e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverRole(role);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function removePlayer(role: Role) {
    setAssignments((p)      => { const n = { ...p }; delete n[role]; setCachedTeamBuilderAssignments(cacheKey, n); return n; });
    setChampAssignments((p) => { const n = { ...p }; delete n[role]; setCachedTeamBuilderChampAssignments(cacheKey, n); return n; });
  }
  function removeChamp(e: React.MouseEvent, role: Role) {
    e.stopPropagation();
    setChampAssignments((p) => { const n = { ...p }; delete n[role]; setCachedTeamBuilderChampAssignments(cacheKey, n); return n; });
  }
  function openPicker(role: Role) { setPickingFor(role); setSearch(""); setShowAll(false); }
  function closePicker()           { setPickingFor(null); setSearch(""); setShowAll(false); }
  function pickChamp(c: ChampionInfo) {
    if (!pickingFor) return;
    setChampAssignments((p) => {
      const next = { ...p, [pickingFor]: c };
      setCachedTeamBuilderChampAssignments(cacheKey, next);
      return next;
    });
    closePicker();
  }
  function clearAll() {
    clearCachedTeamBuilderState(cacheKey);
    setAssignments({});
    setChampAssignments({});
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Panel className="flex h-full flex-col overflow-hidden">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-b border-cyan-200/10 bg-[radial-gradient(circle_at_0%_0%,rgba(25,216,255,0.08),transparent_50%)] px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-white">Team Builder</h2>
            <p className="mt-0.5 text-xs text-slate-500">Arrastra jugadores al mapa y elige campeones.</p>
          </div>
          <div className="flex items-center gap-2">
            {filledCount > 0 && (
              <button className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors" onClick={clearAll}>
                Limpiar
              </button>
            )}
            <span className="rounded-full border border-cyan-300/22 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-300">
              {filledCount}/5
            </span>
          </div>
        </div>

        {/* ── Body: 3 columns ──────────────────────────────────────────────── */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[200px_1fr_280px]">

          {/* ── Col 1: Roster ────────────────────────────────────────────── */}
          <div className="overflow-y-auto border-b border-cyan-200/10 p-4 lg:border-b-0 lg:border-r">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Jugadores</p>
            <div className="flex flex-col gap-1.5">
              {members.map((member) => {
                const isDragging    = draggingId === member.id;
                const roleAssigned  = ROLES.find((r) => assignments[r.id] === member.id);
                return (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, member.id)}
                    onDragEnd={onDragEnd}
                    title={roleAssigned ? `Arrastra para cambiar de ${roleAssigned.label}` : "Arrastra a una línea"}
                    className={cn(
                      "flex cursor-grab select-none items-center gap-2 rounded-lg border px-2.5 py-2 transition-all duration-150 active:cursor-grabbing",
                      roleAssigned
                        ? "border-white/12 bg-white/[0.04] hover:border-white/22 hover:bg-white/[0.06]"
                        : "border-cyan-200/10 bg-white/[0.03] hover:border-cyan-300/35 hover:bg-cyan-400/6",
                      isDragging && "scale-95 opacity-30",
                    )}
                  >
                    <div className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black",
                      member.role === "owner"
                        ? "border-violet-300/28 bg-violet-500/14 text-violet-200"
                        : "border-cyan-200/10 bg-white/5 text-slate-400",
                    )}>
                      {member.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white leading-tight">{member.name}</p>
                      {roleAssigned ? (
                        <p className={cn("text-[10px] font-bold", roleAssigned.color)}>
                          {roleAssigned.label} · mover →
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-600">{member.accounts.length} cuentas</p>
                      )}
                    </div>
                    <GripIcon className={cn("size-2.5 shrink-0", roleAssigned ? "text-slate-500" : "text-slate-700")} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Col 2: Map ───────────────────────────────────────────────── */}
          <div className="flex flex-col border-b border-cyan-200/10 p-3 lg:border-b-0 lg:border-r">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/8">
              <div className="relative h-full w-full select-none [&_*]:select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mapa-lol.png"
                  alt="Summoner's Rift"
                  draggable={false}
                  className="absolute inset-0 size-full select-none object-cover pointer-events-none"
                />
                <div className="pointer-events-none absolute inset-0 select-none bg-black/15" />

                {ROLES.map((role) => {
                  const assignedId = assignments[role.id];
                  const assigned = assignedId ? memberById.get(assignedId) : null;
                  const champ    = champAssignments[role.id];
                  const isOver   = dragOverRole === role.id;
                  const isDraggingThis = assigned && draggingId === assigned.id;
                  return (
                    <div
                      key={role.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ top: role.top, left: role.left }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverRole(null);
                      }}
                      onDragOver={(e) => onDragOver(e, role.id)}
                      onDrop={(e) => onDrop(e, role.id)}
                    >
                      {champ ? (
                        /* Champion assigned — draggable */
                        <div
                          draggable={!!assigned}
                          onDragStart={assigned ? (e) => onDragStart(e, assigned.id) : undefined}
                          onDragEnd={onDragEnd}
                          className={cn(
                            "relative flex flex-col items-center gap-1 rounded-2xl p-1 transition-all duration-150",
                            assigned && "cursor-grab active:cursor-grabbing",
                            isOver && "scale-110 bg-white/15 ring-2 ring-white/40",
                            isDraggingThis && "opacity-40 scale-95",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={champImg(champ.id)}
                            alt={champ.name}
                            className="size-14 rounded-xl border-2 border-white/40 object-cover shadow-xl shadow-black/70"
                          />
                          <span className="rounded-full border border-black/60 bg-black/75 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-sm drop-shadow">
                            {champ.name.split(" ")[0]}
                          </span>
                          <span className={cn("text-[8px] font-black drop-shadow-[0_1px_3px_rgba(0,0,0,1)]", role.color)}>
                            {role.abbr}
                          </span>
                        </div>
                      ) : (
                        /* Player assigned but no champ — draggable pill */
                        <div
                          draggable={!!assigned}
                          onDragStart={assigned ? (e) => onDragStart(e, assigned.id) : undefined}
                          onDragEnd={onDragEnd}
                          className={cn(
                            "flex min-w-[68px] flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 shadow-xl backdrop-blur-md transition-all duration-150",
                            assigned && "cursor-grab active:cursor-grabbing",
                            isOver
                              ? "scale-110 border-white/60 bg-white/25 shadow-white/20"
                              : assigned
                                ? "border-white/30 bg-black/60 hover:border-white/45 hover:bg-black/70"
                                : "border-white/18 bg-black/50 hover:border-white/35 hover:bg-black/65",
                            isDraggingThis && "opacity-40 scale-95",
                          )}
                        >
                          <span className={cn("size-2 rounded-full shadow-[0_0_6px_currentColor]", role.dot)} />
                          <span className={cn("text-[11px] font-black tracking-wide", isOver ? "text-white" : role.color)}>
                            {role.abbr}
                          </span>
                          {assigned ? (
                            <span className="text-[8px] font-bold text-white/80 truncate max-w-[60px]">
                              {assigned.name.split(" ")[0]}
                            </span>
                          ) : (
                            <span className="text-[8px] text-white/30">soltar</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-600">
              {filledCount === 0 ? "Arrastra jugadores a las líneas" : `${champsCount}/5 campeones elegidos`}
            </p>
          </div>

          {/* ── Col 3: Composition ───────────────────────────────────────── */}
          <div className="overflow-y-auto p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Composición</p>
            <div className="flex flex-col gap-2">
              {ROLES.map((role) => {
                const playerId = assignments[role.id];
                const player = playerId ? memberById.get(playerId) : null;
                const champ  = champAssignments[role.id];
                return (
                  <div
                    key={role.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-150",
                      player
                        ? "border-white/8 bg-white/[0.03]"
                        : "border-dashed border-white/6 bg-transparent",
                    )}
                  >
                    {/* Role badge */}
                    <div className={cn(
                      "flex w-10 shrink-0 flex-col items-center gap-0.5",
                    )}>
                      <span className={cn("text-[8px] font-black uppercase tracking-wider", role.color)}>{role.abbr}</span>
                      <span className={cn("size-1 rounded-full", role.dot)} />
                    </div>

                    {/* Champion slot */}
                    {champ ? (
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={champImg(champ.id)}
                          alt={champ.name}
                          className="size-9 rounded-lg border border-white/15 object-cover"
                        />
                        <button
                          className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[#07111f] border border-rose-500/40 text-[8px] text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                          onClick={(e) => removeChamp(e, role.id)}
                          title="Quitar campeón"
                        >×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => player && openPicker(role.id)}
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg border text-[10px] transition-colors",
                          player
                            ? "border-dashed border-cyan-300/30 text-cyan-400 hover:bg-cyan-400/10"
                            : "border-white/6 text-slate-700 cursor-default",
                        )}
                        disabled={!player}
                        title={player ? "Elegir campeón" : "Asigna un jugador primero"}
                      >
                        {player ? "+" : "—"}
                      </button>
                    )}

                    {/* Player + champ name */}
                    <div className="min-w-0 flex-1">
                      {player ? (
                        <>
                          <p className="truncate text-xs font-bold text-white leading-tight">
                            {player.name.split(" ")[0]}
                          </p>
                          <p className="truncate text-[10px] text-slate-500 leading-tight">
                            {champ ? champ.name : "Sin campeón"}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-700">Sin asignar</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      {champ && (
                        <button
                          className="rounded-lg border border-cyan-300/25 bg-cyan-400/8 px-2 py-1 text-[10px] font-black text-cyan-300 transition-all hover:border-cyan-300/50 hover:bg-cyan-400/15"
                          onClick={() => setBuildPanel({ champId: champ.id, champName: champ.name, role: role.id })}
                        >
                          Build
                        </button>
                      )}
                      {player && (
                        <button
                          className="flex size-6 items-center justify-center rounded-lg border border-white/8 text-[10px] text-slate-600 transition-colors hover:border-rose-500/30 hover:text-rose-400"
                          onClick={() => removePlayer(role.id)}
                          title="Quitar jugador"
                        >×</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Synergy panel — visible when all 5 champs assigned */}
            {synergyResult && <SynergyPanel result={synergyResult} />}

            {/* Team summary footer */}
            {filledCount > 0 && (
              <div className="mt-4 rounded-xl border border-white/6 bg-white/[0.02] p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Equipo</p>
                <div className="flex gap-1.5 flex-wrap">
                  {ROLES.map((role) => {
                    const champ = champAssignments[role.id];
                    const playerId = assignments[role.id];
                    const player = playerId ? memberById.get(playerId) : null;
                    if (!player) return null;
                    return (
                      <div key={role.id} className="flex flex-col items-center gap-0.5" title={`${role.label}: ${player.name}${champ ? ` — ${champ.name}` : ""}`}>
                        {champ ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={champImg(champ.id)} alt={champ.name} className="size-8 rounded-lg border border-white/12 object-cover" />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-[10px] font-black text-slate-600">
                            {player.name[0]}
                          </div>
                        )}
                        <span className={cn("text-[8px] font-black", role.color)}>{role.abbr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* ── Conflict confirmation modal ───────────────────────────────────── */}
      {pendingDrop && (() => {
        const incoming  = members.find((m) => m.id === pendingDrop.incomingId)!;
        const occupant  = members.find((m) => m.id === pendingDrop.occupantId)!;
        const targetRole = ROLES.find((r) => r.id === pendingDrop.targetRole)!;
        const canSwap   = pendingDrop.incomingCurrentRole !== null;
        const fromRole  = canSwap ? ROLES.find((r) => r.id === pendingDrop.incomingCurrentRole) : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={cancelDrop}>
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-200/20 bg-[#07111f] shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="border-b border-cyan-200/10 bg-[radial-gradient(circle_at_0%_0%,rgba(25,216,255,0.08),transparent_50%)] px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Línea ocupada</p>
                <p className="mt-0.5 text-base font-black text-white">
                  <span className={targetRole.color}>{targetRole.label}</span> ya tiene a{" "}
                  <span className="text-white">{occupant.name.split(" ")[0]}</span>
                </p>
              </div>
              {/* Body */}
              <div className="px-5 py-4">
                <p className="text-sm text-slate-400">
                  {canSwap
                    ? <>¿Qué deseas hacer con <span className="font-bold text-white">{incoming.name.split(" ")[0]}</span> ({fromRole && <span className={fromRole.color}>{fromRole.label}</span>}) y <span className="font-bold text-white">{occupant.name.split(" ")[0]}</span> (<span className={targetRole.color}>{targetRole.label}</span>)?</>
                    : <>¿Quieres poner a <span className="font-bold text-white">{incoming.name.split(" ")[0]}</span> en <span className={cn("font-bold", targetRole.color)}>{targetRole.label}</span> y sacar a <span className="font-bold text-white">{occupant.name.split(" ")[0]}</span>?</>
                  }
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {canSwap && (
                    <button
                      className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/10 py-2.5 text-sm font-black text-cyan-300 transition-all hover:border-cyan-300/60 hover:bg-cyan-400/20"
                      onClick={confirmSwap}
                    >
                      Intercambiar roles
                    </button>
                  )}
                  <button
                    className="w-full rounded-xl border border-rose-400/30 bg-rose-500/10 py-2.5 text-sm font-black text-rose-400 transition-all hover:border-rose-400/60 hover:bg-rose-500/20"
                    onClick={confirmReplace}
                  >
                    {canSwap ? `Solo mover a ${targetRole.label} (sacar a ${occupant.name.split(" ")[0]})` : `Reemplazar a ${occupant.name.split(" ")[0]}`}
                  </button>
                  <button
                    className="w-full rounded-xl border border-white/8 py-2.5 text-sm font-bold text-slate-500 transition-all hover:border-white/18 hover:text-slate-300"
                    onClick={cancelDrop}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Build panel modal ─────────────────────────────────────────────── */}
      {buildPanel && (
        <ChampionBuildPanel
          championId={buildPanel.champId}
          championName={buildPanel.champName}
          role={buildPanel.role as LolRole}
          onClose={() => setBuildPanel(null)}
        />
      )}

      {/* ── Champion picker modal ─────────────────────────────────────────── */}
      {pickingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closePicker}>
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-cyan-200/20 bg-[#07111f] shadow-2xl" onClick={(e) => e.stopPropagation()}>

            {/* Picker header */}
            <div className="flex items-center justify-between gap-3 border-b border-cyan-200/10 p-4">
              <div>
                <p className={cn("text-[10px] font-black uppercase tracking-widest", ROLES.find((r) => r.id === pickingFor)?.color)}>
                  {ROLES.find((r) => r.id === pickingFor)?.label}
                </p>
                <p className="text-base font-black text-white">Elegir campeón</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowAll(false)}
                  className={cn("rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors",
                    !showAll ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-300" : "border-white/8 text-slate-500 hover:text-slate-300")}
                >Por rol</button>
                <button
                  onClick={() => setShowAll(true)}
                  className={cn("rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors",
                    showAll ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-300" : "border-white/8 text-slate-500 hover:text-slate-300")}
                >Todos</button>
                <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-lg text-slate-400 hover:text-white" onClick={closePicker}>×</button>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-cyan-200/10 p-3">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar campeón..."
                className="w-full rounded-xl border border-cyan-200/14 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-300/50"
              />
            </div>

            {/* Grid */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {champions.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-slate-600">Cargando campeones...</div>
              ) : filteredChamps.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-slate-600">Sin resultados para &ldquo;{search}&rdquo;</div>
              ) : (
                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                  {filteredChamps.map((c) => (
                    <button key={c.id} onClick={() => pickChamp(c)} title={c.name}
                      className="group flex flex-col items-center gap-1 rounded-xl border border-transparent p-1 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={champImg(c.id)} alt={c.name} loading="lazy"
                        className="size-10 rounded-lg border border-white/8 object-cover group-hover:border-cyan-300/40" />
                      <span className="w-full truncate text-center text-[8px] text-slate-500 group-hover:text-cyan-300">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 16 16">
      <circle cx="5.5" cy="4.5" r="1.2" /><circle cx="5.5" cy="8" r="1.2" /><circle cx="5.5" cy="11.5" r="1.2" />
      <circle cx="10.5" cy="4.5" r="1.2" /><circle cx="10.5" cy="8" r="1.2" /><circle cx="10.5" cy="11.5" r="1.2" />
    </svg>
  );
}
