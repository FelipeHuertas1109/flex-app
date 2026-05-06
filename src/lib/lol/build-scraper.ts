import * as cheerio from "cheerio";
import type { ChampionBuild, BuildItem, BuildRune, LolRole, Matchup } from "@/lib/lol/types";
import { getLatestVersion } from "@/lib/lol/ddragon";

const OPGG_BASE = "https://www.op.gg";
const OPGG_CDN  = "https://opgg-static.akamaized.net";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  Referer: "https://www.op.gg/",
};

// ── Cache ────────────────────────────────────────────────────────────────────
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, ChampionBuild>();

function cacheKey(champion: string, role: LolRole) {
  return `${champion.toLowerCase()}:${role}`;
}
function isFresh(b: ChampionBuild) {
  return Date.now() - b.cachedAt < TTL_MS;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** DDragon id (e.g. "AurelionSol") → op.gg slug ("aurelionsol") */
function toOpggSlug(championId: string): string {
  return championId.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** LolRole → op.gg position string */
function toOpggRole(role: LolRole): string {
  return role === "adc" ? "bottom" : role;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

function extractFirstPercent(text: string): number | null {
  const m = text.match(/(\d{1,2}(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) : null;
}

// ── Build + runes ─────────────────────────────────────────────────────────────

async function scrapeBuildPage(
  championId: string,
  role: LolRole,
): Promise<{
  items: BuildItem[];
  starterItems: BuildItem[];
  runes: BuildRune[];
  winRate: number | null;
  pickRate: number | null;
}> {
  const slug     = toOpggSlug(championId);
  const position = toOpggRole(role);
  const url = `${OPGG_BASE}/champions/${slug}/build?region=global&type=ranked&tier=emerald_plus&position=${position}`;

  const html = await fetchHtml(url);
  if (!html) return { items: [], starterItems: [], runes: [], winRate: null, pickRate: null };

  const $ = cheerio.load(html);
  const bodyText = $.text();

  // ── Win rate / pick rate via regex on full page text ──────────────────────
  let winRate: number | null = null;
  let pickRate: number | null = null;

  const wrMatch = bodyText.match(/Win\s*rate\D{0,10}?(\d{1,2}(?:\.\d+)?)%/i);
  if (wrMatch) winRate = parseFloat(wrMatch[1]);

  const prMatch = bodyText.match(/Pick\s*rate\D{0,10}?(\d{1,2}(?:\.\d+)?)%/i);
  if (prMatch) pickRate = parseFloat(prMatch[1]);

  // Fallback: any % in [40,70] range
  if (!winRate) {
    const all = [...bodyText.matchAll(/(\d{1,2}\.\d+)%/g)];
    for (const m of all) {
      const v = parseFloat(m[1]);
      if (v >= 45 && v <= 60) { winRate = v; break; }
    }
  }

  // ── Items ─────────────────────────────────────────────────────────────────
  // op.gg serves item images from their CDN with path /item/{id}.png
  const allItems: BuildItem[] = [];
  const seenItems = new Set<string>();

  $(`img[src*="${OPGG_CDN}"][src*="/item/"]`).each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const alt = $(el).attr("alt") ?? "";
    if (!src || seenItems.has(src)) return;
    seenItems.add(src);
    allItems.push({ name: alt || "Item", imageUrl: src });
  });

  // Fallback: any image with /item/ in src
  if (allItems.length === 0) {
    $('img[src*="/item/"]').each((_, el) => {
      const src = $(el).attr("src") ?? "";
      const alt = $(el).attr("alt") ?? "";
      if (!src || seenItems.has(src)) return;
      seenItems.add(src);
      allItems.push({ name: alt || "Item", imageUrl: src });
    });
  }

  // Starter items: Doran items, Long Sword, Amplifying Tome, Health Potion
  const STARTER_NAMES = ["doran", "long sword", "amplifying", "health potion", "refillable", "corrupting"];
  const starterItems: BuildItem[] = [];
  const coreItems: BuildItem[] = [];

  for (const item of allItems) {
    if (STARTER_NAMES.some((s) => item.name.toLowerCase().includes(s))) {
      starterItems.push(item);
    } else {
      coreItems.push(item);
    }
  }

  // ── Runes ─────────────────────────────────────────────────────────────────
  const runes: BuildRune[] = [];
  const seenRunes = new Set<string>();

  $(`img[src*="${OPGG_CDN}"][src*="/perk/"]`).each((i, el) => {
    const src = $(el).attr("src") ?? "";
    const alt = $(el).attr("alt") ?? "";
    if (!src || seenRunes.has(src)) return;
    seenRunes.add(src);
    runes.push({ name: alt || `Runa ${i + 1}`, imageUrl: src, isKeystone: runes.length === 0 });
  });

  // Fallback
  if (runes.length === 0) {
    $('img[src*="/perk/"]').each((i, el) => {
      const src = $(el).attr("src") ?? "";
      const alt = $(el).attr("alt") ?? "";
      if (!src || seenRunes.has(src)) return;
      seenRunes.add(src);
      runes.push({ name: alt || `Runa ${i + 1}`, imageUrl: src, isKeystone: runes.length === 0 });
    });
  }

  return {
    items: coreItems.slice(0, 6),
    starterItems: starterItems.slice(0, 3),
    runes: runes.slice(0, 9),
    winRate,
    pickRate,
  };
}

// ── Counters ──────────────────────────────────────────────────────────────────

async function scrapeCountersPage(
  championId: string,
  role: LolRole,
  version: string,
): Promise<{ counters: Matchup[]; strongAgainst: Matchup[] }> {
  const slug     = toOpggSlug(championId);
  const position = toOpggRole(role);
  const url = `${OPGG_BASE}/champions/${slug}/counters/${position}?region=global&type=ranked&tier=emerald_plus`;

  const html = await fetchHtml(url);
  if (!html) return { counters: [], strongAgainst: [] };

  const $ = cheerio.load(html);
  const all: Matchup[] = [];

  // op.gg counter links: /lol/champions/{champ}/counters/{role}?...&target_champion={champSlug}
  $('a[href*="target_champion="]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const champMatch = href.match(/target_champion=([a-z0-9]+)/i);
    if (!champMatch) return;

    const champSlug = champMatch[1]; // e.g. "fiora"
    const champName = champSlug.charAt(0).toUpperCase() + champSlug.slice(1);

    const img = $(el).find("img").first();
    const imgSrc = img.attr("src") ?? `${OPGG_CDN}/meta/images/lol/${version}/champion/${champName}.png`;

    const text = $(el).text();
    const wrMatch = text.match(/(\d{1,2}(?:\.\d+)?)%/);
    const wr = wrMatch ? parseFloat(wrMatch[1]) : 50;

    all.push({ championName: champName, imageUrl: imgSrc, winRate: wr });
  });

  // Fallback: champion images on counters page with win rates
  if (all.length === 0) {
    $(`img[src*="${OPGG_CDN}"][src*="/champion/"]`).each((_, el) => {
      const src = $(el).attr("src") ?? "";
      const alt = $(el).attr("alt") ?? "";
      const champNameMatch = src.match(/\/champion\/([^.?/]+)/);
      if (!champNameMatch || !alt) return;
      const row = $(el).closest("tr, li, [class*='row'], a").text();
      const wr = extractFirstPercent(row) ?? 50;
      all.push({ championName: alt, imageUrl: src, winRate: wr });
    });
  }

  // Sort: low WR = counters (we lose), high WR = good matchups (we win)
  const unique = Array.from(new Map(all.map((m) => [m.championName, m])).values());
  const counters     = unique.filter((m) => m.winRate < 49).slice(0, 5);
  const strongAgainst = unique.filter((m) => m.winRate > 51).slice(0, 5);

  return { counters, strongAgainst };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getChampionBuild(
  championId: string,
  role: LolRole,
): Promise<ChampionBuild | null> {
  const key    = cacheKey(championId, role);
  const cached = cache.get(key);
  if (cached && isFresh(cached)) return cached;

  const version = await getLatestVersion();

  const [buildData, matchups] = await Promise.all([
    scrapeBuildPage(championId, role),
    scrapeCountersPage(championId, role, version),
  ]);

  if (
    buildData.items.length === 0 &&
    buildData.runes.length === 0 &&
    buildData.winRate === null
  ) {
    return null;
  }

  const result: ChampionBuild = {
    champion: championId,
    role,
    patch: version,
    winRate: buildData.winRate,
    pickRate: buildData.pickRate,
    items: buildData.items,
    starterItems: buildData.starterItems,
    runes: buildData.runes,
    counters: matchups.counters,
    strongAgainst: matchups.strongAgainst,
    source: "op.gg",
    cachedAt: Date.now(),
  };

  cache.set(key, result);
  return result;
}
