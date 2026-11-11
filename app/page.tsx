"use client";

import React, { useEffect, useState, useCallback } from "react";
import SkyCanvas from "@/components/canvas/SkyCanvas";
import FloorCanvas from "@/components/canvas/FloorCanvas";
import BrawlerHud from "@/components/hud/BrawlerHud";
import FloorHudControls from "@/components/hud/FloorHudControls";

import Stage0Title from "@/components/stages/Stage0Title";
import Stage1Select from "@/components/stages/Stage1Select";
import Stage2DressCode from "@/components/stages/Stage2DressCode";
import Stage3Entourage from "@/components/stages/Stage3Entourage";
import Stage4Church from "@/components/stages/Stage4Church";
import Stage5Venue from "@/components/stages/Stage5Venue";
import Stage6Gallery from "@/components/stages/Stage6Gallery";
import Stage7Rsvp from "@/components/stages/Stage7Rsvp";

import MapModal from "@/components/modals/MapModal";
import ComicModal from "@/components/modals/ComicModal";
import GalleryLightboxModal from "@/components/modals/GalleryLightboxModal";
import RsvpSuccessModal from "@/components/modals/RsvpSuccessModal";

import { gameState } from "@/lib/arcade/state";
import { initArcade, destroyArcade } from "@/lib/arcade/engine";
import { playSfx } from "@/lib/arcade/audio";
import { addBrawlerScore } from "@/lib/arcade/score";
import { DEFAULT_ROSTER } from "@/lib/arcade/data";
import { PartyMember, GalleryItem } from "@/lib/arcade/types";
import { useMasterlist } from "@/lib/arcade/useMasterlist";

const GALLERY_LIKES_STORAGE_KEY = "jero_viah_gallery_likes_v1";
const RSVP_ROSTER_STORAGE_KEY = "jero_viah_rsvp_roster_v1";

