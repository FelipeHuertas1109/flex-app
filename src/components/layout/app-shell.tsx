import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

const navItems = ["Dashboard", "Grupos", "Cuentas", "Invitaciones"];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-foreground shadow-xl shadow-black/30">
        <div className="relative mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-teal/55 via-indigo/30 to-transparent" />

          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal text-sm font-black text-white shadow-lg shadow-teal/40">
              <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_55%)]" />
              <span className="relative z-10">FX</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white/90">Flex App</p>
              <p className="truncate text-xs text-white/38">Equipos, cuentas y rendimiento</p>
            </div>
          </div>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Principal">
            {navItems.map((item, index) => (
              <a
                className={
                  index === 0
                    ? "rounded-md border border-teal/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white"
                    : "rounded-md px-3 py-1.5 text-sm font-medium text-white/42 transition duration-150 hover:bg-white/8 hover:text-white/72"
                }
                href="#"
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center rounded-md border border-teal/28 bg-teal/12 px-2 py-1 text-xs font-semibold text-teal sm:inline-flex">
              Mock data
            </span>
            <button
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/12 bg-white/8 px-3 text-sm font-medium text-white/68 transition duration-150 hover:border-white/20 hover:bg-white/14 hover:text-white/85 active:bg-white/10"
              type="button"
            >
              <span className="flex size-4 items-center justify-center rounded-sm bg-white text-[10px] font-black text-foreground">
                G
              </span>
              Google
            </button>
          </div>
        </div>
      </header>
      <main className="surface-pattern mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
