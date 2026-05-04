import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSnapshot } from "@/features/dashboard/data/mock-dashboard";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export async function DashboardScreen() {
  const snapshot = await getDashboardSnapshot();

  return (
    <AppShell>
      <DashboardView snapshot={snapshot} />
    </AppShell>
  );
}
