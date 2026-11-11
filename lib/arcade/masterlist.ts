import { MasterlistGuest } from './types';

export const DEFAULT_MASTERLIST_URL = '/masterlist.json';

export function getMasterlistUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MASTERLIST_URL?.trim();
  return normalizeSheetUrl(configured || DEFAULT_MASTERLIST_URL);
}

export function getRsvpSubmitUrl(): string {
  return process.env.NEXT_PUBLIC_RSVP_SUBMIT_URL?.trim() || '';
}

/**
 * Converts a standard Google Sheets `/edit` URL into its CSV export URL
 * while leaving published CSV, gviz, Apps Script, or JSON API URLs intact.
 */
export function normalizeSheetUrl(rawUrl: string): string {
  if (!rawUrl.includes('docs.google.com/spreadsheets/d/')) {
    return rawUrl;
  }
  if (rawUrl.includes('output=csv') || rawUrl.includes('gviz/tq') || rawUrl.includes('format=csv')) {
    return rawUrl;
  }
  const match = rawUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return rawUrl;
  const gidMatch = rawUrl.match(/[?&#]gid=([0-9]+)/);
  const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
  return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv${gidParam}`;
}

function splitCompanionList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return dedupeNames(raw.map((v) => String(v ?? '').trim()));
  }
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return dedupeNames(trimmed.split(/[,;|\n]+/).map((s) => s.trim()));
}

function dedupeNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    if (!name) continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

function parseCsvRows(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell.trim());
      cell = '';
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

const PRIMARY_CONTACT_KEYS = new Set([
  'main_contact',
  'maincontact',
  'primary_contact',
  'primarycontact',
  'primary',
  'primary_name',
  'primaryname',
  'primary_guest',
  'primaryguest',
  'host',
  'name',
  'full_name',
  'fullname',
  'player',
  'player_name'
]);

const ROW_GUEST_KEYS = new Set(['guest_name', 'guestname', 'guest']);

const COMPANION_KEYS = new Set([
  'companions',
  'companion',
  'guests',
  'plus_ones',
  'plusones',
  'plus_one',
  'under_name',
  'undername',
  'added_names',
  'addednames',
  'added_guests',
  'members',
  'household',
  'allowed_guests'
]);

export function stripHonorific(name: string): string {
  return name
    .trim()
    .replace(/^(mr|mrs|ms|miss|dr|engr|atty|rev|prof|hon|sir|ma'am)\.?\s+/i, '')
    .trim();
}

function mapCategoryToClan(category?: string): string | undefined {
  if (!category) return undefined;
  const c = category.toLowerCase();
  if (c.includes('groom')) return 'Team Jero';
  if (c.includes('bride')) return 'Team Viah';
  if (c.includes('entourage') || c.includes('sponsor')) return 'Both Players';
  return undefined;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function normalizeRecord(rec: Record<string, unknown>): MasterlistGuest | null {
  let mainContact = '';
  let rowGuestName = '';
  let partyId: string | undefined;
  let role: string | undefined;
  let category: string | undefined;
  const companionPool: string[] = [];
  let clan: string | undefined;
  let email: string | undefined;

  for (const [rawKey, value] of Object.entries(rec)) {
    const k = normalizeKey(rawKey);
    if (!mainContact && PRIMARY_CONTACT_KEYS.has(k) && typeof value === 'string') {
      mainContact = value.trim();
    } else if (!rowGuestName && ROW_GUEST_KEYS.has(k) && typeof value === 'string') {
      rowGuestName = value.trim();
    } else if (k === 'party_id' || k === 'partyid' || k === 'group_id') {
      const s = String(value ?? '').trim();
      if (s) partyId = s;
    } else if (k === 'party_role' || k === 'partyrole' || k === 'role') {
      const s = String(value ?? '').trim();
      if (s) role = s;
    } else if (k === 'category' || k === 'group') {
      const s = String(value ?? '').trim();
      if (s) category = s;
    } else if (
      COMPANION_KEYS.has(k) ||
      /^(guest|companion|plus_?one|member)_?\d+$/.test(k)
    ) {
      companionPool.push(...splitCompanionList(value));
    } else if (k === 'clan' || k === 'side' || k === 'alliance') {
      const s = String(value ?? '').trim();
      if (s) clan = s;
    } else if (k === 'email' || k === 'comms_email') {
      const s = String(value ?? '').trim();
      if (s) email = s;
    }
  }

  const primaryName = mainContact || rowGuestName;
  if (!primaryName) return null;
  const primaryLower = primaryName.toLowerCase();
  const isCompanionRow =
    Boolean(mainContact && rowGuestName) &&
    rowGuestName.toLowerCase() !== primaryLower;

  if (isCompanionRow) {
    companionPool.unshift(rowGuestName);
  }

  const companions = dedupeNames(companionPool).filter(
    (c) => c.toLowerCase() !== primaryLower
  );

  const companionDetails = companions.map((c) => ({
    name: c,
    role: isCompanionRow && c.toLowerCase() === rowGuestName.toLowerCase() ? role : undefined
  }));

  return {
    name: primaryName,
    partyId,
    role: isCompanionRow ? undefined : role,
    category,
    companions,
    companionDetails,
    clan: clan || mapCategoryToClan(category),
    email
  };
}

function parseGvizResponse(text: string): MasterlistGuest[] | null {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?\s*$/);
  if (!match) return null;
  const parsed = JSON.parse(match[1]) as {
    table?: {
      cols?: Array<{ label?: string; id?: string }>;
      rows?: Array<{ c?: Array<{ v?: unknown; f?: string } | null> }>;
    };
  };
  const cols = parsed.table?.cols ?? [];
  const rows = parsed.table?.rows ?? [];
  const headers = cols.map((c, idx) => c.label || c.id || `col_${idx}`);
  const guests: MasterlistGuest[] = [];

  for (const r of rows) {
    const rec: Record<string, unknown> = {};
    (r.c ?? []).forEach((cell, idx) => {
      if (cell) rec[headers[idx]] = cell.f ?? cell.v ?? '';
    });
    const entry = normalizeRecord(rec);
    if (entry) guests.push(entry);
  }
  return guests;
}

function mergeMasterlistGuests(entries: MasterlistGuest[]): MasterlistGuest[] {
  const byParty = new Map<string, MasterlistGuest>();
  for (const entry of entries) {
    const key = entry.partyId
      ? `${entry.partyId.toLowerCase()}::${entry.name.toLowerCase()}`
      : entry.name.toLowerCase();
    const existing = byParty.get(key);
    if (!existing) {
      byParty.set(key, {
        ...entry,
        companions: [...entry.companions],
        companionDetails: [...(entry.companionDetails ?? [])]
      });
    } else {
      const primaryLower = existing.name.toLowerCase();
      existing.companions = dedupeNames([
        ...existing.companions,
        ...entry.companions
      ]).filter((c) => c.toLowerCase() !== primaryLower);

      const detailMap = new Map<string, { name: string; role?: string }>();
      for (const d of [
        ...(existing.companionDetails ?? []),
        ...(entry.companionDetails ?? [])
      ]) {
        const dk = d.name.toLowerCase();
        if (dk === primaryLower) continue;
        const prev = detailMap.get(dk);
        if (!prev || (!prev.role && d.role)) {
          detailMap.set(dk, { name: d.name, role: d.role });
        }
      }
      existing.companionDetails = Array.from(detailMap.values());

      if (!existing.role && entry.role) existing.role = entry.role;
      if (!existing.category && entry.category) existing.category = entry.category;
      if (!existing.clan && entry.clan) existing.clan = entry.clan;
      if (!existing.email && entry.email) existing.email = entry.email;
    }
  }
  return Array.from(byParty.values());
}

export function parseMasterlistText(rawText: string): MasterlistGuest[] {
  const trimmed = rawText.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return [];

  if (/^\s*(<!doctype|<html)/i.test(trimmed)) {
    throw new Error(
      'Masterlist URL returned an HTML/login page instead of JSON/CSV. In Google Apps Script, set "Execute as: Me" and "Who has access: Anyone".'
    );
  }

  if (trimmed.includes('google.visualization.Query.setResponse(')) {
    const gviz = parseGvizResponse(trimmed);
    if (gviz) return mergeMasterlistGuests(gviz);
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const data = JSON.parse(trimmed) as unknown;
    const list: unknown[] = Array.isArray(data)
      ? data
      : typeof data === 'object' && data !== null
        ? ((data as Record<string, unknown>).guests as unknown[]) ||
          ((data as Record<string, unknown>).data as unknown[]) ||
          ((data as Record<string, unknown>).records as unknown[]) ||
          ((data as Record<string, unknown>).rows as unknown[]) ||
          []
        : [];

    const guests: MasterlistGuest[] = [];
    for (const item of list) {
      if (typeof item === 'object' && item !== null) {
        const entry = normalizeRecord(item as Record<string, unknown>);
        if (entry) guests.push(entry);
      }
    }
    return mergeMasterlistGuests(guests);
  }

  const rows = parseCsvRows(trimmed);
  if (rows.length < 2) return [];
  const headers = rows[0];
  const guests: MasterlistGuest[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const rec: Record<string, unknown> = {};
    headers.forEach((h, colIdx) => {
      if (h) rec[h] = values[colIdx] ?? '';
    });
    const entry = normalizeRecord(rec);
    if (entry) guests.push(entry);
  }
  return mergeMasterlistGuests(guests);
}

export async function fetchMasterlist(url?: string): Promise<{
  guests: MasterlistGuest[];
  source: string;
}> {
  const targetUrl = url ? normalizeSheetUrl(url) : getMasterlistUrl();
  const res = await fetch(targetUrl, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch masterlist (HTTP ${res.status})`);
  }
  const text = await res.text();
  const guests = parseMasterlistText(text);
  return { guests, source: targetUrl };
}

export interface RsvpSubmissionPayload {
  name: string;
  email: string;
  attendance: string;
  addedGuests: string[];
  guestCount: number;
  totalPartyCount: number;
  clan: string;
  msg: string;
}

export async function submitRsvpEntry(payload: RsvpSubmissionPayload): Promise<void> {
  const submitUrl = getRsvpSubmitUrl();
  if (!submitUrl) return;

  // Use text/plain to stay compatible with Google Apps Script web apps without CORS preflight failures.
  const res = await fetch(submitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  if (!res.ok && res.type !== 'opaque') {
    throw new Error(`Failed to submit RSVP (HTTP ${res.status})`);
  }
}

