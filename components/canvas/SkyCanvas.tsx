"use client";

import React from "react";

export default function SkyCanvas() {
  return (
    <>
      {/* OPEN-AIR DYNAMIC SKY, WEATHER, CLOUDS, FLOCKS OF BIRDS & PINE HORIZON */}
      <canvas id="sky-canvas" className="pixel-canvas" aria-hidden="true" />

      {/* 2.5D Walkable Street Ground Plane (Bottom 25vh) */}
      <div className="street-ground-backdrop" />
    </>
  );
}

