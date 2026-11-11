import { gameState } from './state';
import { playSfx, isSfxEnabled, toggleAudio, toggleBgmSong } from './audio';
import { addBrawlerScore } from './score';

const TOTAL_STAGES = 8;

export function walkToStage(idx: number) {
  const clamped = Math.max(0, Math.min(TOTAL_STAGES - 1, idx));
  if (clamped !== Math.round(gameState.targetProgress)) {
    playSfx('blip');
  }
  gameState.targetProgress = clamped;
}

export function stepLevel(delta: number) {
  walkToStage(Math.round(gameState.targetProgress) + delta);
}

export function triggerLoveCombo(customText?: string) {
  if (!isSfxEnabled()) toggleAudio(true);
  playSfx('powerup');
  gameState.brawlerComboTimer = 65;
  addBrawlerScore(250, 740);
  gameState.combatPopups.push({
    xRatio: 0.5,
    yRatio: 0.25,
    text: customText || 'CRITICAL LOVE!',
    sub: '+740 LOVE COMBO',
    life: 85,
    color: '#ef4444'
  });
}

export function triggerFighterMove(who: 'jero' | 'viah') {
  triggerLoveCombo(who === 'jero' ? 'JERO: TUXEDO UPPERCUT!' : 'VIAH: RADIANT SMILE CRIT!');
}

export function pressStartAdventure() {
  toggleAudio(true);
  toggleBgmSong(true);
  playSfx('powerup');
  if (typeof document !== 'undefined') {
    const credEl = document.getElementById('arcadeCreditNum');
    if (credEl) credEl.textContent = '9';
  }
  triggerLoveCombo('COIN INSERTED! FIRST DATE BGM PLAYING!');
  walkToStage(1);
}

export function enterStreetFromSelect() {
  if (!isSfxEnabled()) toggleAudio(true);
  playSfx('fanfare');
  triggerLoveCombo('ROUND 1: BAGUIO STREET QUEST — GO!');
  walkToStage(2);
}

export function tossDogTreat(customSpeech?: string) {
  if (!isSfxEnabled()) toggleAudio(true);
  playSfx('bark');
  gameState.dogTreatTimer = 75;
  gameState.treatCount++;
  addBrawlerScore(150, 300);

  if (typeof document !== 'undefined') {
    const countEl = document.getElementById('hudTreatCount');
    if (countEl) countEl.textContent = String(gameState.treatCount);

    const fillEl = document.getElementById('pupsSubBarFill');
    if (fillEl) fillEl.style.width = '100%';

    const speechEl = document.getElementById('walkerSpeechText');
    if (speechEl) {
      speechEl.textContent = customSpeech || '"🦴 ARF! ARF! Baki, Manju & Shiro caught the golden bones! (+300 PUP XP)"';
    }
  }

  const W = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const H = typeof window !== 'undefined' ? window.innerHeight * 0.34 : 300;
  const u = Math.max(0.45, Math.min(1, H / 300, W / 560));

  [-115, -25, 95].forEach((offset, idx) => {
    gameState.flyingBones.push({
      x: W * 0.5 + offset * 0.3 * u,
      y: H * 0.08,
      vx: offset * 0.035 * u,
      vy: -5 - idx * 0.8,
      life: 36
    });
  });

  gameState.combatPopups.push({
    xRatio: 0.5,
    yRatio: 0.22,
    text: customSpeech || '🦴 BAKI, MANJU & SHIRO HAPPY!',
    sub: '+300 PUP LOVE XP',
    life: 90,
    color: '#fde047'
  });
}

