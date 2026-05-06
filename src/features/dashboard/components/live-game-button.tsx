import { cleanRiotIdPart, riotAccountPath } from "@/lib/riot/format";

type LiveGameButtonProps = {
  gameName: string;
  inGame: boolean;
  region: string;
  tagLine: string;
};

function regionSlug(region: string, tagLine: string) {
  const normalizedRegion = cleanRiotIdPart(region).toLowerCase();
  if (normalizedRegion) return normalizedRegion;
  return cleanRiotIdPart(tagLine).toLowerCase() || "lan";
}

export function LiveGameButton({ gameName, inGame, region, tagLine }: LiveGameButtonProps) {
  const account = riotAccountPath(gameName, tagLine);
  const slug = regionSlug(region, tagLine);
  const porofessorUrl = `https://porofessor.gg/live/${slug}/${account}`;

  if (!inGame) {
    return (
      <button
        className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg border border-emerald-300/18 bg-emerald-400/5 px-3 text-xs font-black text-emerald-100/35 opacity-60"
        disabled
        title="No esta en partida"
        type="button"
      >
        Jugando
      </button>
    );
  }

  return (
    <a
      className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-300/55 bg-emerald-400/16 px-3 text-xs font-black text-emerald-100 shadow-lg shadow-emerald-500/15 transition hover:border-emerald-200/80 hover:bg-emerald-400/24"
      href={porofessorUrl}
      rel="noopener noreferrer"
      target="_blank"
      title="Abrir partida en vivo"
    >
      Jugando
    </a>
  );
}
