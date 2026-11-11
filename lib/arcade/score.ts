import { gameState } from './state';

export function addBrawlerScore(ptsP1 = 100, ptsP2 = 150) {
  gameState.p1Score += ptsP1;
  gameState.p2Score += ptsP2;

  if (typeof document !== 'undefined') {
    const p1El = document.getElementById('p1ScoreText');
    const p2El = document.getElementById('p2ScoreText');
    const b1El = document.getElementById('p1BonusPopup');
    const b2El = document.getElementById('p2BonusPopup');

    if (p1El) p1El.textContent = String(gameState.p1Score).padStart(3, '0');
    if (p2El) p2El.textContent = String(gameState.p2Score).padStart(3, '0');
    if (b1El) b1El.textContent = `+${ptsP1}`;
    if (b2El) b2El.textContent = `+${ptsP2}`;
  }
}

