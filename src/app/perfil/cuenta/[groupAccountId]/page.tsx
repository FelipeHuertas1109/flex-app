import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { ProfileAccountDetails } from "@/features/profile/components/profile-account-details";
import { getAccountProfileStats } from "@/features/profile/actions";
import { mapUserToShellUser } from "@/lib/auth/shell-user";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileAccountPage({
  params,
}: {
  params: Promise<{ groupAccountId: string }>;
}) {
  const { groupAccountId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const shellUser = mapUserToShellUser(user)!;
  const statsResult = await getAccountProfileStats(groupAccountId);

  if (statsResult.error || !statsResult.data) {
    return (
      <AppShell user={shellUser}>
        <Panel className="mx-auto max-w-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-black text-white">Detalle de cuenta</h1>
          <p className="mt-3 text-sm text-slate-300">{statsResult.error ?? "No se pudo cargar la cuenta seleccionada."}</p>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell user={shellUser}>
      <ProfileAccountDetails stats={statsResult.data} />
    </AppShell>
  );
}
