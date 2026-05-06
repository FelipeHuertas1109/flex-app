import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/feedback/skeleton";
import { Panel } from "@/components/ui/panel";

export function KeySkeleton() {
  return (
    <AppShell user={null}>
      <div className="mx-auto max-w-6xl space-y-6" aria-label="Cargando key">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
          <Panel className="overflow-hidden">
            <div className="border-b border-cyan-200/10 bg-white/[0.03] px-6 py-6 sm:px-7">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="mt-4 h-10 w-48" />
              <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
              <Skeleton className="mt-2 h-5 w-4/5 max-w-xl" />
            </div>
            <div className="space-y-5 px-6 py-6 sm:px-7">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-5 w-3/5" />
              <div className="flex justify-end">
                <Skeleton className="h-11 w-32" />
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-7 w-40" />
              <div className="mt-5 grid gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Panel>
            <Panel className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-7 w-56" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="mt-3 h-4 w-2/3" />
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
