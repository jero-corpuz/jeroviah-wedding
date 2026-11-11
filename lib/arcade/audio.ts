// Web Audio API 8-Bit Arcade Synthesizer & "First Date" Chiptune BGM

let audioCtx: AudioContext | null = null;
let sfxEnabled = false;
let bgmPlaying = false;
let bgmInterval: ReturnType<typeof setInterval> | null = null;
let bgmAudio: HTMLAudioElement | null = null;
let bgmFileFailed = false;

export const BGM_SRC = encodeURI('/Blink 182 - First Date (8 bit) [hInmtONKCT0].mp3');

export function initAudio() {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function isSfxEnabled(): boolean {
  return sfxEnabled;
}

export function isBgmPlaying(): boolean {
  return bgmPlaying;
}

const fallbackNotes = [
  392.00, 392.00, 587.33, 587.33, 440.00, 440.00, 349.23, 349.23,
  523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.00
];
let bgmNoteIdx = 0;

export function startFallbackBgm() {
  if (bgmInterval || !audioCtx) return;
  bgmInterval = setInterval(() => {
    if (!bgmPlaying || !audioCtx) return;
    const freq = fallbackNotes[bgmNoteIdx++ % fallbackNotes.length];
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch {
      // Audio playback error or suspended
    }
  }, 210);
}

export function stopFallbackBgm() {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}

function getOrCreateBgmAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!bgmAudio) {
    bgmAudio = new Audio();
    bgmAudio.src = BGM_SRC;
    bgmAudio.loop = true;
    bgmAudio.preload = 'none';
    bgmAudio.volume = 0.55;
    bgmAudio.addEventListener('error', () => {
      bgmFileFailed = true;
      if (bgmPlaying) startFallbackBgm();
    });
  }
  return bgmAudio;
}

export function toggleAudio(force?: boolean): boolean {
  initAudio();
  sfxEnabled = typeof force === 'boolean' ? force : !sfxEnabled;

  const btn = document.getElementById('sfxToggleBtn');
  if (btn) {
    btn.textContent = sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
    btn.classList.toggle('on', sfxEnabled);
  }
  const mb = document.getElementById('soundBtnMobile');
  if (mb) mb.textContent = sfxEnabled ? '🔊' : '🔇';

  if (sfxEnabled && !bgmPlaying) {
    toggleBgmSong(true);
  }
  if (sfxEnabled) {
    playSfx('coin');
  }
  return sfxEnabled;
}

export function toggleBgmSong(force?: boolean): boolean {
  initAudio();
  bgmPlaying = typeof force === 'boolean' ? force : !bgmPlaying;

  const btn = document.getElementById('bgmToggleBtn');
  if (btn) {
    btn.textContent = bgmPlaying ? '🎵 BGM: ON' : '🎵 BGM: OFF';
    btn.classList.toggle('on', bgmPlaying);
  }

  const audio = getOrCreateBgmAudio();
  if (!audio) return bgmPlaying;

  if (bgmPlaying) {
    if (bgmFileFailed) {
      startFallbackBgm();
      return true;
    }
    const p = audio.play();
    if (p && p.catch) {
      p.catch(() => {
        if (audio.error) {
          bgmFileFailed = true;
          startFallbackBgm();
        }
      });
    }
  } else {
    audio.pause();
    stopFallbackBgm();
  }
  return bgmPlaying;
}

export function playSfx(type: 'blip' | 'step' | 'coin' | 'pickup' | 'chirp' | 'bark' | 'powerup' | 'fanfare' | 'dance' | 'bells') {
  if (!sfxEnabled) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (type === 'blip' || type === 'step') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type === 'step' ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(type === 'step' ? 130 : 540, now);
    osc.frequency.exponentialRampToValueAtTime(type === 'step' ? 65 : 820, now + 0.05);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'coin' || type === 'pickup') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.06);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  } else if (type === 'chirp') {
    [0, 0.07].forEach((off, idx) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 + idx * 300, now + off);
      osc.frequency.exponentialRampToValueAtTime(2200, now + off + 0.05);
      gain.gain.setValueAtTime(0.06, now + off);
      gain.gain.exponentialRampToValueAtTime(0.001, now + off + 0.06);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + off);
      osc.stop(now + off + 0.06);
    });
  } else if (type === 'bark') {
    [0, 0.1].forEach((off) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, now + off);
      osc.frequency.exponentialRampToValueAtTime(700, now + off + 0.04);
      osc.frequency.exponentialRampToValueAtTime(220, now + off + 0.08);
      gain.gain.setValueAtTime(0.08, now + off);
      gain.gain.exponentialRampToValueAtTime(0.001, now + off + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + off);
      osc.stop(now + off + 0.09);
    });
  } else if (type === 'powerup' || type === 'fanfare') {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.08, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.16);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.16);
    });
  } else if (type === 'dance') {
    // Upbeat 8-bit Baguio Porch Dance Groove
    [392.0, 523.25, 659.25, 783.99, 659.25, 783.99].forEach((f, i) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.075);
      gain.gain.setValueAtTime(0.07, now + i * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.075 + 0.07);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.075);
      osc.stop(now + i * 0.075 + 0.07);
    });
  } else if (type === 'bells') {
    // Romantic 8-bit Wedding Church Bells Chime
    [1046.5, 1318.5, 1567.98, 2093.0].forEach((f, i) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.11);
      gain.gain.setValueAtTime(0.11, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.35);
    });
  }
}

