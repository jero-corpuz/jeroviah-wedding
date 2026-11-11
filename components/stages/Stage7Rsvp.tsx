"use client";

import React, { useMemo, useState } from "react";
import { MasterlistGuest, PartyMember } from "@/lib/arcade/types";
import { walkToStage } from "@/lib/arcade/actions";
import { playSfx } from "@/lib/arcade/audio";
import { addBrawlerScore } from "@/lib/arcade/score";
import { stripHonorific, submitRsvpEntry } from "@/lib/arcade/masterlist";

interface Stage7RsvpProps {
  roster: PartyMember[];
  onRsvpSuccess: (data: PartyMember) => void;
  masterlist: MasterlistGuest[];
  setMasterlist: React.Dispatch<React.SetStateAction<MasterlistGuest[]>>;
  masterlistLoading: boolean;
  masterlistError: string | null;
  isSyncing: boolean;
  syncMasterlist: (opts?: { silent?: boolean }) => Promise<void>;
  syncIfStale: (maxAgeMs?: number) => void;
}

const VALID_CLANS = new Set(["Team Jero", "Team Viah", "Both Players"]);
const MIN_QUERY_LENGTH = 3;

interface PartyMemberOption {
  name: string;
  role?: string;
  status?: string;
  isMainContact?: boolean;
}

interface SelectableGuest {
  key: string;
  guestName: string;
  isCompanion: boolean;
  party: MasterlistGuest;
  role?: string;
  status?: string;
  otherPartyMembers: PartyMemberOption[];
}

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

function buildSelectableGuests(masterlist: MasterlistGuest[]): SelectableGuest[] {
  const items: SelectableGuest[] = [];
  for (const party of masterlist) {
    const partyPrefix = party.partyId ? `${party.partyId}::` : "";
    const memberDetails: PartyMemberOption[] = party.companions.map((compName) => {
      const d = party.companionDetails?.find((item) => item.name === compName);
      return {
        name: compName,
        role: d?.role,
        status: d?.status,
      };
    });

    items.push({
      key: `${partyPrefix}host::${party.name.toLowerCase()}`,
      guestName: party.name,
      isCompanion: false,
      party,
      role: party.role,
      status: party.status,
      otherPartyMembers: memberDetails,
    });

    const includeHostAsCompanion = Boolean(
      party.hasOwnRow || party.role || party.status
    );

    for (const compName of party.companions) {
      const detail = memberDetails.find((m) => m.name === compName);
      const others: PartyMemberOption[] = [];
      if (includeHostAsCompanion) {
        others.push({
          name: party.name,
          role: party.role,
          status: party.status,
          isMainContact: true,
        });
      }
      for (const m of memberDetails) {
        if (m.name.toLowerCase() !== compName.toLowerCase()) {
          others.push(m);
        }
      }
      items.push({
        key: `${partyPrefix}member::${compName.toLowerCase()}`,
        guestName: compName,
        isCompanion: true,
        party,
        role: detail?.role,
        status: detail?.status,
        otherPartyMembers: others,
      });
    }
  }
  return items;
}

