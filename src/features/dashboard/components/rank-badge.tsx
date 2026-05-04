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
  IRON:     "border-slate-400/20 bg-slate-100 text-slate-500",
  BRONZE:   "border-amber-800/25 bg-amber-50 text-amber-800",
  SILVER:   "border-slate-400/25 bg-slate-100 text-slate-600",
  GOLD:     "border-gold/30 bg-gold-soft text-gold font-bold",
  PLATINUM: "border-teal/30 bg-teal-soft text-teal font-bold",
  EMERALD:  "border-emerald-500/30 bg-emerald-50 text-emerald-700 font-bold",
  DIAMOND:  "border-indigo/30 bg-indigo-soft text-indigo font-bold",
  MASTER:   "border-fuchsia-500/30 bg-fuchsia-50 text-fuchsia-700 font-bold",
};

export function RankBadge({ account }: RankBadgeProps) {
  const label = account.division
    ? `${tierLabels[account.tier]} ${account.division}`
    : tierLabels[account.tier];

  return (
    <Badge className={cn("shadow-sm shadow-black/5", tierStyles[account.tier])}>
      {label}
    </Badge>
  );
}
