export type LolRole = "top" | "jungle" | "mid" | "adc" | "support";
export type LolRegion = "global" | "na" | "euw" | "kr" | "lan" | "las";
export type LolTier = "all" | "emerald_plus" | "diamond_plus" | "master_plus";

export type BuildItem = {
  name: string;
  imageUrl: string;
};

export type BuildRune = {
  name: string;
  imageUrl: string;
  isKeystone: boolean;
};

export type Matchup = {
  championName: string;
  imageUrl: string;
  winRate: number;
};

export type ChampionBuild = {
  champion: string;
  role: LolRole;
  patch: string;
  winRate: number | null;
  pickRate: number | null;
  items: BuildItem[];
  starterItems: BuildItem[];
  runes: BuildRune[];
  counters: Matchup[];
  strongAgainst: Matchup[];
  source: string;
  cachedAt: number;
};

export type BuildApiResponse =
  | { ok: true; data: ChampionBuild }
  | { ok: false; error: string };
