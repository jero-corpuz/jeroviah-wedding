"use client";

import React, { useState } from "react";
import { walkToStage, triggerFighterMove, pressStartAdventure, tossDogTreat } from "@/lib/arcade/actions";
import { toggleAudio, toggleBgmSong } from "@/lib/arcade/audio";
import { spawnExtraBirdFlock } from "@/lib/arcade/sky";

interface BrawlerHudProps {
  onWalkToStage?: (stage: number) => void;
}

export default function BrawlerHud({ onWalkToStage = walkToStage }: BrawlerHudProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleSettings = () => {
    setSettingsOpen((prev) => !prev);
  };

  return (
    <header className="brawler-hud">
      <div className="hud-main-grid">
        {/* LEFT: PLAYER 1 (JERO) PORTRAIT, SCORE, YELLOW HP BAR & 3 CYAN SPECIAL BARS */}
        <div className="fighter-hud-cluster p1">
          <div
            className="portrait-medallion"
            onClick={() => triggerFighterMove("jero")}
            title="Click Jero for a Special Brawler Combo!"
          >
            <canvas id="hudAvatarJero" width="48" height="48" className="pixel-canvas" />
            <span className="portrait-tag p1-tag">P1</span>
          </div>
          <div className="bars-column">
            <div className="hud-text-row">
              <span className="hud-fighter-name">JERO</span>
              <div className="hud-score-cluster">
                <span className="score-zeros">000</span>
                <span id="p1ScoreText" className="score-val">
                  500
                </span>
                <span id="p1BonusPopup" className="score-bonus">
                  +100
                </span>
              </div>
            </div>
            <div className="hp-capsule-outer">
              <div id="p1HpFill" className="hp-capsule-fill" style={{ width: "95%" }} />
            </div>
            <div className="special-segments-row">
              <div className="special-seg">
                <div className="special-seg-fill" />
              </div>
              <div className="special-seg">
                <div className="special-seg-fill" />
              </div>
              <div className="special-seg">
                <div className="special-seg-fill" />
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: STAGE SELECTOR (desktop: neon sidebar) + SETTINGS DRAWER (BGM, FLOCK, SFX) */}
        <div className="hud-side-dock">
          <nav className="stage-dots-bar">
            <button
              onClick={() => onWalkToStage(0)}
              data-stage-btn="0"
              className="stage-chip active"
              aria-label="Stage 0: Start"
            >
              0<span className="chip-label">:START</span>
            </button>
            <button
              onClick={() => onWalkToStage(1)}
              data-stage-btn="1"
              className="stage-chip"
              aria-label="Stage 1: Heroes"
            >
              1<span className="chip-label">:HEROES</span>
            </button>
            <button
              onClick={() => onWalkToStage(2)}
              data-stage-btn="2"
              className="stage-chip"
              aria-label="Stage 2: Dress code"
            >
              2<span className="chip-label">:DRESS CODE 👗</span>
            </button>
            <button
              onClick={() => onWalkToStage(3)}
              data-stage-btn="3"
              className="stage-chip"
              aria-label="Stage 3: Entourage"
            >
              3<span className="chip-label">:ENTOURAGE 🏟️</span>
            </button>
            <button
              onClick={() => onWalkToStage(4)}
              data-stage-btn="4"
              className="stage-chip"
              aria-label="Stage 4: Church"
            >
              4<span className="chip-label">:CHURCH 💒</span>
            </button>
            <button
              onClick={() => onWalkToStage(5)}
              data-stage-btn="5"
              className="stage-chip"
              aria-label="Stage 5: Venue"
            >
              5<span className="chip-label">:VENUE 💃</span>
            </button>
            <button
              onClick={() => onWalkToStage(6)}
              data-stage-btn="6"
              className="stage-chip"
              aria-label="Stage 6: Gallery"
            >
              6<span className="chip-label">:GALLERY</span>
            </button>
            <button
              onClick={() => onWalkToStage(7)}
              data-stage-btn="7"
              className="stage-chip"
              aria-label="Stage 7: RSVP"
            >
              7<span className="chip-label">:RSVP 🎬</span>
            </button>
          </nav>

          <div className={`hud-settings ${settingsOpen ? "open" : ""}`} id="hudSettings">
            <button
              type="button"
              className="settings-toggle"
              id="settingsToggleBtn"
              onClick={toggleSettings}
              aria-expanded={settingsOpen ? "true" : "false"}
              aria-controls="settingsPanel"
              title="Sound & sky settings"
            >
              <span className="settings-gear" aria-hidden="true">
                ⚙
              </span>
              <span className="settings-word">&nbsp;SETTINGS</span>
              <span className="settings-arrow" aria-hidden="true">
                ▶
              </span>
            </button>
            <div
              className="settings-panel"
              id="settingsPanel"
              role="group"
              aria-label="Sound and sky settings"
            >
              <button
                type="button"
                className="settings-opt"
                id="bgmToggleBtn"
                onClick={() => toggleBgmSong()}
                title="Toggle the 8-bit First Date background music"
              >
                🎵 BGM: OFF
              </button>
              <button
                type="button"
                className="settings-opt"
                onClick={spawnExtraBirdFlock}
                title="Summon a flock of flying birds across the sky"
              >
                🦅 FLOCK
              </button>
              <button
                type="button"
                className="settings-opt"
                id="sfxToggleBtn"
                onClick={() => toggleAudio()}
                title="Toggle sound effects"
              >
                🔇 SFX: OFF
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: PLAYER 2 (VIAH) PORTRAIT, SCORE, YELLOW HP BAR, 3 CYAN BARS & "3 PUPS" SUB-BAR */}
        <div>
          <div className="fighter-hud-cluster p2">
            <div
              className="portrait-medallion"
              onClick={() => triggerFighterMove("viah")}
              title="Click Viah for a Radiant Smile Combo!"
            >
              <canvas id="hudAvatarViah" width="48" height="48" className="pixel-canvas" />
              <span className="portrait-tag p2-tag">P2</span>
            </div>
            <div className="bars-column">
              <div className="hud-text-row">
                <div className="hud-score-cluster">
                  <span id="p2BonusPopup" className="score-bonus red">
                    +740
                  </span>
                  <span className="score-zeros">000</span>
                  <span id="p2ScoreText" className="score-val">
                    220
                  </span>
                </div>
                <span
                  className="insert-coin-txt blink"
                  onClick={pressStartAdventure}
                  style={{ cursor: "pointer" }}
                >
                  INSERT COIN
                </span>
                <span className="hud-fighter-name">VIAH</span>
              </div>
              <div className="hp-capsule-outer">
                <div id="p2HpFill" className="hp-capsule-fill" style={{ width: "97%" }} />
              </div>
              <div className="special-segments-row">
                <div className="special-seg">
                  <div className="special-seg-fill glow-white" />
                </div>
                <div className="special-seg">
                  <div className="special-seg-fill" />
                </div>
                <div className="special-seg">
                  <div className="special-seg-fill" />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Boss / Companion Mini-Bar ("3 PUPS") */}
          <div
            className="sub-companion-hud"
            onClick={() => tossDogTreat()}
            title="Click to toss golden bone treats to Baki, Manju & Shiro!"
          >
            <div className="sub-companion-name">
              🐾 BAKI • MANJU • SHIRO (<span id="hudTreatCount">0</span>)
            </div>
            <div className="sub-companion-bar">
              <div id="pupsSubBarFill" className="sub-companion-fill" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

