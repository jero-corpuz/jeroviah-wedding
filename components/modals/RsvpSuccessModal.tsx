"use client";

import React from "react";
import { playSfx } from "@/lib/arcade/audio";

interface RsvpSuccessModalProps {
  isOpen: boolean;
  summaryText: string;
  onClose: () => void;
}

export default function RsvpSuccessModal({
  isOpen,
  summaryText,
  onClose,
}: RsvpSuccessModalProps) {
  const handleClose = () => {
    playSfx("blip");
    onClose();
  };

  return (
    <div
      id="rsvpSuccessModal"
      className={`modal-backdrop${isOpen ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={isOpen ? "false" : "true"}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="modal-card" style={{ textAlign: "center" }}>
        <div className="crit-hit-banner" style={{ fontSize: "16px" }}>
          ★ STAGE CLEAR! CHALLENGER REGISTERED! ★
        </div>
        <h3 className="brawler-title" style={{ fontSize: "48px", margin: "6px 0" }}>
          WELCOME TO THE PARTY!
        </h3>
        <p
          id="rsvpModalSummary"
          style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}
        >
          {summaryText}
        </p>
        <button
          onClick={handleClose}
          className="arcade-btn btn-green"
          style={{ width: "100%", padding: "12px" }}
        >
          AWESOME! BACK TO THE STAGE
        </button>
      </div>
    </div>
  );
}

