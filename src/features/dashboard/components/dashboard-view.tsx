import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { RankBadge } from "@/features/dashboard/components/rank-badge";
import type {
  DashboardSnapshot,
  GroupMember,
  LeagueAccount,
} from "@/features/dashboard/types";

type DashboardViewProps = {
  snapshot: DashboardSnapshot;
};

const statusTone: Record<LeagueAccount["leagueOfGraphsStatus"], "teal" | "gold" | "danger"> = {
  synced: "teal",
  pending: "gold",
  stale: "danger",
};

const statusLabel: Record<LeagueAccount["leagueOfGraphsStatus"], string> = {
  synced: "League of Graphs sincronizado",
  pending: "Sincronizacion pendiente",
  stale: "Datos por actualizar",
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

  return (
    <div className="animate-enter space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm shadow-black/[0.03] sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <Badge tone="teal">Grupo privado</Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                {snapshot.group.name}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
                Base inicial para organizar miembros, cuentas main y smurf, ranking Flex y
                metricas de rendimiento antes de conectar Supabase y Riot data.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
              <Button>Invitar miembro</Button>
              <Button variant="secondary">Registrar cuenta</Button>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Miembros" value={snapshot.members.length.toString()} detail="Activos" />
            <StatTile label="Cuentas" value={accounts.length.toString()} detail={`${mainAccounts} mains`} />
            <StatTile label="Mejor posicion" value={bestAverage.toFixed(1)} detail="Escala 1 a 10" />
            <StatTile label="Invitaciones" value={pendingInvites.toString()} detail="Pendientes" />
          </dl>
        </div>

        <Panel className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Proxima sincronizacion</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Preparado para Vercel Cron Jobs y scraping aislado de League of Graphs.
              </p>
            </div>
            <Badge tone="indigo">Futuro</Badge>
          </div>
          <div className="mt-5 space-y-3">
            <TimelineRow label="Ultima lectura mock" value={formatSyncDate(snapshot.sync.lastUpdatedAt)} />
            <TimelineRow label="Frecuencia objetivo" value={snapshot.sync.nextJobLabel} />
            <TimelineRow label="Auth esperada" value="Google OAuth con Supabase" />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.8fr)]">
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Leaderboard Flex</h2>
              <p className="mt-1 text-sm text-muted">Ordenado por Posicion Promedio mock.</p>
            </div>
            <Badge tone="gold">Cola Flex</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
              <thead className="bg-surface-muted/70 text-xs uppercase text-muted">
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
                  <tr className="border-b border-border last:border-b-0" key={account.id}>
                    <td className="px-5 py-4">
                      <MemberIdentity member={account.member} rank={index + 1} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">
                        {account.summonerName}
                        <span className="text-muted">#{account.tagLine}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {account.region} {account.isMain ? "Main" : "Smurf"}
                      </div>
                      <div className="mt-2">
                        <Badge tone={statusTone[account.leagueOfGraphsStatus]}>
                          {statusLabel[account.leagueOfGraphsStatus]}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <RankBadge account={account} />
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-foreground">{account.lp}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground">
                      {account.winRate}%
                    </td>
                    <td className="px-5 py-4">
                      <PerformanceMeter value={account.averagePosition} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <MembersPanel members={snapshot.members} />
          <InvitesPanel snapshot={snapshot} />
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-t border-border pt-4">
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="mt-2 text-2xl font-bold text-foreground">{value}</dd>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-3 first:border-t-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="max-w-[12rem] text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function MemberIdentity({ member, rank }: { member: GroupMember; rank: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground text-sm font-black text-white">
        {rank}
      </div>
      <div>
        <div className="font-semibold text-foreground">{member.name}</div>
        <div className="mt-1 text-xs text-muted">{member.role}</div>
      </div>
    </div>
  );
}

function PerformanceMeter({ value }: { value: number }) {
  const width = `${Math.min(Math.max(value * 10, 0), 100)}%`;

  return (
    <div className="min-w-40">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-bold text-foreground">{value.toFixed(1)}</span>
        <span className="text-xs text-muted">/ 10</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-teal" style={{ width }} />
      </div>
    </div>
  );
}

function MembersPanel({ members }: { members: GroupMember[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Miembros</h2>
          <p className="mt-1 text-sm text-muted">Cuentas asociadas por persona.</p>
        </div>
        <Badge tone="neutral">{members.length}</Badge>
      </div>
      <div className="mt-5 divide-y divide-border">
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
          <h2 className="text-lg font-bold text-foreground">Invitaciones</h2>
          <p className="mt-1 text-sm text-muted">Base visual para enviar correos desde Supabase.</p>
        </div>
        <Button className="h-9 px-3" variant="ghost">
          Nueva
        </Button>
      </div>

      {pendingInvites.length > 0 ? (
        <div className="mt-5 divide-y divide-border">
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
        <div className="mt-5 rounded-md border border-dashed border-border bg-background/80 p-4 text-sm text-muted">
          No hay invitaciones pendientes. Invita a un correo para completar el grupo.
        </div>
      )}
    </Panel>
  );
}

function formatSyncDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
