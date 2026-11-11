"use client";

import React from "react";
import { GalleryItem } from "@/lib/arcade/types";
import { playSfx } from "@/lib/arcade/audio";

interface GalleryLightboxModalProps {
  isOpen: boolean;
  currentIndex: number;
  items: GalleryItem[];
  onClose: () => void;
  onStep: (delta: number) => void;
  onLikeCurrent: () => void;
}

export default function GalleryLightboxModal({
  isOpen,
  currentIndex,
  items,
  onClose,
  onStep,
  onLikeCurrent,
}: GalleryLightboxModalProps) {
  if (!items.length) return null;
  const currentItem = items[currentIndex] || items[0];
  const pad = (n: number) => String(n).padStart(2, "0");

  const handleClose = () => {
    playSfx("blip");
    onClose();
  };

  return (
    <div
      id="galleryLightboxModal"
      className={`modal-backdrop${isOpen ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={isOpen ? "false" : "true"}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="modal-card lightbox-card"
        style={{ background: "#1e1b24", color: "#fff" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span id="lightboxBadge" className="poster-header-tag">
            PRE-NUP {pad(currentIndex + 1)} / {pad(items.length)}
          </span>
          <button onClick={handleClose} className="arcade-btn btn-red">
            ✕ ESC
          </button>
        </div>

        <div className="lightbox-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="lightboxImage"
            src={currentItem.img}
            alt={currentItem.title}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <h3
              id="lightboxTitle"
              style={{
                fontFamily: "var(--font-comic)",
                fontSize: "26px",
                color: "#fde047",
              }}
            >
              {currentItem.title}
            </h3>
            <p id="lightboxDesc" style={{ fontSize: "15px" }}>
              Baguio City • Pre-Nup Memory
            </p>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => onStep(-1)}
              className="arcade-btn btn-cyan"
            >
              ◀ PREV
            </button>
            <button
              onClick={onLikeCurrent}
              className="arcade-btn btn-red"
            >
              ❤️ <span id="lightboxLikeCount">{currentItem.likes}</span>
            </button>
            <button
              onClick={() => onStep(1)}
              className="arcade-btn btn-gold"
            >
              NEXT ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

