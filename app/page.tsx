"use client";

import { useEffect, useMemo, useState } from "react";
import { CLUSTER, TOKEN_SYMBOL } from "@/lib/token-config";
import BurnPanel from "./components/BurnPanel";

type GameKey = "all" | "flip" | "reaction" | "ttt";

type Player = {
  wallet: string;
  wins: number;
  volumeSol: number;
  multiplier: number;
  pointsTotal: number;
  tier?: number;
  burnedAmount?: number;

  winsByGame?: { flip: number; reaction: number; ttt: number };
  lossesByGame?: { flip: number; reaction: number; ttt: number };
  gameLabels?: { flip: string; reaction: string; ttt: string };
};

type Event = {
  id: string;
  createdAt: string;
  type: string;
  wallet: string;
  amountSol: number | null;
  meta: string | null;
};

function shortWallet(w: string) {
  return w.length > 10 ? `${w.slice(0, 6)}...${w.slice(-4)}` : w;
}

function formatCompact(n: number) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}k`;
  return `${v.toFixed(0)}`;
}

// 🔥 OFFICIEL TIER PLAN
const TIERS = [
  { name: "Tier 1", burn: 10_000 },
  { name: "Tier 2", burn: 25_000 },
  { name: "Tier 3", burn: 50_000 },
  { name: "Tier 4", burn: 100_000 },
  { name: "Tier 5", burn: 250_000 },
  { name: "Tier 6", burn: 500_000 },
  { name: "Tier 7", burn: 750_000 },
  { name: "Tier 8", burn: 1_000_000 },
  { name: "Tier 9", burn: 2_000_000 },
  { name: "Tier 10", burn: 5_000_000 },
];

function getTierFromBurn(burned: number) {
  let tierIndex = -1;
  for (let i = 0; i < TIERS.length; i++) {
    if (burned >= TIERS[i].burn) tierIndex = i;
  }
  return tierIndex >= 0 ? tierIndex + 1 : 0;
}

function getTierProgress(burned: number) {
  const tier = getTierFromBurn(burned);

  const prev = tier <= 0 ? 0 : TIERS[tier - 1].burn;
  const next = tier >= TIERS.length ? null : TIERS[tier]?.burn;

  if (!next) {
    return { tier, prev, next: null as number | null, pct: 100 };
  }

  const denom = Math.max(1, next - prev);
  const pct = Math.max(0, Math.min(100, ((burned - prev) / denom) * 100));
  return { tier, prev, next, pct };
}

function tierStyles(tier: number) {
  if (tier >= 9) return "bg-red-500/15 text-red-200 border-red-500/30";
  if (tier >= 7) return "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30";
  if (tier >= 4) return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-gray-500/15 text-gray-200 border-gray-500/30";
}

function TierBadge({ tier }: { tier: number }) {
  if (tier <= 0) return <span className="text-gray-500 text-sm">—</span>;

  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full border px-2 py-1 text-xs font-semibold",
        tierStyles(tier),
      ].join(" ")}
      title={TIERS[tier - 1]?.name}
    >
      🔥 {TIERS[tier - 1]?.name}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div className="h-full bg-white/60" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [gameFilter, setGameFilter] = useState<GameKey>("all");

  async function load() {
    const [lb, ev] = await Promise.all([
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ]);
    setPlayers(lb);
    setEvents(ev);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const networkLabel = CLUSTER === "mainnet-beta" ? "MAINNET" : "DEVNET";

  const gameLabels = useMemo(() => {
    // kommer fra API hvis det findes — ellers fallback
    const api = players?.[0]?.gameLabels;
    return {
      flip: api?.flip ?? "Flip",
      reaction: api?.reaction ?? "Reaction",
      ttt: api?.ttt ?? "Tic Tac Toe",
    };
  }, [players]);

  const rows = useMemo(() => {
    return players.map((p) => {
      const burned = Number(p.burnedAmount ?? 0);
      const prog = getTierProgress(burned);

      const winsByGame = p.winsByGame ?? { flip: 0, reaction: 0, ttt: 0 };

      const winsShown =
        gameFilter === "all"
          ? Number(p.wins ?? 0)
          : Number(winsByGame[gameFilter] ?? 0);

      return {
        ...p,
        burnedAmount: burned,
        tier: Number(p.tier ?? prog.tier),
        _progressPct: prog.pct,
        _nextTierBurn: prog.next,
        _winsShown: winsShown,
      };
    });
  }, [players, gameFilter]);

  return (
    <main className="min-h-screen bg-black text-white p-8 space-y-10">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold">Solarena</h1>
          <span className="text-xs px-2 py-1 rounded-full border border-gray-700 text-gray-300">
            {networkLabel} • {TOKEN_SYMBOL}
          </span>
        </div>
        <p className="text-gray-400">Play. Compete. Burn. Climb.</p>
      </header>

      {/* ✅ BURN PANEL */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Burn</h2>
        <BurnPanel onBurned={load} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Leaderboard</h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Game:</span>
            <select
              className="bg-gray-950 border border-gray-800 rounded-md px-3 py-2 text-sm"
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value as GameKey)}
            >
              <option value="all">All</option>
              <option value="flip">{gameLabels.flip}</option>
              <option value="reaction">{gameLabels.reaction}</option>
              <option value="ttt">{gameLabels.ttt}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-800">
            <thead>
              <tr className="bg-gray-900">
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Wallet</th>
                <th className="p-3 text-left">Tier</th>
                <th className="p-3 text-center">Burned</th>
                <th className="p-3 text-center">
                  {gameFilter === "all" ? "Wins" : `${gameLabels[gameFilter]} Wins`}
                </th>
                <th className="p-3 text-center">Volume (SOL)</th>
                <th className="p-3 text-center">Multiplier</th>
                <th className="p-3 text-center">Points</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((p, i) => {
                const next = (p as any)._nextTierBurn as number | null;
                const burned = Number(p.burnedAmount ?? 0);
                const remaining = next ? Math.max(0, next - burned) : 0;

                return (
                  <tr key={p.wallet} className="border-t border-gray-900 hover:bg-white/5 align-top">
                    <td className="p-3">{i + 1}</td>

                    <td className="p-3">
                      <div className="font-medium">{shortWallet(p.wallet)}</div>

                      <div className="text-xs text-gray-500 mt-1">
                        {next ? (
                          <>
                            <span className="text-gray-200 font-semibold">{formatCompact(remaining)}</span>{" "}
                            to next tier • unlock at {formatCompact(next)}
                          </>
                        ) : (
                          <span className="text-gray-300 font-semibold">MAX tier reached</span>
                        )}
                      </div>

                      <ProgressBar pct={Number((p as any)._progressPct ?? 0)} />
                    </td>

                    <td className="p-3">
                      <TierBadge tier={p.tier ?? 0} />
                    </td>

                    <td className="p-3 text-center">{formatCompact(burned)}</td>
                    <td className="p-3 text-center">{Number((p as any)._winsShown ?? 0)}</td>
                    <td className="p-3 text-center">{Number(p.volumeSol ?? 0).toFixed(2)}</td>
                    <td className="p-3 text-center">{Number(p.multiplier ?? 1).toFixed(2)}x</td>
                    <td className="p-3 text-center">{Number(p.pointsTotal ?? 0).toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p className="mt-6 text-gray-400">No players yet. Post a match to start the board.</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Live activity</h2>

        <div className="border border-gray-800 rounded-lg overflow-hidden">
          {events.length === 0 ? (
            <div className="p-4 text-gray-400">No events yet.</div>
          ) : (
            <ul className="divide-y divide-gray-900">
              {events.map((e) => (
                <li key={e.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-400">{new Date(e.createdAt).toLocaleString()}</div>
                    <div className="font-medium">
                      {shortWallet(e.wallet)} <span className="text-gray-400">{e.type}</span>
                      {e.amountSol ? <span className="text-gray-400"> • {e.amountSol.toFixed(2)} SOL</span> : null}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{e.meta ? e.meta.slice(0, 60) : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
