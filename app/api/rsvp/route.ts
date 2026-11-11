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
  return (
    process.env.RSVP_SUBMIT_URL?.trim() ||
    process.env.NEXT_PUBLIC_RSVP_SUBMIT_URL?.trim() ||
    ""
  );
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
    });

    if (!upstream.ok) {
      return Response.json(
        { error: `Failed to submit RSVP (HTTP ${upstream.status})` },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, mode: "remote" });
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

