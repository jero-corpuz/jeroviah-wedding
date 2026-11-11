"use client";

import React from "react";
import { replayWindowShopping } from "@/lib/arcade/dioramas";

export default function Stage2DressCode() {
  return (
    <section className="open-air-stage" id="stage-2">
      <div className="hill-stage-split">
        {/* LEFT: PIXEL SHOPPING STREET WITH 4 BOUTIQUES SHOWING FORMAL & SEMI-FORMAL OUTFITS */}
        <div className="hill-diorama-box">
          <div
            className="hill-action-floating-pill"
            onClick={replayWindowShopping}
          >
            🛍️ TAP THE SHOP WINDOWS TO GO WINDOW-SHOPPING!
          </div>
          <canvas
            id="cityShopsCanvas"
            width="660"
            height="370"
            className="pixel-canvas hill-diorama-canvas"
            onClick={replayWindowShopping}
            title="Boutiques showing the formal and semi-formal outfits in the four motif colors"
          />
        </div>

        {/* RIGHT: DRESS CODE SIGNBOARD */}
        <div className="trail-kiosk-panel">
          <div className="floodlight-bar">
            <div className="floodlight-lamp" />
            <div className="floodlight-lamp" />
          </div>

          <div className="highway-billboard motif-billboard custom-scroll">
            <div className="motif-head">
              <span
                className="poster-header-tag"
                style={{ background: "#688073", color: "#fff" }}
              >
                👗 STAGE 02 • WEDDING MOTIF
              </span>
              <span
                className="poster-header-tag"
                style={{ background: "#6E8AA1", color: "#fff" }}
              >
                DRESS CODE
              </span>
            </div>

            <h2 className="brawler-title motif-title">DRESS TO THE MOTIF</h2>
            <p className="motif-lead">Please wear any of these four colors:</p>

            <div className="swatch-row">
              <div className="swatch">
                <span className="swatch-dot" style={{ background: "#96A99B" }} />
                <b>SAGE</b>
                <small>#96A99B</small>
              </div>
              <div className="swatch">
                <span className="swatch-dot" style={{ background: "#688073" }} />
                <b>EUCALYPTUS</b>
                <small>#688073</small>
              </div>
              <div className="swatch">
                <span className="swatch-dot" style={{ background: "#6E8AA1" }} />
                <b>SLATE BLUE</b>
                <small>#6E8AA1</small>
              </div>
              <div className="swatch">
                <span className="swatch-dot" style={{ background: "#98B9D6" }} />
                <b>DUSTY BLUE</b>
                <small>#98B9D6</small>
              </div>
            </div>

            <div className="sign-card attire-card">
              <span className="attire-tag formal">
                FORMAL • ENTOURAGE &amp; SPONSORS
              </span>
              <p>
                <b>Ladies:</b> floor-length gowns.
                <br />
                <b>Gentlemen:</b> full suit or barong with a tie.
              </p>
            </div>
            <div className="sign-card attire-card">
              <span className="attire-tag semi">
                SEMI-FORMAL • GUESTS
              </span>
              <p>
                <b>Ladies:</b> cocktail or midi dresses.
                <br />
                <b>Gentlemen:</b> slacks with a long-sleeve top or blazer; tie
                optional.
              </p>
            </div>

            <div className="no-white-card">
              🚫 PLEASE AVOID WHITE — IT&apos;S RESERVED FOR THE BRIDE
            </div>
            <p className="motif-note">
              🧥 Baguio gets chilly in February: bring a coat, shawl or cardigan
              in the motif tones.
            </p>
          </div>

          <div className="billboard-pillars-row">
            <div className="steel-pillar" />
            <div className="steel-pillar" />
          </div>
        </div>
      </div>
    </section>
  );
}

