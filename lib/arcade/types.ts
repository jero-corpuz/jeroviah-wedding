export interface HeroData {
  id: string;
  name: string;
  tag: string;
  role: string;
  bio: string;
  statName: string;
  statVal: string;
  statPct: number;
  statCol: string;
  mapStage: string;
  home: string;
  mapX: number;
  mapY: number;
  flagCol: string;
  lockMsg: string;
}

export interface EntourageGroup {
  role: string;
  icon: string;
  names: string[];
}

export interface MasterlistCompanion {
  name: string;
  role?: string;
}

export interface MasterlistGuest {
  name: string;
  partyId?: string;
  role?: string;
  category?: string;
  companions: string[];
  companionDetails?: MasterlistCompanion[];
  clan?: string;
  email?: string;
}

export interface PartyMember {
  name: string;
  party: string;
  clan: string;
  msg: string;
  attendance?: string;
  guestCount?: number;
  addedGuests?: string[];
  isNew?: boolean;
}

export interface GalleryItem {
  id: number;
  title: string;
  likes: number;
  thumb: string;
  img: string;
}

export interface StageInfo {
  icon: string;
  time: string;
  speech: string;
}

export interface PickupItem {
  id: number;
  stagePos: number;
  yDepth: number;
  type: 'apple' | 'bone' | 'ring' | 'taho';
  label: string;
  collected: boolean;
}

export interface CombatPopup {
  xRatio: number;
  yRatio: number;
  text: string;
  sub?: string;
  life: number;
  color?: string;
}

export interface FlyingBone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

