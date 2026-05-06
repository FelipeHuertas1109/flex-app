import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { getMatchDeepAnalysis, type QueueFilter } from "@/features/match-history/actions";
import { MatchDeepAnalysis } from "@/features/match-history/components/match-deep-analysis";
import { mapUserToShellUser } from "@/lib/auth/shell-user";
import { createClient } from "@/lib/supabase/server";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams?: Promise<{ account?: string; queue?: string }>;
}) {
  const { matchId } = await params;
  const query = await searchParams;
  const accountId = query?.account;
  const queue = query?.queue === "flex" ? "flex" : "soloq";

  if (!accountId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const shellUser = mapUserToShellUser(user)!;
  const result = await getMatchDeepAnalysis(accountId, queue as QueueFilter, matchId);
  if (result.error || !result.match || !result.account || !result.analysis) notFound();

  const match = result.match;
  const selected = match.teams.flatMap((team) => team.participants).find((participant) => participant.selected) ?? null;

  return (
    <AppShell user={shellUser}>
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 text-sm font-black text-cyan-100 transition hover:border-cyan-200/70 hover:bg-cyan-400/16"
            href="/historial"
          >
            ← Volver al historial
          </Link>
          <Badge tone="neutral">{match.matchId}</Badge>
        </div>

        <Panel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={match.result === "Victoria" ? "teal" : "danger"}>{match.result}</Badge>
            <Badge tone="indigo">{match.queue}</Badge>
            <Badge tone="neutral">{match.dateLabel}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Estadísticas de partida {selected ? `· ${selected.riotId}` : ""}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Vista detallada de combate, economía y desempeño de ambos equipos para esta match.
          </p>
        </Panel>

        <MatchDeepAnalysis analysis={result.analysis} />
      </section>
    </AppShell>
  );
}
