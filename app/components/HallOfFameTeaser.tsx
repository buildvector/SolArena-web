// app/components/HallOfFameTeaser.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/app/components/Avatar";

type Player = {
  wallet: string;
  pointsTotal: number;
  multiplier: number;
  wins: number;
  volumeSol: number;
  lastSeenAt?: string;
};

function shortWallet(w: string) {
  return w.length > 10 ? `${w.slice(0, 6)}...${w.slice(-4)}` : w;
}

function glow(rank: 1 | 2 | 3) {
  const base = "rounded-2xl border bg-gradient-to-b from-white/5 to-black/40 p-4 transition-all";
  if (rank === 1) return `${base} border-rose-500/25 shadow-[0_0_70px_rgba(244,63,94,0.20)]`;
  if (rank === 2) return `${base} border-violet-400/20 shadow-[0_0_60px_rgba(168,85,247,0.18)]`;
  return `${base} border-cyan-400/18 shadow-[0_0_55px_rgba(34,211,238,0.16)]`;
}

export default function HallOfFameTeaser({ pollMs = 8000 }: { pollMs?: number }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const r = await fetch("/api/leaderboard", { cache: "no-store" });
      const j = await r.json().catch(() => []);
      if (r.ok && Array.isArray(j)) setPlayers(j);
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

  const top3 = useMemo(() => players.slice(0, 3), [players]);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-[0_0_70px_rgba(0,0,0,0.65)] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="text-sm font-extrabold tracking-tight">Hall of Fame (Top 3)</div>
        <a className="text-xs text-gray-300 hover:text-white transition" href="/leaderboard">
          Open →
        </a>
      </div>

      <div className="p-4 space-y-3">
        {loading && top3.length === 0 ? (
          <div className="text-sm text-gray-400">Loading…</div>
        ) : top3.length === 0 ? (
          <div className="text-sm text-gray-400">No players yet.</div>
        ) : (
          top3.map((p, i) => {
            const rank = (i + 1) as 1 | 2 | 3;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
            return (
              <div key={p.wallet} className={glow(rank)}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-200">
                    {medal} Rank #{rank}
                  </div>
                  <div className="text-xs text-gray-500">{Math.floor(p.pointsTotal ?? 0)} pts</div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <Avatar wallet={p.wallet} size={38} />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{shortWallet(p.wallet)}</div>
                    <div className="text-xs text-gray-500 truncate">{p.wallet}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                    <div className="text-gray-500">Wins</div>
                    <div className="mt-0.5 font-semibold text-gray-200">{Number(p.wins ?? 0)}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                    <div className="text-gray-500">Mult</div>
                    <div className="mt-0.5 font-semibold text-gray-200">{Number(p.multiplier ?? 1).toFixed(2)}x</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/40 p-2">
                    <div className="text-gray-500">Vol</div>
                    <div className="mt-0.5 font-semibold text-gray-200">{Number(p.volumeSol ?? 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="rounded-xl border border-yellow-400/18 bg-yellow-400/10 px-4 py-3">
          <div className="text-xs font-semibold text-yellow-200 tracking-widest">SCARCITY</div>
          <div className="mt-1 text-sm text-yellow-100">
            Only <span className="font-extrabold">20 wallets survive</span> with permanent OG status.
          </div>
          <div className="mt-1 text-xs text-yellow-100/70">
            
          </div>
        </div>
      </div>
    </section>
  );
}