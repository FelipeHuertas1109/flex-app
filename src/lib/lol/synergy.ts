import type { LolRole } from "@/lib/lol/types";

export type ChampionArchetype =
  | "engage" | "wombo" | "poke" | "scaling" | "assassin"
  | "split" | "protect" | "tank" | "bruiser" | "mage" | "marksman" | "utility";

export type CompositionType =
  | "Engage" | "Poke" | "Scaling" | "Split Push" | "Wombo Combo" | "Mixta";

export type PairSynergy = {
  roleA: LolRole;
  roleB: LolRole;
  champA: string;
  champB: string;
  score: number;
  weight: number;
};

export type SynergyResult = {
  score: number;
  grade: "S" | "A" | "B" | "C" | "D";
  compositionType: CompositionType;
  compositionDescription: string;
  topPairs: PairSynergy[];
  worstPairs: PairSynergy[];
  issues: string[];
  strengths: string[];
};

export type TeamEntry = {
  role: LolRole;
  championId: string;
  championName: string;
  tags: string[];
};

// ── Champion → archetype (DDragon IDs) ───────────────────────────────────────
const ARCHETYPES: Record<string, ChampionArchetype> = {
  // Engage
  Leona: "engage", Nautilus: "engage", Malphite: "engage",
  Amumu: "engage", JarvanIV: "engage", Vi: "engage",
  Alistar: "engage", Blitzcrank: "engage", Ornn: "engage",
  Sejuani: "engage", Zac: "engage", Galio: "engage",
  Rell: "engage", Maokai: "engage", Rakan: "engage",
  Hecarim: "engage", Nocturne: "engage", Sion: "engage",
  Rammus: "engage", Warwick: "engage", XinZhao: "engage",
  Volibear: "engage", Poppy: "engage", TahmKench: "engage",
  Thresh: "engage", Gragas: "engage", Braum: "engage",
  Skarner: "engage",

  // Wombo Combo
  Orianna: "wombo", MissFortune: "wombo", Kennen: "wombo",
  Karthus: "wombo", Yasuo: "wombo", Yone: "wombo",
  Rumble: "wombo", Fiddlesticks: "wombo", Neeko: "wombo",
  Seraphine: "wombo",

  // Poke
  Jayce: "poke", Ezreal: "poke", Karma: "poke",
  Lux: "poke", Xerath: "poke", Ziggs: "poke",
  VelKoz: "poke", Caitlyn: "poke", Nidalee: "poke",
  Varus: "poke", Zoe: "poke", Zyra: "poke", Corki: "poke",
  Teemo: "poke",

  // Scaling
  Kassadin: "scaling", Kayle: "scaling", Jinx: "scaling",
  KogMaw: "scaling", Vayne: "scaling", Twitch: "scaling",
  Nasus: "scaling", Veigar: "scaling", Tristana: "scaling",
  Aphelios: "scaling", Vladimir: "scaling", Senna: "scaling",

  // Assassin
  Zed: "assassin", Talon: "assassin", Katarina: "assassin",
  Diana: "assassin", Khazix: "assassin", Rengar: "assassin",
  Akali: "assassin", Ekko: "assassin", Qiyana: "assassin",
  Fizz: "assassin", Leblanc: "assassin", Shaco: "assassin",
  Evelynn: "assassin", Pyke: "assassin", Elise: "assassin",
  Kayn: "assassin",

  // Split Push
  Fiora: "split", Tryndamere: "split", Jax: "split",
  Yorick: "split", Camille: "split", Illaoi: "split",
  Singed: "split", Trundle: "split", Quinn: "split",

  // Protect
  Lulu: "protect", Janna: "protect", Soraka: "protect",
  Zilean: "protect", Yuumi: "protect", Shen: "protect",
  Taric: "protect", RenataGlasc: "protect", Milio: "protect",

  // Tank
  Chogath: "tank", DrMundo: "tank", Nunu: "tank", KSante: "tank",

  // Bruiser
  Darius: "bruiser", Garen: "bruiser", Mordekaiser: "bruiser",
  Renekton: "bruiser", Irelia: "bruiser", Riven: "bruiser",
  Aatrox: "bruiser", Sett: "bruiser", Pantheon: "bruiser",
  Urgot: "bruiser", Olaf: "bruiser", Udyr: "bruiser",
  Wukong: "bruiser", Gnar: "bruiser", Kled: "bruiser",
  Ambessa: "bruiser", Belveth: "bruiser", Gwen: "bruiser",
  RekSai: "bruiser", Shyvana: "bruiser", Gangplank: "bruiser",
  Briar: "bruiser", Lillia: "bruiser",

  // Mage
  Syndra: "mage", Cassiopeia: "mage", Annie: "mage",
  Ahri: "mage", TwistedFate: "mage", Brand: "mage",
  Swain: "mage", Heimerdinger: "mage", Malzahar: "mage",
  Morgana: "mage", Lissandra: "mage", Taliyah: "mage",
  Azir: "mage", Sylas: "mage", Viktor: "mage",
  Ryze: "mage", AurelionSol: "mage", Vex: "mage",
  Hwei: "mage", Nilah: "mage",

  // Marksman
  Ashe: "marksman", Lucian: "marksman", Draven: "marksman",
  Xayah: "marksman", Kaisa: "marksman", Jhin: "marksman",
  Sivir: "marksman", Samira: "marksman", Zeri: "marksman",
  Kalista: "marksman", MasterYi: "marksman",

  // Utility
  Nami: "utility", Bard: "utility", Sona: "utility",
  Ivern: "utility", Kindred: "utility",
};

