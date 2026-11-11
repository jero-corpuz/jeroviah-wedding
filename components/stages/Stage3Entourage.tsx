"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { buildEntourageGroups } from "@/lib/arcade/entourage";
import { cheerCrowd, drawCharacterOnCanvas } from "@/lib/arcade/dioramas";
import { MasterlistGuest } from "@/lib/arcade/types";

interface Stage3EntourageProps {
  masterlist?: MasterlistGuest[];
}

interface FurBearerProfile {
  name: string;
  charIdx: number | null;
  subtitle: string;
}

const KNOWN_FUR_BEARERS: Record<string, { charIdx: number; subtitle: string }> = {
  baki: { charIdx: 2, subtitle: "Black Bulldog • Ring Guard" },
  manju: { charIdx: 3, subtitle: "Brown Bulldog • Bandana Brawler" },
  shiro: { charIdx: 4, subtitle: "Japanese Spitz • Cloud Healer" },
};

function resolveFurBearers(names: string[]): FurBearerProfile[] {
  const expanded = names
    .flatMap((raw) => raw.split(/\s*(?:•|,|&|\band\b)\s*/i))
    .map((s) => s.trim())
    .filter(Boolean);

  return expanded.map((name) => {
    const lower = name.toLowerCase();
    const matchedKey = Object.keys(KNOWN_FUR_BEARERS).find((k) =>
      lower.includes(k)
    );
    const known = matchedKey ? KNOWN_FUR_BEARERS[matchedKey] : null;
    return {
      name,
      charIdx: known ? known.charIdx : null,
      subtitle: known ? known.subtitle : "Fur-Bearer",
    };
  });
}

function FurBearerPortrait({
  name,
  charIdx,
}: {
  name: string;
  charIdx: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawCharacterOnCanvas(ctx, canvas.width, canvas.height, charIdx, false);
  }, [charIdx]);

  return (
    <canvas
      ref={canvasRef}
      width={112}
      height={104}
      className="pixel-canvas furbearer-portrait"
      aria-label={`${name} portrait`}
    />
  );
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
              {entourageGroups.map((group, idx) => {
                const isPrincipalSponsors = group.role === "PRINCIPAL SPONSORS";
                const isFurBearers = group.role === "FUR-BEARERS";
                const isFullWidth = isPrincipalSponsors || isFurBearers;
                const furBearers = isFurBearers
                  ? resolveFurBearers(group.names)
                  : [];

                return (
                  <div
                    key={idx}
                    className={`squad-card${isFullWidth ? " squad-card--full" : ""}`}
                  >
                    <div className="squad-role">
                      {group.icon} {group.role}
                    </div>
                    {isFurBearers ? (
                      <div
                        className="furbearer-grid"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(
                            3,
                            Math.max(1, furBearers.length)
                          )}, minmax(0, 1fr))`,
                        }}
                      >
                        {furBearers.map((pup, pIdx) => (
                          <div key={pIdx} className="furbearer-card">
                            {pup.charIdx !== null && (
                              <FurBearerPortrait
                                name={pup.name}
                                charIdx={pup.charIdx}
                              />
                            )}
                            <div className="squad-name">{pup.name}</div>
                            <div className="furbearer-sub">{pup.subtitle}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`squad-names${
                          isPrincipalSponsors && group.names.length > 1
                            ? " squad-names--2col"
                            : ""
                        }`}
                      >
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
                    )}
                  </div>
                );
              })}
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

