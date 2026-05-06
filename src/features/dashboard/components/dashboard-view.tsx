"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AddAccountProvider, AddAccountTrigger } from "@/features/accounts/components/add-account-dialog";
import { DashboardBackgroundSync } from "@/features/accounts/components/dashboard-background-sync";
import { SyncAllAccountsButton } from "@/features/accounts/components/sync-all-accounts-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { AccountDetailsButton } from "@/features/dashboard/components/account-details-button";
import { CopyChip } from "@/features/dashboard/components/copy-chip";
import { ExternalStatsButton } from "@/features/dashboard/components/external-stats-button";
import { LiveGameButton } from "@/features/dashboard/components/live-game-button";
import { RankBadge } from "@/features/dashboard/components/rank-badge";
import { RemoveMemberButton } from "@/features/groups/components/remove-member-button";
import type {
  DashboardSnapshot,
  GroupMember,
  LeaderboardSort,
  LeaderboardSortDirection,
  LeagueAccount,
} from "@/features/dashboard/types";
import { InviteMemberButton } from "@/features/invites/components/invite-member-dialog";
import { RenameGroupButton } from "@/features/groups/components/rename-group-dialog";
import { cn } from "@/lib/utils";

type DashboardViewProps = {
  snapshot: DashboardSnapshot;
  queue: "flex" | "solo-duo";
  sort: LeaderboardSort;
  sortDirection: LeaderboardSortDirection;
};

type LeaderboardState = {
  queue: DashboardViewProps["queue"];
  sort: LeaderboardSort;
  sortDirection: LeaderboardSortDirection;
};

type AccountWithMember = LeagueAccount & {
  member: GroupMember | null;
};

type MemberOption = {
  id: string;
  name: string;
};

type Accent = "teal" | "indigo" | "gold" | "danger";
type StatIconName = "members" | "accounts" | "crown";

const accentStyles: Record<
  Accent,
  {
    border: string;
    glow: string;
    icon: string;
    meter: string;
    text: string;
  }
> = {
  teal: {
    border: "border-cyan-300/36 hover:border-cyan-200/60",
    glow: "from-cyan-400/18 via-cyan-300/7 to-white/[0.03] shadow-cyan-500/12",
    icon: "border-cyan-300/38 bg-cyan-400/12 text-cyan-200 shadow-cyan-400/20",
    meter: "from-cyan-300 via-sky-400 to-violet-500",
    text: "text-cyan-200",
  },
  indigo: {
    border: "border-violet-300/36 hover:border-violet-200/60",
    glow: "from-violet-500/18 via-violet-400/7 to-white/[0.03] shadow-violet-500/12",
    icon: "border-violet-300/38 bg-violet-500/12 text-violet-200 shadow-violet-500/20",
    meter: "from-violet-300 via-fuchsia-400 to-cyan-300",
    text: "text-violet-200",
  },
  gold: {
    border: "border-amber-300/38 hover:border-amber-200/65",
    glow: "from-amber-400/18 via-amber-300/7 to-white/[0.03] shadow-amber-500/12",
    icon: "border-amber-300/42 bg-amber-400/12 text-amber-200 shadow-amber-400/20",
    meter: "from-amber-300 via-orange-400 to-cyan-300",
    text: "text-amber-200",
  },
  danger: {
    border: "border-pink-300/38 hover:border-pink-200/65",
    glow: "from-pink-500/18 via-pink-400/7 to-white/[0.03] shadow-pink-500/12",
    icon: "border-pink-300/42 bg-pink-500/12 text-pink-200 shadow-pink-500/20",
    meter: "from-pink-400 via-rose-400 to-orange-400",
    text: "text-pink-200",
  },
};

const TIER_SORT_ORDER: Record<string, number> = {
  UNRANKED: 0,
  IRON: 10,
  BRONZE: 20,
  SILVER: 30,
  GOLD: 40,
  PLATINUM: 50,
  EMERALD: 60,
  DIAMOND: 70,
  MASTER: 80,
  GRANDMASTER: 90,
  CHALLENGER: 100,
};

const DIVISION_SORT_ORDER: Record<string, number> = {
  I: 4,
  II: 3,
  III: 2,
  IV: 1,
};

function leaderboardSortScore(account: LeagueAccount, queue: "flex" | "solo-duo"): number {
  const queueStats = queue === "solo-duo" ? account.soloDuo : account.flex;
  const tier = queueStats.tier.toUpperCase();
  const tierPoints = TIER_SORT_ORDER[tier] ?? 0;
  let divPoints = 0;
  if (queueStats.division && DIVISION_SORT_ORDER[queueStats.division]) {
    divPoints = DIVISION_SORT_ORDER[queueStats.division];
  } else if (tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER") {
    divPoints = 5;
  }
  return tierPoints * 10_000 + divPoints * 100 + queueStats.lp;
}

