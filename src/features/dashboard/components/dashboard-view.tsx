import type { ReactNode } from "react";
import { AddAccountProvider, AddAccountTrigger } from "@/features/accounts/components/add-account-dialog";
import { ManageAccountDialog } from "@/features/accounts/components/manage-account-dialog";
import { DashboardBackgroundSync } from "@/features/accounts/components/dashboard-background-sync";
import { SyncAllAccountsButton } from "@/features/accounts/components/sync-all-accounts-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { CopyChip } from "@/features/dashboard/components/copy-chip";
import { MaskedPswCardBlock, MaskedPswTableCell } from "@/features/dashboard/components/masked-psw-cell";
import { RankBadge } from "@/features/dashboard/components/rank-badge";
import { RemoveMemberButton } from "@/features/groups/components/remove-member-button";
import type {
  DashboardSnapshot,
  GroupMember,
  LeagueAccount,
} from "@/features/dashboard/types";
import { InviteMemberButton } from "@/features/invites/components/invite-member-dialog";
import { RenameGroupButton } from "@/features/groups/components/rename-group-dialog";
import { cn } from "@/lib/utils";

type DashboardViewProps = {
  snapshot: DashboardSnapshot;
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

function flexLeaderboardSortScore(account: LeagueAccount): number {
  const tier = account.tier.toUpperCase();
  const tierPoints = TIER_SORT_ORDER[tier] ?? 0;
  let divPoints = 0;
  if (account.division && DIVISION_SORT_ORDER[account.division]) {
    divPoints = DIVISION_SORT_ORDER[account.division];
  } else if (tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER") {
    divPoints = 5;
  }
  return tierPoints * 10_000 + divPoints * 100 + account.lp;
}

export function DashboardView({ snapshot }: DashboardViewProps) {
  const memberAccounts = snapshot.members.flatMap((member) =>
    member.accounts.map((account) => ({ ...account, member })),
  );
  const sharedAccounts = snapshot.sharedAccounts.map((account) => ({
    ...account,
    member: null,
  }));
  const accounts = [...memberAccounts, ...sharedAccounts];
  const sortedAccounts = [...accounts].sort((left, right) => flexLeaderboardSortScore(right) - flexLeaderboardSortScore(left));
  const leaderLp = sortedAccounts[0]?.lp ?? 0;
  const memberOptions = snapshot.members.map((member) => ({
    id: member.id,
    name: member.name,
  }));

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
                <Badge tone="gold">Flex queue</Badge>
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
                Coordina cuentas y miembros con una lectura clara del ranking Flex antes de conectar datos
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
              accent="gold"
              detail="Primero del ranking ordenado"
              icon="crown"
              label="Mayor LP"
              value={String(leaderLp)}
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
                <h2 className="text-xl font-black text-white">Leaderboard Flex</h2>
                <p className="mt-0.5 text-sm text-slate-400">Ordenado por liga (tier y division) y despues LP.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start">
              <Badge tone="gold">Top del grupo</Badge>
              <SyncAllAccountsButton groupId={snapshot.group.id} />
            </div>
          </div>

          {sortedAccounts.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto p-4 md:block">
                <table className="w-full min-w-[1120px] border-separate border-spacing-y-1 text-left">
                  <thead className="text-[11px] uppercase tracking-[0.08em] text-slate-300/85">
                    <tr>
                      <th className="w-[4.75rem] px-4 py-3 text-center font-black">#</th>
                      <th className="px-4 py-3 font-black">Propietario</th>
                      <th className="px-4 py-3 font-black">Riot ID</th>
                      <th className="px-4 py-3 font-black">Rango</th>
                      <th className="px-4 py-3 text-center font-black">LP</th>
                      <th className="whitespace-nowrap px-4 py-3 text-center font-black">Win rate</th>
                      <th className="px-4 py-3 font-black">Usuario</th>
                      <th className="px-4 py-3 font-black">Contraseña</th>
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

function StatTile({
  accent,
  detail,
  icon,
  label,
  value,
}: {
  accent: Accent;
  detail: string;
  icon: StatIconName;
  label: string;
  value: string;
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
      <dd className="mt-3 text-4xl font-black tabular-nums text-white">{value}</dd>
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
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

function CredentialCell({ copyLabel, value }: { copyLabel: string; value: string | null }) {
  const text = value?.trim() ?? "";
  return (
    <td className="px-4 py-5">
      <div className="flex max-w-[12rem] items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-black text-slate-100">{text || "—"}</span>
        <CopyChip ariaLabel={copyLabel} compact value={text} />
      </div>
    </td>
  );
}

function LeaderboardRow({
  account,
  index,
  memberOptions,
}: {
  account: AccountWithMember;
  index: number;
  memberOptions: MemberOption[];
}) {
  const rowTone = account.isShared
    ? "outline-amber-400/48 bg-[linear-gradient(90deg,rgba(245,184,63,0.21),rgba(245,184,63,0.09)_34%,rgba(7,19,39,0.87)_72%)] shadow-[inset_4px_0_0_rgba(245,184,63,0.95),0_0_24px_rgba(245,184,63,0.15)] hover:outline-amber-300/68 hover:bg-[linear-gradient(90deg,rgba(245,184,63,0.26),rgba(245,184,63,0.11)_34%,rgba(7,19,39,0.92)_72%)]"
    : "outline-cyan-300/24 bg-[linear-gradient(90deg,rgba(25,216,255,0.105),rgba(7,19,39,0.82)_31%,rgba(7,19,39,0.9)_74%)] shadow-[inset_4px_0_0_rgba(25,216,255,0.52),0_0_18px_rgba(25,216,255,0.045)] hover:outline-cyan-200/42 hover:bg-[linear-gradient(90deg,rgba(25,216,255,0.14),rgba(7,19,39,0.86)_31%,rgba(7,19,39,0.93)_74%)]";

  return (
    <tr
      className={cn(
        "group overflow-hidden rounded-lg outline outline-1 outline-offset-[-1px] transition duration-150",
        rowTone,
      )}
    >
      <td className="rounded-l-lg px-4 py-5">
        <RankNumber rank={index + 1} shared={account.isShared} />
      </td>
      <td className="px-4 py-5">
        <OwnerIdentity member={account.member} shared={account.isShared} />
      </td>
      <td className="px-4 py-5">
        <LeaderboardAccountIdentity account={account} compactCopy />
      </td>
      <td className="px-4 py-5">
        <RankBadge account={account} />
      </td>
      <td className="px-4 py-5 text-center font-mono text-sm font-black text-white">
        {account.lp}
      </td>
      <td className={cn("px-4 py-5 text-center text-sm font-black", winRateTone(account.winRate))}>
        {account.winRate}%
      </td>
      <CredentialCell copyLabel="Copiar User" value={account.accountUser} />
      <MaskedPswTableCell value={account.accountPsw} />
      <td className="rounded-r-lg px-4 py-5 text-end align-middle">
        <ManageAccountDialog
          currentAccountPsw={account.accountPsw ?? ""}
          currentAccountUser={account.accountUser ?? ""}
          currentIsShared={account.isShared}
          currentOwnerId={account.member?.id ?? ""}
          groupAccountId={account.id}
          members={memberOptions}
        />
      </td>
    </tr>
  );
}

function LeaderboardCard({
  account,
  index,
  memberOptions,
}: {
  account: AccountWithMember;
  index: number;
  memberOptions: MemberOption[];
}) {
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
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <MemberIdentity member={account.member} rank={index + 1} />
        <RankBadge account={account} className="w-fit max-w-full sm:shrink-0" />
      </div>
      <div className="mt-4 min-w-0">
        <LeaderboardAccountIdentity account={account} />
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
        <MetricPill label="LP" value={account.lp.toString()} />
        <MetricPill label="Win rate" value={`${account.winRate}%`} />
      </div>
      <div className="mt-4 grid min-w-0 gap-2 rounded-lg border border-cyan-200/12 bg-black/22 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">User</span>
          <CopyChip ariaLabel="Copiar User" value={account.accountUser ?? ""} />
        </div>
        <p className="truncate font-mono text-xs font-semibold text-white">{account.accountUser?.trim() || "—"}</p>
        <MaskedPswCardBlock value={account.accountPsw} />
      </div>
      <div className="mt-4 flex justify-end border-t border-cyan-200/12 pt-3">
        <ManageAccountDialog
          currentAccountPsw={account.accountPsw ?? ""}
          currentAccountUser={account.accountUser ?? ""}
          currentIsShared={account.isShared}
          currentOwnerId={account.member?.id ?? ""}
          groupAccountId={account.id}
          members={memberOptions}
        />
      </div>
    </article>
  );
}

function RankNumber({ rank, shared }: { rank: number; shared: boolean }) {
  return (
    <div
      className={cn(
        "hex-mark relative mx-auto flex size-12 items-center justify-center border text-sm font-black tabular-nums shadow-lg",
        shared
          ? "border-amber-200/48 bg-linear-to-br from-amber-300/18 to-black/24 text-amber-100 shadow-amber-500/22"
          : "border-cyan-200/22 bg-linear-to-br from-cyan-400/12 to-black/26 text-slate-100 shadow-cyan-500/12",
      )}
    >
      <span className="absolute inset-1 hex-mark border border-white/10 bg-black/18" />
      <span className="relative">{rank}</span>
    </div>
  );
}

function OwnerIdentity({ member, shared }: { member: GroupMember | null; shared: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3.5">
      <div
        className={cn(
          "relative flex size-14 shrink-0 items-center justify-center rounded-xl border shadow-lg",
          shared
            ? "hex-mark border-amber-300/38 bg-amber-400/14 text-amber-200 shadow-amber-500/18"
            : "border-cyan-300/26 bg-cyan-400/12 text-cyan-100 shadow-cyan-500/14",
        )}
      >
        {shared ? <LinkIcon className="size-6 drop-shadow-[0_0_10px_currentColor]" /> : <UserIcon className="size-6" />}
      </div>
      <div className="min-w-0">
        <div className="truncate font-black text-white">{member?.name ?? "Sin dueño"}</div>
        <div
          className={cn(
            "mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold",
            shared ? "text-amber-300" : "text-slate-400",
          )}
        >
          <span>{shared ? "Cuenta compartida" : member ? formatRole(member.role) : "Sin dueño"}</span>
          {!shared && member ? <ShieldTinyIcon className="size-3.5 text-cyan-300" /> : null}
        </div>
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
