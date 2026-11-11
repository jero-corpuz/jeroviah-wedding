"use client";

import React from "react";
import { replayChurchKiss } from "@/lib/arcade/dioramas";
import { downloadIcsCalendar, openGoogleCalendar } from "@/lib/arcade/calendar";
import { walkToStage } from "@/lib/arcade/actions";

export default function Stage4Church() {
  return (
    <section className="open-air-stage" id="stage-4">
      <div className="hill-stage-split">
        {/* LEFT: PIXEL DIORAMA OF THE CHURCH WITH GRAND STAIRS & ROMANTIC KISS */}
        <div className="hill-diorama-box">
          <div className="hill-action-floating-pill" onClick={replayChurchKiss}>
            💋 CLICK TO WATCH JERO &amp; VIAH CLIMB THE CHURCH STAIRS &amp; KISS!
          </div>
          <canvas
            id="churchHillCanvas"
            width="660"
            height="370"
            className="pixel-canvas hill-diorama-canvas"
            onClick={replayChurchKiss}
            title="Click to replay Jero & Viah climbing the church stairs for their wedding kiss!"
          />
        </div>

        {/* RIGHT: CEREMONY CARD */}
        <div className="trail-kiosk-panel">
          <div className="floodlight-bar">
            <div className="floodlight-lamp" />
            <div className="floodlight-lamp" />
          </div>

          <div className="highway-billboard custom-scroll church-billboard">
            <div className="motif-head">
              <span
                className="poster-header-tag"
                style={{ background: "#1e3a8a", color: "#fde047" }}
              >
                ⛪ STAGE 04 • THE CEREMONY
              </span>
              <span
                className="poster-header-tag"
                style={{ background: "#16a34a", color: "#fff" }}
              >
                FEB 12, 2027
              </span>
            </div>

            <h2 className="brawler-title church-title">
              ST. ALOYSIUS GONZAGA PARISH CHURCH
            </h2>
            <p className="church-addr">
              📍 SLU, 28 Lower Bonifacio St, Baguio, 2600 Benguet
            </p>

            <div className="ceremony-row">
              <div className="ceremony-time">
                2:00 PM<small>CEREMONY STARTS</small>
              </div>
              <ul className="program-list">
                <li>
                  <b>1:30 PM</b> — please be seated
                </li>
                <li>
                  <b>2:00 PM</b> — wedding ceremony
                </li>
                <li>
                  <b>After</b> — photos on the church steps
                </li>
                <li>
                  <b>Then</b> — reception at Teacher&apos;s Camp ▶
                </li>
              </ul>
            </div>

            <div className="church-actions">
              <button onClick={replayChurchKiss} className="arcade-btn btn-red">
                💋 ALTAR KISS
              </button>
              <button onClick={downloadIcsCalendar} className="arcade-btn btn-gold">
                📅 SAVE .ICS
              </button>
              <button onClick={openGoogleCalendar} className="arcade-btn btn-cyan">
                🌐 GOOGLE CAL
              </button>
              <button onClick={() => walkToStage(7)} className="arcade-btn btn-cream">
                🎬 RSVP
              </button>
              <a
                href="https://www.google.com/maps/search/?api=1&amp;query=St.+Aloysius+Gonzaga+Parish+Church,+28+Lower+Bonifacio+St,+Baguio"
                target="_blank"
                rel="noopener noreferrer"
                className="arcade-btn btn-green church-maps"
              >
                🧭 OPEN IN GOOGLE MAPS
              </a>
            </div>
          </div>

          <div className="billboard-pillars-row">
            <div className="timber-pillar" />
            <div className="timber-pillar" />
          </div>
        </div>
      </div>
    </section>
  );
}