export default function Stage7Rsvp({
  roster,
  onRsvpSuccess,
  masterlist,
  setMasterlist,
  masterlistLoading,
  masterlistError,
  isSyncing,
  syncMasterlist,
  syncIfStale,
}: Stage7RsvpProps) {
  const [name, setName] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<SelectableGuest | null>(null);
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

  const loadMasterlist = () => syncMasterlist({ silent: false });

  const rawQuery = name.trim().toLowerCase();
  const strippedQuery = stripHonorific(name).toLowerCase();
  const hasMinQuery = rawQuery.length >= MIN_QUERY_LENGTH;

  const selectableGuests = useMemo(
    () => buildSelectableGuests(masterlist),
    [masterlist]
  );

  const suggestions = useMemo(() => {
    if (!hasMinQuery) return [];
    const matched = selectableGuests.filter((entry) =>
      matchesGuestQuery(entry.guestName, rawQuery, strippedQuery)
    );
    matched.sort((a, b) => {
      const aStart =
        a.guestName.toLowerCase().startsWith(rawQuery) ||
        (strippedQuery.length > 0 &&
          stripHonorific(a.guestName).toLowerCase().startsWith(strippedQuery));
      const bStart =
        b.guestName.toLowerCase().startsWith(rawQuery) ||
        (strippedQuery.length > 0 &&
          stripHonorific(b.guestName).toLowerCase().startsWith(strippedQuery));
      if (aStart !== bStart) return aStart ? -1 : 1;
      if (a.isCompanion !== b.isCompanion) return a.isCompanion ? 1 : -1;
      return 0;
    });
    return matched.slice(0, 20);
  }, [selectableGuests, hasMinQuery, rawQuery, strippedQuery]);

  const findExactGuest = (value: string): SelectableGuest | null => {
    const q = value.trim().toLowerCase();
    if (!q) return null;
    const direct = selectableGuests.filter(
      (e) => e.guestName.trim().toLowerCase() === q
    );
    if (direct.length === 1) return direct[0];

    const stripped = stripHonorific(value).toLowerCase();
    if (!stripped) return null;
    const strippedMatches = selectableGuests.filter(
      (e) => stripHonorific(e.guestName).toLowerCase() === stripped
    );
    return strippedMatches.length === 1 ? strippedMatches[0] : null;
  };

  const selectMasterlistGuest = (entry: SelectableGuest) => {
    setName(entry.guestName);
    setSelectedGuest(entry);
    setSelectedCompanions([]);
    setCompanionsOpen(!entry.isCompanion && entry.otherPartyMembers.length > 0);
    setDropdownOpen(false);
    setNotFoundError(false);
    setSubmitError(null);
    const normalizedStatus = entry.status?.trim().toLowerCase();
    if (normalizedStatus === "declined") {
      setAttendance("regrets");
    } else if (normalizedStatus === "confirmed") {
      setAttendance("attending");
    }
    if (entry.party.clan && VALID_CLANS.has(entry.party.clan)) {
      setClan(entry.party.clan);
    }
    if (entry.party.email && !email) {
      setEmail(entry.party.email);
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setDropdownOpen(value.trim().length >= MIN_QUERY_LENGTH);
    setHighlightIndex(0);
    setNotFoundError(false);
    setSubmitError(null);

    // Auto-refresh in background if the guest is typing and data is older than 30s
    if (value.trim().length >= MIN_QUERY_LENGTH) {
      syncIfStale(30_000);
    }

    const exact = findExactGuest(value);
    if (exact) {
      setSelectedGuest(exact);
      setCompanionsOpen(!exact.isCompanion && exact.otherPartyMembers.length > 0);
      const validNames = new Set(exact.otherPartyMembers.map((m) => m.name));
      setSelectedCompanions((prev) => prev.filter((c) => validNames.has(c)));
      if (exact.party.clan && VALID_CLANS.has(exact.party.clan)) {
        setClan(exact.party.clan);
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
    const primaryStatus: "Confirmed" | "Declined" = isRegrets
      ? "Declined"
      : "Confirmed";
    const addedGuests = isRegrets ? [] : selectedCompanions;
    const declinedGuests = isRegrets ? [matched.guestName] : [];
    const updates: Array<{
      party_id?: string;
      guest_name: string;
      status: "Confirmed" | "Declined";
    }> = [
      {
        party_id: matched.party.partyId,
        guest_name: matched.guestName,
        status: primaryStatus,
      },
      ...addedGuests.map((comp) => ({
        party_id: matched.party.partyId,
        guest_name: comp,
        status: "Confirmed" as const,
      })),
    ];
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
        action: "update_status",
        partyId: matched.party.partyId,
        party_id: matched.party.partyId,
        main_contact: matched.party.name,
        party: partyLabel,
        name: matched.guestName,
        guest_name: matched.guestName,
        email: email.trim(),
        attendance,
        status: primaryStatus,
        addedGuests,
        declinedGuests,
        updates,
        guestCount,
        totalPartyCount,
        clan,
        msg: msg.trim(),
      });

      const statusByGuest = new Map(
        updates.map((u) => [u.guest_name.toLowerCase(), u.status])
      );
      setMasterlist((prev) =>
        prev.map((g) => {
          const sameParty = matched.party.partyId
            ? g.partyId === matched.party.partyId &&
              g.name.toLowerCase() === matched.party.name.toLowerCase()
            : g.name.toLowerCase() === matched.party.name.toLowerCase();
          if (!sameParty) return g;
          return {
            ...g,
            status: statusByGuest.get(g.name.toLowerCase()) ?? g.status,
            companionDetails: g.companionDetails
              ? g.companionDetails.map((d) => ({
                  ...d,
                  status: statusByGuest.get(d.name.toLowerCase()) ?? d.status,
                }))
              : g.companions.map((cname) => ({
                  name: cname,
                  status: statusByGuest.get(cname.toLowerCase()),
                })),
          };
        })
      );

      playSfx("bells");
      addBrawlerScore(500, 999);

      const member: PartyMember = {
        name: matched.guestName,
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

  const companionCount = selectedGuest?.otherPartyMembers.length ?? 0;
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
                      syncIfStale(30_000);
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
                        suggestions.map((entry, idx) => {
                          const countLabel =
                            !entry.isCompanion && entry.otherPartyMembers.length > 0
                              ? `+${entry.otherPartyMembers.length} LISTED`
                              : !entry.isCompanion
                                ? "SOLO PASS"
                                : null;

                          return (
                            <button
                              key={entry.key}
                              type="button"
                              role="option"
                              aria-selected={
                                selectedGuest?.key === entry.key ? "true" : "false"
                              }
                              className={`rsvp-autofill-item${
                                idx === highlightIndex ? " highlighted" : ""
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectMasterlistGuest(entry);
                              }}
                            >
                              <span className="rsvp-autofill-main">
                                <span>{entry.guestName}</span>
                                {entry.isCompanion && (
                                  <span className="rsvp-autofill-sub">
                                    Party: {entry.party.name}
                                  </span>
                                )}
                              </span>
                              <span className="rsvp-autofill-tag">
                                {[
                                  entry.role || entry.party.category,
                                  countLabel,
                                  entry.status,
                                ]
                                  .filter(Boolean)
                                  .join(" • ")}
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
                      ✅ VERIFIED ON MASTERLIST: {selectedGuest.guestName}
                      {selectedGuest.role
                        ? ` (${selectedGuest.role})`
                        : selectedGuest.party.category
                          ? ` (${selectedGuest.party.category})`
                          : ""}
                      {selectedGuest.isCompanion
                        ? ` • PARTY: ${selectedGuest.party.name}`
                        : ""}
                      {selectedGuest.status
                        ? ` • STATUS: ${selectedGuest.status.toUpperCase()}`
                        : ""}
                    </div>
                  )}

                  {notFoundError && !selectedGuest && !masterlistError && (
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
                      {selectedGuest.isCompanion
                        ? "2. ALSO CONFIRM OTHER PARTY MEMBERS? (OPTIONAL)"
                        : "2. WHO WILL YOU TAKE? (PARTY MEMBERS)"}
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
                              ? "💌 REGRETS FOR YOU ONLY — OTHER PARTY MEMBERS UNCHANGED"
                              : activeAddedCount === 0
                                ? `☑️ JUST ME (1P SOLO) — ${companionCount} OTHER IN PARTY (CLICK TO ADD)`
                                : `☑️ ${activeAddedCount} OF ${companionCount} PARTY MEMBER${
                                    companionCount === 1 ? "" : "S"
                                  } CHECKED (PARTY: ${1 + activeAddedCount})`}
                          </span>
                          <span>{companionsOpen ? "▲" : "▼"}</span>
                        </button>

                        {companionsOpen && (
                          <div className="rsvp-companions-menu custom-scroll">
                            <div className="rsvp-companions-tools">
                              <span>Optional: check any others coming with you (unchecked guests stay as-is):</span>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button
                                  type="button"
                                  disabled={attendance === "regrets"}
                                  onClick={() =>
                                    setSelectedCompanions(
                                      selectedGuest.otherPartyMembers.map((m) => m.name)
                                    )
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
                              {selectedGuest.otherPartyMembers.map((member, cIdx) => {
                                const checked =
                                  attendance !== "regrets" &&
                                  selectedCompanions.includes(member.name);
                                const detailRole = member.role;
                                const detailStatus = member.status;
                                const statusSlug = detailStatus
                                  ? detailStatus
                                      .toLowerCase()
                                      .replace(/[^a-z0-9]+/g, "-")
                                  : "";
                                return (
                                  <label
                                    key={`${member.name}-${cIdx}`}
                                    className={`rsvp-companion-opt${
                                      checked ? " checked" : ""
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={attendance === "regrets"}
                                      onChange={() => toggleCompanion(member.name)}
                                    />
                                    <span className="rsvp-companion-info">
                                      <span>{member.name}</span>
                                      {(detailRole || detailStatus) && (
                                        <span className="rsvp-companion-role">
                                          {detailRole ? `(${detailRole})` : ""}
                                          {detailRole && detailStatus ? " " : ""}
                                          {detailStatus ? (
                                            <span
                                              className={`rsvp-status-badge status-${statusSlug}`}
                                            >
                                              {detailStatus.toUpperCase()}
                                            </span>
                                          ) : null}
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
                        🎫 1P SOLO PASS — no extra guests listed under your party.
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
