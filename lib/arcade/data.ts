import {
  HeroData,
  EntourageGroup,
  PartyMember,
  StageInfo,
  PickupItem,
} from "./types";

export const PORTRAIT_DATA_URIS = {
  0: "data:image/png;base64,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",
  1: "data:image/png;base64,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",
};

export const SF2_ROSTER_DATA: HeroData[] = [
  {
    id: "jero",
    name: "JERO",
    tag: "1P GROOM",
    role: "GROOM • LVL 99 TECH ARCHITECT",
    bio: "Sharp black tux, unstoppable dad jokes & unbreakable devotion to Player 2.",
    statName: "⚔️ BRAWLER WIT",
    statVal: "99/100",
    statPct: 99,
    statCol: "#ef4444",
    mapStage: "ILOCOS SUR",
    home: "ILOCOS SUR",
    mapX: 0.2,
    mapY: 0.38,
    flagCol: "#ef4444",
    lockMsg: "🔒 PREVIEW ONLY: JERO IS LOCKED IN AS PLAYER 1 GROOM!",
  },
  {
    id: "viah",
    name: "VIAH",
    tag: "2P BRIDE",
    role: "BRIDE • LVL 99 HEART CAPTAIN",
    bio: "Radiant smile (+100 Charm Aura), master quest strategist & co-op party leader.",
    statName: "✨ CHARM AURA",
    statVal: "100/100",
    statPct: 100,
    statCol: "#ff2a85",
    mapStage: "BAGUIO",
    home: "BAGUIO CITY",
    mapX: 0.52,
    mapY: 0.4,
    flagCol: "#ff2a85",
    lockMsg: "🔒 PREVIEW ONLY: VIAH IS LOCKED IN AS PLAYER 2 BRIDE!",
  },
  {
    id: "black_bull",
    name: "BAKI",
    tag: "DOG #1 • TANK",
    role: "BLACK BULLDOG • BOWTIE RING GUARD",
    bio: "Muscular charcoal coat, cute underbite teeth, pink wedding bowtie & +500 Ring Guard!",
    statName: "🛡️ RING GUARD",
    statVal: "100/100",
    statPct: 100,
    statCol: "#facc15",
    mapStage: "QUEZON HILL",
    home: "QUEZON HILL, BAGUIO",
    mapX: 0.7,
    mapY: 0.3,
    flagCol: "#facc15",
    lockMsg: "🐾 PREVIEW ONLY: BAKI IS LOCKED IN FOR AISLE SECURITY!",
  },
  {
    id: "brown_bull",
    name: "MANJU",
    tag: "DOG #2 • BRAWLER",
    role: "BROWN BULLDOG • BANDANA BRAWLER",
    bio: "Broad wrinkled brow, white chest blaze, red arcade bandana & unstoppable zoomies!",
    statName: "🦴 BULLDOG HOP",
    statVal: "98/100",
    statPct: 98,
    statCol: "#f97316",
    mapStage: "SAN LUIS",
    home: "SAN LUIS, BAGUIO",
    mapX: 0.72,
    mapY: 0.7,
    flagCol: "#22c55e",
    lockMsg: "🐾 PREVIEW ONLY: MANJU IS LOCKED IN FOR PORCH DANCE DUTY!",
  },
  {
    id: "white_spitz",
    name: "SHIRO",
    tag: "DOG #3 • HEALER",
    role: "WHITE JAPANESE SPITZ • CLOUD HEALER",
    bio: "Ultra-fluffy white mane, pointed ears, curled plume tail & +999 Party Cuteness Aura!",
    statName: "☁️ FLUFF HEAL",
    statVal: "100/100",
    statPct: 100,
    statCol: "#38bdf8",
    mapStage: "HOLY GHOST",
    home: "HOLY GHOST, BAGUIO",
    mapX: 0.86,
    mapY: 0.48,
    flagCol: "#38bdf8",
    lockMsg: "☁️ PREVIEW ONLY: SHIRO IS LOCKED IN AS PARTY HEALER!",
  },
  {
    id: "full_pack",
    name: "CO-OP SQUAD",
    tag: "5-HERO PARTY",
    role: "JERO + VIAH + BAKI + MANJU + SHIRO",
    bio: "Our complete 5-member wedding squad! Bound for Baguio City on February 12, 2027!",
    statName: "💖 TRUE LOVE XP",
    statVal: "MAX!",
    statPct: 100,
    statCol: "#4ade80",
    mapStage: "FEB 12, 2027",
    home: "ILOCOS SUR + BAGUIO",
    mapX: 0.5,
    mapY: 0.74,
    flagCol: "#fde047",
    lockMsg: "🏆 ROSTER LOCKED: ALL 5 HEROES ARE READY FOR FEBRUARY 12, 2027!",
  },
];

