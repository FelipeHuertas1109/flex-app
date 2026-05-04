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
    border: "border-teal/20",
    glow: "from-teal-soft/85 to-white",
    icon: "bg-teal-soft text-teal",
    meter: "from-teal to-indigo",
    text: "text-teal",
  },
  indigo: {
    border: "border-indigo/20",
    glow: "from-indigo-soft/85 to-white",
    icon: "bg-indigo-soft text-indigo",
    meter: "from-indigo to-teal",
    text: "text-indigo",
  },
  gold: {
    border: "border-gold/25",
    glow: "from-gold-soft/90 to-white",
    icon: "bg-gold-soft text-gold",
    meter: "from-gold to-teal",
    text: "text-gold",
  },
  danger: {
    border: "border-danger/20",
    glow: "from-danger-soft/75 to-white",
    icon: "bg-danger-soft text-danger",
    meter: "from-danger to-gold",
    text: "text-danger",
  },
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
    <div className="animate-enter space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <div className="relative overflow-hidden rounded-lg border border-border/80 bg-surface/95 p-5 shadow-lg shadow-teal/5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--teal),var(--indigo),var(--gold))]" />
          <div className="absolute right-0 top-0 h-36 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(15,139,127,0.16),transparent_70%)]" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="teal">Grupo privado</Badge>
                <Badge tone="gold">Flex queue</Badge>
              </div>
              <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-normal text-foreground sm:text-4xl">
                {snapshot.group.name}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
                Coordina cuentas, miembros e invitaciones con una lectura clara del ranking Flex
                antes de conectar Supabase y Riot data.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
              <Button>Invitar miembro</Button>
              <Button variant="secondary">Registrar cuenta</Button>
            </div>
          </div>

          <dl className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              accent="teal"
              detail="Miembros activos"
              icon="M"
              label="Miembros"
              value={snapshot.members.length.toString()}
            />
            <StatTile
              accent="indigo"
              detail={`${mainAccounts} mains configuradas`}
              icon="C"
              label="Cuentas"
              value={accounts.length.toString()}
            />
            <StatTile
              accent="gold"
              detail="Posicion Promedio lider"
              icon="P"
              label="Mejor posicion"
              value={bestAverage.toFixed(1)}
            />
            <StatTile
              accent={pendingInvites > 0 ? "danger" : "teal"}
              detail="Invitaciones pendientes"
              icon="I"
              label="Invitaciones"
              value={pendingInvites.toString()}
            />
          </dl>
        </div>

        <Panel className="overflow-hidden">
          <div className="border-b border-border/80 bg-[linear-gradient(135deg,rgba(229,232,255,0.72),rgba(255,255,255,0.92))] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Sincronizacion</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Preparado para cron jobs y scraping aislado de League of Graphs.
                </p>
              </div>
              <Badge tone="indigo">Futuro</Badge>
            </div>
            <div className="mt-4 rounded-lg border border-indigo/12 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase text-muted">Cobertura mock</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {syncedAccounts}/{accounts.length}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-soft">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--teal),var(--indigo))]"
                  style={{ width: `${accounts.length ? (syncedAccounts / accounts.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="p-5">
            <TimelineRow label="Ultima lectura mock" value={formatSyncDate(snapshot.sync.lastUpdatedAt)} />
            <TimelineRow label="Frecuencia objetivo" value={snapshot.sync.nextJobLabel} />
            <TimelineRow label="Auth esperada" value="Google OAuth con Supabase" />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.8fr)]">
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border/80 bg-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-foreground">Leaderboard Flex</h2>
              <p className="mt-1 text-sm text-muted">Ordenado por Posicion Promedio mock.</p>
            </div>
            <Badge tone="gold" className="self-start">
              Top del grupo
            </Badge>
          </div>

          {sortedAccounts.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
                  <thead className="bg-surface-muted/75 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-5 py-3 font-bold">Jugador</th>
                      <th className="px-5 py-3 font-bold">Cuenta</th>
                      <th className="px-5 py-3 font-bold">Rango</th>
                      <th className="px-5 py-3 font-bold">LP</th>
                      <th className="px-5 py-3 font-bold">Win rate</th>
                      <th className="px-5 py-3 font-bold">Posicion Promedio</th>
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
  icon: string;
  label: string;
  value: string;
}) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br p-4 shadow-sm shadow-black/[0.03]",
        styles.border,
        styles.glow,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <dt className="text-xs font-bold uppercase text-muted">{label}</dt>
        <span className={cn("flex size-8 items-center justify-center rounded-md text-xs font-black", styles.icon)}>
          {icon}
        </span>
      </div>
      <dd className="mt-3 text-3xl font-black text-foreground">{value}</dd>
      <p className="mt-1 text-xs font-medium text-muted">{detail}</p>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border/80 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="max-w-[12rem] text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function LeaderboardRow({ account, index }: { account: AccountWithMember; index: number }) {
  return (
    <tr
      className={cn(
        "group transition duration-200 hover:bg-teal-soft/25",
        index < 3 && "bg-[linear-gradient(90deg,rgba(247,236,211,0.48),transparent_42%)]",
      )}
    >
      <td className="border-b border-border/70 px-5 py-4">
        <MemberIdentity member={account.member} rank={index + 1} />
      </td>
      <td className="border-b border-border/70 px-5 py-4">
        <AccountIdentity account={account} />
      </td>
      <td className="border-b border-border/70 px-5 py-4">
        <RankBadge account={account} />
      </td>
      <td className="border-b border-border/70 px-5 py-4 font-mono text-sm font-bold text-foreground">
        {account.lp}
      </td>
      <td className="border-b border-border/70 px-5 py-4 text-sm font-semibold text-foreground">
        {account.winRate}%
      </td>
      <td className="border-b border-border/70 px-5 py-4">
        <PerformanceMeter value={account.averagePosition} />
      </td>
    </tr>
  );
}

function LeaderboardCard({ account, index }: { account: AccountWithMember; index: number }) {
  return (
    <article
      className={cn(
        "rounded-lg border border-border/80 bg-white/90 p-4 shadow-sm shadow-black/[0.03]",
        index < 3 && "border-gold/30 bg-[linear-gradient(135deg,rgba(247,236,211,0.76),rgba(255,255,255,0.92))]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <MemberIdentity member={account.member} rank={index + 1} />
        <RankBadge account={account} />
      </div>
      <div className="mt-4">
        <AccountIdentity account={account} />
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
  const topRank = rank <= 3;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-black shadow-sm",
          topRank
            ? "border-gold/30 bg-gold-soft text-gold shadow-gold/10"
            : "border-border bg-surface-muted text-muted",
        )}
      >
        {rank}
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold text-foreground">{member.name}</div>
        <div className="mt-1 truncate text-xs text-muted">{formatRole(member.role)}</div>
      </div>
    </div>
  );
}

function AccountIdentity({ account }: { account: AccountWithMember }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-semibold text-foreground">
        {account.summonerName}
        <span className="text-muted">#{account.tagLine}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
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

function PerformanceMeter({ value }: { value: number }) {
  const width = `${Math.min(Math.max(value * 10, 0), 100)}%`;
  const accent: Accent = value >= 8 ? "teal" : value >= 7 ? "indigo" : value >= 6 ? "gold" : "danger";
  const styles = accentStyles[accent];

  return (
    <div className="min-w-40">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("font-mono text-sm font-black", styles.text)}>{value.toFixed(1)}</span>
        <span className="text-xs text-muted">/ 10</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-muted ring-1 ring-border/60">
        <div className={cn("h-full rounded-full bg-gradient-to-r", styles.meter)} style={{ width }} />
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/80 bg-surface/80 px-3 py-2">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

function AccountsPanel({ accounts }: { accounts: AccountWithMember[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground">Cuentas registradas</h2>
          <p className="mt-1 text-sm text-muted">Vista rapida por dueno, estado y rol.</p>
        </div>
        <Badge tone="neutral">{accounts.length}</Badge>
      </div>

      {accounts.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {accounts.map((account) => (
            <article
              className="group rounded-lg border border-border/80 bg-white/75 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-md hover:shadow-teal/10"
              key={account.id}
            >
              <div className="flex items-start justify-between gap-3">
                <AccountIdentity account={account} />
                <Badge tone={account.isMain ? "indigo" : "neutral"}>{account.isMain ? "Main" : "Smurf"}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase text-muted">Dueno</p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {account.member.name} · {formatRole(account.member.role)}
                  </p>
                </div>
                <Button className="h-8 px-3" variant="ghost">
                  Ver
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">{statusDetail[account.leagueOfGraphsStatus]}</p>
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
          <h2 className="text-lg font-black text-foreground">Miembros</h2>
          <p className="mt-1 text-sm text-muted">Cuentas asociadas por persona.</p>
        </div>
        <Badge tone="neutral">{members.length}</Badge>
      </div>
      <div className="mt-5 divide-y divide-border/80">
        {members.map((member) => (
          <div
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            key={member.id}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
              <p className="mt-1 truncate text-xs text-muted">{member.email}</p>
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
          <h2 className="text-lg font-black text-foreground">Invitaciones</h2>
          <p className="mt-1 text-sm text-muted">Invita amigos y completa el grupo.</p>
        </div>
        <Button className="h-9 px-3" variant="secondary">
          Nueva
        </Button>
      </div>

      {pendingInvites.length > 0 ? (
        <div className="mt-5 divide-y divide-border/80">
          {pendingInvites.map((invite) => (
            <div
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              key={invite.id}
            >
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">
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
    <div className="m-4 rounded-lg border border-dashed border-teal/30 bg-teal-soft/30 p-5 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-white text-sm font-black text-teal shadow-sm">
        +
      </div>
      <h3 className="mt-3 text-sm font-black text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{description}</p>
      <Button className="mt-4 h-9 px-3" variant="secondary">
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
