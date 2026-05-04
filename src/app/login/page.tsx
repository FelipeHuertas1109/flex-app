import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth/components/login-screen";

export const metadata: Metadata = {
  title: "Iniciar sesion | Flex App",
  description: "Accede a Flex App con Google para gestionar tu grupo Flex.",
};

export default function LoginPage() {
  return <LoginScreen />;
}
