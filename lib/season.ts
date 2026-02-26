// app/lib/season.ts
function clean(s: any) {
    return String(s ?? "").trim();
  }
  
  function parseIso(iso: string | null | undefined): number | null {
    const v = clean(iso);
    if (!v) return null;
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  
  function pad2(n: number) {
    const x = Math.max(0, Math.floor(n));
    return x < 10 ? `0${x}` : `${x}`;
  }
  
  export const SEASON_NAME = clean(process.env.NEXT_PUBLIC_SEASON_NAME) || "SEASON 1";
  export const SEASON_TAGLINE = clean(process.env.NEXT_PUBLIC_SEASON_TAGLINE) || "7 DAY WAR";
  
  export const SEASON_START = clean(process.env.NEXT_PUBLIC_SEASON_START) || "2026-03-01T12:00:00Z";
  export const SEASON_END = clean(process.env.NEXT_PUBLIC_SEASON_END) || "2026-03-08T12:00:00Z";
  
  export const SITE_URL = clean(process.env.NEXT_PUBLIC_SITE_URL) || "";
  
  export function getSeasonWindow() {
    return {
      name: SEASON_NAME,
      tagline: SEASON_TAGLINE,
      startIso: SEASON_START,
      endIso: SEASON_END,
      siteUrl: SITE_URL,
    };
  }
  
  // Alias (så din page kan kalde getSeasonConfig)
  export function getSeasonConfig() {
    return getSeasonWindow();
  }
  
  export function msLeft(endIso: string | null) {
    const end = parseIso(endIso);
    if (!end) return null;
    const now = Date.now();
    return Math.max(0, end - now);
  }
  
  export function formatLeft(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
  
    if (d > 0) return `${d}d ${pad2(h)}h ${pad2(m)}m`;
    if (h > 0) return `${h}h ${pad2(m)}m ${pad2(s)}s`;
    if (m > 0) return `${m}m ${pad2(s)}s`;
    return `${s}s`;
  }
  
  export function formatEndsIn(endIso: string | null) {
    const left = msLeft(endIso);
    if (left == null) return null;
    return formatLeft(left);
  }
  
  export function getCountdownParts(endIso: string | null) {
    const end = parseIso(endIso);
    if (!end) {
      return { days: "--", hours: "--", mins: "--", secs: "--" };
    }
  
    const total = Math.max(0, Math.floor((end - Date.now()) / 1000));
  
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
  
    return {
      days: pad2(days), // ja, 2-cifret (00..)
      hours: pad2(hours),
      mins: pad2(mins),
      secs: pad2(secs),
    };
  }