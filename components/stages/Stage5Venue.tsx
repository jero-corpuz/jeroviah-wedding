"use client";

import React from "react";
import { replayPorchDance } from "@/lib/arcade/dioramas";

interface Stage5VenueProps {
  onOpenMapModal?: () => void;
}

export default function Stage5Venue({ onOpenMapModal }: Stage5VenueProps) {
  return (
    <section className="open-air-stage" id="stage-5">
      <div className="hill-stage-split">
        {/* LEFT / CENTER: PIXEL DIORAMA OF TEACHER'S CAMP WHITE AMERICAN COLONIAL HOUSE ON A PINE HILL WITH GRAND STAIRS */}
        <div className="hill-diorama-box">
          <div
            className="hill-action-floating-pill"
            onClick={replayPorchDance}
          >
            💃 CLICK TO WATCH JERO, VIAH &amp; 3 PUPS CLIMB THE HILL STAIRS &amp; DANCE!
          </div>
          <canvas
            id="teachersCampHillCanvas"
            width="660"
            height="370"
            className="pixel-canvas hill-diorama-canvas"
            onClick={replayPorchDance}
            title="Click to replay Jero, Viah & the 3 Dogs climbing the Teacher's Camp hill stairs and dancing on the porch!"
          />
        </div>

        {/* RIGHT: COMPACT CAMP TRAIL POST SIGNBOARD */}
        <div className="trail-kiosk-panel">
          <div className="floodlight-bar">
            <div className="floodlight-lamp" />
            <div className="floodlight-lamp" />
          </div>

          <div className="highway-billboard timber-billboard custom-scroll">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "4px",
              }}
            >
              <span
                className="poster-header-tag"
                style={{ background: "#1b4332", color: "#fde047" }}
              >
                🌅 STAGE 05 • RECEPTION VENUE
              </span>
              <span className="crit-hit-banner">💃 PORCH DANCE +999!</span>
            </div>

            <h2
              className="brawler-title"
              style={{
                fontSize: "clamp(24px, 2.6vw, 34px)",
                lineHeight: 1,
                marginTop: "5px",
              }}
            >
              WHITE HALL HERITAGE HOUSE
            </h2>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#3b2314",
                margin: "3px 0",
              }}
            >
              📍 Scenic Mountain Heritage Grounds (Est. 1908)
            </p>

            <div
              className="sign-card"
              style={{ marginTop: "5px", background: "#fffbeb" }}
            >
              <p style={{ fontSize: "14px", lineHeight: 1.35 }}>
                <strong>🏡 Old American Heritage House:</strong> Iconic white
                colonial clapboard architecture atop a terraced pine hill (+100
                Pine Forest Aura, crisp mountain breeze)!
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginTop: "6px",
                  fontFamily: "var(--font-arcade)",
                  fontSize: "9px",
                  flexWrap: "wrap",
                }}
              >
                <span>🧥 CHILL ARMOR:</span>
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#1b4332",
                    border: "2px solid #000",
                  }}
                  title="Pine Green"
                />
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#1d3557",
                    border: "2px solid #000",
                  }}
                  title="Midnight Navy"
                />
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#d4a373",
                    border: "2px solid #000",
                  }}
                  title="Warm Tan"
                />
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#f2e8cf",
                    border: "2px solid #000",
                  }}
                  title="Champagne Cream"
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "6px",
                marginTop: "8px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={replayPorchDance}
                className="arcade-btn btn-red"
                style={{ flex: 1 }}
              >
                💃 REPLAY PORCH DANCE
              </button>
              <button
                onClick={onOpenMapModal}
                className="arcade-btn btn-gold"
                style={{ flex: 1 }}
              >
                🗺️ TRAVEL GUIDE
              </button>
              <a
                href="https://maps.google.com/?q=Baguio+Teachers+Camp"
                target="_blank"
                rel="noopener noreferrer"
                className="arcade-btn btn-green"
                style={{ width: "100%" }}
              >
                🧭 OPEN GOOGLE MAPS GPS
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

