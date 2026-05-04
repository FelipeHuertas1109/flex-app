import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/features/auth/actions";

const sessionHighlights = [
  {
    label: "OAuth",
    value: "Google",
  },
  {
    label: "Grupos",
    value: "Privados",
  },
  {
    label: "Sync",
    value: "Supabase",
  },
];

const previewRows = [
  { name: "SolarWave", rank: "Diamante III", score: "8.4", tone: "gold" },
  { name: "OrbitKit", rank: "Esmeralda I", score: "7.8", tone: "teal" },
  { name: "NorthReset", rank: "Oro I", score: "6.3", tone: "danger" },
];

export function LoginScreen() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 surface-pattern" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-[min(900px,100vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(25,216,255,0.2),transparent_62%)]" />

      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link className="group flex min-w-0 items-center gap-3" href="/">
            <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/35 bg-[#071a33] text-lg font-black text-white shadow-xl shadow-cyan-500/20">
              <span className="absolute -left-3 -top-3 size-10 rounded-full bg-cyan-300/45 blur-xl" />
              <span className="absolute -right-4 bottom-0 size-10 rounded-full bg-violet-500/55 blur-xl" />
              <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(25,216,255,0.42),transparent_42%,rgba(124,60,255,0.42))]" />
              <span className="relative z-10 tracking-tight">FX</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight text-white">Flex App</p>
              <p className="truncate text-xs font-medium text-slate-300">Equipos, cuentas y rendimiento</p>
            </div>
          </Link>

          <Link
            className="inline-flex h-10 items-center rounded-lg border border-cyan-300/18 bg-white/6 px-4 text-sm font-bold text-slate-200 shadow-lg shadow-black/20 transition duration-150 hover:border-cyan-300/35 hover:bg-cyan-300/8 hover:text-white"
            href="/"
          >
            Dashboard
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-6 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(430px,1.08fr)] lg:py-14">
          <div className="order-2 lg:order-1">
            <div className="neon-panel relative overflow-hidden rounded-2xl border border-cyan-200/14 bg-[#07111f]/82 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/7 backdrop-blur-xl sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-cyan-300/70 via-violet-400/45 to-amber-300/35" />
              <div className="absolute -right-24 -top-24 size-72 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute -bottom-28 left-8 size-72 rounded-full bg-violet-500/10 blur-3xl" />

              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="teal">Google OAuth</Badge>
                  <Badge tone="indigo">Supabase ready</Badge>
                </div>

                <h1 className="mt-5 max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Entra al lobby de tu Flex queue
                </h1>
                <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
                  Usa una sola cuenta de Google para acceder a tus grupos, cuentas vinculadas,
                  invitaciones y rendimiento Flex con una interfaz pensada para squads.
                </p>

                <form action={signInWithGoogle} className="mt-8">
                  <Button className="h-12 w-full justify-center text-base sm:w-auto sm:min-w-80" type="submit">
                    <GoogleMark />
                    Continuar con Google
                  </Button>
                  <p className="mt-4 max-w-md text-xs leading-5 text-slate-500">
                    Al continuar te enviaremos a Google OAuth via Supabase y volveras al dashboard.
                  </p>
                </form>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {sessionHighlights.map((item) => (
                    <div
                      className="rounded-xl border border-cyan-200/10 bg-black/24 p-4 shadow-inner shadow-black/30"
                      key={item.label}
                    >
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-black text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-xl overflow-hidden rounded-2xl border border-cyan-200/14 bg-[#061024]/76 p-5 shadow-2xl shadow-black/45 ring-1 ring-white/7 backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_4%,rgba(124,60,255,0.18),transparent_38%),radial-gradient(circle_at_0%_20%,rgba(25,216,255,0.14),transparent_34%)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3 border-b border-cyan-200/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="hex-mark relative flex size-12 items-center justify-center border border-cyan-300/22 bg-linear-to-br from-cyan-400/18 to-violet-600/14 text-amber-300 shadow-xl shadow-cyan-500/12">
                      <span className="absolute inset-1 hex-mark border border-cyan-300/16 bg-black/18" />
                      <TrophyIcon />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">Aurora Flex Club</p>
                      <p className="text-sm text-slate-400">Vista previa del squad</p>
                    </div>
                  </div>
                  <Badge tone="gold">Privado</Badge>
                </div>

                <div className="mt-5 grid gap-3">
                  {previewRows.map((row, index) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-xl border border-cyan-200/10 bg-black/24 p-4 shadow-lg shadow-black/20"
                      key={row.name}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <RankMedal rank={index + 1} tone={row.tone} />
                        <div className="min-w-0">
                          <p className="truncate font-black text-white">{row.name}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">{row.rank}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-lg font-black text-cyan-200">{row.score}</p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Prom.</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-violet-300/14 bg-violet-500/8 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-slate-300">Vista ejemplo</p>
                    <p className="font-mono text-sm font-black text-white">3 / 4</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800/90">
                    <div className="h-full w-3/4 rounded-full bg-linear-to-r from-cyan-300 via-sky-400 to-violet-500 shadow-lg shadow-cyan-400/30" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <span className="relative flex size-7 items-center justify-center rounded-lg bg-white text-sm font-black text-[#111827] shadow-lg shadow-black/20">
      G
    </span>
  );
}

function TrophyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="relative size-7 drop-shadow-[0_0_10px_rgba(245,184,63,0.65)]"
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

function RankMedal({ rank, tone }: { rank: number; tone: string }) {
  const toneClass =
    tone === "gold"
      ? "border-amber-100/70 bg-linear-to-br from-amber-300 via-amber-400 to-amber-700 text-amber-950 shadow-amber-400/35"
      : tone === "teal"
        ? "border-cyan-200/50 bg-linear-to-br from-cyan-300 via-teal to-violet-700 text-white shadow-cyan-400/25"
        : "border-pink-200/40 bg-linear-to-br from-pink-400 via-rose-500 to-violet-800 text-white shadow-pink-500/25";

  return (
    <div className={`hex-mark relative flex size-11 shrink-0 items-center justify-center border text-sm font-black shadow-lg ${toneClass}`}>
      <span className="absolute inset-1 hex-mark border border-white/18 bg-black/8" />
      <span className="relative">{rank}</span>
    </div>
  );
}
