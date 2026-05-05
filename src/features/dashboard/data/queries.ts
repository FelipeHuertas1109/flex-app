import { createClient } from "@/lib/supabase/server";
import { inferRegionFromTagLine, routingPlatformToRegionLabel } from "@/lib/riot/routing-platform";
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
  average_position: string | number | null;
  last_synced_at: string | null;
  routing_platform?: string | null;
};

type GroupAccountQueryRow = {
  id: string;
  user_id: string;
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

function normalizeDivision(rank: string | null | undefined): LeagueAccount["division"] {
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

export async function getDashboardSnapshot(): Promise<DashboardSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberRecord } = await supabase
    .from("group_members")
    .select("group_id, invite_admin, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!memberRecord) {
    return null;
  }

  const { data: group } = await supabase.from("groups").select("*").eq("id", memberRecord.group_id).single();

  if (!group) return null;

  const { data: membersData } = await supabase
    .from("group_members")
    .select("role, joined_at, profiles(id, email, full_name)")
    .eq("group_id", group.id);

  const { data: accountsData } = await supabase
    .from("group_accounts")
    .select("id, user_id, custom_name, credential_user, credential_psw, riot_accounts(*)")
    .eq("group_id", group.id);

  const { data: invitesData } = await supabase
    .from("group_invites")
    .select("id, email, status, created_at")
    .eq("group_id", group.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const memberRowsRaw = (membersData ?? []) as unknown as GroupMemberQueryRow[];
  const memberRows = memberRowsRaw.filter((m): m is GroupMemberQueryRow & { profiles: DashboardProfileRow } =>
    Boolean(m.profiles?.id),
  );
  const accountRows = (accountsData ?? []) as unknown as GroupAccountQueryRow[];

  const members: GroupMember[] = memberRows.map((m) => {
    const memberAccountsData = accountRows.filter((acc) => acc.user_id === m.profiles.id);

    const accounts: LeagueAccount[] = memberAccountsData.flatMap((acc) => {
      const riotRaw = acc.riot_accounts as RiotAccountRow | RiotAccountRow[] | null | undefined;
      const riot = Array.isArray(riotRaw) ? riotRaw[0] : riotRaw;
      if (!riot?.game_name) {
        return [];
      }

      const fromPlatform = routingPlatformToRegionLabel(riot.routing_platform);
      const fromTag = inferRegionFromTagLine(riot.tag_line ?? "");
      return [
        {
          id: acc.id,
          customName: acc.custom_name || null,
          summonerName: riot.game_name,
          tagLine: riot.tag_line,
          region: fromPlatform || fromTag,
          accountUser: acc.credential_user ?? null,
          accountPsw: acc.credential_psw ?? null,
          isMain: acc.custom_name?.toLowerCase() === "main",
          tier: toRankTier(riot.tier || undefined),
          division: normalizeDivision(riot.rank),
          lp: riot.lp ?? 0,
          winRate: numericOrZero(riot.win_rate),
          leagueOfGraphsStatus: riot.last_synced_at ? "synced" : "pending",
        },
      ];
    });

    return {
      id: m.profiles.id,
      name: m.profiles.full_name || "Usuario Desconocido",
      email: m.profiles.email,
      role: toMemberRole(m.role),
      accounts,
    };
  });

  const invites: GroupInvite[] = (invitesData ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    status: row.status === "accepted" ? "accepted" : "pending",
    invitedAt: row.created_at ?? new Date().toISOString(),
  }));

  return {
    viewerId: user.id,
    group: {
      id: group.id,
      name: group.name,
      createdAt: group.created_at,
    },
    members,
    invites,
    viewerInviteAdmin: Boolean(memberRecord.invite_admin),
    viewerIsOwner: memberRecord.role === "owner",
    viewerCanManageMembers: memberRecord.role === "owner" || Boolean(memberRecord.invite_admin),
  };
}
