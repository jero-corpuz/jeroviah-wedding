import { ENTOURAGE } from "./data";
import { EntourageGroup, MasterlistGuest } from "./types";

function normalizeRole(role: string): string {
  return role
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[\s_-]+/g, " ");
}

function pushUnique(target: string[], rawName: string): void {
  const clean = rawName.trim().replace(/\s+/g, " ");
  if (!clean) return;
  const lower = clean.toLowerCase();
  if (!target.some((item) => item.toLowerCase() === lower)) {
    target.push(clean);
  }
}

function formatRoleLabel(rawRole: string): string {
  return rawRole
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Derives the Meet the Squad entourage groups dynamically from live masterlist
 * `party_role` values while preserving default placeholders for unfilled roles.
 */
export function buildEntourageGroups(
  masterlist: MasterlistGuest[],
): EntourageGroup[] {
  if (!masterlist.length) {
    return ENTOURAGE;
  }

  const groomFathers: string[] = [];
  const groomMothers: string[] = [];
  const groomOtherParents: string[] = [];
  const brideFathers: string[] = [];
  const brideMothers: string[] = [];
  const brideOtherParents: string[] = [];

  const principalSponsors: string[] = [];
  const bestMen: string[] = [];
  const maidsOfHonor: string[] = [];
  const groomsmen: string[] = [];
  const bridesmaids: string[] = [];

  const candles: string[] = [];
  const veils: string[] = [];
  const cords: string[] = [];
  const otherSecondary: string[] = [];

  const ringBearers: string[] = [];
  const coinBearers: string[] = [];
  const bibleBearers: string[] = [];
  const flowerGirls: string[] = [];
  const otherBearers: string[] = [];

  const furBearers: string[] = [];

  const records: Array<{ name: string; role: string }> = [];
  for (const party of masterlist) {
    if (party.hasOwnRow !== false && party.role) {
      records.push({ name: party.name, role: party.role });
    }
    for (const comp of party.companionDetails ?? []) {
      if (comp.role) {
        records.push({ name: comp.name, role: comp.role });
      }
    }
  }

  for (const { name, role: rawRole } of records) {
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (!cleanName) continue;
    const r = normalizeRole(rawRole);
    if (!r) continue;

    if (
      r === "father of groom" ||
      r === "father of the groom" ||
      r === "groom father" ||
      r === "grooms father"
    ) {
      pushUnique(groomFathers, cleanName);
    } else if (
      r === "mother of groom" ||
      r === "mother of the groom" ||
      r === "groom mother" ||
      r === "grooms mother"
    ) {
      pushUnique(groomMothers, cleanName);
    } else if (
      r === "parents of groom" ||
      r === "parents of the groom" ||
      r === "parent of groom" ||
      r === "parent of the groom" ||
      r === "groom parents"
    ) {
      pushUnique(groomOtherParents, cleanName);
    } else if (
      r === "father of bride" ||
      r === "father of the bride" ||
      r === "bride father" ||
      r === "brides father"
    ) {
      pushUnique(brideFathers, cleanName);
    } else if (
      r === "mother of bride" ||
      r === "mother of the bride" ||
      r === "bride mother" ||
      r === "brides mother"
    ) {
      pushUnique(brideMothers, cleanName);
    } else if (
      r === "parents of bride" ||
      r === "parents of the bride" ||
      r === "parent of bride" ||
      r === "parent of the bride" ||
      r === "bride parents"
    ) {
      pushUnique(brideOtherParents, cleanName);
    } else if (
      r === "principal sponsor" ||
      r === "principal sponsors" ||
      r === "ninong" ||
      r === "ninang" ||
      r === "godparent" ||
      r === "godparents"
    ) {
      pushUnique(principalSponsors, cleanName);
    } else if (r === "best man" || r === "bestman") {
      pushUnique(bestMen, cleanName);
    } else if (
      r === "maid of honor" ||
      r === "matron of honor" ||
      r === "man of honor" ||
      r === "moh"
    ) {
      pushUnique(maidsOfHonor, cleanName);
    } else if (
      r === "groomsman" ||
      r === "groomsmen" ||
      r === "grooms man" ||
      r === "grooms men" ||
      r === "junior groomsman" ||
      r === "junior groomsmen"
    ) {
      pushUnique(groomsmen, cleanName);
    } else if (
      r === "bridesmaid" ||
      r === "bridesmaids" ||
      r === "brides maid" ||
      r === "brides maids" ||
      r === "junior bridesmaid" ||
      r === "junior bridesmaids"
    ) {
      pushUnique(bridesmaids, cleanName);
    } else if (
      r === "candle" ||
      r === "candle sponsor" ||
      r === "candle sponsors"
    ) {
      pushUnique(candles, `Candle — ${cleanName}`);
    } else if (r === "veil" || r === "veil sponsor" || r === "veil sponsors") {
      pushUnique(veils, `Veil — ${cleanName}`);
    } else if (r === "cord" || r === "cord sponsor" || r === "cord sponsors") {
      pushUnique(cords, `Cord — ${cleanName}`);
    } else if (
      r === "secondary sponsor" ||
      r === "secondary sponsors" ||
      r === "arrhae sponsor" ||
      r === "bible sponsor"
    ) {
      pushUnique(otherSecondary, `${formatRoleLabel(rawRole)} — ${cleanName}`);
    } else if (r === "ring bearer" || r === "ring bearers") {
      pushUnique(ringBearers, `Ring Bearer — ${cleanName}`);
    } else if (
      r === "coin bearer" ||
      r === "coin bearers" ||
      r === "arrhae bearer" ||
      r === "arrhae bearers"
    ) {
      pushUnique(coinBearers, `Coin Bearer — ${cleanName}`);
    } else if (r === "bible bearer" || r === "bible bearers") {
      pushUnique(bibleBearers, `Bible Bearer — ${cleanName}`);
    } else if (r === "flower girl" || r === "flower girls") {
      pushUnique(flowerGirls, `Flower Girl — ${cleanName}`);
    } else if (r === "flower boy" || r === "flower boys") {
      pushUnique(flowerGirls, `Flower Boy — ${cleanName}`);
    } else if (r === "fur bearer" || r === "fur bearers") {
      pushUnique(furBearers, cleanName);
    } else if (r.includes("bearer")) {
      pushUnique(otherBearers, `${formatRoleLabel(rawRole)} — ${cleanName}`);
    }
  }

  const groomParents = [...groomFathers, ...groomMothers, ...groomOtherParents];
  const brideParents = [...brideFathers, ...brideMothers, ...brideOtherParents];

  const secondaryNames =
    candles.length || veils.length || cords.length || otherSecondary.length
      ? [
          ...(candles.length ? candles : ["Candle — to be announced"]),
          ...(veils.length ? veils : ["Veil — to be announced"]),
          ...(cords.length ? cords : ["Cord — to be announced"]),
          ...otherSecondary,
        ]
      : ENTOURAGE[7].names;

  const hasAnyBearerOrFlowerGirl =
    ringBearers.length ||
    coinBearers.length ||
    bibleBearers.length ||
    flowerGirls.length ||
    otherBearers.length;

  const bearerNames = hasAnyBearerOrFlowerGirl
    ? [
        ...ringBearers,
        ...coinBearers,
        ...bibleBearers,
        ...otherBearers,
        ...(flowerGirls.length
          ? flowerGirls
          : ["Flower Girl — to be announced"]),
      ]
    : ["To be announced"];

  return [
    {
      role: "PARENTS OF THE GROOM",
      icon: "🤵‍♂️",
      names: groomParents.length ? groomParents : ["To be announced"],
    },
    {
      role: "PARENTS OF THE BRIDE",
      icon: "👰‍♀️",
      names: brideParents.length ? brideParents : ["To be announced"],
    },
    {
      role: "PRINCIPAL SPONSORS",
      icon: "👑",
      names: principalSponsors.length ? principalSponsors : ["To be announced"],
    },
    {
      role: "BEST MAN",
      icon: "🤵",
      names: bestMen.length ? bestMen : ["To be announced"],
    },
    {
      role: "MAID OF HONOR",
      icon: "👰",
      names: maidsOfHonor.length ? maidsOfHonor : ["To be announced"],
    },
    {
      role: "GROOMSMEN",
      icon: "⚔️",
      names: groomsmen.length ? groomsmen : ["To be announced"],
    },
    {
      role: "BRIDESMAIDS",
      icon: "💐",
      names: bridesmaids.length ? bridesmaids : ["To be announced"],
    },
    { role: "SECONDARY SPONSORS", icon: "🕯️", names: secondaryNames },
    { role: "BEARERS & FLOWER GIRLS", icon: "🌸", names: bearerNames },
    {
      role: "FUR-BEARERS",
      icon: "🐾",
      names: furBearers.length ? furBearers : ["Baki • Manju • Shiro"],
    },
  ];
}
