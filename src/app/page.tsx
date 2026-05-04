import { Suspense } from "react";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardScreen />
    </Suspense>
  );
}
