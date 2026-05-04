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
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/88 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-foreground text-sm font-black text-white">
              FX
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
                    ? "rounded-md bg-surface px-3 py-2 text-sm font-semibold text-foreground shadow-sm shadow-black/[0.03]"
                    : "rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground"
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
              <span className="flex size-5 items-center justify-center rounded bg-white text-xs font-black text-foreground shadow-sm">
                G
              </span>
              Google
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
