import { NextRequest, NextResponse } from "next/server";
import { getChampionBuild } from "@/lib/lol/build-scraper";
import type { LolRole } from "@/lib/lol/types";

const VALID_ROLES: LolRole[] = ["top", "jungle", "mid", "adc", "support"];

function isValidRole(r: string): r is LolRole {
  return VALID_ROLES.includes(r as LolRole);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ championName: string }> },
) {
  const { championName } = await params;

  if (!championName || !/^[a-zA-Z0-9' ]+$/.test(championName)) {
    return NextResponse.json({ ok: false, error: "Nombre de campeón inválido." }, { status: 400 });
  }

  const roleParam = req.nextUrl.searchParams.get("role") ?? "mid";
  const role: LolRole = isValidRole(roleParam) ? roleParam : "mid";

  const data = await getChampionBuild(championName, role);

  if (!data) {
    return NextResponse.json(
      { ok: false, error: `No se encontraron datos para ${championName} en el rol ${role}. La fuente puede estar temporalmente inaccesible.` },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, data }, { status: 200, headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } });
}
