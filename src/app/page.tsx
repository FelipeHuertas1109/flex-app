import { Suspense } from "react";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import type { LeaderboardSort, LeaderboardSortDirection } from "@/features/dashboard/types";

function parseLeaderboardSort(value: string | undefined): LeaderboardSort {
  if (value === "games" || value === "win-rate") return value;
  return "rank";
}

function parseLeaderboardSortDirection(value: string | undefined): LeaderboardSortDirection {
  return value === "asc" ? "asc" : "desc";
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ dir?: string; main?: string; queue?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const queue = params?.queue === "solo-duo" ? "solo-duo" : "flex";
  const sort = parseLeaderboardSort(params?.sort);
  const sortDirection = parseLeaderboardSortDirection(params?.dir);
  const mainOnly = params?.main === "1";

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardScreen mainOnly={mainOnly} queue={queue} sort={sort} sortDirection={sortDirection} />
    </Suspense>
  );
}
