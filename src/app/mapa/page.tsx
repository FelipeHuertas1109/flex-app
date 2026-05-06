import type { Metadata } from "next";
import { TeamBuilderScreen } from "@/features/teambuilder/components/teambuilder-screen";

export const metadata: Metadata = {
  title: "Team Builder | Flex App",
};

export default function MapaPage() {
  return <TeamBuilderScreen />;
}
