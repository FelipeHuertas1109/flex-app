import type { User } from "@supabase/supabase-js";

export type ShellUser = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

export function mapUserToShellUser(user: User | null): ShellUser | null {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    (user.email ? user.email.split("@")[0] : "Usuario");
  const avatar =
    (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta?.picture === "string" && meta.picture) ||
    null;
  return {
    displayName: name,
    email: user.email ?? "",
    avatarUrl: avatar,
  };
}
