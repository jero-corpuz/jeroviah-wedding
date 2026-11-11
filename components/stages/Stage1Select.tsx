"use client";

import React from "react";
import { walkToStage, enterStreetFromSelect, triggerFighterMove } from "@/lib/arcade/actions";
import { previewSf2Character, triggerPreviewAction } from "@/lib/arcade/dioramas";

interface Stage1SelectProps {
  onOpenComicModal?: () => void;
}

export default function Stage1Select({ onOpenComicModal }: Stage1SelectProps) {
  return (
    <section className="fullscreen-arcade-stage" id="stage-1">
      <div className="sf2-select-cabinet custom-scroll">
        {/* Top Header Row: Back to Title | PLAYER SELECT | 4-Panel Lore & Enter Street */}
        <div className="sf2-header-row">
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              onClick={() => walkToStage(0)}
              className="arcade-btn btn-cream"
              style={{ padding: "6px 10px", fontSize: "10px" }}
            >
              ◀ TITLE
            </button>
            <span className="sf2-preview-lock-pill">
              🔒 ROSTER LOCKED • PREVIEW ONLY
            </span>
          </div>

          <h2 className="sf2-title-text">PLAYER SELECT</h2>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              onClick={onOpenComicModal}
              className="arcade-btn btn-gold"
              style={{ padding: "6px 10px", fontSize: "10px" }}
            >
              📖 4-PANEL LORE
            </button>
            <button
              onClick={enterStreetFromSelect}
              className="arcade-btn btn-green"
              style={{ padding: "6px 12px", fontSize: "10px" }}
            >
              ⚡ WALK THE STREET ▶
            </button>
          </div>
        </div>

        {/* Main Full-Screen SF2 3-Column Player Select Arena */}
        <div className="sf2-arena-grid">
          {/* LEFT SIDE: 1P (ACTIVE PREVIEW SLOT) */}
          <div className="sf2-side-preview p1-side">
            <div id="sf2LeftTag" className="sf2-player-tag p1">
              1P
            </div>
            <div id="sf2LeftName" className="sf2-fighter-big-name">
              JERO
            </div>
            <div
              className="sf2-big-portrait-box"
              onClick={triggerPreviewAction}
              style={{ cursor: "pointer" }}
              title="Click to preview character animation!"
            >
              <canvas
                id="sf2LeftBigCanvas"
                width="96"
                height="96"
                className="pixel-canvas"
              />
            </div>
            <div className="sf2-bio-card">
              <span id="sf2LeftRole" className="sf2-bio-role">
                GROOM • LVL 99 ARCHITECT
              </span>
              <span id="sf2LeftHome" className="sf2-bio-home">
                📍 FROM ILOCOS SUR
              </span>
              <div id="sf2LeftBio">
                Sharp black tux, unstoppable dad jokes &amp; unbreakable
                devotion to Player 2.
              </div>
              <div className="stat-line" style={{ color: "#fde047" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span id="sf2LeftStatName">⚔️ WIT &amp; GUARD</span>
                  <span id="sf2LeftStatVal">99/100</span>
                </div>
                <div className="stat-track">
                  <div
                    id="sf2LeftStatBar"
                    className="stat-fill"
                    style={{ width: "99%", background: "#ef4444" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: PIXEL QUEST MAP WITH FLAGS + 6-SLOT CHARACTER & DOGS SELECT GRID */}
          <div className="sf2-center-col">
            {/* Pixel World / Philippines Quest Map Canvas */}
            <canvas
              id="sf2MapCanvas"
              width="460"
              height="118"
              className="pixel-canvas sf2-map-frame"
            />

            {/* Status Banner Explaining Preview Mode */}
            <div
              id="sf2PreviewBanner"
              style={{
                fontFamily: "var(--font-arcade)",
                fontSize: "10px",
                color: "#fde047",
                background: "rgba(0,0,0,0.82)",
                border: "2px solid #38bdf8",
                padding: "5px 10px",
                textAlign: "center",
              }}
            >
              👆 HOVER OR CLICK ANY HERO OR DOG TO PREVIEW! (ROSTER LOCKED FOR FEB 12, 2027)
            </div>

            {/* 2x3 Street Fighter II Portrait Grid */}
            <div className="sf2-roster-grid">
              <div
                className="sf2-cell active-1p"
                data-char-idx="0"
                onMouseEnter={() => previewSf2Character(0, false)}
                onClick={() => previewSf2Character(0, true)}
              >
                <canvas
                  id="sf2CellCanvas0"
                  width="112"
                  height="104"
                  className="pixel-canvas"
                />
                <span className="sf2-cell-label">JERO (1P)</span>
              </div>
              <div
                className="sf2-cell active-2p"
                data-char-idx="1"
                onMouseEnter={() => previewSf2Character(1, false)}
                onClick={() => previewSf2Character(1, true)}
              >
                <canvas
                  id="sf2CellCanvas1"
                  width="112"
                  height="104"
                  className="pixel-canvas"
                />
                <span className="sf2-cell-label">VIAH (2P)</span>
              </div>
              <div
                className="sf2-cell"
                data-char-idx="2"
                onMouseEnter={() => previewSf2Character(2, false)}
                onClick={() => previewSf2Character(2, true)}
              >
                <canvas
                  id="sf2CellCanvas2"
                  width="112"
                  height="104"
                  className="pixel-canvas"
                />
                <span className="sf2-cell-label">BAKI</span>
              </div>
              <div
                className="sf2-cell"
                data-char-idx="3"
                onMouseEnter={() => previewSf2Character(3, false)}
                onClick={() => previewSf2Character(3, true)}
              >
                <canvas
                  id="sf2CellCanvas3"
                  width="112"
                  height="104"
                  className="pixel-canvas"
                />
                <span className="sf2-cell-label">MANJU</span>
              </div>
              <div
                className="sf2-cell"
                data-char-idx="4"
                onMouseEnter={() => previewSf2Character(4, false)}
                onClick={() => previewSf2Character(4, true)}
              >
                <canvas
                  id="sf2CellCanvas4"
                  width="112"
                  height="104"
                  className="pixel-canvas"
                />
                <span className="sf2-cell-label">SHIRO</span>
              </div>
              <div
                className="sf2-cell"
                data-char-idx="5"
                onMouseEnter={() => previewSf2Character(5, false)}
                onClick={() => previewSf2Character(5, true)}
              >
                <canvas
                  id="sf2CellCanvas5"
                  width="112"
                  height="104"
                  className="pixel-canvas"
                />
                <span className="sf2-cell-label">FULL PACK</span>
              </div>
            </div>

            {/* Start prompt, centred right under the character grid */}
            <button
              type="button"
              onClick={enterStreetFromSelect}
              className="arcade-btn btn-gold sf2-start-cta"
            >
              🕹️ PRESS [ENTER] OR CLICK TO WALK THE STREET!{" "}
              <span className="blink">▶</span>
            </button>
          </div>

          {/* RIGHT SIDE: 2P (CO-OP PARTNER PREVIEW SLOT) */}
          <div className="sf2-side-preview p2-side">
            <div id="sf2RightTag" className="sf2-player-tag p2">
              2P
            </div>
            <div id="sf2RightName" className="sf2-fighter-big-name">
              VIAH
            </div>
            <div
              className="sf2-big-portrait-box"
              onClick={() => triggerFighterMove("viah")}
              style={{ cursor: "pointer" }}
              title="Click to preview Viah!"
            >
              <canvas
                id="sf2RightBigCanvas"
                width="96"
                height="96"
                className="pixel-canvas"
              />
            </div>
            <div className="sf2-bio-card">
              <span id="sf2RightRole" className="sf2-bio-role">
                BRIDE • LVL 99 HEART CAPTAIN
              </span>
              <span id="sf2RightHome" className="sf2-bio-home">
                📍 FROM BAGUIO CITY
              </span>
              <div id="sf2RightBio">
                Radiant smile (+100 Charm Aura), master quest planner &amp; co-op
                party leader.
              </div>
              <div className="stat-line" style={{ color: "#67e8f9" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span id="sf2RightStatName">✨ CHARM AURA</span>
                  <span id="sf2RightStatVal">100/100</span>
                </div>
                <div className="stat-track">
                  <div
                    id="sf2RightStatBar"
                    className="stat-fill"
                    style={{ width: "100%", background: "#38bdf8" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Arcade Action Bar */}
        <div className="sf2-bottom-bar">
          <span
            style={{
              fontFamily: "var(--font-arcade)",
              fontSize: "10px",
              color: "#93c5fd",
            }}
          >
            🐾 5-HERO PARTY LOCKED: JERO + VIAH + BAKI + MANJU + SHIRO
          </span>
          <button
            onClick={() => walkToStage(7)}
            className="arcade-btn btn-red"
            style={{ padding: "8px 12px", fontSize: "10px" }}
          >
            ⛪ SKIP TO RSVP
          </button>
        </div>
      </div>
    </section>
  );
}

