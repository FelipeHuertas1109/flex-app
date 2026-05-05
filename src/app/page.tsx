import { Suspense } from "react";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ queue?: string }>;
}) {
  const params = await searchParams;
  const queue = params?.queue === "solo-duo" ? "solo-duo" : "flex";

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardScreen queue={queue} />
    </Suspense>
  );
}
