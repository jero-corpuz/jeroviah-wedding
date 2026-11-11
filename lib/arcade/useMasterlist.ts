"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMasterlist } from "@/lib/arcade/masterlist";
import { MasterlistGuest, PartyMember } from "@/lib/arcade/types";

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes while tab is active
const RECHECK_MIN_AGE_MS = 4_000; // Re-sync quickly when returning from editing Google Sheets

export interface UseMasterlistResult {
  masterlist: MasterlistGuest[];
  setMasterlist: React.Dispatch<React.SetStateAction<MasterlistGuest[]>>;
  messages: PartyMember[];
  messagesSupported: boolean;
  loading: boolean;
  error: string | null;
  isSyncing: boolean;
  syncMasterlist: (opts?: { silent?: boolean }) => Promise<void>;
  syncIfStale: (maxAgeMs?: number) => void;
}

export function useMasterlist(): UseMasterlistResult {
  const [masterlist, setMasterlist] = useState<MasterlistGuest[]>([]);
  const [messages, setMessages] = useState<PartyMember[]>([]);
  const [messagesSupported, setMessagesSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const lastFetchedRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  const syncMasterlist = useCallback(async (opts?: { silent?: boolean }) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    const silent = !!opts?.silent;
    if (!silent) setLoading(true);
    setIsSyncing(true);
    setError(null);

    try {
      const {
        guests,
        messages: nextMessages,
        messagesSupported: nextSupported,
      } = await fetchMasterlist();
      setMasterlist(guests);
      setMessages(nextMessages);
      setMessagesSupported(nextSupported);
      lastFetchedRef.current = Date.now();
    } catch (err) {
      if (!silent) {
        setError(
          err instanceof Error ? err.message : "Could not load guest masterlist."
        );
      }
    } finally {
      isSyncingRef.current = false;
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  const syncIfStale = useCallback(
    (maxAgeMs = 30_000) => {
      if (Date.now() - lastFetchedRef.current > maxAgeMs) {
        syncMasterlist({ silent: true });
      }
    },
    [syncMasterlist]
  );

  useEffect(() => {
    let active = true;
    lastFetchedRef.current = Date.now();
    fetchMasterlist()
      .then(({ guests, messages: nextMessages, messagesSupported: nextSupported }) => {
        if (!active) return;
        setMasterlist(guests);
        setMessages(nextMessages);
        setMessagesSupported(nextSupported);
        lastFetchedRef.current = Date.now();
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load guest masterlist."
        );
        setLoading(false);
      });

    // Periodic background sync every 15 minutes while the tab is visible
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncMasterlist({ silent: true });
      }
    }, SYNC_INTERVAL_MS);

    // Instant re-sync when switching back from editing Google Sheets (debounced 4s)
    const handleRecheck = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        Date.now() - lastFetchedRef.current > RECHECK_MIN_AGE_MS
      ) {
        syncMasterlist({ silent: true });
      }
    };

    const handleOnline = () => {
      syncMasterlist({ silent: true });
    };

    window.addEventListener("focus", handleRecheck);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleRecheck);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleRecheck);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleRecheck);
    };
  }, [syncMasterlist]);

  return {
    masterlist,
    setMasterlist,
    messages,
    messagesSupported,
    loading,
    error,
    isSyncing,
    syncMasterlist,
    syncIfStale,
  };
}