function queueStatsFor(account: LeagueAccount, queue: "flex" | "solo-duo") {
  return queue === "solo-duo" ? account.soloDuo : account.flex;
}

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

function sortLeaderboardAccounts(
  accounts: AccountWithMember[],
  queue: "flex" | "solo-duo",
  sort: LeaderboardSort,
  sortDirection: LeaderboardSortDirection,
) {
  return [...accounts].sort((left, right) => {
    const leftStats = queueStatsFor(left, queue);
    const rightStats = queueStatsFor(right, queue);
    const rankScoreDiff = leaderboardSortScore(right, queue) - leaderboardSortScore(left, queue);
    const direction = sortDirection === "asc" ? -1 : 1;
    const rankDiff = rankScoreDiff * direction;

    if (sort === "games") {
      return (rightStats.totalGames - leftStats.totalGames) * direction || rankDiff;
    }

    if (sort === "win-rate") {
      const leftHasGames = leftStats.totalGames > 0;
      const rightHasGames = rightStats.totalGames > 0;
      if (leftHasGames !== rightHasGames) return rightHasGames ? 1 : -1;
      return (
        (rightStats.winRate - leftStats.winRate) * direction ||
        (rightStats.totalGames - leftStats.totalGames) * direction ||
        rankDiff
      );
    }

    return rankDiff;
  });
}

function leaderboardHref(
  queue: "flex" | "solo-duo",
  sort: LeaderboardSort,
  sortDirection: LeaderboardSortDirection,
) {
  return `/?queue=${queue}&sort=${sort}&dir=${sortDirection}`;
}

function nextSortDirection(
  activeSort: LeaderboardSort,
  currentDirection: LeaderboardSortDirection,
  nextSort: LeaderboardSort,
) {
  if (activeSort !== nextSort) return "desc";
  return currentDirection === "desc" ? "asc" : "desc";
}

const SORT_LABELS: Record<LeaderboardSort, string> = {
  rank: "Rango",
  games: "Partidas",
  "win-rate": "Win rate",
};

function useReorderAnimation(animationKey: string) {
  const elementsRef = useRef(new Map<string, HTMLElement>());
  const previousRectsRef = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const currentRects = new Map<string, DOMRect>();

    elementsRef.current.forEach((element, id) => {
      if (!element.isConnected) return;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      currentRects.set(id, rect);
    });

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      previousRectsRef.current = currentRects;
      return;
    }

    currentRects.forEach((rect, id) => {
      const previousRect = previousRectsRef.current.get(id);
      const element = elementsRef.current.get(id);
      if (!previousRect || !element) return;

      const deltaX = previousRect.left - rect.left;
      const deltaY = previousRect.top - rect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      element.animate(
        [
          {
            opacity: 0.86,
            transform: `translate(${deltaX}px, ${deltaY}px) scale(0.985)`,
          },
          {
            opacity: 1,
            transform: "translate(0px, 0px) scale(1)",
          },
        ],
        {
          duration: 440,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    });

    previousRectsRef.current = currentRects;
  }, [animationKey]);

  return (id: string) => (node: HTMLElement | null) => {
    if (node) {
      elementsRef.current.set(id, node);
      return;
    }
    elementsRef.current.delete(id);
  };
}

function LeaderboardNavLink({
  children,
  className,
  nextState,
  onNavigate,
}: {
  children: ReactNode;
  className?: string;
  nextState: LeaderboardState;
  onNavigate: (nextState: LeaderboardState) => void;
}) {
  return (
    <Link
      className={className}
      href={leaderboardHref(nextState.queue, nextState.sort, nextState.sortDirection)}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(nextState);
      }}
      prefetch={false}
      scroll={false}
    >
      {children}
    </Link>
  );
}

