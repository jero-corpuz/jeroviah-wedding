"use client";

import React from "react";
import { pressStartAdventure } from "@/lib/arcade/actions";

export default function Stage0Title() {
  return (
    <section className="fullscreen-arcade-stage" id="stage-0">
      <div
        className="sf1-title-cabinet"
        onClick={pressStartAdventure}
        title="Click anywhere or press [ENTER] to Push Start!"
      >
        {/* Classic 1987 Arcade Attract-Mode Top Score Row */}
        <div className="sf1-top-score-bar">
          <div>
            <span style={{ color: "#ef4444" }}>1UP</span> &nbsp;000500
          </div>
          <div>
            <span style={{ color: "#facc15" }}>HI-SCORE</span> &nbsp;999999
          </div>
          <div>
            <span style={{ color: "#38bdf8" }}>2UP</span> &nbsp;000220
          </div>
        </div>

        {/* Center Slanted Red-to-Gold Brush-Stroke Logo & Push Start Prompt */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-arcade)",
              fontSize: "clamp(10px, 1vw, 11px)",
              color: "#4ade80",
              letterSpacing: "0.12em",
              marginBottom: "6px",
            }}
          >
            🕹️ FEBRUARY 12, 2027 • CO-OP WEDDING QUEST 🕹️
          </div>

          <div className="sf1-brush-logo-wrap">
            <div className="sf1-brush-line1">JERO &amp; VIAH</div>
            <div className="sf1-brush-line2">VS THE WORLD</div>
          </div>

          <div className="sf1-push-start blink">PUSH START BUTTON</div>
          <div>
            <span className="sf1-enter-sub">
              🖱️ CLICK ANYWHERE TO ENTER &nbsp;OR&nbsp; ⌨️ PRESS [ENTER] KEY
            </span>
          </div>

          <div className="sf1-menu-lines">
            <div>ONE PLAYER</div>
            <div>OR</div>
            <div>PLAYER1 &nbsp;VS&nbsp; PLAYER2 &nbsp;(+3 DOGS)</div>
          </div>

          {/* Live Countdown Timer to Feb 12, 2027 */}
          <div
            className="cd-row"
            style={{
              maxWidth: "440px",
              width: "100%",
              margin: "6px auto 0 auto",
            }}
          >
            <div className="cd-box" style={{ background: "#090d16" }}>
              <div id="cd-days" className="cd-val">
                000
              </div>
              <div className="cd-lbl">DAYS</div>
            </div>
            <div className="cd-box" style={{ background: "#090d16" }}>
              <div id="cd-hours" className="cd-val">
                00
              </div>
              <div className="cd-lbl">HOURS</div>
            </div>
            <div className="cd-box" style={{ background: "#090d16" }}>
              <div id="cd-mins" className="cd-val">
                00
              </div>
              <div className="cd-lbl">MINS</div>
            </div>
            <div className="cd-box" style={{ background: "#090d16" }}>
              <div id="cd-secs" className="cd-val" style={{ color: "#4ade80" }}>
                00
              </div>
              <div className="cd-lbl">SECS</div>
            </div>
          </div>
        </div>

        {/* Classic Bottom Copyright & Credit Row */}
        <div className="sf1-bottom-bar">
          <span className="sf1-capcom-copy">© JERO &amp; VIAH 2027</span>
          <span
            className="sf1-bottom-hint"
            style={{ fontSize: "11px", color: "#94a3b8" }}
          >
            CLICK SCREEN OR PRESS [ENTER] FOR PLAYER SELECT ▶
          </span>
          <span className="sf1-credit-txt">
            CREDIT &nbsp;
            <span id="arcadeCreditNum" className="sf1-credit-num">
              4
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

