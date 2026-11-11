"use client";

import React from "react";
import { stepLevel, tossDogTreat, triggerLoveCombo } from "@/lib/arcade/actions";
import { spawnExtraBirdFlock } from "@/lib/arcade/sky";
import { toggleAudio } from "@/lib/arcade/audio";

export default function FloorHudControls() {
  return (
    <div className="floor-hud-controls">
      <button
        onClick={() => stepLevel(-1)}
        className="arcade-btn btn-cyan"
        aria-label="Previous stage"
      >
        ◀<span className="btn-label">&nbsp;PREV</span>
      </button>

      <div
        id="walkerSpeechText"
        className="brawler-speech-box"
        onClick={() => triggerLoveCombo()}
        aria-live="polite"
      >
        &ldquo;☀️ Look at the sunrise clouds &amp; flying birds! Walk right to collect Apples &amp; Rings!&rdquo;
      </div>

      <button
        onClick={() => tossDogTreat()}
        className="arcade-btn btn-gold"
        title="Toss a golden bone for the dogs"
        aria-label="Toss bone"
      >
        🦴<span className="btn-label">&nbsp;TOSS BONE</span>
      </button>

      <button
        onClick={spawnExtraBirdFlock}
        className="arcade-btn btn-cream"
        title="Summon a flock of pixel birds"
        aria-label="Summon birds"
      >
        🦅<span className="btn-label">&nbsp;BIRDS</span>
      </button>

      <button
        onClick={() => triggerLoveCombo()}
        className="arcade-btn btn-red"
        title="Trigger a CRITICAL LOVE combo"
        aria-label="Love combo"
      >
        ⚡<span className="btn-label">&nbsp;COMBO</span>
      </button>

      <button
        onClick={() => toggleAudio()}
        className="arcade-btn btn-cream sound-btn"
        id="soundBtnMobile"
        aria-label="Toggle sound"
      >
        🔇
      </button>

      <button
        onClick={() => stepLevel(1)}
        className="arcade-btn btn-green"
        aria-label="Next stage"
      >
        <span className="btn-label">NEXT&nbsp;</span>
        <span className="blink">▶</span>
      </button>
    </div>
  );
}

