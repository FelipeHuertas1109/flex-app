import { Suspense } from "react";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";

export default function Home({
  searchParams,
}: {
  searchParams?: { queue?: string };
}) {
  const queue = searchParams?.queue === "solo-duo" ? "solo-duo" : "flex";
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardScreen queue={queue} />
    </Suspense>
  );
}
