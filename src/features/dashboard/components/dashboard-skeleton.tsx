import { AppShell } from "@/components/layout/app-shell";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/feedback/skeleton";

export function DashboardSkeleton() {
  return (
    <AppShell>
      <div className="space-y-6" aria-label="Cargando dashboard">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm shadow-black/[0.03] sm:p-6">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="mt-4 h-10 w-full max-w-md" />
            <Skeleton className="mt-3 h-5 w-full max-w-xl" />
            <Skeleton className="mt-2 h-5 w-4/5 max-w-lg" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton className="h-28" key={index} />
              ))}
            </div>
          </div>
          <Panel className="p-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-3 h-5 w-full" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="h-12" key={index} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.8fr)]">
          <Panel className="overflow-hidden">
            <div className="border-b border-border p-5">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="grid grid-cols-6 gap-4 border-b border-border p-5" key={index}>
                  <Skeleton className="col-span-2 h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ))}
            </div>
          </Panel>
          <div className="space-y-4">
            <Panel className="p-5">
              <Skeleton className="h-6 w-32" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton className="h-16" key={index} />
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <Skeleton className="h-6 w-36" />
              <div className="mt-5 space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton className="h-12" key={index} />
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
