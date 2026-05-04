import { createClient } from "@/lib/supabase/server";

export type PendingInviteInboxRow = {
  id: string;
  groupId: string;
  groupName: string;
  invitedAt: string;
};

type InviteQueryRow = {
  id: string;
  group_id: string;
  created_at: string;
  groups: { name: string } | { name: string }[] | null;
};

/** Invitaciones pendientes cuyo email coincide con el perfil (RLS); para la bandeja no-admin. */
export async function getPendingInvitesInbox(): Promise<PendingInviteInboxRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("group_invites")
    .select("id, group_id, created_at, groups(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("getPendingInvitesInbox:", error.message);
    return [];
  }

  return (data ?? []).map((row: InviteQueryRow) => {
    const g = row.groups;
    const nested = Array.isArray(g) ? g[0] : g;

    return {
      id: row.id,
      groupId: row.group_id,
      groupName: nested?.name ?? "Grupo",
      invitedAt: row.created_at ?? new Date().toISOString(),
    };
  });
}
