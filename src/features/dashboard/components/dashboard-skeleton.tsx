import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/feedback/skeleton";
import { Panel } from "@/components/ui/panel";

export function DashboardSkeleton() {
  return (
    <AppShell user={null}>
      <div className="space-y-5" aria-label="Cargando dashboard">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.58fr)_minmax(360px,0.8fr)]">
          <div className="overflow-hidden rounded-xl border border-cyan-200/14 bg-surface/86 p-5 shadow-2xl shadow-black/40 ring-1 ring-white/7 sm:p-7">
            <Skeleton className="h-px w-full rounded-none" />
            <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="w-full max-w-2xl">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="mt-4 h-12 w-full max-w-md" />
                <Skeleton className="mt-3 h-5 w-full max-w-xl" />
                <Skeleton className="mt-2 h-5 w-4/5 max-w-lg" />
              </div>
              <div className="flex gap-2 md:flex-col lg:flex-row">
                <Skeleton className="h-11 w-40" />
                <Skeleton className="h-11 w-40" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="rounded-xl border border-cyan-200/12 bg-white/[0.035] p-4" key={index}>
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="size-12 rounded-xl" />
                  </div>
                  <Skeleton className="mt-3 h-10 w-16" />
                  <Skeleton className="mt-2 h-4 w-28" />
                </div>
              ))}
            </div>
          </div>

          <Panel className="overflow-hidden">
            <div className="border-b border-cyan-200/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="w-full">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="mt-3 h-5 w-full max-w-72" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="mt-4 h-16 w-full" />
            </div>
            <div className="p-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="mt-3 h-10 first:mt-0" key={index} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.8fr)]">
          <Panel className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-cyan-200/10 bg-white/[0.025] p-5">
              <div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="mt-2 h-4 w-56" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="hidden md:block">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="grid grid-cols-6 gap-4 border-b border-cyan-200/10 px-5 py-4" key={index}>
                  <Skeleton className="col-span-2 h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ))}
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="h-44" key={index} />
              ))}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="mt-2 h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-10" />
              </div>
              <div className="mt-4 grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton className="h-32" key={index} />
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-6 w-10" />
              </div>
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton className="h-12" key={index} />
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="mt-4 space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton className="h-10" key={index} />
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
