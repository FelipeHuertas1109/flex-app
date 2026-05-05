import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSnapshot } from "@/features/dashboard/data/queries";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Panel } from "@/components/ui/panel";
import { CreateGroupForm } from "@/features/groups/components/create-group-form";
import type { LeaderboardSort, LeaderboardSortDirection } from "@/features/dashboard/types";

export async function DashboardScreen({
  queue,
  sort,
  sortDirection,
}: {
  queue: "flex" | "solo-duo";
  sort: LeaderboardSort;
  sortDirection: LeaderboardSortDirection;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const snapshot = await getDashboardSnapshot(user.id);

  if (!snapshot) {
    return (
      <AppShell>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Panel className="max-w-md bg-black/40 p-8 text-center backdrop-blur-xl">
            <h2 className="text-2xl font-black text-white">Únete a un Flex Queue</h2>
            <p className="mt-3 text-sm text-slate-300">
              Parece que aún no perteneces a ningún grupo. Puedes crear tu propio squad
              o esperar a que alguien te invite para ver el Dashboard.
            </p>
            <p className="mt-5 text-sm text-slate-300">
              ¿Te llegó una invitación? Revisa{" "}
              <Link className="font-bold text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline" href="/invitaciones">
                Invitaciones
              </Link>{" "}
              para unirte con tu correo de Google.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {/* Formulario extraido a Client Component para manejar errores visuales */}
              <CreateGroupForm />
            </div>
          </Panel>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardView queue={queue} snapshot={snapshot} sort={sort} sortDirection={sortDirection} />
    </AppShell>
  );
}
