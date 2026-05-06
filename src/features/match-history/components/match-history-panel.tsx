"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getMatchHistory, getMatchParticipantTiers, type ParticipantRankInfo, type QueueFilter } from "@/features/match-history/actions";
import type { DashboardSnapshot, GroupMember, LeagueAccount } from "@/features/dashboard/types";
import type { MatchHistoryItem, MatchHistoryResult } from "@/features/match-history/types";
import { cn } from "@/lib/utils";

type AccountWithMember = LeagueAccount & {
  member: GroupMember | null;
};

function allAccounts(snapshot: DashboardSnapshot): AccountWithMember[] {
  const memberAccounts = snapshot.members.flatMap((member) =>
    member.accounts.map((account) => ({ ...account, member })),
  );
  const sharedAccounts = snapshot.sharedAccounts.map((account) => ({
    ...account,
    member: null,
  }));
  return [...memberAccounts, ...sharedAccounts];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function updatedAtLabel(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

export function MatchHistoryPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const accounts = useMemo(() => allAccounts(snapshot), [snapshot]);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "");
  const [queue, setQueue] = useState<QueueFilter>("soloq");
  const [historyCache, setHistoryCache] = useState<Map<string, MatchHistoryResult>>(new Map());
  const [isPending, startTransition] = useTransition();

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? accounts[0] ?? null;
  const cacheKey = `${selectedAccount?.id}:${queue}`;
  const selectedHistory = historyCache.get(cacheKey) ?? null;

  const loadHistory = (accountId: string, q: QueueFilter, force = false) => {
    const key = `${accountId}:${q}`;
    if (!force && historyCache.has(key)) return;
    startTransition(async () => {
      const result = await getMatchHistory(accountId, q);
      setHistoryCache((prev) => new Map(prev).set(key, result));
    });
  };

  useEffect(() => {
    if (!selectedAccount?.id) return;
    loadHistory(selectedAccount.id, queue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.id, queue]);

  return (
    <div className="animate-enter space-y-4">
      <Panel className="overflow-hidden p-0">
        <div className="border-b border-cyan-200/10 bg-[radial-gradient(circle_at_0%_0%,rgba(25,216,255,0.12),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(124,60,255,0.12),transparent_36%)] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="indigo">Match-V5</Badge>
                <Badge tone="teal">{accounts.length} cuentas</Badge>
                {selectedHistory && selectedHistory.error === null ? (
                  <Badge tone="neutral">Actualizado {updatedAtLabel(selectedHistory.updatedAt)}</Badge>
                ) : null}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Historial</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Últimas 20 partidas de la cuenta seleccionada, con estadísticas de combate, economía, visión, súbditos y objetos.
              </p>
            </div>
            {selectedAccount ? (
              <div className="flex flex-col items-end gap-2">
                <Button
                  className="self-start"
                  disabled={isPending}
                  onClick={() => loadHistory(selectedAccount.id, queue, true)}
                  variant="secondary"
                >
                  {isPending ? "Consultando..." : "Actualizar historial"}
                </Button>
                <div className="flex overflow-hidden rounded-lg border border-white/12 bg-black/20">
                  {(["soloq", "flex"] as const).map((q) => (
                    <button
                      className={cn(
                        "px-3 py-1.5 text-xs font-black transition",
                        q === queue
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
                      )}
                      disabled={isPending}
                      key={q}
                      onClick={() => setQueue(q)}
                      type="button"
                    >
                      {q === "soloq" ? "Solo/Duo" : "Flex"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {accounts.length > 0 ? (
          <div className="grid min-h-[36rem] gap-0 xl:grid-cols-[minmax(17rem,0.36fr)_minmax(0,1fr)]">
            <HistoryAccountsList
              accounts={accounts}
              selectedAccountId={selectedAccount?.id ?? ""}
              onSelect={setSelectedAccountId}
            />
            <div className="min-w-0 p-4 sm:p-5">
              {isPending && !selectedHistory ? (
                <HistoryLoading />
              ) : selectedHistory?.error ? (
                <HistoryMessage title="No se pudo cargar el historial" description={selectedHistory.error} />
              ) : selectedHistory?.error === null && selectedHistory.matches.length ? (
                <MatchList
                  accountId={selectedHistory.account.id}
                  matches={selectedHistory.matches}
                  queue={queue}
                  routingPlatform={selectedHistory.account.routingPlatform ?? ""}
                />
              ) : selectedHistory ? (
                <HistoryMessage
                  title="Sin partidas recientes"
                  description="Riot no devolvió partidas recientes para esta cuenta."
                />
              ) : (
                <HistoryMessage title="Selecciona una cuenta" description="El historial aparecerá aquí." />
              )}
            </div>
          </div>
        ) : (
          <HistoryMessage
            title="No hay cuentas agregadas"
            description="Agrega una cuenta en el Dashboard para consultar su historial desde Riot."
          />
        )}
      </Panel>
    </div>
  );
}

function HistoryAccountsList({
  accounts,
  onSelect,
  selectedAccountId,
}: {
  accounts: AccountWithMember[];
  onSelect: (accountId: string) => void;
  selectedAccountId: string;
}) {
  return (
    <aside className="border-b border-cyan-200/10 bg-black/18 p-4 xl:border-b-0 xl:border-r">
      <div className="space-y-2">
        {accounts.map((account) => {
          const active = account.id === selectedAccountId;
          return (
            <button
              className={cn(
                "group flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border p-3 text-left transition",
                active
                  ? "border-violet-300/50 bg-violet-400/12 shadow-lg shadow-violet-500/10"
                  : "border-white/8 bg-white/[0.035] hover:border-cyan-300/28 hover:bg-white/[0.06]",
              )}
              key={account.id}
              onClick={() => onSelect(account.id)}
              type="button"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-white">
                  {account.summonerName}
                  <span className="text-slate-400">#{account.tagLine}</span>
                </div>
                <p className="mt-1 truncate text-xs font-medium text-slate-500">
                  {account.member?.name ?? "Cuenta compartida"} · {account.region}
                </p>
              </div>
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  active ? "bg-violet-300 shadow-[0_0_14px_rgba(167,139,250,0.75)]" : "bg-slate-600",
                )}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function MatchList({
  accountId,
  matches,
  queue,
  routingPlatform,
}: {
  accountId: string;
  matches: MatchHistoryItem[];
  queue: QueueFilter;
  routingPlatform: string;
}) {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchCard
          accountId={accountId}
          expanded={expandedMatchId === match.id}
          key={match.id}
          match={match}
          queue={queue}
          routingPlatform={routingPlatform}
          onToggle={() => setExpandedMatchId((current) => (current === match.id ? null : match.id))}
        />
      ))}
    </div>
  );
}

function MatchCard({
  accountId,
  expanded,
  match,
  onToggle,
  queue,
  routingPlatform,
}: {
  accountId: string;
  expanded: boolean;
  match: MatchHistoryItem;
  onToggle: () => void;
  queue: QueueFilter;
  routingPlatform: string;
}) {
  const won = match.result === "Victoria";

  const { selectedRank, selectedOpLabel } = (() => {
    const all = match.teams.flatMap((t) => t.participants);
    const sorted = [...all].sort((a, b) => b.opScore - a.opScore);
    const idx = sorted.findIndex((p) => p.selected);
    const selected = all.find((p) => p.selected) ?? null;
    return { selectedRank: idx === -1 ? null : idx + 1, selectedOpLabel: selected?.opLabel ?? null };
  })();

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-white/[0.035] shadow-xl shadow-black/20",
        won ? "border-cyan-300/18" : "border-pink-300/18",
      )}
    >
      <div
        className={cn(
          "grid gap-4 border-b p-4 md:grid-cols-[minmax(14rem,1.2fr)_minmax(0,2fr)]",
          won ? "border-cyan-300/12 bg-cyan-400/7" : "border-pink-300/12 bg-pink-500/7",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ChampionPortrait imageUrl={match.championImageUrl} name={match.championName} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={won ? "teal" : "danger"}>{match.result}</Badge>
              <Badge tone="neutral">{match.queue}</Badge>
              {selectedRank !== null ? (
                <span className={cn("inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-black", rankStyle(selectedRank))}>
                  {selectedOpLabel ?? `#${selectedRank}`}
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 truncate text-base font-black text-white">{match.championName}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {match.dateLabel} · {match.duration} · {match.lane}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill label="K/D/A" value={`${match.kills}/${match.deaths}/${match.assists}`} detail={`${match.kda} KDA`} />
          <StatPill label="KP" value={`${match.killParticipation}%`} detail="participación" />
          <StatPill label="CS" value={String(match.creepScore)} detail={`${match.creepScorePerMinute}/min`} />
          <StatPill label="Visión" value={String(match.visionScore)} detail={`${match.wardsPlaced}/${match.wardsKilled} wards`} />
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill label="Daño" value={formatNumber(match.damageDealtToChampions)} detail="a campeones" />
          <StatPill label="Recibido" value={formatNumber(match.damageTaken)} detail="daño total" />
          <StatPill
            label="PL"
            value={match.lpChange !== null ? (match.lpChange > 0 ? "+" : "") + match.lpChange : "—"}
            detail={match.lpChange !== null ? (match.lpChange >= 0 ? "ganados" : "perdidos") : "no disponible"}
          />
          <div className="min-w-0 rounded-xl border border-cyan-200/10 bg-black/20 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Hechizos</p>
            <div className="mt-2 flex gap-2">
              {match.summonerSpells.map((spell) => (
                <DataDragonIcon icon={spell} key={`${match.id}-spell-${spell.id}`} size="sm" />
              ))}
            </div>
            <p className="mt-2 truncate text-xs font-semibold text-slate-500">
              {match.largestMultiKill ? `${match.largestMultiKill} kill` : match.gameMode}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Objetos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {match.items.length > 0 ? (
                match.items.map((item, index) => <DataDragonIcon icon={item} key={`${match.id}-item-${index}-${item.id}`} />)
              ) : (
                <span className="text-sm font-medium text-slate-500">Sin objetos registrados</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              className="inline-flex h-8 items-center justify-center rounded-lg border border-violet-300/40 bg-violet-500/12 px-3 text-xs font-black text-violet-100 transition hover:border-violet-200/70 hover:bg-violet-500/18"
              href={`/historial/partida/${match.matchId}?account=${accountId}&queue=${queue}`}
            >
              Ver analisis
            </Link>
            <Button
              aria-expanded={expanded}
              className="h-8 px-3 text-xs"
              onClick={onToggle}
              type="button"
              variant="ghost"
            >
              {expanded ? "Contraer partida" : "Ampliar partida"}
              <span aria-hidden="true" className="text-sm leading-none">
                {expanded ? "⌃" : "⌄"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {expanded ? <ExpandedMatchDetails match={match} routingPlatform={routingPlatform} /> : null}

      <div className="flex justify-end border-t border-white/8 px-4 py-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            className="inline-flex h-9 items-center justify-center rounded-lg border border-violet-300/40 bg-violet-500/12 px-3 text-xs font-black text-violet-100 transition hover:border-violet-200/70 hover:bg-violet-500/18"
            href={`/historial/partida/${match.matchId}?account=${accountId}&queue=${queue}`}
          >
            Ver analisis
          </Link>
          <Button
            aria-expanded={expanded}
            className="h-9 px-3 text-xs"
            onClick={onToggle}
            type="button"
            variant="ghost"
          >
            {expanded ? "Contraer partida" : "Ampliar partida"}
            <span aria-hidden="true" className="text-sm leading-none">
              {expanded ? "⌃" : "⌄"}
            </span>
          </Button>
        </div>
      </div>
    </article>
  );
}

function ExpandedMatchDetails({ match, routingPlatform }: { match: MatchHistoryItem; routingPlatform: string }) {
  const allParticipants = match.teams.flatMap((t) => t.participants);
  const sorted = [...allParticipants].sort((a, b) => b.opScore - a.opScore);
  const rankMap = new Map(sorted.map((p, i) => [p.puuid, i + 1]));

  const [tierMap, setTierMap] = useState<Record<string, ParticipantRankInfo>>({});

  useEffect(() => {
    if (!routingPlatform) return;
    const puuids = allParticipants.map((p) => p.puuid);
    getMatchParticipantTiers(puuids, routingPlatform).then(setTierMap);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.matchId, routingPlatform]);

  return (
    <div className="border-t border-cyan-200/10 bg-black/18 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-white">Participantes</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Estadísticas completas de ambos equipos en esta partida.
          </p>
        </div>
        <Badge tone="neutral">{match.matchId}</Badge>
      </div>
      <div className="grid gap-3">
        {match.teams.map((team) => (
          <div
            className={cn(
              "overflow-hidden rounded-xl border bg-white/[0.025]",
              team.id === 100 ? "border-cyan-300/18" : "border-pink-300/18",
            )}
            key={team.id}
          >
            <div
              className={cn(
                "flex items-center justify-between border-b px-4 py-3",
                team.id === 100
                  ? "border-cyan-300/12 bg-cyan-400/7"
                  : "border-pink-300/12 bg-pink-500/7",
              )}
            >
              <h4 className="text-sm font-black text-white">Equipo {team.label}</h4>
              <Badge tone={team.result === "Victoria" ? "teal" : "danger"}>{team.result}</Badge>
            </div>
            <div className="divide-y divide-white/8">
              {team.participants.map((participant) => (
                <ParticipantRow
                  key={participant.puuid || participant.participantId}
                  participant={participant}
                  rank={rankMap.get(participant.puuid) ?? 10}
                  tier={tierMap[participant.puuid] ?? null}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TIER_EMBLEMS: Partial<Record<string, string>> = {
  IRON: "/emblem-small/emblem-iron.webp",
  BRONZE: "/emblem-small/emblem-bronze.webp",
  SILVER: "/emblem-small/emblem-silver.webp",
  GOLD: "/emblem-small/emblem-gold.webp",
  PLATINUM: "/emblem-small/emblem-platinum.webp",
  EMERALD: "/emblem-small/emblem-emerald.webp",
  DIAMOND: "/emblem-small/emblem-diamond.webp",
  MASTER: "/emblem-small/emblem-master.webp",
  GRANDMASTER: "/emblem-small/emblem-grandmaster.webp",
  CHALLENGER: "/emblem-small/emblem-challenger.webp",
};

function TierIcon({ rank }: { rank: ParticipantRankInfo | null }) {
  const src = rank ? TIER_EMBLEMS[rank.tier] : null;
  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-0.5">
      <div className="relative size-14 overflow-hidden">
        {src ? (
          <Image
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-auto w-[320%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            height={112}
            priority={false}
            src={src}
            width={112}
          />
        ) : (
          <div className="size-full rounded border border-white/8 bg-white/5" />
        )}
      </div>
      {rank?.division ? (
        <span className="text-[9px] font-black leading-none tracking-wide text-slate-400">
          {rank.division}
        </span>
      ) : null}
    </div>
  );
}

function rankStyle(rank: number): string {
  if (rank === 1) return "bg-amber-400/25 text-amber-300 border-amber-400/40";
  if (rank === 2) return "bg-slate-300/15 text-slate-300 border-slate-400/30";
  if (rank === 3) return "bg-amber-700/20 text-amber-500 border-amber-600/30";
  if (rank <= 5)  return "bg-cyan-500/10 text-cyan-400/80 border-cyan-500/18";
  return "bg-white/5 text-slate-500 border-white/8";
}

function ParticipantRow({ participant, rank, tier }: { participant: MatchHistoryItem["teams"][number]["participants"][number]; rank: number; tier: ParticipantRankInfo | null }) {
  const style = rankStyle(rank);
  return (
    <div
      className={cn(
        "grid gap-3 px-4 py-3 lg:grid-cols-[minmax(15rem,1.3fr)_minmax(10rem,0.7fr)_minmax(12rem,0.9fr)_minmax(9rem,0.7fr)]",
        participant.selected && "bg-amber-300/8",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <TierIcon rank={tier} />
        <div className="relative shrink-0">
          <ChampionPortrait imageUrl={participant.championImageUrl} name={participant.championName} />
          <span className={cn("absolute -bottom-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border text-[10px] font-black", style)}>
            {rank}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-white">{participant.riotId}</p>
            {participant.selected ? <Badge tone="gold">Seleccionada</Badge> : null}
            {participant.opLabel ? (
              <Badge tone={participant.opLabel === "MVP" ? "gold" : "indigo"}>{participant.opLabel}</Badge>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {participant.championName} · {participant.lane}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <CompactMetric label="K/D/A" value={`${participant.kills}/${participant.deaths}/${participant.assists}`} />
        <CompactMetric label="CS" value={String(participant.creepScore)} />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {participant.items.length > 0 ? (
          participant.items.map((item, index) => (
            <DataDragonIcon icon={item} key={`${participant.participantId}-item-${index}-${item.id}`} size="sm" />
          ))
        ) : (
          <span className="text-xs font-semibold text-slate-500">Sin objetos</span>
        )}
      </div>

      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {participant.summonerSpells.map((spell) => (
            <DataDragonIcon icon={spell} key={`${participant.participantId}-spell-${spell.id}`} size="sm" />
          ))}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-black text-white">{participant.kda} KDA</p>
          <p className="text-[11px] font-semibold text-slate-500">{formatNumber(participant.damageDealtToChampions)} daño</p>
          <p className="text-[11px] font-semibold text-slate-500">{formatNumber(participant.goldEarned)} oro</p>
        </div>
      </div>
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/8 bg-black/18 px-2 py-1.5">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="truncate text-xs font-black text-white">{value}</p>
    </div>
  );
}

function ChampionPortrait({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-black/30 shadow-lg shadow-black/20">
      {imageUrl ? (
        <Image alt={name} className="object-cover" fill sizes="56px" src={imageUrl} />
      ) : (
        <div className="flex size-full items-center justify-center text-xs font-black text-slate-500">?</div>
      )}
      <span className="absolute inset-0 bg-linear-to-br from-white/14 via-transparent to-black/20" />
    </div>
  );
}

function DataDragonIcon({
  icon,
  size = "md",
}: {
  icon: { imageUrl: string | null; name: string };
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-black/30",
        size === "sm" ? "size-8" : "size-9",
      )}
      title={icon.name}
    >
      {icon.imageUrl ? (
        <Image alt={icon.name} className="object-cover" fill sizes={size === "sm" ? "32px" : "36px"} src={icon.imageUrl} />
      ) : (
        <div className="flex size-full items-center justify-center text-[10px] font-black text-slate-500">?</div>
      )}
    </div>
  );
}

function StatPill({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-cyan-200/10 bg-black/20 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-base font-black text-white" title={value}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function HistoryLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4" key={index}>
          <div className="flex items-center gap-3">
            <div className="size-14 animate-pulse rounded-xl bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-white/8" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((__, pillIndex) => (
              <div className="h-[4.25rem] animate-pulse rounded-xl bg-white/8" key={pillIndex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryMessage({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex min-h-[24rem] items-center justify-center rounded-xl border border-dashed border-cyan-200/16 bg-white/[0.025] p-6 text-center">
      <div>
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-violet-300/22 bg-violet-400/10 text-lg font-black text-violet-200">
          ◇
        </div>
        <h2 className="mt-4 text-base font-black text-white">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}
