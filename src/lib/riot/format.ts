const INVISIBLE_RIOT_ID_CHARS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

export function cleanRiotIdPart(value: string) {
  return value.normalize("NFKC").replace(INVISIBLE_RIOT_ID_CHARS, "").trim();
}

export function riotAccountPath(gameName: string, tagLine: string) {
  return encodeURIComponent(`${cleanRiotIdPart(gameName)}-${cleanRiotIdPart(tagLine)}`);
}
