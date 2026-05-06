import Link from "next/link";
import type { ReactNode } from "react";
import { ActiveNav } from "@/components/layout/active-nav";

type AppShellProps = {
  children: ReactNode;
};

const shellBand = "mx-auto w-4/5 max-w-[1720px] px-4 sm:px-6 lg:px-8";

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 surface-pattern backdrop-blur-[3px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(25,216,255,0.14),transparent_62%)]" />

      <header className="sticky top-0 z-20 border-b border-cyan-200/12 bg-[#030816]/82 shadow-2xl shadow-black/35 backdrop-blur-2xl">
        <div className={`relative flex min-h-18 items-center justify-between gap-4 py-3 ${shellBand}`}>
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />

          <div className="flex min-w-0 items-center gap-3">
            <Link
              className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/35 bg-[#071a33] text-lg font-black text-white shadow-xl shadow-cyan-500/20"
              href="/"
            >
              <span className="absolute -left-3 -top-3 size-10 rounded-full bg-cyan-300/45 blur-xl" />
              <span className="absolute -right-4 bottom-0 size-10 rounded-full bg-violet-500/55 blur-xl" />
              <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(25,216,255,0.42),transparent_42%,rgba(124,60,255,0.42))]" />
              <span className="relative z-10 tracking-tight">FX</span>
            </Link>
            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight text-white">Flex App</p>
              <p className="truncate text-xs font-medium text-slate-300">Domina el meta con tu escuadra</p>
            </div>
          </div>

          <ActiveNav />

          <div className="flex items-center gap-2">
            <form action="/auth/signout" method="post">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/12 bg-white/8 px-3 text-sm font-bold text-white/84 shadow-lg shadow-black/20 transition duration-150 hover:border-cyan-300/24 hover:bg-white/12 hover:text-white active:bg-white/10"
                type="submit"
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-white text-xs font-black text-[#111827]">G</span>
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className={`py-5 ${shellBand}`}>{children}</main>
    </div>
  );
}
