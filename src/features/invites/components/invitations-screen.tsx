import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { AcceptPendingInvitesButton } from "@/features/invites/components/accept-invites-button";
import { getPendingInvitesInbox } from "@/features/invites/data/queries";

export async function InvitationsScreen() {
  const inbox = await getPendingInvitesInbox();

  const formatted = (iso: string) =>
    new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    );

  return (
    <AppShell>
      <div className="animate-enter mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Invitaciones</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Solo tu correo puede ver estas invitaciones. Si fuiste invitado, unete al grupo y luego revisa el
            dashboard para las cuentas Flex.
          </p>
          <Link className="mt-3 inline-block text-sm font-bold text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline" href="/">
            Volver al Dashboard
          </Link>
        </div>

        <Panel className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-black text-white">Pendientes</h2>
            <Badge tone={inbox.length > 0 ? "gold" : "neutral"}>{inbox.length}</Badge>
          </div>

          {inbox.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-cyan-300/26 bg-cyan-400/[0.06] px-6 py-10 text-center">
              <p className="text-sm font-bold text-white">Sin invitaciones pendientes</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
                Pide al administrador de tu squad que invite el mismo correo con el que inicias sesion en Google.
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-6 divide-y divide-cyan-200/12">
                {inbox.map((row) => (
                  <li className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0" key={row.id}>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-white">{row.groupName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatted(row.invitedAt)}</p>
                    </div>
                    <Badge tone="gold">Pendiente</Badge>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-cyan-200/12 pt-6">
                <p className="text-sm leading-relaxed text-slate-400">
                  Una sola pulsacion procesa todas las invitaciones de esta lista usando tu correo de perfil actual.
                </p>
                <div className="mt-4">
                  <AcceptPendingInvitesButton disabled={inbox.length === 0} />
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
