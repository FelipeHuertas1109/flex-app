import { CacheService } from "@/lib/redis/cache";

const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

type ItemData = { name: string; image: { full: string } };
type ChampionData = { id: string; key: string; name: string; image: { full: string } };
type RuneData = { id: number; key: string; name: string; icon: string; slots: { runes: { id: number; key: string; name: string; icon: string }[] }[] };
type SummonerSpellData = { id: string; key: string; name: string; image: { full: string } };

const CACHE_TTL = 86400; // 24 hours in seconds

export async function getLatestVersion(): Promise<string> {
  return CacheService.getOrSet("ddragon:version", CACHE_TTL, async () => {
    const res = await fetch(VERSIONS_URL, { next: { revalidate: CACHE_TTL } });
    const versions: string[] = await res.json();
    return versions[0];
  });
}

export async function getItemsMap(): Promise<Map<string, { name: string; imageUrl: string }>> {
  const obj = await CacheService.getOrSet("ddragon:items", CACHE_TTL, async () => {
    const version = await getLatestVersion();
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
      { next: { revalidate: CACHE_TTL } },
    );
    const json = await res.json();
    const itemsMap: Record<string, { name: string; imageUrl: string }> = {};
    for (const [id, item] of Object.entries<ItemData>(json.data)) {
      itemsMap[id] = {
        name: item.name,
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`,
      };
    }
    return itemsMap;
  });
  return new Map(Object.entries(obj));
}

export async function getChampionsByKeyMap(): Promise<Map<number, { id: string; name: string; imageUrl: string }>> {
  const obj = await CacheService.getOrSet("ddragon:champions", CACHE_TTL, async () => {
    const version = await getLatestVersion();
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
      { next: { revalidate: CACHE_TTL } },
    );
    const json = await res.json();
    const championsMap: Record<string, { id: string; name: string; imageUrl: string }> = {};
    for (const champion of Object.values<ChampionData>(json.data)) {
      const key = Number(champion.key);
      if (!Number.isFinite(key)) continue;
      championsMap[key] = {
        id: champion.id,
        name: champion.name,
        imageUrl: championImageUrl(champion.id, version),
      };
    }
    return championsMap;
  });

  const map = new Map<number, { id: string; name: string; imageUrl: string }>();
  for (const [k, v] of Object.entries(obj)) {
    map.set(Number(k), v as { id: string; name: string; imageUrl: string });
  }
  return map;
}

export async function getRunesMap(): Promise<Map<number, { name: string; imageUrl: string; isKeystone: boolean }>> {
  const obj = await CacheService.getOrSet("ddragon:runes", CACHE_TTL, async () => {
    const version = await getLatestVersion();
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
      { next: { revalidate: CACHE_TTL } },
    );
    const trees: RuneData[] = await res.json();
    const runesMap: Record<string, { name: string; imageUrl: string; isKeystone: boolean }> = {};
    for (const tree of trees) {
      for (let slotIdx = 0; slotIdx < tree.slots.length; slotIdx++) {
        for (const rune of tree.slots[slotIdx].runes) {
          runesMap[rune.id] = {
            name: rune.name,
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
            isKeystone: slotIdx === 0,
          };
        }
      }
    }
    return runesMap;
  });

  const map = new Map<number, { name: string; imageUrl: string; isKeystone: boolean }>();
  for (const [k, v] of Object.entries(obj)) {
    map.set(Number(k), v as { name: string; imageUrl: string; isKeystone: boolean });
  }
  return map;
}

export async function getSummonerSpellsMap(): Promise<Map<number, { name: string; imageUrl: string }>> {
  const obj = await CacheService.getOrSet("ddragon:spells", CACHE_TTL, async () => {
    const version = await getLatestVersion();
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`,
      { next: { revalidate: CACHE_TTL } },
    );
    const json = await res.json();
    const spellsMap: Record<string, { name: string; imageUrl: string }> = {};
    for (const spell of Object.values<SummonerSpellData>(json.data)) {
      const key = Number(spell.key);
      if (!Number.isFinite(key)) continue;
      spellsMap[key] = {
        name: spell.name,
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}`,
      };
    }
    return spellsMap;
  });

  const map = new Map<number, { name: string; imageUrl: string }>();
  for (const [k, v] of Object.entries(obj)) {
    map.set(Number(k), v as { name: string; imageUrl: string });
  }
  return map;
}

export function championImageUrl(championId: string, version: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
}
