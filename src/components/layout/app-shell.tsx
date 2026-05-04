import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: ReactNode;
};

const navItems = ["Dashboard", "Grupos", "Cuentas", "Invitaciones"];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/75 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-foreground text-sm font-black text-white shadow-md shadow-teal/15">
              <span className="absolute inset-x-0 top-0 h-px bg-gold/70" />
              <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,139,127,0.55),transparent_42%,rgba(173,122,34,0.35))]" />
              <span className="relative">
              FX
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">Flex App</p>
              <p className="truncate text-xs text-muted">Equipos, cuentas y rendimiento</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {navItems.map((item, index) => (
              <a
                className={
                  index === 0
                    ? "rounded-md border border-border/80 bg-surface px-3 py-2 text-sm font-semibold text-foreground shadow-sm shadow-black/[0.04]"
                    : "rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface/80 hover:text-foreground"
                }
                href="#"
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Badge tone="teal" className="hidden sm:inline-flex">
              Mock data
            </Badge>
            <Button className="h-9 px-3" variant="secondary">
              <span className="flex size-5 items-center justify-center rounded-md bg-white text-xs font-black text-foreground shadow-sm">
                G
              </span>
              Google
            </Button>
          </div>
        </div>
      </header>
      <main className="surface-pattern mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
