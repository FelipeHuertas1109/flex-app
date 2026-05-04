const PLATFORM_TO_REGION_LABEL: Record<string, string> = {
  la1: "LAN",
  la2: "LAS",
  br1: "BR",
  na1: "NA",
  euw1: "EUW",
  eun1: "EUNE",
  kr: "KR",
  jp1: "JP",
  oc1: "OCE",
  tr1: "TR",
  ru: "RU",
};

export function routingPlatformToRegionLabel(platform: string | null | undefined): string {
  if (!platform) return "";
  const normalized = platform.trim().toLowerCase();
  return PLATFORM_TO_REGION_LABEL[normalized] ?? platform.toUpperCase();
}

/** Si el tag coincide con region LoL (LAN, LAS, etc.), mostrarlo como fallback. */
export function inferRegionFromTagLine(tagLine: string): string {
  const t = tagLine.trim().toUpperCase();
  const byTag: Record<string, string> = {
    LAS: "LAS",
    LAN: "LAN",
    BR: "BR",
    NA: "NA",
    EUW: "EUW",
    EUNE: "EUNE",
    KR: "KR",
    JP: "JP",
    OCE: "OCE",
    TR: "TR",
    RU: "RU",
  };
  return byTag[t] ?? "";
}
