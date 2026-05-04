import { Badge } from "@/components/ui/badge";
import type { LeagueAccount } from "@/features/dashboard/types";

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

export function RankBadge({ account }: RankBadgeProps) {
  const label = account.division
    ? `${tierLabels[account.tier]} ${account.division}`
    : tierLabels[account.tier];

  return (
    <Badge tone={account.tier === "DIAMOND" || account.tier === "MASTER" ? "indigo" : "gold"}>
      {label}
    </Badge>
  );
}
