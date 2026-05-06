import type { Metadata } from "next";
import { MatchHistoryScreen } from "@/features/match-history/components/match-history-screen";

export const metadata: Metadata = {
  title: "Historial | Flex App",
};

export default function HistorialPage() {
  return <MatchHistoryScreen />;
}
