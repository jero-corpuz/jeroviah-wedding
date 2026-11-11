"use client";

import React from "react";
import { playSfx } from "@/lib/arcade/audio";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MapModal({ isOpen, onClose }: MapModalProps) {
  const handleClose = () => {
    playSfx("blip");
    onClose();
  };

  return (
    <div
      id="mapModal"
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
            🗺️ TACTICAL QUEST BRIEFING
          </h3>
          <button onClick={handleClose} className="arcade-btn btn-red">
            ✕ CLOSE
          </button>
        </div>
        <p style={{ fontSize: "16px", lineHeight: 1.5 }}>
          <strong>🚗 By Car:</strong> Take NLEX → SCTEX → TPLEX, then ascend via
          scenic mountain highways straight to our heritage wedding venue.
          <br />
          <br />
          <strong>🚌 By Transport:</strong> Deluxe buses drop you right in town.
          Local transit and taxis provide quick access to the grounds.
          <br />
          <br />
          <strong>🧥 February Armor:</strong> Evening mountain air is brisk!
          Equip suits, coats, shawls, and comfortable block heels for the outdoor
          grounds.
        </p>
      </div>
    </div>
  );
}

