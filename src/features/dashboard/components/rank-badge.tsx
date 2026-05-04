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
  IRON: "border-slate-400/20 bg-slate-100 text-slate-700",
  BRONZE: "border-amber-800/20 bg-amber-100 text-amber-900",
  SILVER: "border-slate-400/20 bg-slate-100 text-slate-700",
  GOLD: "border-gold/20 bg-gold-soft text-gold",
  PLATINUM: "border-teal/20 bg-teal-soft text-teal",
  EMERALD: "border-emerald-500/20 bg-emerald-50 text-emerald-700",
  DIAMOND: "border-indigo/20 bg-indigo-soft text-indigo",
  MASTER: "border-fuchsia-500/20 bg-fuchsia-50 text-fuchsia-700",
};

export function RankBadge({ account }: RankBadgeProps) {
  const label = account.division
    ? `${tierLabels[account.tier]} ${account.division}`
    : tierLabels[account.tier];

  return (
    <Badge className={cn("shadow-sm shadow-black/[0.02]", tierStyles[account.tier])}>
      {label}
    </Badge>
  );
}
