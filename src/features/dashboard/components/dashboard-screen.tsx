import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSnapshot } from "@/features/dashboard/data/mock-dashboard";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function DashboardScreen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const snapshot = await getDashboardSnapshot();

  return (
    <AppShell>
      <DashboardView snapshot={snapshot} />
    </AppShell>
  );
}
