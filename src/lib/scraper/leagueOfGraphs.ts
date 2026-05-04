import * as cheerio from "cheerio";

interface AccountStats {
  gameName: string;
  tagLine: string;
  tier: string | null;
  rank: string | null;
  lp: number | null;
  winRate: number | null;
}

interface MatchStats {
  matchId: string;
  kills: number;
  deaths: number;
  assists: number;
  // TODO: Add more specific fields as we extract them
}

const REGION = "las"; // O parametrizable
const BASE_URL = "https://www.leagueofgraphs.com/summoner";

/**
 * Obtiene las estadisticas base de una cuenta
 * Usa el standard 'gameName-tagLine'
 */
export async function scrapeAccountStats(
  gameName: string,
  tagLine: string,
  region: string = REGION
): Promise<AccountStats | null> {
  try {
    const url = `${BASE_URL}/${region}/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
    
    // Logica anti-bot basica: headers simulando navegador standard
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      next: { revalidate: 3600 }, // Opcion de Next.js para cachear temporalmente y no saturar
    });

    if (!response.ok) {
      console.error(`Failed to fetch profile: ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let tier: string | null = null;
    let rank: string | null = null;
    let lp: number | null = null;
    let winRate: number | null = null;

    // Buscar todos los bloques de las colas rankeadas
    $(".pie-chart-container").each((_, element) => {
      const parent = $(element).closest(".box");
      const title = parent.find(".box-title").text().toLowerCase();

      // Buscar el contenedor específico de Flex
      if (title.includes("flex")) {
        const fullRank = parent.find(".leagueTier").text().trim(); // Ej: "Diamond II" o "Unranked"
        if (fullRank && !fullRank.toLowerCase().includes("unranked")) {
          const parts = fullRank.split(" ");
          tier = parts[0]?.toUpperCase() || null; // DIAMOND
          rank = parts[1] || null; // II
        }

        const lpText = parent.find(".league-points").text().replace(/[^0-9]/g, "");
        if (lpText) {
          lp = parseInt(lpText, 10);
        }

        const winRateText = parent.find(".pie-chart-title").text().replace(/[^0-9]/g, ""); // A veces el WR está en el centro del pie chart
        if (winRateText) {
          winRate = parseInt(winRateText, 10);
        }
      }
    });

    // Fallback: Si no hay wr en el pie chart, buscar en el texto de victorias/derrotas
    if (winRate === null) {
       // logic can vary, let's leave it simple
    }
    
    return {
      gameName,
      tagLine,
      tier,
      rank,
      lp,
      winRate
    };
  } catch (error) {
    console.error("Scraping error:", error);
    return null;
  }
}

/**
 * Historial reciente (placeholder) para metricas de rendimiento.
 */
export async function scrapeMatchHistory(): Promise<MatchStats[]> {
  // Misma logica pero yendo al tab de partidas o iterando divs
  return [];
}
