import type { ReactNode } from "react";
import type { ShellUser } from "@/lib/auth/shell-user";
import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: ReactNode;
  user: ShellUser | null;
};

const shellBand = "mx-auto w-4/5 max-w-[1720px] px-4 sm:px-6 lg:px-8";

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 surface-pattern backdrop-blur-[3px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(25,216,255,0.14),transparent_62%)]" />

      <AppSidebar user={user} />

      <div className="min-h-screen min-w-0 pl-14">
        <main className={`py-5 ${shellBand}`}>{children}</main>
      </div>
    </div>
  );
}