export function DashboardView({
  snapshot,
  queue: initialQueue,
  sort: initialSort,
  sortDirection: initialSortDirection,
}: DashboardViewProps) {
  const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>(() => ({
    queue: initialQueue,
    sort: initialSort,
    sortDirection: initialSortDirection,
  }));

  const queue = leaderboardState.queue;
  const sort = leaderboardState.sort;
  const sortDirection = leaderboardState.sortDirection;

  const navigateLeaderboard = (nextState: LeaderboardState) => {
    setLeaderboardState((current) => {
      if (
        current.queue === nextState.queue &&
        current.sort === nextState.sort &&
        current.sortDirection === nextState.sortDirection
      ) {
        return current;
      }

      if (typeof window !== "undefined") {
        window.history.replaceState(window.history.state, "", leaderboardHref(nextState.queue, nextState.sort, nextState.sortDirection));
      }

      return nextState;
    });
  };

  const memberAccounts = snapshot.members.flatMap((member) =>
    member.accounts.map((account) => ({ ...account, member })),
  );
  const sharedAccounts = snapshot.sharedAccounts.map((account) => ({
    ...account,
    member: null,
  }));
  const accounts = [...memberAccounts, ...sharedAccounts];
  const lastStatsSyncedAt = latestIsoDate(accounts.map((account) => account.lastStatsSyncedAt));
  const lastLiveGameCheckedAt = latestIsoDate(accounts.map((account) => account.lastLiveGameCheckedAt));
  const sortedAccounts = sortLeaderboardAccounts(accounts, queue, sort, sortDirection);
  const worstWinRateAccount = sortedAccounts
    .filter((account) => {
      const queueStats = queueStatsFor(account, queue);
      return queueStats.totalGames > 0;
    })
    .sort((left, right) => {
      const leftStats = queueStatsFor(left, queue);
      const rightStats = queueStatsFor(right, queue);
      return leftStats.winRate - rightStats.winRate || rightStats.totalGames - leftStats.totalGames;
    })[0];
  const worstWinRateStats = worstWinRateAccount ? queueStatsFor(worstWinRateAccount, queue) : null;
  const memberOptions = snapshot.members.map((member) => ({
    id: member.id,
    name: member.name,
  }));
  const leaderboardAnimationKey = `${queue}:${sort}:${sortDirection}:${sortedAccounts.map((account) => account.id).join("|")}`;
  const registerDesktopRow = useReorderAnimation(`desktop:${leaderboardAnimationKey}`);
  const registerMobileCard = useReorderAnimation(`mobile:${leaderboardAnimationKey}`);

  return (
    <AddAccountProvider groupId={snapshot.group.id}>
    <div className="animate-enter space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.58fr)_minmax(360px,0.8fr)]">
        <div className="relative overflow-hidden rounded-xl border border-cyan-200/14 bg-[#07111f]/86 p-5 shadow-2xl shadow-black/40 ring-1 ring-white/7 backdrop-blur-xl sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_10%,rgba(25,216,255,0.16),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(124,60,255,0.2),transparent_33%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%)]" />
          <div className="absolute -right-12 top-2 hidden size-72 rounded-full border border-cyan-300/10 bg-[conic-gradient(from_130deg,rgba(25,216,255,0.18),rgba(124,60,255,0.05),transparent,rgba(25,216,255,0.18))] opacity-70 blur-[0.3px] md:block" />
          <div className="absolute right-10 top-9 hidden text-[13rem] font-black leading-none text-white/[0.025] md:block">
            FX
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-cyan-300/60 via-violet-400/45 to-amber-300/35" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="teal">Grupo privado</Badge>
                <Badge tone="gold">{queue === "solo-duo" ? "Solo/Duo queue" : "Flex queue"}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <h1 className="max-w-[min(100%,36rem)] text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {snapshot.group.name}
                </h1>
                {snapshot.viewerIsOwner ? (
                  <RenameGroupButton currentName={snapshot.group.name} groupId={snapshot.group.id} />
                ) : null}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Coordina cuentas y miembros con una lectura clara del ranking {queue === "solo-duo" ? "Solo/Duo" : "Flex"} antes de conectar datos
                Riot en profundidad.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:pt-5">
              {snapshot.viewerInviteAdmin ? (
                <InviteMemberButton groupId={snapshot.group.id} pendingInvites={snapshot.invites} />
              ) : null}
              <AddAccountTrigger variant="hero" />
            </div>
          </div>

          <dl className="relative mt-7 grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatTile
              accent="teal"
              detail="Miembros activos"
              icon="members"
              label="Miembros"
              value={snapshot.members.length.toString()}
            />
            <StatTile
              accent="indigo"
              detail="Registradas en el grupo"
              icon="accounts"
              label="Cuentas"
              value={accounts.length.toString()}
            />
            <StatTile
              accent="danger"
              detail={
                worstWinRateAccount && worstWinRateStats
                  ? `${worstWinRateStats.winRate}% WR en ${worstWinRateStats.totalGames} partidas`
                  : "Sin partidas en la cola seleccionada"
              }
              icon="crown"
              label="Bollo de mrd"
              value={worstWinRateAccount?.summonerName ?? "Sin datos"}
              valueClassName="text-2xl sm:text-3xl"
            />
          </dl>
        </div>

        <MembersScrollPanel
          canManageMembers={snapshot.viewerCanManageMembers}
          groupId={snapshot.group.id}
          members={snapshot.members}
          sharedAccountsCount={snapshot.sharedAccounts.length}
          viewerId={snapshot.viewerId}
        />
      </section>

      <section>
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-cyan-200/10 bg-[radial-gradient(circle_at_0%_0%,rgba(25,216,255,0.12),transparent_34%)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="hex-mark relative flex size-13 shrink-0 items-center justify-center border border-cyan-300/22 bg-linear-to-br from-cyan-400/18 via-sky-500/12 to-violet-600/14 text-amber-300 shadow-xl shadow-cyan-500/12">
                <span className="absolute inset-1 hex-mark border border-cyan-300/16 bg-black/18" />
                <TrophyIcon className="relative size-7 drop-shadow-[0_0_10px_rgba(245,184,63,0.65)]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Leaderboard {queue === "solo-duo" ? "Solo/Duo" : "Flex"}</h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  Ordenado por {SORT_LABELS[sort]} {sortDirection === "asc" ? "de menor a mayor" : "de mayor a menor"}.
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex rounded-lg border border-white/10 bg-black/24 p-1 shadow-inner shadow-black/20">
                  <LeaderboardNavLink
                    nextState={{ queue: "flex", sort, sortDirection }}
                    onNavigate={navigateLeaderboard}
                  >
                    <span className={cn(
                      "inline-flex h-8 items-center rounded-md px-3 text-xs font-black transition",
                      queue === "flex"
                        ? "bg-cyan-400/18 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.38)]"
                        : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
                    )}>
                      Flex
                    </span>
                  </LeaderboardNavLink>
                  <LeaderboardNavLink
                    nextState={{ queue: "solo-duo", sort, sortDirection }}
                    onNavigate={navigateLeaderboard}
                  >
                    <span className={cn(
                      "inline-flex h-8 items-center rounded-md px-3 text-xs font-black transition",
                      queue === "solo-duo"
                        ? "bg-cyan-400/18 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.38)]"
                        : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
                    )}>
                      Solo/Duo
                    </span>
                  </LeaderboardNavLink>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 md:hidden">
                  <LeaderboardNavLink
                    nextState={{ queue, sort: "rank", sortDirection: nextSortDirection(sort, sortDirection, "rank") }}
                    onNavigate={navigateLeaderboard}
                  >
                    <Badge tone={sort === "rank" ? "teal" : "neutral"}>Rango {sort === "rank" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</Badge>
                  </LeaderboardNavLink>
                  <LeaderboardNavLink
                    nextState={{ queue, sort: "games", sortDirection: nextSortDirection(sort, sortDirection, "games") }}
                    onNavigate={navigateLeaderboard}
                  >
                    <Badge tone={sort === "games" ? "teal" : "neutral"}>Partidas {sort === "games" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</Badge>
                  </LeaderboardNavLink>
                  <LeaderboardNavLink
                    nextState={{ queue, sort: "win-rate", sortDirection: nextSortDirection(sort, sortDirection, "win-rate") }}
                    onNavigate={navigateLeaderboard}
                  >
                    <Badge tone={sort === "win-rate" ? "teal" : "neutral"}>Win rate {sort === "win-rate" ? (sortDirection === "asc" ? "↑" : "↓") : ""}</Badge>
                  </LeaderboardNavLink>
                </div>
              </div>
              <SyncAllAccountsButton
                groupId={snapshot.group.id}
                lastLiveGameCheckedAt={lastLiveGameCheckedAt}
                lastStatsSyncedAt={lastStatsSyncedAt}
              />
            </div>
          </div>

          {sortedAccounts.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto p-4 md:block">
                <table className="w-full min-w-[980px] border-separate border-spacing-y-1 text-left">
                  <thead className="text-[11px] uppercase tracking-[0.08em] text-slate-300/85">
                    <tr>
                      <th className="w-[4.75rem] px-4 py-3 text-center font-black">#</th>
                      <th className="w-[5.25rem] px-2 py-3 text-center font-black">Propietario</th>
                      <th className="px-4 py-3 font-black">Riot ID</th>
                      <SortableHeader activeSort={sort} className="px-4 py-3" onNavigate={navigateLeaderboard} queue={queue} sort="rank" sortDirection={sortDirection}>
                        Rango
                      </SortableHeader>
                      <SortableHeader activeSort={sort} className="px-4 py-3 text-center" onNavigate={navigateLeaderboard} queue={queue} sort="games" sortDirection={sortDirection}>
                        Partidas
                      </SortableHeader>
                      <SortableHeader activeSort={sort} className="px-4 py-3 text-center" onNavigate={navigateLeaderboard} queue={queue} sort="win-rate" sortDirection={sortDirection}>
                        Win rate
                      </SortableHeader>
                      <th className="whitespace-nowrap px-4 py-3 text-end font-black">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAccounts.map((account, index) => (
                      <LeaderboardRow
                        account={account}
                        index={index}
                        key={account.id}
                        memberOptions={memberOptions}
                        queue={queue}
                        rowRef={registerDesktopRow(account.id)}
                      />
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
                  <ShieldTinyIcon className="size-3.5 text-amber-300" />
                  Las cuentas compartidas son accesibles por varios miembros del equipo.
                </p>
              </div>
              <div className="grid min-w-0 gap-3 p-3 sm:p-4 md:hidden">
                {sortedAccounts.map((account, index) => (
                    <LeaderboardCard
                      account={account}
                      index={index}
                      key={account.id}
                      memberOptions={memberOptions}
                      queue={queue}
                      cardRef={registerMobileCard(account.id)}
                    />
                  ))}
                </div>
            </>
          ) : (
            <EmptyState
              description="Agrega una cuenta de Riot para construir el ranking Flex del grupo."
              title="Todavia no hay datos de ranking"
            >
              <AddAccountTrigger variant="inline" />
            </EmptyState>
          )}
        </Panel>
      </section>
    </div>
    <DashboardBackgroundSync groupId={snapshot.group.id} />
    </AddAccountProvider>
  );
}

function SortableHeader({
  activeSort,
  children,
  className,
  onNavigate,
  queue,
  sort,
  sortDirection,
}: {
  activeSort: LeaderboardSort;
  children: ReactNode;
  className?: string;
  onNavigate: (nextState: LeaderboardState) => void;
  queue: "flex" | "solo-duo";
  sort: LeaderboardSort;
  sortDirection: LeaderboardSortDirection;
}) {
  const active = activeSort === sort;
  const nextDirection = nextSortDirection(activeSort, sortDirection, sort);
  const nextState: LeaderboardState = {
    queue,
    sort,
    sortDirection: nextDirection,
  };

  return (
    <th className={cn("whitespace-nowrap font-black", className)}>
      <LeaderboardNavLink
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-slate-200 transition",
          "border-cyan-200/14 bg-white/[0.035] shadow-sm shadow-black/10 hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-cyan-100",
          className?.includes("text-center") ? "justify-center" : "justify-start",
          active && "border-cyan-300/70 bg-cyan-400/12 text-cyan-100 shadow-[0_0_14px_rgba(25,216,255,0.18)]",
        )}
        nextState={nextState}
        onNavigate={onNavigate}
      >
        <span>{children}</span>
        <span
          aria-hidden="true"
          className={cn(
            "text-[10px] leading-none text-cyan-300 transition-opacity",
            active ? "opacity-100" : "opacity-50",
          )}
        >
          {active ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </LeaderboardNavLink>
    </th>
  );
}

function StatTile({
  accent,
  detail,
  icon,
  label,
  value,
  valueClassName,
}: {
  accent: Accent;
  detail: string;
  icon: StatIconName;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-linear-to-br p-4 shadow-xl transition-all duration-200 hover:-translate-y-0.5",
        styles.border,
        styles.glow,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-white/30 via-white/5 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <dt className={cn("text-xs font-black uppercase tracking-[0.14em]", styles.text)}>{label}</dt>
        <span className={cn("relative flex size-12 shrink-0 items-center justify-center rounded-xl border shadow-lg", styles.icon)}>
          <span className="absolute inset-1 rounded-lg border border-white/10 bg-white/5" />
          <StatIcon className="relative size-6 drop-shadow-[0_0_10px_currentColor]" name={icon} />
        </span>
      </div>
      <dd className={cn("mt-3 truncate text-4xl font-black tabular-nums text-white", valueClassName)} title={value}>
        {value}
      </dd>
      <p className="mt-1 text-sm font-medium text-slate-400">{detail}</p>
    </div>
  );
}

function MembersScrollPanel({
  canManageMembers,
  groupId,
  members,
  sharedAccountsCount,
  viewerId,
}: {
  canManageMembers: boolean;
  groupId: string;
  members: GroupMember[];
  sharedAccountsCount: number;
  viewerId: string;
}) {
  return (
    <Panel className="flex max-h-[min(26rem,calc(100vh-10rem))] min-h-[14rem] flex-col overflow-hidden p-0">
      <div className="border-b border-cyan-200/10 bg-[radial-gradient(circle_at_100%_0%,rgba(124,60,255,0.12),transparent_45%)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Miembros</h2>
            <p className="mt-1 text-xs text-slate-400">Cuentas asociadas por persona y compartidas.</p>
          </div>
          <Badge tone="neutral">{members.length}</Badge>
        </div>
      </div>
      <div className="members-scroll-glass min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <div className="divide-y divide-cyan-200/10">
          {sharedAccountsCount > 0 ? (
            <div className="flex items-center justify-between gap-3 pb-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/28 bg-amber-400/12 text-xs font-black text-amber-200 shadow-lg shadow-amber-500/10">
                  S
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">Sin dueno</p>
                  <p className="truncate text-xs text-slate-500">Cuentas compartidas del grupo</p>
                </div>
              </div>
              <Badge tone="gold">{sharedAccountsCount} cuentas</Badge>
            </div>
          ) : null}
          {members.map((member) => {
            const canRemoveMember = canManageMembers && member.role !== "owner" && member.id !== viewerId;

            return (
              <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0" key={member.id}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black shadow-lg",
                      member.role === "owner"
                        ? "border-violet-300/28 bg-violet-500/14 text-violet-200 shadow-violet-500/10"
                        : "border-cyan-200/12 bg-white/6 text-slate-300 shadow-black/20",
                    )}
                  >
                    {member.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{member.name}</p>
                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={member.role === "owner" ? "indigo" : "neutral"}>{member.accounts.length} cuentas</Badge>
                  {canRemoveMember ? (
                    <RemoveMemberButton groupId={groupId} memberId={member.id} memberName={member.name} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function StatIcon({ className, name }: { className?: string; name: StatIconName }) {
  const common = {
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.15,
    viewBox: "0 0 24 24",
  };

  if (name === "members") {
    return (
      <svg {...common}>
        <path d="M8.5 11.25a3.15 3.15 0 1 0 0-6.3 3.15 3.15 0 0 0 0 6.3Z" />
        <path d="M15.5 10.5a2.55 2.55 0 1 0 0-5.1" />
        <path d="M3.25 19.05v-1.1c0-2.45 2.35-4.35 5.25-4.35s5.25 1.9 5.25 4.35v1.1" />
        <path d="M14.5 13.9c2.7.25 4.25 1.95 4.25 4.05v1.1" />
      </svg>
    );
  }

  if (name === "accounts") {
    return (
      <svg {...common}>
        <path d="M12 3.5 19 6.2v5.35c0 4.35-2.75 7.55-7 8.95-4.25-1.4-7-4.6-7-8.95V6.2l7-2.7Z" />
        <path d="m9.25 12.2 2 2 4.15-4.55" />
        <path d="M12 3.5v17" opacity="0.35" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4.7 18.35h14.6" />
      <path d="M6.05 16.15 4.75 8.2l4.2 3.2L12 5.35l3.05 6.05 4.2-3.2-1.3 7.95H6.05Z" />
      <path d="M8.75 13.35h6.5" />
      <path d="M12 5.35v3.15" opacity="0.55" />
    </svg>
  );
}

function winRateTone(winRate: number) {
  if (winRate >= 70) return "text-emerald-300";
  if (winRate >= 55) return "text-amber-300";
  if (winRate > 0) return "text-cyan-100";
  return "text-rose-400";
}

function LeaderboardRow({
  account,
  index,
  memberOptions,
  queue,
  rowRef,
}: {
  account: AccountWithMember;
  index: number;
  memberOptions: MemberOption[];
  queue: "flex" | "solo-duo";
  rowRef?: (node: HTMLTableRowElement | null) => void;
}) {
  const queueStats = queue === "solo-duo" ? account.soloDuo : account.flex;
  const rank = index + 1;
  
  const rowTone = 
    rank === 1 ? "bg-linear-to-r from-amber-500/10 to-transparent border-amber-500/20" :
    rank === 2 ? "bg-linear-to-r from-slate-400/10 to-transparent border-slate-400/20" :
    rank === 3 ? "bg-linear-to-r from-amber-700/10 to-transparent border-amber-700/20" :
    "bg-transparent border-transparent hover:bg-white/[0.02]";

  return (
    <tr
      className={cn(
        "group border-b border-[#1f2230] transition duration-150 last:border-0",
        rowTone,
      )}
      ref={rowRef}
    >
      <td className="px-4 py-4">
        <RankNumber rank={rank} />
      </td>
      <td className="w-[5.25rem] px-2 py-5 text-center">
        <OwnerIdentity member={account.member} shared={account.isShared} />
      </td>
      <td className="px-4 py-5">
        <LeaderboardAccountIdentity account={account} compactCopy />
      </td>
      <td className="px-4 py-5">
        <RankBadge division={queueStats.division} lp={queueStats.lp} tier={queueStats.tier} />
      </td>
      <td className="px-4 py-5 text-center font-mono text-sm font-black text-slate-100">
        {queueStats.totalGames}
      </td>
      <td className={cn("px-4 py-5 text-center text-sm font-black", winRateTone(queueStats.winRate))}>
        {queueStats.winRate}%
      </td>
      <td className="rounded-r-lg px-4 py-5 align-middle">
        <div className="flex justify-end gap-2">
          <LiveGameButton gameName={account.summonerName} inGame={account.isInGame} region={account.region} tagLine={account.tagLine} />
          <ExternalStatsButton gameName={account.summonerName} region={account.region} tagLine={account.tagLine} />
          <AccountDetailsButton
            accountPsw={account.accountPsw}
            accountUser={account.accountUser}
            currentIsShared={account.isShared}
            currentOwnerId={account.member?.id ?? ""}
            currentRoutingPlatform={account.routingPlatform}
            groupAccountId={account.id}
            members={memberOptions}
          />
        </div>
      </td>
    </tr>
  );
}

function LeaderboardCard({
  account,
  index,
  memberOptions,
  queue,
  cardRef,
}: {
  account: AccountWithMember;
  index: number;
  memberOptions: MemberOption[];
  queue: "flex" | "solo-duo";
  cardRef?: (node: HTMLElement | null) => void;
}) {
  const queueStats = queue === "solo-duo" ? account.soloDuo : account.flex;
  const cardStyle =
    index === 0
      ? "border-amber-300/40 bg-linear-to-br from-amber-400/14 to-white/[0.035] shadow-amber-500/12"
      : index === 1
        ? "border-slate-300/28 bg-linear-to-br from-slate-300/12 to-white/[0.035]"
        : index === 2
          ? "border-orange-300/32 bg-linear-to-br from-orange-500/12 to-white/[0.035]"
          : "border-cyan-200/12 bg-white/[0.04]";

  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border p-3 shadow-xl shadow-black/20 sm:p-4",
        cardStyle,
      )}
      ref={cardRef}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <MemberIdentity member={account.member} rank={index + 1} />
        <RankBadge className="w-fit max-w-full sm:shrink-0" division={queueStats.division} lp={queueStats.lp} tier={queueStats.tier} />
      </div>
      <div className="mt-4 min-w-0">
        <LeaderboardAccountIdentity account={account} />
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
        <MetricPill label="Partidas" value={queueStats.totalGames.toString()} />
        <MetricPill label="Win rate" value={`${queueStats.winRate}%`} />
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-cyan-200/12 pt-3">
        <LiveGameButton gameName={account.summonerName} inGame={account.isInGame} region={account.region} tagLine={account.tagLine} />
        <ExternalStatsButton gameName={account.summonerName} region={account.region} tagLine={account.tagLine} />
        <AccountDetailsButton
          accountPsw={account.accountPsw}
          accountUser={account.accountUser}
          currentIsShared={account.isShared}
          currentOwnerId={account.member?.id ?? ""}
          currentRoutingPlatform={account.routingPlatform}
          groupAccountId={account.id}
          members={memberOptions}
        />
      </div>
    </article>
  );
}

function RankNumber({ rank }: { rank: number }) {
  const toneClass =
    rank === 1
      ? "bg-linear-to-br from-amber-300 to-amber-500 text-amber-900 border-amber-200/50"
      : rank === 2
        ? "bg-linear-to-br from-slate-200 to-slate-400 text-slate-800 border-white/50"
        : rank === 3
          ? "bg-linear-to-br from-amber-600 to-amber-800 text-amber-100 border-amber-500/50"
          : "bg-[#11131a] text-slate-400 border-[#1f2230]";

  return (
    <div
      className={cn(
        "hex-mark mx-auto flex size-10 items-center justify-center border text-sm font-black tabular-nums shadow-xs",
        toneClass,
      )}
    >
      {rank}
    </div>
  );
}

function OwnerIdentity({
  member,
  shared,
}: {
  member: GroupMember | null;
  shared: boolean;
}) {
  const ownerName = member?.name ?? "Sin dueño";
  const ownerHint = shared ? "Cuenta compartida" : ownerName;
  const ownerAvatarUrl = !shared ? member?.avatarUrl ?? null : null;

  return (
    <div className="flex justify-center">
      <div
        aria-label={ownerHint}
        className={cn(
          "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-lg",
          !shared && member ? "cursor-help" : "",
          shared
            ? "hex-mark border-amber-300/38 bg-amber-400/14 text-amber-200 shadow-amber-500/18"
            : "border-cyan-300/26 bg-cyan-400/12 text-cyan-100 shadow-cyan-500/14",
        )}
        title={ownerHint}
      >
        {shared ? <LinkIcon className="size-6 drop-shadow-[0_0_10px_currentColor]" /> : null}
        {!shared && ownerAvatarUrl ? (
          <>
            <Image alt={ownerName} className="object-cover" fill sizes="48px" src={ownerAvatarUrl} />
            <span className="absolute inset-0 bg-linear-to-br from-white/22 via-transparent to-black/18" />
          </>
        ) : null}
        {!shared && !ownerAvatarUrl ? <UserIcon className="size-6" /> : null}
      </div>
    </div>
  );
}

function MemberIdentity({ member, rank }: { member: GroupMember | null; rank: number }) {
  const badgeStyle =
    rank === 1
      ? "bg-linear-to-br from-amber-300 via-amber-400 to-amber-700 text-amber-950 border-amber-100/70 shadow-amber-400/40"
      : rank === 2
        ? "bg-linear-to-br from-slate-100 via-slate-300 to-slate-600 text-slate-950 border-slate-100/55 shadow-slate-300/28"
        : rank === 3
          ? "bg-linear-to-br from-orange-300 via-orange-500 to-orange-900 text-orange-50 border-orange-200/45 shadow-orange-500/30"
          : "border-slate-500/34 bg-linear-to-br from-slate-700/80 to-slate-950 text-slate-300 shadow-black/25";

  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
      <div
        className={cn(
          "hex-mark relative flex size-11 shrink-0 items-center justify-center border text-sm font-black shadow-lg sm:size-12 sm:text-base",
          badgeStyle,
        )}
      >
        <span className="absolute inset-1 hex-mark border border-white/18 bg-black/8" />
        <span className="relative">{rank}</span>
      </div>
      <div className="shrink-0">
        <PlayerCrest rank={rank} />
      </div>
      <div className="min-w-0">
        <div className="truncate font-black text-white">{member?.name ?? "Sin dueno"}</div>
        <div className="mt-0.5 truncate text-xs font-medium text-slate-400">
          {member ? formatRole(member.role) : "Cuenta compartida"}
        </div>
      </div>
    </div>
  );
}

function LeaderboardAccountIdentity({ account, compactCopy = false }: { account: AccountWithMember; compactCopy?: boolean }) {
  const riotLine = `${account.summonerName}#${account.tagLine}`;
  return (
    <div className="min-w-0 overflow-hidden">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="min-w-0 max-w-full truncate font-black text-white">
          {account.summonerName}
          <span className="text-slate-400">#{account.tagLine}</span>
        </span>
        <CopyChip ariaLabel="Copiar nombre de cuenta" compact={compactCopy} value={riotLine} />
      </div>
      {account.region ? (
        <div className="mt-1 text-xs font-medium text-slate-400">
          <span>{account.region}</span>
        </div>
      ) : null}
      {account.isShared ? (
        <div className="mt-2">
          <Badge tone="gold">Compartida</Badge>
        </div>
      ) : null}
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.1"
      viewBox="0 0 24 24"
    >
      <path d="M8 5.25h8v4.4c0 2.35-1.55 4.3-4 4.3s-4-1.95-4-4.3v-4.4Z" />
      <path d="M8 7H5.5v1.75c0 1.8 1.15 3.2 3 3.45" />
      <path d="M16 7h2.5v1.75c0 1.8-1.15 3.2-3 3.45" />
      <path d="M12 13.95v3.15" />
      <path d="M8.75 18.75h6.5" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.15"
      viewBox="0 0 24 24"
    >
      <path d="M9.4 14.6 14.6 9.4" />
      <path d="M11.2 6.4 12.6 5a4.1 4.1 0 0 1 5.8 5.8L17 12.2" />
      <path d="m12.8 17.6-1.4 1.4a4.1 4.1 0 0 1-5.8-5.8L7 11.8" />
    </svg>
  );
}

function ShieldTinyIcon({ className }: { className?: string }) {
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
      <path d="M12 3.8 18 6v4.8c0 3.9-2.25 6.8-6 8.9-3.75-2.1-6-5-6-8.9V6l6-2.2Z" />
      <path d="m9.4 12 1.75 1.75L15 9.7" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
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
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.5 20.2c.75-3.45 3.55-5.45 7.5-5.45s6.75 2 7.5 5.45" />
    </svg>
  );
}

function PlayerCrest({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "from-cyan-300 to-indigo text-cyan-100 shadow-cyan-400/25"
      : rank === 2
        ? "from-slate-300 to-sky-700 text-slate-100 shadow-slate-300/18"
        : rank === 3
          ? "from-cyan-300 to-violet-700 text-cyan-100 shadow-violet-400/20"
          : "from-slate-500 to-slate-900 text-slate-300 shadow-black/25";

  return (
    <div
      className={cn(
        "relative flex size-11 items-center justify-center rounded-xl border border-cyan-200/14 bg-linear-to-br shadow-lg",
        tone,
      )}
    >
      <span className="absolute inset-1 rounded-lg border border-white/12 bg-black/24" />
      <svg
        aria-hidden="true"
        className="relative size-7 drop-shadow-[0_0_8px_currentColor]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M12 3.4 17.8 7v5.1c0 3.4-2.25 6.15-5.8 8.1-3.55-1.95-5.8-4.7-5.8-8.1V7L12 3.4Z" />
        <path d="M12 6.5v10.2" />
        <path d="m8.6 10.1 3.4-2.05 3.4 2.05" />
        <path d="m8.8 13.3 3.2 2 3.2-2" />
      </svg>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan-200/10 bg-black/22 px-3 py-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-black text-white">{value}</p>
    </div>
  );
}

function EmptyState({
  action,
  children,
  description,
  title,
}: {
  action?: string;
  children?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="my-2 rounded-xl border border-dashed border-cyan-300/28 bg-cyan-400/6 p-7 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-cyan-300/28 bg-cyan-400/10 text-lg font-black text-cyan-200 shadow-lg shadow-cyan-400/10">
        +
      </div>
      <h3 className="mt-3.5 text-sm font-black text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-400">{description}</p>
      {children ?? (
        action ? (
          <Button className="mt-5 h-9 px-4 text-sm" type="button" variant="secondary">
            {action}
          </Button>
        ) : null
      )}
    </div>
  );
}

function formatRole(role: GroupMember["role"]) {
  const labels: Record<GroupMember["role"], string> = {
    owner: "Owner",
    captain: "Capitan",
    member: "Miembro",
  };

  return labels[role];
}
