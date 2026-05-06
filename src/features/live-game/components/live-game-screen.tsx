import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { LiveGamePanel } from "@/features/live-game/components/live-game-panel";
import { getDashboardSnapshot } from "@/features/dashboard/data/queries";
import { mapUserToShellUser } from "@/lib/auth/shell-user";
import { createClient } from "@/lib/supabase/server";

export async function LiveGameScreen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const shellUser = mapUserToShellUser(user)!;
  const snapshot = await getDashboardSnapshot(user.id);

  if (!snapshot) {
    return (
      <AppShell user={shellUser}>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Panel className="max-w-md bg-black/40 p-8 text-center backdrop-blur-xl">
            <h2 className="text-2xl font-black text-white">Sin grupo activo</h2>
            <p className="mt-3 text-sm text-slate-300">
              Necesitas pertenecer a un grupo para ver partidas activas.{" "}
              <Link className="font-bold text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline" href="/">
                Ir al Dashboard
              </Link>
            </p>
          </Panel>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={shellUser}>
      <LiveGamePanel snapshot={snapshot} />
    </AppShell>
  );
}
