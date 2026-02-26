// app/components/LiveStatsBar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { TOKEN_SYMBOL } from "@/lib/token-config";
import { formatEndsIn } from "@/lib/season";

type Stats = {
  playersCount: number;
  eventsCount: number;
  totalVolumeSol: number;
  totalGames: number;
  totalBurned: number;
  topWallet: string | null;
  topPoints: number;
};

function formatCompact(n: number) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}k`;
  return `${v.toFixed(0)}`;
}

function shortWallet(w: string) {
  return w.length > 10 ? `${w.slice(0, 6)}...${w.slice(-4)}` : w;
}

export default function LiveStatsBar({
  seasonEndIso,
  pollMs = 5000,
}: {
  seasonEndIso: string | null;
  pollMs?: number;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await fetch("/api/stats", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLoading(false);
        return;
      }

      setStats({
        playersCount: Number(j.playersCount ?? 0),
        eventsCount: Number(j.eventsCount ?? 0),
        totalVolumeSol: Number(j.totalVolumeSol ?? 0),
        totalGames: Number(j.totalGames ?? 0),
        totalBurned: Number(j.totalBurned ?? 0),
        topWallet: j.topWallet ?? null,
        topPoints: Number(j.topPoints ?? 0),
      });
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

  const endsIn = useMemo(() => formatEndsIn(seasonEndIso), [seasonEndIso]);

  return (
    <div className="rounded-2xl border border-rose-500/18 bg-black/40 backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,0.65)] overflow-hidden">
      <div className="relative px-4 py-3 sm:px-5 sm:py-4">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-14 left-1/2 h-32 w-[620px] -translate-x-1/2 blur-3xl bg-[radial-gradient(circle,rgba(244,63,94,0.16),rgba(168,85,247,0.12),rgba(34,211,238,0.06),rgba(0,0,0,0)_65%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
        </div>

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.45)] animate-pulse" />
              LIVE WAR STATS
            </span>

            <span className="text-xs text-gray-400">{loading ? "Updating…" : "Synced"}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Burned</div>
              <div className="mt-0.5 text-sm font-extrabold text-white">
                🔥 {stats ? formatCompact(stats.totalBurned) : "—"} {TOKEN_SYMBOL}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Games</div>
              <div className="mt-0.5 text-sm font-extrabold text-white">
                🎮 {stats ? formatCompact(stats.totalGames) : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Volume</div>
              <div className="mt-0.5 text-sm font-extrabold text-white">
                💰 {stats ? stats.totalVolumeSol.toFixed(2) : "—"} SOL
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Season ends</div>
              <div className="mt-0.5 text-sm font-extrabold text-white">🏆 {endsIn ?? "—"}</div>
            </div>
          </div>

          {stats?.topWallet ? (
            <div className="hidden xl:flex items-center gap-2 text-xs text-gray-400">
              <span className="text-gray-500">Top:</span>
              <span className="font-semibold text-gray-200">{shortWallet(stats.topWallet)}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-300">{Math.floor(stats.topPoints)} pts</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}