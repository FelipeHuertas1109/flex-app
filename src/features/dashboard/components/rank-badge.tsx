import { Badge } from "@/components/ui/badge";
import type { LeagueAccount } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type RankBadgeProps = {
  account: LeagueAccount;
};

const tierLabels: Record<LeagueAccount["tier"], string> = {
  IRON: "Hierro",
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
  PLATINUM: "Platino",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Master",
};

const tierStyles: Record<LeagueAccount["tier"], string> = {
  IRON:     "border-slate-400/25 bg-slate-500/12 text-slate-300",
  BRONZE:   "border-orange-400/25 bg-orange-500/12 text-orange-200",
  SILVER:   "border-slate-200/25 bg-slate-200/12 text-slate-100",
  GOLD:     "border-amber-300/35 bg-amber-400/14 text-amber-200 font-bold",
  PLATINUM: "border-cyan-300/35 bg-cyan-400/12 text-cyan-200 font-bold",
  EMERALD:  "border-emerald-300/35 bg-emerald-400/12 text-emerald-200 font-bold",
  DIAMOND:  "border-violet-300/35 bg-violet-500/14 text-violet-100 font-bold",
  MASTER:   "border-fuchsia-300/35 bg-fuchsia-500/14 text-fuchsia-100 font-bold",
};

export function RankBadge({ account }: RankBadgeProps) {
  const label = account.division
    ? `${tierLabels[account.tier]} ${account.division}`
    : tierLabels[account.tier];

  return (
    <Badge className={cn("h-8 px-3 shadow-lg shadow-black/20", tierStyles[account.tier])}>
      {label}
    </Badge>
  );
}
