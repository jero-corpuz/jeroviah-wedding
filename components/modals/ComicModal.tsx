"use client";

import React from "react";
import { playSfx } from "@/lib/arcade/audio";

interface ComicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComicModal({ isOpen, onClose }: ComicModalProps) {
  const handleClose = () => {
    playSfx("blip");
    onClose();
  };

  return (
    <div
      id="comicOriginModal"
      className={`modal-backdrop${isOpen ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={isOpen ? "false" : "true"}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="modal-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "3px solid #000",
            paddingBottom: "8px",
            marginBottom: "10px",
          }}
        >
          <h3 style={{ fontFamily: "var(--font-comic)", fontSize: "30px" }}>
            📖 JERO &amp; VIAH: 4-PANEL CO-OP ORIGIN COMIC
          </h3>
          <button onClick={handleClose} className="arcade-btn btn-red">
            ✕ CLOSE
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          <div className="sign-card" style={{ background: "#fff" }}>
            <span className="poster-header-tag">
              PANEL 01 • THE RANDOM ENCOUNTER
            </span>
            <p style={{ fontSize: "15px", marginTop: "6px" }}>
              One shared coffee quest sparked an instant critical hit! Player 1
              &amp; Player 2 unlocked permanent Co-Op Mode.
            </p>
          </div>
          <div className="sign-card" style={{ background: "#fff" }}>
            <span
              className="poster-header-tag"
              style={{ background: "#0284c7", color: "#fff" }}
            >
              PANEL 02 • ROAD TRIP LEVEL-UPS
            </span>
            <p style={{ fontSize: "15px", marginTop: "6px" }}>
              From La Union surf waves to Baguio pine trails, every food crawl
              and mountain drive leveled up their bond.
            </p>
          </div>
          <div className="sign-card" style={{ background: "#fff" }}>
            <span
              className="poster-header-tag"
              style={{ background: "#16a34a", color: "#fff" }}
            >
              PANEL 03 • BAKI, MANJU &amp; SHIRO
            </span>
            <p style={{ fontSize: "15px", marginTop: "6px" }}>
              Baki the stocky black bulldog, Manju the muscular brown bulldog,
              and Shiro the fluffy white Japanese Spitz completed our 5-member
              squad (+500 loyalty!).
            </p>
          </div>
          <div className="sign-card" style={{ background: "#fef08a" }}>
            <span
              className="poster-header-tag"
              style={{ background: "#dc2626", color: "#fff" }}
            >
              PANEL 04 • FINAL BOSS: FEB 12, 2027
            </span>
            <p style={{ fontSize: "15px", marginTop: "6px" }}>
              Jero dropped to one knee with the Legendary Diamond Ring—and Viah
              said YES! Next stop: Teacher&apos;s Camp, Baguio!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

