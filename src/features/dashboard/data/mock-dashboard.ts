import type { DashboardSnapshot } from "@/features/dashboard/types";

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  await new Promise((resolve) => setTimeout(resolve, 360));

  return {
    group: {
      id: "grupo-aurora",
      name: "Aurora Flex Club",
      createdAt: "2026-05-01",
    },
    members: [
      {
        id: "member-1",
        name: "Santi",
        email: "santi@example.com",
        role: "owner",
        accounts: [
          {
            id: "acc-1",
            summonerName: "SolarWave",
            tagLine: "LAN",
            region: "LAN",
            isMain: true,
            tier: "DIAMOND",
            division: "III",
            lp: 62,
            winRate: 57,
            averagePosition: 8.4,
            leagueOfGraphsStatus: "synced",
          },
        ],
      },
      {
        id: "member-2",
        name: "Majo",
        email: "majo@example.com",
        role: "captain",
        accounts: [
          {
            id: "acc-2",
            summonerName: "OrbitKit",
            tagLine: "LAN",
            region: "LAN",
            isMain: true,
            tier: "EMERALD",
            division: "I",
            lp: 31,
            winRate: 54,
            averagePosition: 7.8,
            leagueOfGraphsStatus: "synced",
          },
          {
            id: "acc-3",
            summonerName: "OrbitMini",
            tagLine: "LAS",
            region: "LAS",
            isMain: false,
            tier: "PLATINUM",
            division: "II",
            lp: 18,
            winRate: 51,
            averagePosition: 6.9,
            leagueOfGraphsStatus: "pending",
          },
        ],
      },
      {
        id: "member-3",
        name: "Nico",
        email: "nico@example.com",
        role: "member",
        accounts: [
          {
            id: "acc-4",
            summonerName: "NorthReset",
            tagLine: "LAN",
            region: "LAN",
            isMain: true,
            tier: "GOLD",
            division: "I",
            lp: 74,
            winRate: 49,
            averagePosition: 6.3,
            leagueOfGraphsStatus: "stale",
          },
        ],
      },
    ],
    invites: [
      {
        id: "invite-1",
        email: "duo.mid@example.com",
        status: "pending",
      },
      {
        id: "invite-2",
        email: "jungla@example.com",
        status: "pending",
      },
    ],
    sync: {
      lastUpdatedAt: "2026-05-03T18:35:00-05:00",
      nextJobLabel: "Cron futuro cada 6 horas",
    },
  };
}
