import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  normalizeSheetUrl,
  parseMasterlistText,
  RsvpSubmissionPayload,
} from "@/lib/arcade/masterlist";

function getServerMasterlistUrl(): string {
  const configured =
    process.env.MASTERLIST_URL?.trim() ||
    process.env.NEXT_PUBLIC_MASTERLIST_URL?.trim() ||
    "";
  return configured ? normalizeSheetUrl(configured) : "";
}

function getServerRsvpSubmitUrl(): string {
  const configured =
    process.env.RSVP_SUBMIT_URL?.trim() ||
    process.env.NEXT_PUBLIC_RSVP_SUBMIT_URL?.trim() ||
    "";
  if (configured) return configured;

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
      const res = await fetch(targetUrl, { cache: "no-store" });
      if (!res.ok) {
        return Response.json(
          { error: `Failed to fetch masterlist (HTTP ${res.status})` },
          { status: 502 }
        );
      }
      rawText = await res.text();
    } else {
      const fallbackPath = path.join(process.cwd(), "public", "masterlist.json");
      rawText = await readFile(fallbackPath, "utf8");
    }

    const parsed = parseMasterlistText(rawText);
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

    const guests = queryFilter
      ? sanitized.filter(
          (g) =>
            g.name.toLowerCase().includes(queryFilter) ||
            g.companions.some((c) => c.toLowerCase().includes(queryFilter))
        )
      : sanitized;

    return Response.json(
      { guests },
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
    if (!payload || !payload.name?.trim()) {
      return Response.json(
        { error: "Invalid RSVP payload." },
        { status: 400 }
      );
    }

    const submitUrl = getServerRsvpSubmitUrl();
    const isTestEmail = payload.email
      ?.trim()
      .toLowerCase()
      .endsWith("@example.com");

    if (!submitUrl || isTestEmail) {
      return Response.json({ ok: true, mode: "local" });
    }

    const upstream = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
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

