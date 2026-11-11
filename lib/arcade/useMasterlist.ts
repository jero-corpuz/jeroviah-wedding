"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMasterlist } from "@/lib/arcade/masterlist";
import { MasterlistGuest } from "@/lib/arcade/types";

export interface UseMasterlistResult {
  masterlist: MasterlistGuest[];
  setMasterlist: React.Dispatch<React.SetStateAction<MasterlistGuest[]>>;
  loading: boolean;
  error: string | null;
  isSyncing: boolean;
  syncMasterlist: (opts?: { silent?: boolean }) => Promise<void>;
  syncIfStale: (maxAgeMs?: number) => void;
}

export function useMasterlist(): UseMasterlistResult {
  const [masterlist, setMasterlist] = useState<MasterlistGuest[]>([]);
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
      const { guests } = await fetchMasterlist();
      setMasterlist(guests);
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
    fetchMasterlist()
      .then(({ guests }) => {
        if (!active) return;
        setMasterlist(guests);
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

  return {
    masterlist,
    setMasterlist,
    loading,
    error,
    isSyncing,
    syncMasterlist,
    syncIfStale,
  };
}