export const ENTOURAGE: EntourageGroup[] = [
  { role: "PARENTS OF THE GROOM", icon: "🤵‍♂️", names: ["To be announced"] },
  { role: "PARENTS OF THE BRIDE", icon: "👰‍♀️", names: ["To be announced"] },
  { role: "PRINCIPAL SPONSORS", icon: "👑", names: ["To be announced"] },
  { role: "BEST MAN", icon: "🤵", names: ["To be announced"] },
  { role: "MAID OF HONOR", icon: "👰", names: ["To be announced"] },
  { role: "GROOMSMEN", icon: "⚔️", names: ["To be announced"] },
  { role: "BRIDESMAIDS", icon: "💐", names: ["To be announced"] },
  {
    role: "SECONDARY SPONSORS",
    icon: "🕯️",
    names: [
      "Candle — to be announced",
      "Veil — to be announced",
      "Cord — to be announced",
    ],
  },
  { role: "BEARERS & FLOWER GIRLS", icon: "🌸", names: ["To be announced"] },
  { role: "FUR-BEARERS", icon: "🐾", names: ["Baki • Manju • Shiro"] },
];

export const GALLERY_FILES = [
  "DJI_20261025082549_0075_D.jpg",
  "RPB00038.jpg",
  "RPB00093.jpg",
  "RPB00229.jpg",
  "RPB00232.jpg",
  "RPB00305.jpg",
  "RPB00313.jpg",
  "RPB00319.jpg",
  "RPB00359.jpg",
  "RPB00382.jpg",
  "RPB00402.jpg",
  "RPB00516.jpg",
  "RPB00648.jpg",
  "RPB00691.jpg",
  "RPB00707.jpg",
  "RPB00776.jpg",
  "RPB00786.jpg",
  "RPB00790.jpg",
  "RPB00837.jpg",
  "RPB00849.jpg",
  "RPB00865.jpg",
  "RPB00999.jpg",
  "RPB01071.jpg",
  "RPB01082.jpg",
  "RPB01090.jpg",
  "RPB09569.jpg",
  "RPB09572.jpg",
  "RPB09623.jpg",
  "RPB09752.jpg",
  "RPB09789.jpg",
  "RPB09825.jpg",
  "RPB09841.jpg",
  "RPB09843.jpg",
  "RPB09846.jpg",
  "RPB09904.jpg",
];

export const DEFAULT_ROSTER: PartyMember[] = [
  // { name: 'Stephen Stills', party: '2P (+1 GUEST)', clan: 'Team Jero', guestCount: 1, addedGuests: ['Julie Powers'], msg: 'Baguio jackets packed! Ready for Stage 3!' },
  // { name: 'Kim Pine', party: '1P (SOLO)', clan: 'Team Viah', guestCount: 0, addedGuests: [], msg: "Drums are tuned. See you at Teacher\'s Camp!" },
  // { name: 'Wallace Wells', party: '2P (+1 GUEST)', clan: 'Both Players', guestCount: 1, addedGuests: ['Mobile'], msg: '10/10 Brawler Wedding of the Century!' },
  // { name: 'Knives Chau', party: '1P (SOLO)', clan: 'Team Viah', guestCount: 0, addedGuests: [], msg: 'CRITICAL HIT FOR JERO & VIAH!! 💖✨' }
];

export const MOTIF_COLORS = [
  { name: "SAGE", hex: "#96A99B" },
  { name: "EUCALYPTUS", hex: "#688073" },
  { name: "SLATE BLUE", hex: "#6E8AA1" },
  { name: "DUSTY BLUE", hex: "#98B9D6" },
];