function archetypeFromTags(tags: string[]): ChampionArchetype {
  if (tags.includes("Support")) return "utility";
  if (tags.includes("Marksman")) return "marksman";
  if (tags.includes("Mage")) return "mage";
  if (tags.includes("Assassin")) return "assassin";
  if (tags.includes("Tank")) return "tank";
  if (tags.includes("Fighter")) return "bruiser";
  return "utility";
}

export function getArchetype(championId: string, tags: string[]): ChampionArchetype {
  return ARCHETYPES[championId] ?? archetypeFromTags(tags);
}

// ── Compatibility matrix (0-100, symmetric) ──────────────────────────────────
type CompatRow = Record<ChampionArchetype, number>;
const COMPAT: Record<ChampionArchetype, CompatRow> = {
  engage:   { engage:78, wombo:92, poke:60, scaling:88, assassin:64, split:50, protect:76, tank:76, bruiser:72, mage:78, marksman:83, utility:80 },
  wombo:    { engage:92, wombo:88, poke:58, scaling:84, assassin:60, split:48, protect:70, tank:72, bruiser:66, mage:88, marksman:80, utility:76 },
  poke:     { engage:60, wombo:58, poke:72, scaling:74, assassin:58, split:64, protect:74, tank:62, bruiser:64, mage:78, marksman:80, utility:76 },
  scaling:  { engage:88, wombo:84, poke:74, scaling:68, assassin:58, split:55, protect:92, tank:72, bruiser:66, mage:74, marksman:72, utility:86 },
  assassin: { engage:64, wombo:60, poke:58, scaling:58, assassin:50, split:56, protect:66, tank:62, bruiser:63, mage:70, marksman:63, utility:68 },
  split:    { engage:50, wombo:48, poke:64, scaling:55, assassin:56, split:44, protect:68, tank:66, bruiser:63, mage:60, marksman:64, utility:70 },
  protect:  { engage:76, wombo:70, poke:74, scaling:92, assassin:66, split:68, protect:62, tank:72, bruiser:68, mage:82, marksman:92, utility:78 },
  tank:     { engage:76, wombo:72, poke:62, scaling:72, assassin:62, split:66, protect:72, tank:64, bruiser:67, mage:78, marksman:82, utility:76 },
  bruiser:  { engage:72, wombo:66, poke:64, scaling:66, assassin:63, split:63, protect:68, tank:67, bruiser:58, mage:70, marksman:74, utility:72 },
  mage:     { engage:78, wombo:88, poke:78, scaling:74, assassin:70, split:60, protect:82, tank:78, bruiser:70, mage:66, marksman:74, utility:80 },
  marksman: { engage:83, wombo:80, poke:80, scaling:72, assassin:63, split:64, protect:92, tank:82, bruiser:74, mage:74, marksman:60, utility:85 },
  utility:  { engage:80, wombo:76, poke:76, scaling:86, assassin:68, split:70, protect:78, tank:76, bruiser:72, mage:80, marksman:85, utility:68 },
};

