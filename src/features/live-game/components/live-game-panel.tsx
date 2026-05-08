"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { DashboardBackgroundSync } from "@/features/accounts/components/dashboard-background-sync";
import { SyncAllAccountsButton } from "@/features/accounts/components/sync-all-accounts-button";
import { RankBadge } from "@/features/dashboard/components/rank-badge";
import {
  getGroupSyncVersion,
  subscribeToGroupSync,
} from "@/features/accounts/lib/sync-all-cache";
import { getLiveGameDetails } from "@/features/live-game/actions";
import {
  getCachedLiveGameDetails,
  pruneStaleLiveGameDetails,
  setCachedLiveGameDetails,
  type LiveGameCachedState,
  type LiveGameInfo,
} from "@/features/live-game/lib/live-game-details-cache";
import type { DashboardSnapshot, GroupMember, LeagueAccount } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type AccountWithMember = LeagueAccount & {
  member: GroupMember | null;
};

function latestIsoDate(values: Array<string | null | undefined>) {
  let latest = 0;

  values.forEach((value) => {
    if (!value) return;
    const time = new Date(value).getTime();
    if (Number.isFinite(time) && time > latest) {
      latest = time;
    }
  });

  return latest > 0 ? new Date(latest).toISOString() : null;
}

export function LiveGamePanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [syncVersion, setSyncVersion] = useState(() => getGroupSyncVersion(snapshot.group.id));
  const [liveState, setLiveState] = useState<{
    accountId: string;
    state: LiveGameCachedState;
    syncVersion: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const accounts = useMemo(() => {
    const memberAccounts = snapshot.members.flatMap((member) =>
      member.accounts.map((account) => ({ ...account, member })),
    );
    const sharedAccounts = snapshot.sharedAccounts.map((account) => ({
      ...account,
      member: null,
    }));
    return [...memberAccounts, ...sharedAccounts];
  }, [snapshot.members, snapshot.sharedAccounts]);

  const liveAccounts = accounts.filter((account) => account.isInGame);
  const selectedAccount =
    liveAccounts.find((account) => account.id === selectedAccountId) ?? liveAccounts[0] ?? null;
  const lastStatsSyncedAt = latestIsoDate(accounts.map((account) => account.lastStatsSyncedAt));
  const lastLiveGameCheckedAt = latestIsoDate(accounts.map((account) => account.lastLiveGameCheckedAt));
  const cachedLiveState = selectedAccount
    ? getCachedLiveGameDetails(snapshot.group.id, selectedAccount.id, syncVersion)
    : null;
  const displayedLiveState =
    cachedLiveState ??
    (liveState && liveState.accountId === selectedAccount?.id && liveState.syncVersion === syncVersion
      ? liveState.state
      : null);

  useEffect(() => {
    return subscribeToGroupSync(snapshot.group.id, () => {
      setSyncVersion(getGroupSyncVersion(snapshot.group.id));
    });
  }, [snapshot.group.id]);

  useEffect(() => {
    pruneStaleLiveGameDetails(snapshot.group.id, liveAccounts.map((account) => account.id));
  }, [liveAccounts, snapshot.group.id]);

  useEffect(() => {
    if (!selectedAccount?.id) {
      return;
    }

    if (getCachedLiveGameDetails(snapshot.group.id, selectedAccount.id, syncVersion)) {
      return;
    }

    let cancelled = false;

    startTransition(async () => {
      const result = await getLiveGameDetails(selectedAccount.id);
      if (cancelled) return;

      const nextState: LiveGameCachedState =
        "error" in result && result.error
          ? { error: result.error, game: null }
          : !result.inGame
            ? { error: "Riot ya no reporta esta cuenta en una partida activa.", game: null }
            : { error: null, game: result.game };

      setCachedLiveGameDetails(snapshot.group.id, selectedAccount.id, syncVersion, nextState);
      setLiveState({
        accountId: selectedAccount.id,
        state: nextState,
        syncVersion,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [selectedAccount?.id, snapshot.group.id, syncVersion]);

  return (
    <>
      <div className="animate-enter space-y-4">
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-cyan-200/10 bg-[radial-gradient(circle_at_0%_0%,rgba(245,184,63,0.12),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(25,216,255,0.1),transparent_38%)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="gold">Spectator API</Badge>
                  <Badge tone={liveAccounts.length > 0 ? "teal" : "neutral"}>{liveAccounts.length} jugando</Badge>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">En partida</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Cuentas del grupo detectadas en partida activa. La información se cachea y solo se vuelve a consultar cuando haces una sincronización manual o corre la sincronización automática.
                </p>
              </div>
              <SyncAllAccountsButton
                groupId={snapshot.group.id}
                lastLiveGameCheckedAt={lastLiveGameCheckedAt}
                lastStatsSyncedAt={lastStatsSyncedAt}
              />
            </div>
          </div>

          {liveAccounts.length > 0 ? (
            <div className="grid min-h-[28rem] gap-0 lg:grid-cols-[minmax(17rem,0.44fr)_minmax(0,1fr)]">
              <LiveAccountsList
                accounts={liveAccounts}
                selectedAccountId={selectedAccount?.id ?? ""}
                onSelect={setSelectedAccountId}
              />
              <div className="min-w-0 p-4 sm:p-5">
                {isPending && !displayedLiveState ? (
                  <LiveGameLoading />
                ) : displayedLiveState?.error ? (
                  <LiveGameMessage title="No se pudo cargar la partida" description={displayedLiveState.error} />
                ) : displayedLiveState?.game ? (
                  <LiveGameDetails game={displayedLiveState.game} />
                ) : (
                  <LiveGameMessage title="Selecciona una cuenta" description="La información de partida aparecerá aquí." />
                )}
              </div>
            </div>
          ) : (
            <EmptyLiveGameState>
              <SyncAllAccountsButton
                groupId={snapshot.group.id}
                lastLiveGameCheckedAt={lastLiveGameCheckedAt}
                lastStatsSyncedAt={lastStatsSyncedAt}
              />
            </EmptyLiveGameState>
          )}
        </Panel>
      </div>
      <DashboardBackgroundSync groupId={snapshot.group.id} />
    </>
  );
}

function LiveAccountsList({
  accounts,
  onSelect,
  selectedAccountId,
}: {
  accounts: AccountWithMember[];
  onSelect: (accountId: string) => void;
  selectedAccountId: string;
}) {
  return (
    <aside className="border-b border-cyan-200/10 bg-black/18 p-4 lg:border-b-0 lg:border-r">
      <div className="space-y-2">
        {accounts.map((account) => {
          const active = account.id === selectedAccountId;
          return (
            <button
              className={cn(
                "group flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border p-3 text-left transition",
                active
                  ? "border-cyan-300/50 bg-cyan-400/12 shadow-lg shadow-cyan-500/10"
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
              <span className="size-2.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function LiveGameDetails({ game }: { game: LiveGameInfo }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <MetricPill label="Cola" value={game.queue} />
        <MetricPill label="Duración" value={game.duration} />
        <MetricPill label="Región" value={game.platform} />
        <MetricPill label="Modo" value={game.gameMode} />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {game.teams.map((team) => (
          <div
            className={cn(
              "overflow-hidden rounded-xl border bg-white/[0.035] shadow-xl shadow-black/20",
              team.id === 100 ? "border-cyan-300/20" : "border-pink-300/20",
            )}
            key={team.id}
          >
            <div
              className={cn(
                "border-b px-4 py-3",
                team.id === 100
                  ? "border-cyan-300/14 bg-cyan-400/8 text-cyan-100"
                  : "border-pink-300/14 bg-pink-500/8 text-pink-100",
              )}
            >
              <h2 className="text-sm font-black">Equipo {team.label}</h2>
            </div>
            <div className="divide-y divide-white/8">
              {team.participants.map((participant) => (
                <div
                  className={cn(
                    "flex min-w-0 items-center gap-3 px-4 py-3 transition",
                    participant.isSelectedAccount && "bg-amber-300/8",
                    participant.leagueOfGraphsUrl && "hover:bg-white/[0.045]",
                  )}
                  key={participant.puuid}
                >
                  <ChampionPortrait imageUrl={participant.championImageUrl} name={participant.championName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      {participant.leagueOfGraphsUrl ? (
                        <a
                          className="truncate text-sm font-black text-white underline-offset-4 transition hover:text-cyan-100 hover:underline"
                          href={participant.leagueOfGraphsUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                          title="Abrir perfil en League of Graphs"
                        >
                          {participant.riotId}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-black text-white">{participant.riotId}</p>
                      )}
                      {participant.isSelectedAccount ? <Badge tone="gold">Seleccionada</Badge> : null}
                    </div>
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-xs font-medium text-slate-400">{participant.championName}</p>
                      {participant.activeQueueRank ? (
                        <RankBadge
                          className="h-6 max-w-[11rem] px-2 text-[10px]"
                          division={participant.activeQueueRank.division}
                          lp={participant.activeQueueRank.lp}
                          tier={participant.activeQueueRank.tier}
                        />
                      ) : (
                        <Badge className="h-5 px-1.5 text-[10px]" tone="neutral">Sin liga de cola</Badge>
                      )}
                    </div>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <IconGroup icons={participant.spells} label="Hechizos" />
                    {participant.perks.length > 0 ? <IconGroup icons={participant.perks} label="Runas" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconGroup({
  icons,
  label,
}: {
  icons: { imageUrl: string | null; name: string }[];
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" aria-label={label}>
      {icons.map((icon, index) => (
        <DataDragonIcon icon={icon} key={`${label}-${index}-${icon.name}`} />
      ))}
    </div>
  );
}

function DataDragonIcon({ icon }: { icon: { imageUrl: string | null; name: string } }) {
  return (
    <div className="relative size-7 overflow-hidden rounded-md border border-white/10 bg-black/30" title={icon.name}>
      {icon.imageUrl ? (
        <Image alt={icon.name} className="object-cover" fill sizes="28px" src={icon.imageUrl} />
      ) : (
        <div className="flex size-full items-center justify-center text-[9px] font-black text-slate-500">?</div>
      )}
    </div>
  );
}

function ChampionPortrait({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-white/12 bg-black/30 shadow-lg shadow-black/20">
      {imageUrl ? (
        <Image alt={name} className="object-cover" fill sizes="48px" src={imageUrl} />
      ) : (
        <div className="flex size-full items-center justify-center text-xs font-black text-slate-500">?</div>
      )}
      <span className="absolute inset-0 bg-linear-to-br from-white/14 via-transparent to-black/20" />
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-cyan-200/12 bg-black/22 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white" title={value}>{value}</p>
    </div>
  );
}

function LiveGameLoading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-[4.25rem] animate-pulse rounded-xl border border-white/8 bg-white/[0.045]" key={index} />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, teamIndex) => (
          <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4" key={teamIndex}>
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((__, index) => (
                <div className="flex items-center gap-3" key={index}>
                  <div className="size-12 animate-pulse rounded-xl bg-white/10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-2/5 animate-pulse rounded bg-white/8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveGameMessage({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex min-h-[18rem] items-center justify-center rounded-xl border border-dashed border-cyan-200/16 bg-white/[0.025] p-6 text-center">
      <div>
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-cyan-300/22 bg-cyan-400/10 text-lg font-black text-cyan-200">
          ◇
        </div>
        <h2 className="mt-4 text-base font-black text-white">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function EmptyLiveGameState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[24rem] items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl border border-cyan-300/22 bg-cyan-400/10 text-xl font-black text-cyan-200">
          ◇
        </div>
        <h2 className="mt-5 text-xl font-black text-white">No hay cuentas en partida</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Sincroniza el grupo para revisar estados en vivo. Cuando Riot reporte una cuenta activa, aparecerá en la columna izquierda.
        </p>
        <div className="mt-5 flex justify-center">{children}</div>
      </div>
    </div>
  );
}
