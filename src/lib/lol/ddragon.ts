const VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";

type ItemData = { name: string; image: { full: string } };
type RuneData = { id: number; key: string; name: string; icon: string; slots: { runes: { id: number; key: string; name: string; icon: string }[] }[] };

let cachedVersion: string | null = null;
let itemsCache: Map<string, { name: string; imageUrl: string }> | null = null;
let runesCache: Map<number, { name: string; imageUrl: string; isKeystone: boolean }> | null = null;

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

export function championImageUrl(championId: string, version: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
}
