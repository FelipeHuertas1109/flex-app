export type RankTier =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER";

export type LeagueAccount = {
  id: string;
  summonerName: string;
  tagLine: string;
  region: string;
  isMain: boolean;
  tier: RankTier;
  division: "I" | "II" | "III" | "IV" | null;
  lp: number;
  winRate: number;
  averagePosition: number;
  leagueOfGraphsStatus: "synced" | "pending" | "stale";
};

export type GroupMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "captain" | "member";
  accounts: LeagueAccount[];
};

export type GroupInvite = {
  id: string;
  email: string;
  status: "pending" | "accepted";
};

export type DashboardSnapshot = {
  group: {
    id: string;
    name: string;
    createdAt: string;
  };
  members: GroupMember[];
  invites: GroupInvite[];
  sync: {
    lastUpdatedAt: string;
    nextJobLabel: string;
  };
};