export default function WeddingPage() {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [comicModalOpen, setComicModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [rsvpSuccessOpen, setRsvpSuccessOpen] = useState(false);
  const [rsvpSummary, setRsvpSummary] = useState("");

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => [...gameState.galleryItems]);
  const [crtMode, setCrtMode] = useState<boolean>(true);
  const [partyRoster, setPartyRoster] = useState<PartyMember[]>(() => [...gameState.partyRoster]);
  const {
    masterlist,
    setMasterlist,
    loading: masterlistLoading,
    error: masterlistError,
    isSyncing,
    syncMasterlist,
    syncIfStale,
  } = useMasterlist();

  useEffect(() => {
    initArcade();
    return () => {
      destroyArcade();
    };
  }, []);

  useEffect(() => {
    const loadSavedState = () => {
      try {
        const rawLikes = window.localStorage.getItem(GALLERY_LIKES_STORAGE_KEY);
        if (rawLikes) {
          const savedLikes: Record<string, number> = JSON.parse(rawLikes);
          if (savedLikes && typeof savedLikes === "object") {
            setGalleryItems((prev) => {
              const next = prev.map((item) => {
                const count = savedLikes[String(item.id)];
                return typeof count === "number" && count >= 0
                  ? { ...item, likes: count }
                  : item;
              });
              gameState.galleryItems = next;
              return next;
            });
          }
        }
      } catch {
        // Ignore localStorage read/parse errors
      }

      try {
        const rawRsvps = window.localStorage.getItem(RSVP_ROSTER_STORAGE_KEY);
        if (rawRsvps) {
          const savedRsvps = JSON.parse(rawRsvps) as PartyMember[];
          if (Array.isArray(savedRsvps) && savedRsvps.length > 0) {
            const seen = new Set<string>();
            const merged: PartyMember[] = [];
            for (const entry of [...savedRsvps, ...DEFAULT_ROSTER]) {
              if (!entry?.name) continue;
              const key = entry.name.trim().toLowerCase();
              if (seen.has(key)) continue;
              seen.add(key);
              merged.push(entry);
            }
            setPartyRoster(merged);
            gameState.partyRoster = merged;
          }
        }
      } catch {
        // Ignore localStorage read/parse errors
      }
    };

    const raf = window.requestAnimationFrame(loadSavedState);
    window.addEventListener("storage", loadSavedState);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("storage", loadSavedState);
    };
  }, []);

  const handleToggleCrt = useCallback(() => {
    playSfx("blip");
    setCrtMode((prev) => !prev);
  }, []);

  const handleLikeItem = useCallback((id: number) => {
    playSfx("coin");
    addBrawlerScore(50, 100);
    setGalleryItems((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      );
      gameState.galleryItems = next;
      try {
        const likesMap: Record<string, number> = {};
        for (const item of next) {
          if (item.likes > 0) {
            likesMap[String(item.id)] = item.likes;
          }
        }
        window.localStorage.setItem(
          GALLERY_LIKES_STORAGE_KEY,
          JSON.stringify(likesMap)
        );
      } catch {
        // Ignore localStorage write errors
      }
      return next;
    });
  }, []);

  const handleOpenLightbox = useCallback((index: number) => {
    playSfx("blip");
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleStepLightbox = useCallback((delta: number) => {
    playSfx("blip");
    setLightboxIndex((prev) => (prev + delta + galleryItems.length) % galleryItems.length);
  }, [galleryItems.length]);

  const handleLikeCurrent = useCallback(() => {
    const current = galleryItems[lightboxIndex];
    if (current) {
      handleLikeItem(current.id);
    }
  }, [galleryItems, lightboxIndex, handleLikeItem]);

  const handleRsvpSuccess = useCallback((newMember: PartyMember) => {
    setPartyRoster((prev) => {
      const targetKey = newMember.name.trim().toLowerCase();
      const filtered = prev
        .filter((p) => p.name.trim().toLowerCase() !== targetKey)
        .map((p) => ({ ...p, isNew: false }));
      const next = [newMember, ...filtered];
      gameState.partyRoster = next;

      try {
        const defaultNames = new Set(
          DEFAULT_ROSTER.map((d) => d.name.trim().toLowerCase())
        );
        const customEntries = next.filter(
          (p) => p.isNew || !defaultNames.has(p.name.trim().toLowerCase())
        );
        window.localStorage.setItem(
          RSVP_ROSTER_STORAGE_KEY,
          JSON.stringify(customEntries)
        );
      } catch {
        // Ignore localStorage write errors
      }
      return next;
    });

    const status =
      newMember.attendance === "regrets"
        ? "cheering from afar"
        : "locked in for Feb 12, 2027";
    const guestsNote =
      newMember.addedGuests && newMember.addedGuests.length > 0
        ? ` — taking ${newMember.addedGuests.join(", ")}`
        : "";
    setRsvpSummary(
      `${newMember.name} (${newMember.party} • ${newMember.clan}) is ${status}${guestsNote}!`
    );
    setRsvpSuccessOpen(true);
  }, []);

  // Expose global window hooks so keyboard listeners and existing click events can trigger modals seamlessly
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.openMapModal = () => setMapModalOpen(true);
    w.closeMapModal = () => setMapModalOpen(false);
    w.openComicModal = () => setComicModalOpen(true);
    w.closeComicModal = () => setComicModalOpen(false);
    w.openGalleryLightbox = (idx: number) => {
      setLightboxIndex(idx);
      setLightboxOpen(true);
    };
    w.closeGalleryLightbox = () => setLightboxOpen(false);
    w.stepLightbox = (delta: number) => handleStepLightbox(delta);
    w.likeCurrentLightboxMemory = () => handleLikeCurrent();
    w.closeRsvpModal = () => setRsvpSuccessOpen(false);

    return () => {
      delete w.openMapModal;
      delete w.closeMapModal;
      delete w.openComicModal;
      delete w.closeComicModal;
      delete w.openGalleryLightbox;
      delete w.closeGalleryLightbox;
      delete w.stepLightbox;
      delete w.likeCurrentLightboxMemory;
      delete w.closeRsvpModal;
    };
  }, [handleStepLightbox, handleLikeCurrent]);

  return (
    <>
      {/* 1. DYNAMIC SKY CANVAS & 2.5D GROUND PLANE */}
      <SkyCanvas />

      {/* 2. AUTHENTIC ARCADE BEAT-'EM-UP TOP HUD */}
      <BrawlerHud />

      {/* 3. OPEN-AIR HORIZONTAL 8-STAGE WORLD */}
      <main id="world-viewport">
        <div id="world-track">
          {/* STAGE 0: FULL-SCREEN STREET FIGHTER (1987) TITLE SCREEN */}
          <Stage0Title />

          {/* STAGE 1: FULL-SCREEN STREET FIGHTER II "PLAYER SELECT" SCREEN */}
          <Stage1Select onOpenComicModal={() => setComicModalOpen(true)} />

          {/* STAGE 2 (11:00 AM CITY): SHOPPING DISTRICT — WEDDING MOTIF & DRESS CODE */}
          <Stage2DressCode />

          {/* STAGE 3 (12:30 PM): ENTOURAGE STADIUM — CROWD WAVE */}
          <Stage3Entourage masterlist={masterlist} />

          {/* STAGE 4 (02:00 PM): ST. ALOYSIUS GONZAGA PARISH CHURCH */}
          <Stage4Church />

          {/* STAGE 5 (05:15 PM BAGUIO GOLDEN HOUR): TEACHER'S CAMP WHITE HALL */}
          <Stage5Venue onOpenMapModal={() => setMapModalOpen(true)} />

          {/* STAGE 6 (07:30 PM): PRE-NUP GALLERY */}
          <Stage6Gallery
            items={galleryItems}
            crtMode={crtMode}
            onToggleCrt={handleToggleCrt}
            onLikeItem={handleLikeItem}
            onOpenLightbox={handleOpenLightbox}
          />

          {/* STAGE 7 (09:30 PM): RSVP ENDING CREDITS */}
          <Stage7Rsvp
            roster={partyRoster}
            onRsvpSuccess={handleRsvpSuccess}
            masterlist={masterlist}
            setMasterlist={setMasterlist}
            masterlistLoading={masterlistLoading}
            masterlistError={masterlistError}
            isSyncing={isSyncing}
            syncMasterlist={syncMasterlist}
            syncIfStale={syncIfStale}
          />
        </div>
      </main>

      {/* 4. FULL-WIDTH 2.5D BEAT-'EM-UP STREET FLOOR CANVAS */}
      <FloorCanvas />

      {/* 5. BOTTOM CONTROLS & DIALOGUE STRIP */}
      <FloorHudControls />

      {/* MODALS */}
      <MapModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
      />

      <ComicModal
        isOpen={comicModalOpen}
        onClose={() => setComicModalOpen(false)}
      />

      <GalleryLightboxModal
        isOpen={lightboxOpen}
        currentIndex={lightboxIndex}
        items={galleryItems}
        onClose={() => setLightboxOpen(false)}
        onStep={handleStepLightbox}
        onLikeCurrent={handleLikeCurrent}
      />

      <RsvpSuccessModal
        isOpen={rsvpSuccessOpen}
        summaryText={rsvpSummary}
        onClose={() => setRsvpSuccessOpen(false)}
      />
    </>
  );
}
