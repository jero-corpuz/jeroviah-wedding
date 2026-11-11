"use client";

import React from "react";
import { GalleryItem } from "@/lib/arcade/types";

interface Stage6GalleryProps {
  items: GalleryItem[];
  crtMode: boolean;
  onToggleCrt: () => void;
  onLikeItem: (id: number) => void;
  onOpenLightbox: (index: number) => void;
}

export default function Stage6Gallery({
  items,
  crtMode,
  onToggleCrt,
  onLikeItem,
  onOpenLightbox,
}: Stage6GalleryProps) {
  const totalLikes = items.reduce((sum, item) => sum + item.likes, 0);

  return (
    <section className="open-air-stage" id="stage-6">
      <div className="roadside-zone gallery-zone">
        <div className="floodlight-bar">
          <div className="floodlight-lamp" />
          <div className="floodlight-lamp" />
          <div className="floodlight-lamp" />
          <div className="floodlight-lamp" />
        </div>

        <div className="highway-billboard marquee-billboard custom-scroll gallery-billboard">
          <div className="gallery-head">
            <h2 className="brawler-title gallery-title">🎬 OUR PRE-NUP</h2>
            <div className="gallery-head-tools">
              <span
                className="poster-header-tag"
                style={{ background: "#6E8AA1", color: "#fff" }}
              >
                <span id="count-all">{items.length}</span> PHOTOS
              </span>
              <button
                id="pixelModeToggleBtn"
                onClick={onToggleCrt}
                className={crtMode ? "arcade-btn btn-cyan" : "arcade-btn btn-gold"}
              >
                {crtMode ? "🕹️ PIXEL CRT: ON" : "✨ CLEAN HD: ON"}
              </button>
              <span
                className="poster-header-tag"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                ❤️ <span id="totalGalleryLikes">{totalLikes}</span>
              </span>
            </div>
          </div>

          <div id="galleryGridContainer" className="gallery-wall-grid">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="gallery-frame-card"
                onClick={() => onOpenLightbox(idx)}
              >
                <div className={`gallery-thumb${crtMode ? " crt" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumb}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="gallery-card-row">
                  <span className="gallery-card-title">{item.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLikeItem(item.id);
                    }}
                    className="arcade-btn btn-red gallery-like"
                  >
                    ❤️ <span>{item.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="billboard-pillars-row">
          <div className="steel-pillar" />
          <div className="steel-pillar" />
          <div className="steel-pillar" />
          <div className="steel-pillar" />
        </div>
      </div>
    </section>
  );
}

