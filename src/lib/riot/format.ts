const INVISIBLE_RIOT_ID_CHARS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

export function cleanRiotIdPart(value: string) {
  return value.normalize("NFKC").replace(INVISIBLE_RIOT_ID_CHARS, "").trim();
}

export function riotAccountPath(gameName: string, tagLine: string) {
  return encodeURIComponent(`${cleanRiotIdPart(gameName)}-${cleanRiotIdPart(tagLine)}`);
}

export function parseRiotId(riotId: string | null | undefined) {
  if (!riotId) return null;

  const cleaned = cleanRiotIdPart(riotId);
  const separatorIndex = cleaned.lastIndexOf("#");
  if (separatorIndex <= 0 || separatorIndex === cleaned.length - 1) {
    return null;
  }

  return {
    gameName: cleaned.slice(0, separatorIndex),
    tagLine: cleaned.slice(separatorIndex + 1),
  };
}

export function leagueOfGraphsSummonerUrl(region: string, gameName: string, tagLine: string) {
  const slug = cleanRiotIdPart(region).toLowerCase() || cleanRiotIdPart(tagLine).toLowerCase() || "lan";
  return `https://www.leagueofgraphs.com/summoner/${slug}/${riotAccountPath(gameName, tagLine)}`;
}
