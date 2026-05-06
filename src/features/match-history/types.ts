export type MatchHistoryAccount = {
  id: string;
  label: string;
  ownerLabel: string;
  region: string;
  routingPlatform: string | null;
};

export type MatchHistoryItem = {
  id: string;
  championImageUrl: string | null;
  championName: string;
  creepScore: number;
  creepScorePerMinute: string;
  damageDealtToChampions: number;
  damageTaken: number;
  dateLabel: string;
  duration: string;
  gameMode: string;
  goldEarned: number;
  items: {
    id: number;
    imageUrl: string | null;
    name: string;
  }[];
  kda: string;
  killParticipation: number;
  kills: number;
  deaths: number;
  assists: number;
  lane: string;
  lpChange: number | null;
  largestMultiKill: string | null;
  matchId: string;
  queue: string;
  result: "Victoria" | "Derrota";
  summonerSpells: {
    id: number;
    imageUrl: string | null;
    name: string;
  }[];
  visionScore: number;
  wardsKilled: number;
  wardsPlaced: number;
  teams: MatchHistoryTeam[];
};

export type MatchHistoryParticipant = {
  assists: number;
  championImageUrl: string | null;
  championName: string;
  creepScore: number;
  damageDealtToChampions: number;
  deaths: number;
  goldEarned: number;
  items: {
    id: number;
    imageUrl: string | null;
    name: string;
  }[];
  kda: string;
  kills: number;
  lane: string;
  opLabel: "ACE" | "MVP" | null;
  opScore: number;
  participantId: number;
  puuid: string;
  riotId: string;
  selected: boolean;
  summonerSpells: {
    id: number;
    imageUrl: string | null;
    name: string;
  }[];
  visionScore: number;
};

export type MatchHistoryTeam = {
  id: number;
  label: string;
  participants: MatchHistoryParticipant[];
  result: "Victoria" | "Derrota";
};

export type MatchHistoryResult =
  | {
      account: MatchHistoryAccount;
      error: null;
      matches: MatchHistoryItem[];
      updatedAt: string;
    }
  | {
      error: string;
    };