// ── Role pair weights ─────────────────────────────────────────────────────────
function pairWeight(roleA: LolRole, roleB: LolRole): number {
  const key = [roleA, roleB].sort().join("-");
  const weights: Record<string, number> = {
    "adc-support": 2.0,
    "jungle-mid": 2.0,
    "jungle-top": 1.5,
    "adc-jungle": 1.2,
    "mid-support": 1.2,
  };
  return weights[key] ?? 1.0;
}

// ── Composition detection ─────────────────────────────────────────────────────
function detectComposition(
  archetypes: ChampionArchetype[],
): { type: CompositionType; description: string } {
  const count = (a: ChampionArchetype) => archetypes.filter((x) => x === a).length;
  const has   = (a: ChampionArchetype) => archetypes.includes(a);

  const womboCnt  = count("wombo") + count("engage");
  const pokeCnt   = count("poke") + count("mage");
  const scaleCnt  = count("scaling");
  const splitCnt  = count("split");
  const assassinCnt = count("assassin");

  if (count("wombo") >= 2 && womboCnt >= 3)
    return { type: "Wombo Combo", description: "Múltiples ultimates AOE hacen devastador cualquier teamfight." };
  if (womboCnt >= 4 && !has("poke") && !has("split"))
    return { type: "Engage", description: "Equipo de iniciación fuerte con mucho CC y resistencia." };
  if (pokeCnt >= 3)
    return { type: "Poke", description: "Presión constante a distancia que agota al rival antes del teamfight." };
  if (splitCnt >= 2 || (splitCnt >= 1 && assassinCnt >= 1))
    return { type: "Split Push", description: "Presión en múltiples líneas que fuerza decisiones difíciles." };
  if (scaleCnt >= 3)
    return { type: "Scaling", description: "Composición que gana claramente en partidas largas." };
  return { type: "Mixta", description: "Composición versátil que puede adaptarse a distintos escenarios." };
}

// ── Issues and strengths ──────────────────────────────────────────────────────
function detectIssues(archetypes: ChampionArchetype[]): string[] {
  const issues: string[] = [];
  const count = (a: ChampionArchetype) => archetypes.filter((x) => x === a).length;

  const physicalArch:  ChampionArchetype[] = ["bruiser", "marksman", "assassin", "split"];
  const frontlineArch: ChampionArchetype[] = ["tank", "bruiser", "engage"];
  const engageArch:    ChampionArchetype[] = ["engage", "wombo"];
  const ccArch:        ChampionArchetype[] = ["engage", "wombo", "utility", "tank"];
  const waveclearArch: ChampionArchetype[] = ["mage", "bruiser", "marksman", "wombo", "poke"];
  const scalingArch:   ChampionArchetype[] = ["scaling", "marksman"];

  if (archetypes.every((a) => physicalArch.includes(a)))
    issues.push("Full AD — el rival puede construir armadura y anularte");
  if (!archetypes.some((a) => frontlineArch.includes(a)))
    issues.push("Sin frontline — equipo frágil ante peleas directas");
  if (!archetypes.some((a) => engageArch.includes(a)))
    issues.push("Sin iniciación — difícil forzar teamfights favorables");
  if (!archetypes.some((a) => ccArch.includes(a)))
    issues.push("Sin CC — no puede lockear objetivos importantes");
  if (!archetypes.some((a) => waveclearArch.includes(a)))
    issues.push("Poca waveclear — vulnerable a sieges y presión de líneas");
  if (!archetypes.some((a) => scalingArch.includes(a)))
    issues.push("Sin late game — necesita ganar antes de los 30 minutos");
  if (count("assassin") >= 3)
    issues.push("Demasiados assassinos — sin cohesión en teamfights grandes");
  if (count("split") >= 2)
    issues.push("Dos split pushers — equipo sin presencia en teamfights");

  return issues;
}

