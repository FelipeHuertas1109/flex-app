export type RankTier =
  | "UNRANKED"
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "CHALLENGER";

export type LeagueAccount = {
  id: string;
  customName: string | null;
  summonerName: string;
  tagLine: string;
  region: string;
  /** Texto guardado (modal: etiqueta User). */
  accountUser: string | null;
  /** Texto guardado (modal: etiqueta Psw). */
  accountPsw: string | null;
  isMain: boolean;
  tier: RankTier;
  division: "I" | "II" | "III" | "IV" | null;
  lp: number;
  winRate: number;
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
  status: "pending" | "accepted" | "cancelled";
  invitedAt: string;
};

export type DashboardSnapshot = {
  group: {
    id: string;
    name: string;
    createdAt: string;
  };
  members: GroupMember[];
  invites: GroupInvite[];
  /** Admin de invitaciones (columna invite_admin en group_members); solo ese rol usa "Invitar miembro". */
  viewerInviteAdmin: boolean;
  /** Owner del grupo: puede renombrar el squad en el hero del dashboard. */
  viewerIsOwner: boolean;
  sync: {
    lastUpdatedAt: string;
    nextJobLabel: string;
  };
};
