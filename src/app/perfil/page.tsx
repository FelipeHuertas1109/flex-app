import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { ProfileAccountsPanel } from "@/features/profile/components/profile-accounts-panel";
import { getDashboardSnapshot } from "@/features/dashboard/data/queries";
import { mapUserToShellUser } from "@/lib/auth/shell-user";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
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
        <Panel className="mx-auto max-w-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-black text-white">Mi perfil</h1>
          <p className="mt-3 text-sm text-slate-300">
            Cuando pertenezcas a un grupo, aqui podras gestionar tus cuentas, eliminarlas y marcarlas como main.
          </p>
        </Panel>
      </AppShell>
    );
  }

  const memberAccounts = snapshot.members.flatMap((member) =>
    member.accounts.map((account) => ({
      id: account.id,
      riotId: `${account.summonerName}#${account.tagLine}`,
      region: account.region,
      isMain: account.isMain,
      isShared: account.isShared,
      soloTier: account.soloDuo.tier,
      soloDivision: account.soloDuo.division,
      soloLp: account.soloDuo.lp,
      soloWinRate: account.soloDuo.winRate,
      soloTotalGames: account.soloDuo.totalGames,
      memberName: member.name,
      isOwner: member.id === snapshot.viewerId,
    })),
  );

  const sharedAccounts = snapshot.sharedAccounts.map((account) => ({
    id: account.id,
    riotId: `${account.summonerName}#${account.tagLine}`,
    region: account.region,
    isMain: account.isMain,
    isShared: true,
    soloTier: account.soloDuo.tier,
    soloDivision: account.soloDuo.division,
    soloLp: account.soloDuo.lp,
    soloWinRate: account.soloDuo.winRate,
    soloTotalGames: account.soloDuo.totalGames,
    memberName: "Sin dueño",
    isOwner: false,
  }));

  const allAccounts = [...memberAccounts, ...sharedAccounts];

  return (
    <AppShell user={shellUser}>
      <section className="mx-auto max-w-5xl space-y-4">
        <Panel className="p-6 sm:p-8">
          <h1 className="text-2xl font-black text-white sm:text-3xl">Mi perfil</h1>
          <p className="mt-2 text-sm text-slate-300">
            Gestiona todas las cuentas de <span className="font-semibold text-cyan-200">{snapshot.group.name}</span>. Cualquier miembro puede marcar una cuenta como principal.
          </p>
        </Panel>
        <ProfileAccountsPanel accounts={allAccounts} groupName={snapshot.group.name} />
      </section>
    </AppShell>
  );
}
