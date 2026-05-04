import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { RankBadge } from "@/features/dashboard/components/rank-badge";
import type {
  DashboardSnapshot,
  GroupMember,
  LeagueAccount,
} from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type DashboardViewProps = {
  snapshot: DashboardSnapshot;
};

type AccountWithMember = LeagueAccount & {
  member: GroupMember;
};

type Accent = "teal" | "indigo" | "gold" | "danger";
type StatIconName = "members" | "accounts" | "crown" | "invite";

const statusTone: Record<LeagueAccount["leagueOfGraphsStatus"], "teal" | "gold" | "danger"> = {
  synced: "teal",
  pending: "gold",
  stale: "danger",
};

const statusLabel: Record<LeagueAccount["leagueOfGraphsStatus"], string> = {
  synced: "Sincronizado",
  pending: "Pendiente",
  stale: "Por actualizar",
};

const statusDetail: Record<LeagueAccount["leagueOfGraphsStatus"], string> = {
  synced: "League of Graphs al dia",
  pending: "Esperando primera lectura",
  stale: "Necesita refrescar datos",
};

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

const accountMarkStyles: Record<LeagueAccount["tier"], string> = {
  IRON: "from-slate-500 to-slate-700 text-slate-100 shadow-slate-500/20",
  BRONZE: "from-amber-800 to-orange-950 text-amber-100 shadow-orange-500/20",
  SILVER: "from-slate-200 to-slate-500 text-slate-950 shadow-slate-300/20",
  GOLD: "from-amber-300 to-amber-600 text-amber-950 shadow-amber-400/30",
  PLATINUM: "from-cyan-300 to-teal-600 text-cyan-950 shadow-cyan-400/30",
  EMERALD: "from-emerald-300 to-teal-700 text-emerald-950 shadow-emerald-400/30",
  DIAMOND: "from-sky-300 to-violet-600 text-white shadow-sky-400/30",
  MASTER: "from-fuchsia-300 to-violet-700 text-white shadow-fuchsia-500/30",
};

