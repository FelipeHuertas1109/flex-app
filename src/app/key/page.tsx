import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyScreen } from "@/features/riot-key/components/key-screen";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Key | Flex App",
  description: "Gestiona la Riot API Key activa usada por Flex App para sincronizar cuentas.",
};

export default async function KeyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <KeyScreen />;
}
