import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  normalizeSheetUrl,
  parseMasterlistPayload,
  RsvpSubmissionPayload,
} from "@/lib/arcade/masterlist";

function stripOuterQuotes(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "").trim();
}

function getServerMasterlistUrl(): string {
  const configured =
    process.env.MASTERLIST_URL ||
    process.env.NEXT_PUBLIC_MASTERLIST_URL ||
    "";
  const cleaned = stripOuterQuotes(configured);
  return cleaned ? normalizeSheetUrl(cleaned) : "";
}

function getServerRsvpSubmitUrl(): string {
  const configured =
    process.env.RSVP_SUBMIT_URL ||
    process.env.NEXT_PUBLIC_RSVP_SUBMIT_URL ||
    "";
  const cleaned = stripOuterQuotes(configured);
  if (cleaned) return cleaned;

  const masterlistUrl = getServerMasterlistUrl();
  if (masterlistUrl.includes("script.google.com/macros/")) {
    return masterlistUrl;
  }
  return "";
}

export async function GET(request: Request) {
  // Access request.url so Next.js 16 Cache Components treats this route as dynamic request-time.
  const { searchParams } = new URL(request.url);
  const queryFilter = searchParams.get("q")?.trim().toLowerCase() || "";

  try {
    const targetUrl = getServerMasterlistUrl();
    let rawText = "";

    if (targetUrl && /^https?:\/\//i.test(targetUrl)) {
      const res = await fetch(targetUrl, {
        cache: "no-store",
        redirect: "follow",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) {
        const hint =
          res.status === 404
            ? "Apps Script URL returned HTTP 404. Update MASTERLIST_URL & RSVP_SUBMIT_URL in Netlify Environment Variables to your active /exec URL and redeploy."
            : res.status === 401 || res.status === 403
              ? "Apps Script denied access. Deploy with 'Execute as: Me' and 'Who has access: Anyone'."
              : `Failed to fetch masterlist (HTTP ${res.status})`;
        return Response.json({ error: hint }, { status: 502 });
      }
      rawText = await res.text();
    } else {
      const fallbackPath = path.join(process.cwd(), "public", "masterlist.json");
      try {
        rawText = await readFile(fallbackPath, "utf8");
      } catch {
        return Response.json(
          {
            error:
              "MASTERLIST_URL is not configured (and fallback masterlist.json was unavailable). Set MASTERLIST_URL & RSVP_SUBMIT_URL in Netlify Environment Variables and redeploy.",
          },
          { status: 500 }
        );
      }
    }

    const {
      guests: parsed,
      messages: parsedMessages,
      messagesSupported,
    } = parseMasterlistPayload(rawText);
    if (
      parsed.length === 0 &&
      /"data"\s*:\s*\[\s*\{[^}]*""\s*:/.test(rawText)
    ) {
      return Response.json(
        {
          error:
            "Apps Script returned rows with empty \"\" column keys. Ensure headers are in Row 1 (or update doGet(e) to locate the header row).",
        },
        { status: 502 }
      );
    }
    // Strip any email field so personal contact details are never exposed to the browser
    const sanitized = parsed.map(({ email: _email, ...rest }) => {
      void _email;
      return rest;
    });

    const messages = parsedMessages.map((entry) => ({
      name: entry.name,
      party: entry.party,
      clan: entry.clan,
      msg: entry.msg,
      ...(entry.attendance ? { attendance: entry.attendance } : {}),
      ...(typeof entry.guestCount === "number" ? { guestCount: entry.guestCount } : {}),
      ...(entry.addedGuests && entry.addedGuests.length > 0
        ? { addedGuests: entry.addedGuests }
        : {}),
    }));

    const guests = queryFilter
      ? sanitized.filter(
          (g) =>
            g.name.toLowerCase().includes(queryFilter) ||
            g.companions.some((c) => c.toLowerCase().includes(queryFilter))
        )
      : sanitized;

    return Response.json(
      { guests, messages, messagesSupported },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not load guest masterlist.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RsvpSubmissionPayload;
    const primaryGuestName = (payload?.guest_name || payload?.name || "").trim();
    if (!payload || !primaryGuestName) {
      return Response.json(
        { error: "Invalid RSVP payload." },
        { status: 400 }
      );
    }

    const upstreamPayload: RsvpSubmissionPayload = {
      ...payload,
      action: "update_status",
      name: primaryGuestName,
      guest_name: primaryGuestName,
    };

    const submitUrl = getServerRsvpSubmitUrl();
    const isTestEmail = upstreamPayload.email
      ?.trim()
      .toLowerCase()
      .endsWith("@example.com");

    if (!submitUrl || isTestEmail) {
      return Response.json({ ok: true, mode: "local" });
    }

    // Mirror core guest fields onto query params as well as JSON body so
    // Apps Script doPost(e) works whether it reads e.postData.contents or e.parameter.
    const upstreamUrl = new URL(submitUrl);
    upstreamUrl.searchParams.set("action", "update_status");
    upstreamUrl.searchParams.set("guest_name", primaryGuestName);
    upstreamUrl.searchParams.set("name", primaryGuestName);
    if (upstreamPayload.party_id) {
      upstreamUrl.searchParams.set("party_id", upstreamPayload.party_id);
    }
    if (upstreamPayload.main_contact) {
      upstreamUrl.searchParams.set("main_contact", upstreamPayload.main_contact);
    }
    if (upstreamPayload.status) {
      upstreamUrl.searchParams.set("status", upstreamPayload.status);
    }

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(upstreamPayload),
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
    });

    const upstreamText = await upstream.text();
    const trimmed = upstreamText.trim();

    if (/^\s*(<!doctype|<html)/i.test(trimmed)) {
      const missingDoPost = /Script function not found:\s*doPost/i.test(trimmed);
      return Response.json(
        {
          error: missingDoPost
            ? "Google Apps Script is missing doPost(e) or needs a New Version deployment."
            : "Google Apps Script returned an HTML/login page on POST. Deploy as 'Execute as: Me' and 'Who has access: Anyone'.",
        },
        { status: 502 }
      );
    }

    let upstreamJson: Record<string, unknown> | null = null;
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          upstreamJson = parsed as Record<string, unknown>;
        }
      } catch {
        // Non-JSON text handled below
      }
    }

    if (!upstream.ok) {
      const upstreamErr =
        (upstreamJson &&
          String(upstreamJson.error ?? upstreamJson.message ?? "").trim()) ||
        `Failed to submit RSVP (HTTP ${upstream.status})`;
      return Response.json({ error: upstreamErr }, { status: 502 });
    }

    if (
      upstreamJson &&
      (upstreamJson.status === "error" || upstreamJson.ok === false)
    ) {
      const upstreamErr =
        String(upstreamJson.message ?? upstreamJson.error ?? "").trim() ||
        "Google Apps Script rejected the RSVP update.";
      return Response.json({ error: upstreamErr }, { status: 502 });
    }

    return Response.json({ ok: true, mode: "remote", upstream: upstreamJson });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to process RSVP.",
      },
      { status: 500 }
    );
  }
}

