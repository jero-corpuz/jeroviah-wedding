"use client";

import React, { useMemo } from "react";
import { buildEntourageGroups } from "@/lib/arcade/entourage";
import { cheerCrowd } from "@/lib/arcade/dioramas";
import { MasterlistGuest } from "@/lib/arcade/types";

interface Stage3EntourageProps {
  masterlist?: MasterlistGuest[];
}

export default function Stage3Entourage({
  masterlist = [],
}: Stage3EntourageProps) {
  const entourageGroups = useMemo(
    () => buildEntourageGroups(masterlist),
    [masterlist]
  );

  return (
    <section className="open-air-stage" id="stage-3">
      <div className="hill-stage-split">
        {/* LEFT: PIXEL STADIUM WITH BLEACHERS OF GUESTS DOING THE WAVE */}
        <div className="hill-diorama-box">
          <div className="hill-action-floating-pill" onClick={cheerCrowd}>
            📣 TAP THE STADIUM TO START A CROWD WAVE!
          </div>
          <canvas
            id="stadiumCanvas"
            width="660"
            height="370"
            className="pixel-canvas hill-diorama-canvas"
            onClick={cheerCrowd}
            title="The guests in the stands doing a crowd wave for the entourage"
          />
        </div>

        {/* RIGHT: ENTOURAGE ROSTER */}
        <div className="trail-kiosk-panel">
          <div className="floodlight-bar">
            <div className="floodlight-lamp" />
            <div className="floodlight-lamp" />
          </div>

          <div className="highway-billboard custom-scroll squad-billboard">
            <div className="motif-head">
              <span
                className="poster-header-tag"
                style={{ background: "#6E8AA1", color: "#fff" }}
              >
                🏟️ STAGE 03 • THE ENTOURAGE
              </span>
              <button onClick={cheerCrowd} className="arcade-btn btn-gold">
                📣 START THE WAVE
              </button>
            </div>
            <h2 className="brawler-title motif-title">MEET THE SQUAD</h2>
            <p className="motif-lead">
              The players walking down the aisle with us — give them a cheer!
            </p>
            <div id="entourageList" className="squad-grid">
              {entourageGroups.map((group, idx) => (
                <div key={idx} className="squad-card">
                  <div className="squad-role">
                    {group.icon} {group.role}
                  </div>
                  {group.names.map((name, nIdx) => (
                    <div
                      key={nIdx}
                      className={`squad-name${
                        /to be announced/i.test(name) ? " tba" : ""
                      }`}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
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