export function DashboardView({ snapshot }: DashboardViewProps) {
  const accounts = snapshot.members.flatMap((member) =>
    member.accounts.map((account) => ({ ...account, member })),
  );
  const sortedAccounts = [...accounts].sort(
    (left, right) => right.averagePosition - left.averagePosition,
  );
  const mainAccounts = accounts.filter((account) => account.isMain).length;
  const bestAverage = sortedAccounts[0]?.averagePosition ?? 0;
  const pendingInvites = snapshot.invites.filter((invite) => invite.status === "pending").length;
  const syncedAccounts = accounts.filter(
    (account) => account.leagueOfGraphsStatus === "synced",
  ).length;

  return (
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
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                {snapshot.group.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Coordina cuentas, miembros e invitaciones con una lectura clara del ranking Flex
                antes de conectar Supabase y Riot data.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:pt-5">
              <Button className="min-w-40">
                <span aria-hidden="true">+</span>
                Invitar miembro
              </Button>
              <Button className="min-w-40" variant="secondary">
                <span aria-hidden="true">+</span>
                Registrar cuenta
              </Button>
            </div>
          </div>

          <dl className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              accent="teal"
              detail="Miembros activos"
              icon="members"
              label="Miembros"
              value={snapshot.members.length.toString()}
            />
            <StatTile
              accent="indigo"
              detail={`${mainAccounts} mains configuradas`}
              icon="accounts"
              label="Cuentas"
              value={accounts.length.toString()}
            />
            <StatTile
              accent="gold"
              detail="Posicion Promedio lider"
              icon="crown"
              label="Mejor posicion"
              value={bestAverage.toFixed(1)}
            />
            <StatTile
              accent={pendingInvites > 0 ? "danger" : "teal"}
              detail="Invitaciones pendientes"
              icon="invite"
              label="Invitaciones"
              value={pendingInvites.toString()}
            />
          </dl>
        </div>

        <Panel className="overflow-hidden">
          <div className="border-b border-cyan-200/10 bg-[radial-gradient(circle_at_100%_0%,rgba(124,60,255,0.16),transparent_42%)] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">Sincronizacion</h2>
                <p className="mt-1 text-sm leading-5 text-slate-300">
                  Preparado para cron jobs y scraping aislado de League of Graphs.
                </p>
              </div>
              <Badge tone="indigo">Futuro</Badge>
            </div>
            <div className="mt-5 rounded-xl border border-cyan-200/12 bg-black/24 p-4 shadow-inner shadow-black/40">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Cobertura mock</span>
                <span className="font-mono text-base font-black text-white">
                  {syncedAccounts}/{accounts.length}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800/90">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-300 via-sky-400 to-violet-500 shadow-lg shadow-cyan-400/30 transition-all duration-700"
                  style={{ width: `${accounts.length ? (syncedAccounts / accounts.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="p-5">
            <TimelineRow icon="L" label="Ultima lectura mock" value={formatSyncDate(snapshot.sync.lastUpdatedAt)} />
            <TimelineRow icon="F" label="Frecuencia objetivo" value={snapshot.sync.nextJobLabel} />
            <TimelineRow icon="A" label="Auth esperada" value="Google OAuth con Supabase" />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.8fr)]">
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-cyan-200/10 bg-[radial-gradient(circle_at_0%_0%,rgba(25,216,255,0.12),transparent_34%)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="hex-mark relative flex size-13 shrink-0 items-center justify-center border border-cyan-300/22 bg-linear-to-br from-cyan-400/18 via-sky-500/12 to-violet-600/14 text-amber-300 shadow-xl shadow-cyan-500/12">
                <span className="absolute inset-1 hex-mark border border-cyan-300/16 bg-black/18" />
                <TrophyIcon className="relative size-7 drop-shadow-[0_0_10px_rgba(245,184,63,0.65)]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Leaderboard Flex</h2>
                <p className="mt-0.5 text-sm text-slate-400">Ordenado por Posicion Promedio mock.</p>
              </div>
            </div>
            <Badge tone="gold" className="self-start">
              Top del grupo
            </Badge>
          </div>

          {sortedAccounts.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto p-5 md:block">
                <table className="w-full min-w-[780px] border-separate border-spacing-0 overflow-hidden rounded-xl border border-cyan-200/12 bg-[#071327]/72 text-left shadow-inner shadow-black/35">
                  <thead className="bg-black/24 text-xs uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-black">Jugador</th>
                      <th className="px-5 py-4 font-black">Cuenta</th>
                      <th className="px-5 py-4 font-black">Rango</th>
                      <th className="px-5 py-4 font-black">LP</th>
                      <th className="px-5 py-4 font-black">Win rate</th>
                      <th className="px-5 py-4 font-black">Posicion Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAccounts.map((account, index) => (
                      <LeaderboardRow account={account} index={index} key={account.id} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 p-4 md:hidden">
                {sortedAccounts.map((account, index) => (
                  <LeaderboardCard account={account} index={index} key={account.id} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              action="Registrar cuenta"
              description="Agrega una cuenta de Riot para construir el ranking Flex del grupo."
              title="Todavia no hay datos de ranking"
            />
          )}
        </Panel>

        <div className="space-y-4">
          <AccountsPanel accounts={sortedAccounts} />
          <MembersPanel members={snapshot.members} />
          <InvitesPanel snapshot={snapshot} />
        </div>
      </section>
    </div>
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

  if (name === "crown") {
    return (
      <svg {...common}>
        <path d="M4.7 18.35h14.6" />
        <path d="M6.05 16.15 4.75 8.2l4.2 3.2L12 5.35l3.05 6.05 4.2-3.2-1.3 7.95H6.05Z" />
        <path d="M8.75 13.35h6.5" />
        <path d="M12 5.35v3.15" opacity="0.55" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4.25 6.75h15.5v10.5H4.25V6.75Z" />
      <path d="m4.75 7.25 7.25 5.8 7.25-5.8" />
      <path d="m9.6 11.15-4.85 5.6" opacity="0.55" />
      <path d="m14.4 11.15 4.85 5.6" opacity="0.55" />
    </svg>
  );
}

function TimelineRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-cyan-200/10 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-cyan-200/14 bg-white/5 text-[10px] font-black text-cyan-200">
          {icon}
        </span>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <span className="max-w-52 text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function LeaderboardRow({ account, index }: { account: AccountWithMember; index: number }) {
  return (
    <tr
      className={cn(
        "group transition duration-150 hover:bg-cyan-300/[0.055]",
        index === 0 && "bg-[linear-gradient(90deg,rgba(245,184,63,0.13),rgba(245,184,63,0.04)_42%,transparent)]",
        index === 1 && "bg-[linear-gradient(90deg,rgba(148,163,184,0.13),rgba(148,163,184,0.04)_42%,transparent)]",
        index === 2 && "bg-[linear-gradient(90deg,rgba(251,146,60,0.12),rgba(251,146,60,0.04)_42%,transparent)]",
      )}
    >
      <td className="border-b border-cyan-200/10 px-5 py-4">
        <MemberIdentity member={account.member} rank={index + 1} />
      </td>
      <td className="border-b border-cyan-200/10 px-5 py-4">
        <LeaderboardAccountIdentity account={account} />
      </td>
      <td className="border-b border-cyan-200/10 px-5 py-4">
        <RankBadge account={account} />
      </td>
      <td className="border-b border-cyan-200/10 px-5 py-4 font-mono text-sm font-black text-white">
        {account.lp}
      </td>
      <td className="border-b border-cyan-200/10 px-5 py-4 text-sm font-black text-white">
        {account.winRate}%
      </td>
      <td className="border-b border-cyan-200/10 px-5 py-4">
        <PerformanceMeter value={account.averagePosition} />
      </td>
    </tr>
  );
}

function LeaderboardCard({ account, index }: { account: AccountWithMember; index: number }) {
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
        "rounded-xl border p-4 shadow-xl shadow-black/20",
        cardStyle,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <MemberIdentity member={account.member} rank={index + 1} />
        <RankBadge account={account} />
      </div>
      <div className="mt-4">
        <LeaderboardAccountIdentity account={account} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricPill label="LP" value={account.lp.toString()} />
        <MetricPill label="Win rate" value={`${account.winRate}%`} />
      </div>
      <div className="mt-4">
        <PerformanceMeter value={account.averagePosition} />
      </div>
    </article>
  );
}

function MemberIdentity({ member, rank }: { member: GroupMember; rank: number }) {
  const badgeStyle =
    rank === 1
      ? "bg-linear-to-br from-amber-300 via-amber-400 to-amber-700 text-amber-950 border-amber-100/70 shadow-amber-400/40"
      : rank === 2
        ? "bg-linear-to-br from-slate-100 via-slate-300 to-slate-600 text-slate-950 border-slate-100/55 shadow-slate-300/28"
        : rank === 3
          ? "bg-linear-to-br from-orange-300 via-orange-500 to-orange-900 text-orange-50 border-orange-200/45 shadow-orange-500/30"
          : "border-slate-500/34 bg-linear-to-br from-slate-700/80 to-slate-950 text-slate-300 shadow-black/25";

  return (
    <div className="flex min-w-0 items-center gap-3.5">
      <div
        className={cn(
          "hex-mark relative flex size-12 shrink-0 items-center justify-center border text-base font-black shadow-lg",
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
        <div className="truncate font-black text-white">{member.name}</div>
        <div className="mt-0.5 truncate text-xs font-medium text-slate-400">{formatRole(member.role)}</div>
      </div>
    </div>
  );
}

function LeaderboardAccountIdentity({ account }: { account: AccountWithMember }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-black text-white">
        {account.summonerName}
        <span className="text-slate-400">#{account.tagLine}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
        <span>{account.region}</span>
        <span aria-hidden="true">/</span>
        <span>{account.isMain ? "Main" : "Smurf"}</span>
      </div>
      <div className="mt-2">
        <Badge tone={statusTone[account.leagueOfGraphsStatus]}>
          {statusLabel[account.leagueOfGraphsStatus]}
        </Badge>
      </div>
    </div>
  );
}

function AccountIdentity({ account }: { account: AccountWithMember }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AccountMark account={account} />
      <div className="min-w-0">
        <div className="truncate font-black text-white">
          {account.summonerName}
          <span className="text-slate-400">#{account.tagLine}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
          <span>{account.region}</span>
          <span aria-hidden="true">/</span>
          <span>{account.isMain ? "Main" : "Smurf"}</span>
        </div>
        <div className="mt-2">
          <Badge tone={statusTone[account.leagueOfGraphsStatus]}>
            {statusLabel[account.leagueOfGraphsStatus]}
          </Badge>
        </div>
      </div>
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

function AccountMark({ account, className }: { account: LeagueAccount; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-linear-to-br text-sm font-black shadow-lg",
        accountMarkStyles[account.tier],
        className,
      )}
    >
      <span className="absolute inset-1 rounded-lg border border-white/16" />
      <span className="relative">{account.summonerName.slice(0, 1)}</span>
    </div>
  );
}

function PerformanceMeter({ value }: { value: number }) {
  const width = `${Math.min(Math.max(value * 10, 0), 100)}%`;
  const accent: Accent = value >= 8 ? "teal" : value >= 7 ? "indigo" : value >= 6 ? "gold" : "danger";
  const styles = accentStyles[accent];

  return (
    <div className="min-w-40">
      <div className="flex items-baseline gap-2">
        <span className={cn("font-mono text-xl font-black tabular-nums", styles.text)}>{value.toFixed(1)}</span>
        <span className="text-xs font-semibold text-slate-500">/ 10</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/90">
        <div className={cn("h-full rounded-full bg-linear-to-r shadow-lg transition-all duration-500", styles.meter)} style={{ width }} />
      </div>
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

function AccountsPanel({ accounts }: { accounts: AccountWithMember[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-cyan-200/16 bg-cyan-400/10 text-sm font-black text-cyan-200">
            C
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Cuentas registradas</h2>
            <p className="mt-0.5 text-xs text-slate-400">Vista rapida por dueno, estado y rol.</p>
          </div>
        </div>
        <Badge tone="neutral">{accounts.length}</Badge>
      </div>

      {accounts.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {accounts.map((account) => (
            <article
              className={cn(
                "group rounded-xl border bg-white/[0.035] p-4 shadow-xl shadow-black/18 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.055]",
                account.isMain ? "border-violet-300/22 hover:border-violet-200/44" : "border-cyan-300/22 hover:border-cyan-200/44",
              )}
              key={account.id}
            >
              <div className="flex items-start justify-between gap-3">
                <AccountIdentity account={account} />
                <Badge tone={account.isMain ? "indigo" : "neutral"}>{account.isMain ? "Main" : "Smurf"}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-cyan-200/10 pt-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-slate-500">Dueno</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-white">
                    {account.member.name} · {formatRole(account.member.role)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{statusDetail[account.leagueOfGraphsStatus]}</p>
                </div>
                <Button className="h-8 px-3 text-xs" variant="ghost">
                  Ver
                  <span aria-hidden="true">›</span>
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          action="Registrar cuenta"
          description="Vincula una cuenta main o smurf para que aparezca en el dashboard."
          title="No hay cuentas registradas"
        />
      )}
    </Panel>
  );
}

function MembersPanel({ members }: { members: GroupMember[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Miembros</h2>
          <p className="mt-0.5 text-xs text-slate-400">Cuentas asociadas por persona.</p>
        </div>
        <Badge tone="neutral">{members.length}</Badge>
      </div>
      <div className="mt-4 divide-y divide-cyan-200/10">
        {members.map((member) => (
          <div
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            key={member.id}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black shadow-lg",
                  member.role === "owner" ? "border-violet-300/28 bg-violet-500/14 text-violet-200 shadow-violet-500/10" : "border-cyan-200/12 bg-white/6 text-slate-300 shadow-black/20",
                )}
              >
                {member.name[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{member.name}</p>
                <p className="truncate text-xs text-slate-500">{member.email}</p>
              </div>
            </div>
            <Badge tone={member.role === "owner" ? "indigo" : "neutral"}>
              {member.accounts.length} cuentas
            </Badge>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function InvitesPanel({ snapshot }: { snapshot: DashboardSnapshot }) {
  const pendingInvites = snapshot.invites.filter((invite) => invite.status === "pending");

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Invitaciones</h2>
          <p className="mt-0.5 text-xs text-slate-400">Invita amigos y completa el grupo.</p>
        </div>
        <Button className="h-8 px-3 text-xs" variant="secondary">
          Nueva
        </Button>
      </div>

      {pendingInvites.length > 0 ? (
        <div className="mt-4 divide-y divide-cyan-200/10">
          {pendingInvites.map((invite) => (
            <div
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              key={invite.id}
            >
              <span className="min-w-0 truncate text-sm font-bold text-white">
                {invite.email}
              </span>
              <Badge tone="gold">Pendiente</Badge>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          action="Invitar miembro"
          description="No hay invitaciones pendientes. Envia un correo para sumar otra cuenta al club."
          title="Grupo completo por ahora"
        />
      )}
    </Panel>
  );
}

function EmptyState({
  action,
  description,
  title,
}: {
  action: string;
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
      <Button className="mt-5 h-9 px-4 text-sm" variant="secondary">
        {action}
      </Button>
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

function formatSyncDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
