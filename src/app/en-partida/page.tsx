import type { Metadata } from "next";
import { LiveGameScreen } from "@/features/live-game/components/live-game-screen";

export const metadata: Metadata = {
  title: "En partida | Flex App",
};

export default function EnPartidaPage() {
  return <LiveGameScreen />;
}
