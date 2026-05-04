import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { label: "Dashboard", icon: "grid" },
  { label: "Grupos", icon: "nodes" },
  { label: "Cuentas", icon: "rank" },
  { label: "Invitaciones", icon: "mail" },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 surface-pattern" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(25,216,255,0.14),transparent_62%)]" />

      <header className="sticky top-0 z-20 border-b border-cyan-200/12 bg-[#030816]/82 shadow-2xl shadow-black/35 backdrop-blur-2xl">
        <div className="relative mx-auto flex min-h-18 w-full max-w-[1720px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />

          <div className="flex min-w-0 items-center gap-3">
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
          </div>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Principal">
            {navItems.map((item, index) => (
              <a
                className={
                  index === 0
                    ? "inline-flex h-11 items-center gap-2 rounded-lg border border-cyan-300/24 bg-cyan-300/10 px-4 text-sm font-bold text-white shadow-lg shadow-cyan-400/10"
                    : "inline-flex h-11 items-center gap-2 rounded-lg border border-transparent px-4 text-sm font-semibold text-slate-400 transition duration-150 hover:border-white/10 hover:bg-white/6 hover:text-white"
                }
                href="#"
                key={item.label}
              >
                <NavIcon type={item.icon} active={index === 0} />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden h-10 items-center rounded-lg border border-cyan-300/25 bg-cyan-400/8 px-4 text-sm font-bold text-cyan-300 shadow-lg shadow-cyan-500/10 sm:inline-flex">
              Mock data
            </span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 text-sm font-bold text-white/84 shadow-lg shadow-black/20 transition duration-150 hover:border-cyan-300/24 hover:bg-white/12 hover:text-white active:bg-white/10"
              type="button"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-white text-xs font-black text-[#111827]">
                G
              </span>
              Google
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1720px] px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function NavIcon({ active, type }: { active: boolean; type: string }) {
  if (type === "grid") {
    return (
      <span className="grid size-4 grid-cols-2 gap-0.5" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <span className={active ? "rounded-[2px] bg-cyan-300" : "rounded-[2px] bg-slate-500"} key={index} />
        ))}
      </span>
    );
  }

  if (type === "mail") {
    return (
      <span
        className={active ? "size-4 rounded-sm border border-cyan-300" : "size-4 rounded-sm border border-slate-500"}
        aria-hidden="true"
      />
    );
  }

  if (type === "rank") {
    return (
      <span className={active ? "hex-mark size-5 bg-cyan-300" : "hex-mark size-5 bg-slate-500"} aria-hidden="true" />
    );
  }

  return (
    <span className="relative size-5" aria-hidden="true">
      <span className={active ? "absolute left-0 top-0 size-2 rounded-full border border-cyan-300" : "absolute left-0 top-0 size-2 rounded-full border border-slate-500"} />
      <span className={active ? "absolute right-0 top-0 size-2 rounded-full border border-cyan-300" : "absolute right-0 top-0 size-2 rounded-full border border-slate-500"} />
      <span className={active ? "absolute bottom-0 left-1.5 size-2 rounded-full border border-cyan-300" : "absolute bottom-0 left-1.5 size-2 rounded-full border border-slate-500"} />
    </span>
  );
}
