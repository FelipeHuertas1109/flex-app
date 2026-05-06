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
  isShared: boolean;
  summonerName: string;
  tagLine: string;
  region: string;
  /** Texto guardado (modal: etiqueta User). */
  accountUser: string | null;
  /** Texto guardado (modal: etiqueta Psw). */
  accountPsw: string | null;
  isInGame: boolean;
  isMain: boolean;
  routingPlatform: string | null;
  flex: {
    tier: RankTier;
    division: "I" | "II" | "III" | "IV" | null;
    lp: number;
    winRate: number;
    totalGames: number;
  };
  soloDuo: {
    tier: RankTier;
    division: "I" | "II" | "III" | "IV" | null;
    lp: number;
    winRate: number;
    totalGames: number;
  };
  leagueOfGraphsStatus: "synced" | "pending" | "stale";
};

export type LeaderboardSort = "rank" | "games" | "win-rate";

export type LeaderboardSortDirection = "asc" | "desc";

export type GroupMember = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
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
  viewerId: string;
  group: {
    id: string;
    name: string;
    createdAt: string;
  };
  members: GroupMember[];
  sharedAccounts: LeagueAccount[];
  invites: GroupInvite[];
  /** Admin de invitaciones (columna invite_admin en group_members); solo ese rol usa "Invitar miembro". */
  viewerInviteAdmin: boolean;
  /** Owner del grupo: puede renombrar el squad en el hero del dashboard. */
  viewerIsOwner: boolean;
  /** Admin operativo del grupo: puede invitar y eliminar miembros no propietarios. */
  viewerCanManageMembers: boolean;
};