function detectStrengths(
  archetypes: ChampionArchetype[],
  composition: CompositionType,
): string[] {
  const strengths: string[] = [];
  const has   = (a: ChampionArchetype) => archetypes.includes(a);
  const count = (a: ChampionArchetype) => archetypes.filter((x) => x === a).length;

  if (has("engage") && has("scaling"))
    strengths.push("Iniciación + carry tardío: teamfights controlados y late game ganador");
  if (has("protect") && has("marksman"))
    strengths.push("Protect the carry: ADC muy difícil de eliminar");
  if (has("engage") && has("wombo"))
    strengths.push("CC en cadena + AOE: teamfights potencialmente devastadores");
  if (count("bruiser") + count("tank") + count("engage") >= 3)
    strengths.push("Frontline sólida: difícil de penetrar para carries rivales");
  if (composition === "Poke")
    strengths.push("Presión constante que desgasta al rival desde el early game");
  if (composition === "Engage")
    strengths.push("Control total del ritmo de juego con múltiples iniciaciones");
  if (composition === "Scaling")
    strengths.push("Domina el late game con carries de alto poder en ítems completos");
  if (composition === "Wombo Combo")
    strengths.push("Potencial de eliminar al equipo rival en segundos con un buen engage");
  if (has("protect") && has("scaling"))
    strengths.push("Escala de forma muy segura gracias al peel dedicado");

  return strengths.length > 0
    ? strengths
    : ["Composición funcional con herramientas para múltiples situaciones"];
}

// ── Public API ────────────────────────────────────────────────────────────────
export function calcTeamSynergy(team: TeamEntry[]): SynergyResult {
  const roleToArch = Object.fromEntries(
    team.map((e) => [e.role, getArchetype(e.championId, e.tags)]),
  ) as Record<LolRole, ChampionArchetype>;

  const roles = team.map((e) => e.role);
  const pairs: PairSynergy[] = [];

  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const roleA = roles[i];
      const roleB = roles[j];
      const score  = COMPAT[roleToArch[roleA]][roleToArch[roleB]];
      const weight = pairWeight(roleA, roleB);
      pairs.push({ roleA, roleB, champA: team[i].championName, champB: team[j].championName, score, weight });
    }
  }

  const totalWeight = pairs.reduce((s, p) => s + p.weight, 0);
  const weightedSum = pairs.reduce((s, p) => s + p.score * p.weight, 0);
  const score = Math.min(100, Math.max(0, Math.round(weightedSum / totalWeight)));

  const grade: SynergyResult["grade"] =
    score >= 85 ? "S" : score >= 75 ? "A" : score >= 63 ? "B" : score >= 50 ? "C" : "D";

  const archetypes = team.map((e) => getArchetype(e.championId, e.tags));
  const { type: compositionType, description: compositionDescription } = detectComposition(archetypes);
  const issues    = detectIssues(archetypes);
  const strengths = detectStrengths(archetypes, compositionType);

  const sorted    = [...pairs].sort((a, b) => b.score - a.score);
  const topPairs  = sorted.slice(0, 3);
  const worstPairs = sorted.slice(-3).reverse();

  return { score, grade, compositionType, compositionDescription, topPairs, worstPairs, issues, strengths };
}
