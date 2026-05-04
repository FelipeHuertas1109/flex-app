import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/features/auth/components/login-screen";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Iniciar sesion | Flex App",
  description: "Accede a Flex App con Google para gestionar tu grupo Flex.",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return <LoginScreen />;
}
