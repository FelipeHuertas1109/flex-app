import { createClient } from "@/lib/supabase/server";
import { routingPlatformToRegionLabel } from "@/lib/riot/routing-platform";
import {
  DashboardSnapshot,
  GroupInvite,
  GroupMember,
  LeagueAccount,
  RankTier,
} from "../types";

type DashboardProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

type GroupMemberQueryRow = {
  role: string;
  joined_at: string;
  profiles: DashboardProfileRow | null;
};

type RiotAccountRow = {
  game_name: string;
  tag_line: string;
  tier: string | null;
  rank: string | null;
  lp: number | null;
  win_rate: string | number | null;
  total_games: number | null;
  solo_tier: string | null;
  solo_rank: string | null;
  solo_lp: number | null;
  solo_win_rate: string | number | null;
  solo_total_games: number | null;
  average_position: string | number | null;
  is_in_game: boolean | null;
  live_game_checked_at: string | null;
  last_synced_at: string | null;
  routing_platform?: string | null;
};

type GroupAccountQueryRow = {
  id: string;
  user_id: string;
  is_shared: boolean | null;
  custom_name: string | null;
  credential_user: string | null;
  credential_psw: string | null;
  riot_accounts: RiotAccountRow;
};

const RANK_TIERS = new Set<string>([
  "UNRANKED",
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
]);

function toRankTier(value: string | null | undefined): RankTier {
  const t = (value ?? "").toUpperCase();
  return RANK_TIERS.has(t) ? (t as RankTier) : "UNRANKED";
}

function normalizeDivision(rank: string | null | undefined): LeagueAccount["flex"]["division"] {
  const r = rank?.trim().toUpperCase();
  if (r === "I" || r === "II" || r === "III" || r === "IV") return r;
  return null;
}

function numericOrZero(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function toMemberRole(role: string): GroupMember["role"] {
  if (role === "owner" || role === "captain" || role === "member") return role;
  return "member";
}

export async function getDashboardSnapshot(viewerId?: string): Promise<DashboardSnapshot | null> {
  const supabase = await createClient();
  let userId = viewerId;

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return null;

  const { data: memberRecord } = await supabase
    .from("group_members")
    .select("group_id, invite_admin, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    return null;
  }

  const groupId = memberRecord.group_id;
  const [groupResult, membersResult, accountsResult, invitesResult] = await Promise.all([
    supabase.from("groups").select("id, name, created_at").eq("id", groupId).single(),
    supabase.from("group_members").select("role, joined_at, profiles(id, email, full_name, avatar_url)").eq("group_id", groupId),
    supabase
      .from("group_accounts")
      .select(
        "id, user_id, is_shared, custom_name, credential_user, credential_psw, riot_accounts(game_name, tag_line, tier, rank, lp, win_rate, total_games, solo_tier, solo_rank, solo_lp, solo_win_rate, solo_total_games, average_position, is_in_game, live_game_checked_at, last_synced_at, routing_platform)",
      )
      .eq("group_id", groupId),
    supabase
      .from("group_invites")
      .select("id, email, status, created_at")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const group = groupResult.data;

  if (!group) return null;

  const memberRowsRaw = (membersResult.data ?? []) as unknown as GroupMemberQueryRow[];
  const memberRows = memberRowsRaw.filter((m): m is GroupMemberQueryRow & { profiles: DashboardProfileRow } =>
    Boolean(m.profiles?.id),
  );
  const accountRows = (accountsResult.data ?? []) as unknown as GroupAccountQueryRow[];

  const toLeagueAccount = (acc: GroupAccountQueryRow): LeagueAccount | null => {
    const riotRaw = acc.riot_accounts as RiotAccountRow | RiotAccountRow[] | null | undefined;
    const riot = Array.isArray(riotRaw) ? riotRaw[0] : riotRaw;
    if (!riot?.game_name) {
      return null;
    }

    return {
      id: acc.id,
      customName: acc.custom_name || null,
      isShared: Boolean(acc.is_shared),
      summonerName: riot.game_name,
      tagLine: riot.tag_line,
      region: routingPlatformToRegionLabel(riot.routing_platform) || "Sin region",
      accountUser: acc.credential_user ?? null,
      accountPsw: acc.credential_psw ?? null,
      isInGame: Boolean(riot.is_in_game),
      lastLiveGameCheckedAt: riot.live_game_checked_at ?? null,
      lastStatsSyncedAt: riot.last_synced_at ?? null,
      isMain: acc.custom_name?.toLowerCase() === "main",
      routingPlatform: riot.routing_platform ?? null,
      flex: {
        tier: toRankTier(riot.tier || undefined),
        division: normalizeDivision(riot.rank),
        lp: riot.lp ?? 0,
        winRate: numericOrZero(riot.win_rate),
        totalGames: riot.total_games ?? 0,
      },
      soloDuo: {
        tier: toRankTier(riot.solo_tier || undefined),
        division: normalizeDivision(riot.solo_rank),
        lp: riot.solo_lp ?? 0,
        winRate: numericOrZero(riot.solo_win_rate),
        totalGames: riot.solo_total_games ?? 0,
      },
      leagueOfGraphsStatus: riot.last_synced_at ? "synced" : "pending",
    };
  };

  const members: GroupMember[] = memberRows.map((m) => {
    const memberAccountsData = accountRows.filter((acc) => !acc.is_shared && acc.user_id === m.profiles.id);
    const accounts = memberAccountsData.flatMap((acc) => {
      const account = toLeagueAccount(acc);
      return account ? [account] : [];
    });

    return {
      id: m.profiles.id,
      name: m.profiles.full_name || "Usuario Desconocido",
      email: m.profiles.email,
      avatarUrl: m.profiles.avatar_url ?? null,
      role: toMemberRole(m.role),
      accounts,
    };
  });

  const sharedAccounts = accountRows.flatMap((acc) => {
    if (!acc.is_shared) return [];
    const account = toLeagueAccount(acc);
    return account ? [account] : [];
  });

  const invites: GroupInvite[] = (invitesResult.data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    status: row.status === "accepted" ? "accepted" : "pending",
    invitedAt: row.created_at ?? new Date().toISOString(),
  }));

  return {
    viewerId: userId,
    group: {
      id: group.id,
      name: group.name,
      createdAt: group.created_at,
    },
    members,
    sharedAccounts,
    invites,
    viewerInviteAdmin: Boolean(memberRecord.invite_admin),
    viewerIsOwner: memberRecord.role === "owner",
    viewerCanManageMembers: memberRecord.role === "owner" || Boolean(memberRecord.invite_admin),
  };
}
