import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { getRiotApiKeySnapshot } from "@/features/riot-key/data/queries";
import { KeyAgeCounter } from "@/features/riot-key/components/key-age-counter";
import { RiotApiKeyForm } from "@/features/riot-key/components/key-form";

export async function KeyScreen() {
  const snapshot = await getRiotApiKeySnapshot();
  const updatedAtLabel = snapshot.updatedAt
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(snapshot.updatedAt))
    : "Nunca";

  const expiresAtLabel = snapshot.expiresAt
    ? new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(snapshot.expiresAt))
    : "Sin clave";

  return (
    <AppShell>
      <div className="animate-enter mx-auto max-w-6xl space-y-6">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
          <Panel className="overflow-hidden">
            <div className="border-b border-cyan-200/10 bg-white/[0.03] px-6 py-6 sm:px-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="indigo">Servidor</Badge>
                <Badge tone={snapshot.hasKey ? "teal" : "gold"}>
                  {snapshot.hasKey ? "Key configurada" : "Falta key"}
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Key</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Carga aquí la <span className="font-bold text-slate-200">RIOT_API_KEY</span> activa. Flex App la guarda
                en Supabase y la usa en las sincronizaciones manuales, automáticas y en el alta inicial de cuentas.
              </p>
            </div>

            <div className="space-y-5 px-6 py-6 sm:px-7">
              {snapshot.error ? (
                <div className="rounded-xl border border-pink-300/24 bg-pink-500/[0.06] p-4">
                  <p className="text-sm font-bold text-white">No se pudo acceder al almacenamiento de la key.</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{snapshot.error}</p>
                </div>
              ) : null}

              <RiotApiKeyForm disabled={Boolean(snapshot.error)} hasKey={snapshot.hasKey} />
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300/90">Estado actual</p>
                  <h2 className="mt-2 text-lg font-black text-white">Riot API Key</h2>
                </div>
                <Badge tone={snapshot.hasKey ? "teal" : "gold"}>{snapshot.hasKey ? "Activa" : "Sin cargar"}</Badge>
              </div>
              <dl className="mt-5 grid gap-4">
                <div className="rounded-xl border border-cyan-200/12 bg-white/[0.035] p-4">
                  <dt className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Última carga</dt>
                  <dd className="mt-2 text-sm font-bold text-white">{updatedAtLabel}</dd>
                </div>
                <div className="rounded-xl border border-cyan-200/12 bg-white/[0.035] p-4">
                  <dt className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Ventana de 24h</dt>
                  <dd className="mt-2 text-sm font-bold text-white">{expiresAtLabel}</dd>
                </div>
                <div className="rounded-xl border border-cyan-200/12 bg-white/[0.035] p-4">
                  <dt className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Última actualización por</dt>
                  <dd className="mt-2 text-sm font-bold text-white">{snapshot.updatedByLabel ?? "Sin registro de usuario"}</dd>
                </div>
              </dl>
            </Panel>

            <Panel className="p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300/90">Contador</p>
              <h2 className="mt-2 text-lg font-black text-white">Tiempo desde la última actualización</h2>
              <div className="mt-5">
                <KeyAgeCounter updatedAt={snapshot.updatedAt} />
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
