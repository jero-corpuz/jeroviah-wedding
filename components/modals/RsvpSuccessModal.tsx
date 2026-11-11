"use client";

import React from "react";
import { playSfx } from "@/lib/arcade/audio";

interface RsvpSuccessModalProps {
  isOpen: boolean;
  isDeclined?: boolean;
  summaryText: string;
  onClose: () => void;
}

export default function RsvpSuccessModal({
  isOpen,
  isDeclined = false,
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
          {isDeclined
            ? "✕ MISSION FAILED! REGRETS LOGGED! ✕"
            : "★ STAGE CLEAR! CHALLENGER REGISTERED! ★"}
        </div>
        <h3 className="brawler-title" style={{ fontSize: "48px", margin: "6px 0" }}>
          {isDeclined ? "MISSION FAILED!" : "WELCOME TO THE PARTY!"}
        </h3>
        <p
          id="rsvpModalSummary"
          style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}
        >
          {summaryText}
        </p>
        <button
          onClick={handleClose}
          className={`arcade-btn ${isDeclined ? "btn-red" : "btn-green"}`}
          style={{ width: "100%", padding: "12px" }}
        >
          {isDeclined ? "CONTINUE — BACK TO THE STAGE" : "AWESOME! BACK TO THE STAGE"}
        </button>
      </div>
    </div>
  );
}

