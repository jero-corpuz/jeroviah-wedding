import { CombatPopup, FlyingBone, PickupItem, PartyMember, GalleryItem } from './types';
import { INITIAL_FLOOR_PICKUPS, DEFAULT_ROSTER, GALLERY_FILES } from './data';

export interface GameState {
  tick: number;
  dtf: number;
  worldProgress: number;
  targetProgress: number;
  isWalking: boolean;
  walkDirection: number;
  wheelLock: boolean;
  lastStepMs: number;
  currentStageIndex: number;
  brawlerComboTimer: number;
  dogTreatTimer: number;
  treatCount: number;
  rideScroll: number;
  rideFx: Array<{ x: number; y: number; life: number; kind: 'puff' | 'line' }>;
  p1Score: number;
  p2Score: number;
  campClimbProgress: number;
  campDanceBoostTimer: number;
  churchClimbProgress: number;
  churchKissBoostTimer: number;
  crowdWaveTimer: number;
  shopSparkleTimer: number;
  sf2SelectedIndex: number;
  galleryPixelCrtMode: boolean;
  currentLightboxIndex: number;
  combatPopups: CombatPopup[];
  floorPickups: PickupItem[];
  flyingBones: FlyingBone[];
  partyRoster: PartyMember[];
  galleryItems: GalleryItem[];
}

export const gameState: GameState = {
  tick: 0,
  dtf: 1,
  worldProgress: 0,
  targetProgress: 0,
  isWalking: false,
  walkDirection: 1,
  wheelLock: false,
  lastStepMs: 0,
  currentStageIndex: 0,
  brawlerComboTimer: 0,
  dogTreatTimer: 0,
  treatCount: 0,
  rideScroll: 0,
  rideFx: [],
  p1Score: 500,
  p2Score: 220,
  campClimbProgress: 0,
  campDanceBoostTimer: 0,
  churchClimbProgress: 0,
  churchKissBoostTimer: 0,
  crowdWaveTimer: 0,
  shopSparkleTimer: 0,
  sf2SelectedIndex: 0,
  galleryPixelCrtMode: true,
  currentLightboxIndex: 0,
  combatPopups: [
    { xRatio: 0.66, yRatio: 0.25, text: 'CRITICAL LOVE!', sub: '+740', life: 120, color: '#ef4444' }
  ],
  floorPickups: JSON.parse(JSON.stringify(INITIAL_FLOOR_PICKUPS)),
  flyingBones: [],
  partyRoster: JSON.parse(JSON.stringify(DEFAULT_ROSTER)),
  galleryItems: GALLERY_FILES.map((file, i) => {
    const n = String(i + 1).padStart(2, '0');
    return {
      id: i + 1,
      title: `PRE-NUP #${n}`,
      likes: 0,
      thumb: `/gallery-web/thumb/${encodeURIComponent(file)}`,
      img: `/gallery-web/full/${encodeURIComponent(file)}`
    };
  })
};

// Cached DOM elements reference
export const domRefs: {
  sky: HTMLCanvasElement | null;
  floor: HTMLCanvasElement | null;
  track: HTMLElement | null;
  speech: HTMLElement | null;
} = {
  sky: null,
  floor: null,
  track: null,
  speech: null
};

