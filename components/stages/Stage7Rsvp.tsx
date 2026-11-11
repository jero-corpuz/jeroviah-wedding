"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MasterlistGuest, PartyMember } from "@/lib/arcade/types";
import { walkToStage } from "@/lib/arcade/actions";
import { playSfx } from "@/lib/arcade/audio";
import { addBrawlerScore } from "@/lib/arcade/score";
import {
  fetchMasterlist,
  stripHonorific,
  submitRsvpEntry,
} from "@/lib/arcade/masterlist";

interface Stage7RsvpProps {
  roster: PartyMember[];
  onRsvpSuccess: (data: PartyMember) => void;
}

const VALID_CLANS = new Set(["Team Jero", "Team Viah", "Both Players"]);
const MIN_QUERY_LENGTH = 3;

function matchesGuestQuery(
  text: string,
  rawQuery: string,
  strippedQuery: string
): boolean {
  if (text.toLowerCase().includes(rawQuery)) return true;
  return (
    strippedQuery.length > 0 &&
    stripHonorific(text).toLowerCase().includes(strippedQuery)
  );
}

export default function Stage7Rsvp({ roster, onRsvpSuccess }: Stage7RsvpProps) {
  const [masterlist, setMasterlist] = useState<MasterlistGuest[]>([]);
  const [masterlistLoading, setMasterlistLoading] = useState(true);
  const [masterlistError, setMasterlistError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<MasterlistGuest | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [notFoundError, setNotFoundError] = useState(false);

  const [selectedCompanions, setSelectedCompanions] = useState<string[]>([]);
  const [companionsOpen, setCompanionsOpen] = useState(true);

  const [email, setEmail] = useState("");
  const [attendance, setAttendance] = useState("attending");
  const [clan, setClan] = useState("Team Jero");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rollCycle, setRollCycle] = useState(0);

  const [isSyncing, setIsSyncing] = useState(false);
  const lastFetchedRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  const syncMasterlist = useCallback(async (opts?: { silent?: boolean }) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    const silent = !!opts?.silent;
    if (!silent) setMasterlistLoading(true);
    setIsSyncing(true);
    setMasterlistError(null);

    try {
      const { guests } = await fetchMasterlist();
      setMasterlist(guests);
      lastFetchedRef.current = Date.now();
    } catch (err) {
      if (!silent) {
        setMasterlistError(
          err instanceof Error ? err.message : "Could not load guest masterlist."
        );
      }
    } finally {
      isSyncingRef.current = false;
      setMasterlistLoading(false);
      setIsSyncing(false);
    }
  }, []);

  const loadMasterlist = useCallback(() => {
    return syncMasterlist({ silent: false });
  }, [syncMasterlist]);

  useEffect(() => {
    let active = true;
    fetchMasterlist()
      .then(({ guests }) => {
        if (!active) return;
        setMasterlist(guests);
        lastFetchedRef.current = Date.now();
        setMasterlistLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setMasterlistError(
          err instanceof Error ? err.message : "Could not load guest masterlist."
        );
        setMasterlistLoading(false);
      });

    // Periodic background sync every 60s while the tab is active
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncMasterlist({ silent: true });
      }
    }, 60_000);

    // Sync on tab re-focus if older than 30s
    const handleRecheck = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        Date.now() - lastFetchedRef.current > 30_000
      ) {
        syncMasterlist({ silent: true });
      }
    };

    window.addEventListener("focus", handleRecheck);
    document.addEventListener("visibilitychange", handleRecheck);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleRecheck);
      document.removeEventListener("visibilitychange", handleRecheck);
    };
  }, [syncMasterlist]);

  const rawQuery = name.trim().toLowerCase();
  const strippedQuery = stripHonorific(name).toLowerCase();
  const hasMinQuery = rawQuery.length >= MIN_QUERY_LENGTH;

  const suggestions = useMemo(() => {
    if (!hasMinQuery) return [];
    const list = masterlist.filter(
      (g) =>
        matchesGuestQuery(g.name, rawQuery, strippedQuery) ||
        g.companions.some((c) => matchesGuestQuery(c, rawQuery, strippedQuery))
    );
    return list.slice(0, 12);
  }, [masterlist, hasMinQuery, rawQuery, strippedQuery]);

  const findExactGuest = (value: string): MasterlistGuest | null => {
    const q = value.trim().toLowerCase();
    if (!q) return null;
    const direct = masterlist.find((g) => g.name.trim().toLowerCase() === q);
    if (direct) return direct;

    const stripped = stripHonorific(value).toLowerCase();
    if (!stripped) return null;
    const strippedMatches = masterlist.filter(
      (g) => stripHonorific(g.name).toLowerCase() === stripped
    );
    return strippedMatches.length === 1 ? strippedMatches[0] : null;
  };

  const selectMasterlistGuest = (guest: MasterlistGuest) => {
    setName(guest.name);
    setSelectedGuest(guest);
    setSelectedCompanions([]);
    setCompanionsOpen(guest.companions.length > 0);
    setDropdownOpen(false);
    setNotFoundError(false);
    setSubmitError(null);
    if (guest.clan && VALID_CLANS.has(guest.clan)) {
      setClan(guest.clan);
    }
    if (guest.email && !email) {
      setEmail(guest.email);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setDropdownOpen(value.trim().length >= MIN_QUERY_LENGTH);
    setHighlightIndex(0);
    setNotFoundError(false);
    setSubmitError(null);

    // Auto-refresh in background if the guest is typing and data is older than 30s
    if (
      value.trim().length >= MIN_QUERY_LENGTH &&
      Date.now() - lastFetchedRef.current > 30_000
    ) {
      syncMasterlist({ silent: true });
    }

    const exact = findExactGuest(value);
    if (exact) {
      setSelectedGuest(exact);
      setCompanionsOpen(exact.companions.length > 0);
      setSelectedCompanions((prev) =>
        prev.filter((c) => exact.companions.includes(c))
      );
      if (exact.clan && VALID_CLANS.has(exact.clan)) {
        setClan(exact.clan);
      }
    } else {
      setSelectedGuest(null);
      setSelectedCompanions([]);
    }
  };

  const handleNameBlur = () => {
    setDropdownOpen(false);
    if (name.trim() && !selectedGuest && !masterlistLoading) {
      setNotFoundError(true);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (suggestions.length) {
        e.preventDefault();
        setDropdownOpen(true);
        setHighlightIndex((prev) => (prev + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      if (suggestions.length) {
        e.preventDefault();
        setDropdownOpen(true);
        setHighlightIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length
        );
      }
    } else if (e.key === "Enter" && dropdownOpen && suggestions.length > 0) {
      e.preventDefault();
      const target = suggestions[highlightIndex] || suggestions[0];
      if (target) selectMasterlistGuest(target);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  const toggleCompanion = (companionName: string) => {
    setSelectedCompanions((prev) =>
      prev.includes(companionName)
        ? prev.filter((item) => item !== companionName)
        : [...prev, companionName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const matched = selectedGuest || findExactGuest(name);

    if (!matched) {
      setNotFoundError(true);
      setDropdownOpen(true);
      return;
    }
    if (!email.trim() || !msg.trim()) return;

    const isRegrets = attendance === "regrets";
    const addedGuests = isRegrets ? [] : selectedCompanions;
    const guestCount = addedGuests.length;
    const totalPartyCount = isRegrets ? 0 : 1 + guestCount;
    const partyLabel = isRegrets
      ? "0P (REGRETS)"
      : guestCount > 0
        ? `${totalPartyCount}P (+${guestCount} ${guestCount === 1 ? "GUEST" : "GUESTS"})`
        : "1P (SOLO)";

    setSubmitting(true);
    try {
      await submitRsvpEntry({
        partyId: matched.partyId,
        party: partyLabel,
        name: matched.name,
        email: email.trim(),
        attendance,
        addedGuests,
        guestCount,
        totalPartyCount,
        clan,
        msg: msg.trim(),
      });

      playSfx("bells");
      addBrawlerScore(500, 999);

      const member: PartyMember = {
        name: matched.name,
        party: partyLabel,
        clan,
        msg: msg.trim(),
        attendance,
        guestCount,
        addedGuests,
        isNew: true,
      };

      onRsvpSuccess(member);
      setRollCycle((c) => c + 1);

      setName("");
      setSelectedGuest(null);
      setSelectedCompanions([]);
      setNotFoundError(false);
      setEmail("");
      setAttendance("attending");
      setClan("Team Jero");
      setMsg("");
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Your RSVP could not be sent. Please try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const comingHeadcount = roster.reduce(
    (sum, p) => (p.attendance === "regrets" ? sum : sum + 1 + (p.guestCount ?? 0)),
    0
  );
  const rollDuration = `${Math.max(26, 16 + roster.length * 5)}s`;

  const renderHalf = (hidden: boolean) => (
    <div className="credit-half" aria-hidden={hidden ? "true" : undefined}>
      <div className="credit-block">
        <div className="credit-role">A CO-OP WEDDING STARRING</div>
        <div className="credit-name big">JERO &amp; VIAH</div>
      </div>
      <div className="credit-block">
        <div className="credit-role">FEATURING</div>
        <div className="credit-name">
          BAKI • THE BLACK BULLDOG
          <br />
          MANJU • THE BROWN BULLDOG
          <br />
          SHIRO • THE WHITE SPITZ
        </div>
      </div>
      <div className="credit-block">
        <div className="credit-role">
          AND OUR {roster.length} CHALLENGERS ({comingHeadcount} TOTAL COMING TO BAGUIO)
        </div>
      </div>

      {roster.map((p, idx) => {
        const isRegrets = p.attendance === "regrets";
        const status = isRegrets ? "CHEERING FROM AFAR" : "ATTENDING";
        const addedCount = p.guestCount ?? p.addedGuests?.length ?? 0;
        const guestBadge = isRegrets
          ? "NO GUESTS (CHEERING FROM AFAR)"
          : addedCount > 0
            ? `+${addedCount} ${addedCount === 1 ? "GUEST ADDED" : "GUESTS ADDED"} (${1 + addedCount} IN PARTY)`
            : "+0 GUESTS ADDED (SOLO)";

        return (
          <div
            key={idx}
            className={`credit-entry${p.isNew ? " is-new" : ""}`}
          >
            <div className="credit-name">{p.name}</div>
            <div className="credit-guest-count">{guestBadge}</div>
            <div className="credit-meta">
              {p.clan} • {status}
            </div>
            <div className="credit-msg">&ldquo;{p.msg}&rdquo;</div>
          </div>
        );
      })}

      <div className="credit-block">
        <div className="credit-role">AND YOU?</div>
        <div className="credit-name">INSERT YOUR NAME</div>
      </div>
      <div className="credit-block">
        <div className="credit-role">FEBRUARY 12, 2027 • BAGUIO CITY</div>
        <div className="credit-name">THANK YOU FOR PLAYING ♥</div>
      </div>
    </div>
  );

  const companionCount = selectedGuest?.companions.length ?? 0;
  const activeAddedCount = attendance === "regrets" ? 0 : selectedCompanions.length;

  return (
    <section className="fullscreen-arcade-stage" id="stage-7">
      <div className="credits-cabinet">
        <div className="credits-header">
          <button
            onClick={() => walkToStage(6)}
            className="arcade-btn btn-cream"
          >
            ◀ BACK
          </button>
          <h2 className="credits-title">★ THE END? NOT YET! ★</h2>
          <span className="credits-sub">RSVP TO JOIN THE CREDITS</span>
        </div>

        <div className="credits-grid">
          {/* LEFT: MASTERLIST RSVP FORM */}
          <div className="credits-form-panel custom-scroll">
            <h3>🎬 INSERT YOUR NAME</h3>
            <form id="rsvpForm" onSubmit={handleSubmit}>
              <div className="rsvp-grid">
                {/* 1. AUTOFILL NAME FROM MASTERLIST */}
                <div className="rsvp-wide rsvp-autocomplete-wrap">
                  <label className="brawler-label" htmlFor="guestName">
                    1. PLAYER NAME (SEARCH MASTERLIST) *
                  </label>
                  <input
                    id="guestName"
                    type="text"
                    required
                    maxLength={80}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={
                      dropdownOpen && !masterlistLoading && hasMinQuery
                        ? "true"
                        : "false"
                    }
                    aria-controls="masterlistAutofill"
                    aria-autocomplete="list"
                    placeholder={
                      masterlistLoading
                        ? "Loading guest masterlist..."
                        : "Type at least 3 letters of your name..."
                    }
                    className="brawler-input"
                    value={name}
                    onFocus={() => {
                      if (name.trim().length >= MIN_QUERY_LENGTH) {
                        setDropdownOpen(true);
                      }
                      if (Date.now() - lastFetchedRef.current > 30_000) {
                        syncMasterlist({ silent: true });
                      }
                    }}
                    onBlur={handleNameBlur}
                    onKeyDown={handleNameKeyDown}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />

                  {dropdownOpen && !masterlistLoading && hasMinQuery && (
                    <div
                      id="masterlistAutofill"
                      className="rsvp-autofill-menu custom-scroll"
                      role="listbox"
                    >
                      {suggestions.length > 0 ? (
                        suggestions.map((guest, idx) => {
                          const matchedViaCompanion =
                            rawQuery.length > 0 &&
                            !matchesGuestQuery(
                              guest.name,
                              rawQuery,
                              strippedQuery
                            )
                              ? guest.companions.filter((c) =>
                                  matchesGuestQuery(c, rawQuery, strippedQuery)
                                )
                              : [];
                          const countLabel =
                            guest.companions.length > 0
                              ? `+${guest.companions.length} LISTED`
                              : "SOLO PASS";
                          const itemKey = guest.partyId
                            ? `${guest.partyId}-${guest.name}`
                            : guest.name;

                          return (
                            <button
                              key={itemKey}
                              type="button"
                              role="option"
                              aria-selected={
                                selectedGuest?.name === guest.name &&
                                selectedGuest?.partyId === guest.partyId
                                  ? "true"
                                  : "false"
                              }
                              className={`rsvp-autofill-item${
                                idx === highlightIndex ? " highlighted" : ""
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectMasterlistGuest(guest);
                              }}
                            >
                              <span className="rsvp-autofill-main">
                                <span>{guest.name}</span>
                                {matchedViaCompanion.length > 0 && (
                                  <span className="rsvp-autofill-sub">
                                    Includes: {matchedViaCompanion.join(", ")}
                                  </span>
                                )}
                              </span>
                              <span className="rsvp-autofill-tag">
                                {guest.category
                                  ? `${guest.category} • ${countLabel}`
                                  : countLabel}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div
                          className="rsvp-autofill-item"
                          style={{
                            cursor: "default",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span>No matching name in masterlist</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              syncMasterlist({ silent: false });
                            }}
                            disabled={isSyncing}
                            style={{
                              fontSize: "10px",
                              color: "#93c5fd",
                              background: "transparent",
                              border: "1px solid #38bdf8",
                              padding: "2px 6px",
                              cursor: isSyncing ? "wait" : "pointer",
                            }}
                          >
                            {isSyncing ? "Syncing..." : "🔄 Refresh Sheet"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {masterlistError && (
                    <div className="rsvp-hint-line warn">
                      ⚠️ {masterlistError}{" "}
                      <button
                        type="button"
                        onClick={loadMasterlist}
                        style={{
                          textDecoration: "underline",
                          background: "transparent",
                          border: 0,
                          color: "#fde047",
                          cursor: "pointer",
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {selectedGuest && (
                    <div className="rsvp-hint-line ok">
                      ✅ VERIFIED ON MASTERLIST: {selectedGuest.name}
                      {selectedGuest.category
                        ? ` (${selectedGuest.category})`
                        : ""}
                    </div>
                  )}

                  {notFoundError && !selectedGuest && (
                    <div id="rsvpNotFoundMsg" className="rsvp-hint-line warn">
                      ⚠️ Name not found in the guest masterlist — please select your
                      name from the autofill list.{" "}
                      <button
                        type="button"
                        onClick={() => syncMasterlist({ silent: false })}
                        disabled={isSyncing}
                        style={{
                          textDecoration: "underline",
                          background: "transparent",
                          border: 0,
                          color: "#fde047",
                          cursor: isSyncing ? "wait" : "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {isSyncing ? "⏳ Syncing with Sheet..." : "🔄 Re-sync Google Sheet"}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. COMPANIONS CHECKBOX DROPDOWN UNDER MATCHED GUEST */}
                {selectedGuest && (
                  <div className="rsvp-wide">
                    <label className="brawler-label">
                      2. WHO WILL YOU TAKE? (GUESTS UNDER YOUR NAME)
                    </label>
                    {companionCount > 0 ? (
                      <div
                        className={`rsvp-companions-dropdown${
                          attendance === "regrets" ? " disabled" : ""
                        }`}
                      >
                        <button
                          type="button"
                          id="companionsDropdownBtn"
                          className="rsvp-companions-trigger"
                          aria-expanded={companionsOpen ? "true" : "false"}
                          onClick={() => setCompanionsOpen((prev) => !prev)}
                        >
                          <span>
                            {attendance === "regrets"
                              ? "💌 REGRETS SELECTED — 0 GUESTS ADDED"
                              : `☑️ ${activeAddedCount} OF ${companionCount} COMPANION${
                                  companionCount === 1 ? "" : "S"
                                } CHECKED (PARTY: ${1 + activeAddedCount})`}
                          </span>
                          <span>{companionsOpen ? "▲" : "▼"}</span>
                        </button>

                        {companionsOpen && (
                          <div className="rsvp-companions-menu custom-scroll">
                            <div className="rsvp-companions-tools">
                              <span>Check all guests coming with you:</span>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button
                                  type="button"
                                  disabled={attendance === "regrets"}
                                  onClick={() =>
                                    setSelectedCompanions([...selectedGuest.companions])
                                  }
                                >
                                  SELECT ALL
                                </button>
                                <button
                                  type="button"
                                  disabled={attendance === "regrets"}
                                  onClick={() => setSelectedCompanions([])}
                                >
                                  CLEAR
                                </button>
                              </div>
                            </div>
                            <div className="rsvp-companion-list">
                              {selectedGuest.companions.map((comp, cIdx) => {
                                const checked =
                                  attendance !== "regrets" &&
                                  selectedCompanions.includes(comp);
                                const detailRole =
                                  selectedGuest.companionDetails?.find(
                                    (d) => d.name === comp
                                  )?.role;
                                return (
                                  <label
                                    key={`${comp}-${cIdx}`}
                                    className={`rsvp-companion-opt${
                                      checked ? " checked" : ""
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={attendance === "regrets"}
                                      onChange={() => toggleCompanion(comp)}
                                    />
                                    <span className="rsvp-companion-info">
                                      <span>{comp}</span>
                                      {detailRole && (
                                        <span className="rsvp-companion-role">
                                          ({detailRole})
                                        </span>
                                      )}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rsvp-hint-line info">
                        🎫 1P SOLO PASS — no extra guests listed under your name.
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="brawler-label" htmlFor="guestEmail">
                    {selectedGuest ? "3" : "2"}. COMMS EMAIL *
                  </label>
                  <input
                    id="guestEmail"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="player3@arcade.com"
                    className="brawler-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="brawler-label" htmlFor="guestAttendance">
                    {selectedGuest ? "4" : "3"}. QUEST STATUS
                  </label>
                  <select
                    id="guestAttendance"
                    className="brawler-input"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                  >
                    <option value="attending">⚡ ATTENDING IN BAGUIO!</option>
                    <option value="regrets">💌 CHEERING FROM AFAR</option>
                  </select>
                </div>

                <div className="rsvp-wide">
                  <label className="brawler-label" htmlFor="guestClan">
                    {selectedGuest ? "5" : "4"}. ALLIANCE CLAN
                  </label>
                  <select
                    id="guestClan"
                    className="brawler-input"
                    value={clan}
                    onChange={(e) => setClan(e.target.value)}
                  >
                    <option value="Team Jero">⚔️ Team Jero</option>
                    <option value="Team Viah">💖 Team Viah</option>
                    <option value="Both Players">🌟 Mutual Friend</option>
                  </select>
                </div>

                <div className="rsvp-wide">
                  <label className="brawler-label" htmlFor="guestMessage">
                    {selectedGuest ? "6" : "5"}. BATTLE CRY / MESSAGE *
                  </label>
                  <textarea
                    id="guestMessage"
                    required
                    maxLength={160}
                    rows={2}
                    placeholder="See you at St. Aloysius!"
                    className="brawler-input"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                  />
                </div>
              </div>

              {submitError && (
                <div className="rsvp-hint-line warn">⚠️ {submitError}</div>
              )}

              <button
                type="submit"
                className="arcade-btn btn-red credits-submit"
                disabled={submitting}
              >
                {submitting
                  ? "⏳ SENDING…"
                  : selectedGuest && attendance === "attending"
                    ? `🏆 LOCK IN RSVP (${1 + activeAddedCount}P) & ROLL CREDITS!`
                    : "🏆 LOCK IN RSVP & ROLL THE CREDITS!"}
              </button>
            </form>
          </div>

          {/* RIGHT: ROLLING CREDITS OF EVERYONE WHO RSVP'D */}
          <div
            className="credits-roll-panel"
            tabIndex={0}
            aria-label="RSVP credits — hover or focus to pause"
          >
            <div
              key={rollCycle}
              id="creditsRoll"
              className="credits-roll"
              style={{ "--roll-dur": rollDuration } as React.CSSProperties}
            >
              {renderHalf(false)}
              {renderHalf(true)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