export const STAGE_INFO: StageInfo[] = [
  {
    icon: "☀️",
    time: "07:00 AM SUNRISE • BLOSSOM BREEZE",
    speech: '"☀️ Sunrise Promenade! Walking with Baki, Manju & Shiro!"',
  },
  {
    icon: "🌤️",
    time: "09:00 AM MORNING • PLAYER SELECT",
    speech:
      '"🌤️ Meet Jero, Viah, our bulldogs Baki & Manju, and Shiro our Japanese Spitz!"',
  },
  {
    icon: "🛍️",
    time: "11:00 AM CITY • DRESS CODE",
    speech:
      '"👗 Window-shopping in the city! Wear sage, eucalyptus, slate blue or dusty blue — please no white!"',
  },
  {
    icon: "🏟️",
    time: "12:30 PM STADIUM • THE ENTOURAGE",
    speech: '"🏟️ The whole crowd is doing the wave for our entourage!"',
  },
  {
    icon: "⛪",
    time: "02:00 PM CEREMONY • ST. ALOYSIUS",
    speech:
      '"💒 2:00 PM at St. Aloysius Gonzaga Parish Church — climbing the church steps to say I DO!"',
  },
  {
    icon: "🌅",
    time: "05:15 PM BAGUIO SUNSET • PORCH DANCE",
    speech:
      '"💃 Reception time! Climbing the Teacher\'s Camp hill stairs to the White House for a Porch Dance!"',
  },
  {
    icon: "🌆",
    time: "07:30 PM TWILIGHT • GALLERY",
    speech:
      '"🌆 Twilight Gallery! Billboard floodlights on — click any photo!"',
  },
  {
    icon: "🌙",
    time: "09:30 PM STARLIT NIGHT • ROLL CREDITS",
    speech: '"🎬 Roll the credits! Add your name to the RSVP list!"',
  },
];

export const STAGE_HOUR = [7, 9, 11, 12.5, 14, 17.25, 19.5, 21.5];

export const SKY_PALETTES = [
  { top: "#ff758f", mid: "#ffb385", bot: "#fff1a8" }, // 0 Title (sunrise)
  { top: "#ff758f", mid: "#ffb385", bot: "#fff1a8" }, // 1 Player select
  { top: "#0369a1", mid: "#38bdf8", bot: "#bae6fd" }, // 2 Dress code: bright midday city
  { top: "#0284c7", mid: "#60a5fa", bot: "#e0f2fe" }, // 3 Entourage stadium: high noon
  { top: "#0284c7", mid: "#38bdf8", bot: "#fde047" }, // 4 Church: 2 PM golden afternoon
  { top: "#3b0764", mid: "#e11d48", bot: "#fb923c" }, // 5 Venue: Baguio sunset
  { top: "#1e1b4b", mid: "#4c1d95", bot: "#be185d" }, // 6 Gallery: twilight
  { top: "#030712", mid: "#0f172a", bot: "#1e1b4b" }, // 7 Credits: starlit night
];

export const INITIAL_FLOOR_PICKUPS: PickupItem[] = [
  {
    id: 1,
    stagePos: 0.24,
    yDepth: 0.56,
    type: "apple",
    label: "🍎 +100 HP",
    collected: false,
  },
  {
    id: 2,
    stagePos: 0.56,
    yDepth: 0.68,
    type: "bone",
    label: "🦴 +300 PUP XP",
    collected: false,
  },
  {
    id: 3,
    stagePos: 1.14,
    yDepth: 0.52,
    type: "ring",
    label: "💍 CRITICAL LOVE!",
    collected: false,
  },
  {
    id: 4,
    stagePos: 1.81,
    yDepth: 0.64,
    type: "apple",
    label: "🍎 +100 HP",
    collected: false,
  },
  {
    id: 5,
    stagePos: 2.34,
    yDepth: 0.54,
    type: "bone",
    label: "🦴 +300 PUP XP",
    collected: false,
  },
  {
    id: 6,
    stagePos: 3.02,
    yDepth: 0.62,
    type: "taho",
    label: "🍓 BAGUIO TAHO +500!",
    collected: false,
  },
  {
    id: 7,
    stagePos: 3.69,
    yDepth: 0.52,
    type: "ring",
    label: "💍 VOW POWER +740!",
    collected: false,
  },
  {
    id: 8,
    stagePos: 4.42,
    yDepth: 0.66,
    type: "taho",
    label: "🍓 PINEBERRY +500!",
    collected: false,
  },
  {
    id: 9,
    stagePos: 5.1,
    yDepth: 0.56,
    type: "bone",
    label: "🦴 GOOD PUPS +300!",
    collected: false,
  },
  {
    id: 10,
    stagePos: 5.83,
    yDepth: 0.6,
    type: "apple",
    label: "🍎 +100 HP",
    collected: false,
  },
  {
    id: 11,
    stagePos: 6.51,
    yDepth: 0.54,
    type: "ring",
    label: "💍 ALTAR READY +999!",
    collected: false,
  },
];
