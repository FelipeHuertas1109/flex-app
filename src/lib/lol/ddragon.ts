const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

type ItemData = { name: string; image: { full: string } };
type ChampionData = { id: string; key: string; name: string; image: { full: string } };
type RuneData = { id: number; key: string; name: string; icon: string; slots: { runes: { id: number; key: string; name: string; icon: string }[] }[] };
type SummonerSpellData = { id: string; key: string; name: string; image: { full: string } };

let cachedVersion: string | null = null;
let championsByKeyCache: Map<number, { id: string; name: string; imageUrl: string }> | null = null;
let itemsCache: Map<string, { name: string; imageUrl: string }> | null = null;
let runesCache: Map<number, { name: string; imageUrl: string; isKeystone: boolean }> | null = null;
let summonerSpellsCache: Map<number, { name: string; imageUrl: string }> | null = null;

export async function getLatestVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  const res = await fetch(VERSIONS_URL, { next: { revalidate: 86400 } });
  const versions: string[] = await res.json();
  cachedVersion = versions[0];
  return cachedVersion;
}

export async function getItemsMap(): Promise<Map<string, { name: string; imageUrl: string }>> {
  if (itemsCache) return itemsCache;
  const version = await getLatestVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`,
    { next: { revalidate: 86400 } },
  );
  const json = await res.json();
  itemsCache = new Map<string, { name: string; imageUrl: string }>();
  for (const [id, item] of Object.entries<ItemData>(json.data)) {
    itemsCache.set(id, {
      name: item.name,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`,
    });
  }
  return itemsCache;
}

export async function getChampionsByKeyMap(): Promise<Map<number, { id: string; name: string; imageUrl: string }>> {
  if (championsByKeyCache) return championsByKeyCache;
  const version = await getLatestVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    { next: { revalidate: 86400 } },
  );
  const json = await res.json();
  championsByKeyCache = new Map<number, { id: string; name: string; imageUrl: string }>();
  for (const champion of Object.values<ChampionData>(json.data)) {
    const key = Number(champion.key);
    if (!Number.isFinite(key)) continue;
    championsByKeyCache.set(key, {
      id: champion.id,
      name: champion.name,
      imageUrl: championImageUrl(champion.id, version),
    });
  }
  return championsByKeyCache;
}

export async function getRunesMap(): Promise<Map<number, { name: string; imageUrl: string; isKeystone: boolean }>> {
  if (runesCache) return runesCache;
  const version = await getLatestVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
    { next: { revalidate: 86400 } },
  );
  const trees: RuneData[] = await res.json();
  runesCache = new Map();
  for (const tree of trees) {
    for (let slotIdx = 0; slotIdx < tree.slots.length; slotIdx++) {
      for (const rune of tree.slots[slotIdx].runes) {
        runesCache.set(rune.id, {
          name: rune.name,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
          isKeystone: slotIdx === 0,
        });
      }
    }
  }
  return runesCache;
}

export async function getSummonerSpellsMap(): Promise<Map<number, { name: string; imageUrl: string }>> {
  if (summonerSpellsCache) return summonerSpellsCache;
  const version = await getLatestVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`,
    { next: { revalidate: 86400 } },
  );
  const json = await res.json();
  summonerSpellsCache = new Map<number, { name: string; imageUrl: string }>();
  for (const spell of Object.values<SummonerSpellData>(json.data)) {
    const key = Number(spell.key);
    if (!Number.isFinite(key)) continue;
    summonerSpellsCache.set(key, {
      name: spell.name,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}`,
    });
  }
  return summonerSpellsCache;
}

export function championImageUrl(championId: string, version: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
}
