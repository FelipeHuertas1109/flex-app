import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvitationsScreen } from "@/features/invites/components/invitations-screen";

export default async function InvitacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <InvitationsScreen />;
}
