"use client";

import { useEffect, useMemo, useState } from "react";
import { CLUSTER, TOKEN_SYMBOL } from "@/lib/token-config";
import Avatar from "@/app/components/Avatar";

type GameKey = "all" | "flip" | "reaction" | "ttt";

type Player = {
  wallet: string;
  wins: number;
  losses?: number;
  volumeSol: number;
  multiplier: number;
  pointsTotal: number;
  tier?: number;
  burnedAmount?: number;
  lastSeenAt?: string;

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

type Stats = {
  playersCount: number;
  eventsCount: number;
  totalVolumeSol: number;
  totalGames: number;
  totalBurned: number;
  topWallet: string | null;
  topPoints: number;
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

function safeDate(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function timeAgo(iso?: string | null) {
  const d = safeDate(iso);
  if (!d) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function winRate(wins?: number, losses?: number) {
  const w = Number(wins || 0);
  const l = Number(losses || 0);
  const denom = w + l;
  if (!denom) return null;
  return (w / denom) * 100;
}

function eventBadge(type: string) {
  const t = String(type || "");
  const norm = t.includes(":") ? t.replace(":", "_") : t;

  if (norm === "burn" || norm === "burn_dev") {
    return { label: "BURN", cls: "bg-amber-500/15 text-amber-200 border-amber-500/30" };
  }

  if (norm.endsWith("_win")) return { label: "WIN", cls: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" };
  if (norm.endsWith("_loss")) return { label: "LOSS", cls: "bg-rose-500/15 text-rose-200 border-rose-500/30" };
  if (norm.endsWith("_play")) return { label: "PLAY", cls: "bg-sky-500/15 text-sky-200 border-sky-500/30" };

  return { label: "EVENT", cls: "bg-gray-500/15 text-gray-200 border-gray-500/30" };
}

function parseGameFromType(type: string) {
  const t = String(type || "");
  const norm = t.includes(":") ? t.replace(":", "_") : t;
  if (norm.startsWith("flip_")) return "flip";
  if (norm.startsWith("reaction_")) return "reaction";
  if (norm.startsWith("ttt_")) return "ttt";
  return null;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="text-xs px-2 py-1 rounded border border-gray-800 bg-gray-950 hover:bg-white/5"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 900);
        } catch {}
      }}
      title="Copy wallet"
      type="button"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ShareRankButton({ text, label = "Share" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="text-xs px-2 py-1 rounded border border-gray-800 bg-gray-950 hover:bg-white/5"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 900);
        } catch {}
      }}
      title="Copy share text"
      type="button"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}

/** Strong hover glow for Top 3 + smooth lift */
function podiumGlow(rank: 1 | 2 | 3) {
  const base = "transition-all duration-200 ease-out will-change-transform hover:-translate-y-0.5";

  if (rank === 1) {
    return [
      base,
      "ring-1 ring-yellow-400/25",
      "shadow-[0_0_42px_rgba(255,215,0,0.18)]",
      "hover:ring-2 hover:ring-yellow-300/55",
      "hover:shadow-[0_0_78px_rgba(255,215,0,0.38)]",
    ].join(" ");
  }

  if (rank === 2) {
    return [
      base,
      "ring-1 ring-slate-200/20",
      "shadow-[0_0_38px_rgba(180,180,200,0.14)]",
      "hover:ring-2 hover:ring-slate-100/50",
      "hover:shadow-[0_0_68px_rgba(180,180,200,0.32)]",
    ].join(" ");
  }

  return [
    base,
    "ring-1 ring-orange-400/18",
    "shadow-[0_0_34px_rgba(205,127,50,0.12)]",
    "hover:ring-2 hover:ring-orange-300/50",
    "hover:shadow-[0_0_64px_rgba(205,127,50,0.30)]",
  ].join(" ");
}

function podiumAccent(rank: 1 | 2 | 3) {
  if (rank === 1) return "border-yellow-500/30 hover:border-yellow-400/60";
  if (rank === 2) return "border-slate-300/25 hover:border-slate-200/50";
  return "border-orange-500/25 hover:border-orange-400/50";
}

function Top10Badge() {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
      TOP 10
    </span>
  );
}

function CrownBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-200">
      👑 KING
    </span>
  );
}

function PodiumCard({
  rank,
  player,
  shareText,
}: {
  rank: 1 | 2 | 3;
  player: Player;
  shareText: string;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const wr = winRate(player.wins, player.losses);

  const glimmer =
    rank === 1
      ? "absolute -inset-10 pointer-events-none rounded-[999px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[pulse_2.6s_ease-in-out_infinite] bg-[radial-gradient(circle,rgba(255,215,0,0.22),rgba(0,0,0,0)_65%)]"
      : "";

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-white/5 to-black/40 p-4",
        podiumAccent(rank),
        podiumGlow(rank),
      ].join(" ")}
    >
      {rank === 1 ? <div className={glimmer} /> : null}

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-200 font-semibold flex items-center">
            {medal} Rank #{rank}
            {rank === 1 ? <CrownBadge /> : null}
          </div>
          <div className="text-xs text-gray-500">{timeAgo(player.lastSeenAt)}</div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Avatar wallet={player.wallet} size={40} />
          <div className="min-w-0">
            <div className="font-semibold truncate">{shortWallet(player.wallet)}</div>
            <div className="text-xs text-gray-500 truncate">{player.wallet}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-gray-900 bg-black/40 p-2">
            <div className="text-[10px] text-gray-500">Points</div>
            <div className="text-sm font-semibold">{Number(player.pointsTotal ?? 0).toFixed(0)}</div>
          </div>
          <div className="rounded-lg border border-gray-900 bg-black/40 p-2">
            <div className="text-[10px] text-gray-500">Multiplier</div>
            <div className="text-sm font-semibold">{Number(player.multiplier ?? 1).toFixed(2)}x</div>
          </div>
          <div className="rounded-lg border border-gray-900 bg-black/40 p-2">
            <div className="text-[10px] text-gray-500">Winrate</div>
            <div className="text-sm font-semibold">{wr === null ? "—" : `${wr.toFixed(0)}%`}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Volume:{" "}
            <span className="text-gray-200 font-semibold">{Number(player.volumeSol ?? 0).toFixed(2)}</span>{" "}
            SOL
          </div>
          <div className="flex items-center gap-2">
            <ShareRankButton text={shareText} label="Share" />
            <CopyButton value={player.wallet} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardSection({
  compact = false,
  pollMs,
  showStats,
  showActivity,
  tableLimit,
  activityLimit,
  refreshKey,
}: {
  compact?: boolean;
  pollMs?: number;
  showStats?: boolean;
  showActivity?: boolean;
  tableLimit?: number;
  activityLimit?: number;
  refreshKey?: number | string;
}) {
  const effectiveShowStats = showStats ?? !compact;
  const effectiveShowActivity = showActivity ?? !compact;

  const effectivePollMs = pollMs ?? 5000;
  const effectiveTableLimit = tableLimit ?? (compact ? 10 : 50);
  const effectiveActivityLimit = activityLimit ?? 20;

  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [gameFilter, setGameFilter] = useState<GameKey>("all");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const tasks: Promise<any>[] = [fetch("/api/leaderboard", { cache: "no-store" }).then((r) => r.json())];

      if (effectiveShowActivity) tasks.push(fetch("/api/events", { cache: "no-store" }).then((r) => r.json()));
      if (effectiveShowStats) tasks.push(fetch("/api/stats", { cache: "no-store" }).then((r) => r.json()));

      const settled = await Promise.allSettled(tasks);

      const lb = settled[0];
      if (lb.status === "fulfilled" && Array.isArray(lb.value)) setPlayers(lb.value);

      let idx = 1;

      if (effectiveShowActivity) {
        const ev = settled[idx++];
        if (ev && ev.status === "fulfilled" && Array.isArray(ev.value)) setEvents(ev.value);
      } else {
        setEvents([]);
      }

      if (effectiveShowStats) {
        const st = settled[idx++];
        if (st && st.status === "fulfilled" && st.value && typeof st.value === "object") {
          setStats({
            playersCount: Number(st.value.playersCount ?? 0),
            eventsCount: Number(st.value.eventsCount ?? 0),
            totalVolumeSol: Number(st.value.totalVolumeSol ?? 0),
            totalGames: Number(st.value.totalGames ?? 0),
            totalBurned: Number(st.value.totalBurned ?? 0),
            topWallet: st.value.topWallet ?? null,
            topPoints: Number(st.value.topPoints ?? 0),
          });
        }
      } else {
        setStats(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, effectivePollMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePollMs, effectiveShowActivity, effectiveShowStats]);

  useEffect(() => {
    if (refreshKey === undefined) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const networkLabel = CLUSTER === "mainnet-beta" ? "MAINNET" : "DEVNET";

  const gameLabels = useMemo(() => {
    const api = players?.[0]?.gameLabels;
    return {
      flip: api?.flip ?? "Flip",
      reaction: api?.reaction ?? "Reaction",
      ttt: api?.ttt ?? "Tic Tac Toe",
    };
  }, [players]);

  const top3 = useMemo(() => players.slice(0, 3), [players]);

  const rows = useMemo(() => {
    const slice = players.slice(0, effectiveTableLimit);

    return slice.map((p, index) => {
      const winsByGame = p.winsByGame ?? { flip: 0, reaction: 0, ttt: 0 };
      const winsShown = gameFilter === "all" ? Number(p.wins ?? 0) : Number((winsByGame as any)[gameFilter] ?? 0);

      const lossesByGame = p.lossesByGame ?? { flip: 0, reaction: 0, ttt: 0 };
      const lossesShown = gameFilter === "all" ? Number(p.losses ?? 0) : Number((lossesByGame as any)[gameFilter] ?? 0);

      const wr = winsShown + lossesShown > 0 ? (winsShown / (winsShown + lossesShown)) * 100 : null;

      const shareText =
        `Solarena Rank #${index + 1} • ${Number(p.pointsTotal ?? 0).toFixed(0)} pts • ` +
        `${Number(p.multiplier ?? 1).toFixed(2)}x • ${winsShown} wins • ` +
        `${Number(p.volumeSol ?? 0).toFixed(2)} SOL • wallet ${shortWallet(p.wallet)}`;

      return {
        ...p,
        _rank: index + 1,
        _winsShown: winsShown,
        _lossesShown: lossesShown,
        _winrateShown: wr,
        _shareText: shareText,
      } as any;
    });
  }, [players, gameFilter, effectiveTableLimit]);

  const eventsShown = useMemo(() => events.slice(0, effectiveActivityLimit), [events, effectiveActivityLimit]);

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl md:text-4xl font-bold">Leaderboard</h2>
            <span className="text-xs px-2 py-1 rounded-full border border-gray-700 text-gray-300">
              {networkLabel} • {TOKEN_SYMBOL}
            </span>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)] animate-pulse" />
              <span className="text-xs text-gray-500">Live {loading ? "• Updating…" : "• Synced"}</span>
            </div>
          </div>

          <button
            className="text-xs px-3 py-2 rounded-lg border border-gray-800 bg-gray-950 hover:bg-white/5"
            onClick={load}
            type="button"
          >
            Refresh
          </button>
        </div>

        {effectiveShowStats ? (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Players" value={stats ? formatCompact(stats.playersCount) : "—"} sub="Unique wallets" />
            <StatCard label="Plays" value={stats ? formatCompact(stats.totalGames) : "—"} sub="Tracked matches" />
            <StatCard
              label="Volume"
              value={stats ? `${Number(stats.totalVolumeSol).toFixed(2)} SOL` : "—"}
              sub="Total volume"
            />
            <StatCard label="Total burned" value={stats ? formatCompact(stats.totalBurned) : "—"} sub={`${TOKEN_SYMBOL} burned`} />
          </section>
        ) : null}
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
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

        {top3.length >= 3 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <PodiumCard rank={2} player={top3[1]} shareText={(rows?.[1] as any)?._shareText ?? ""} />
            <PodiumCard rank={1} player={top3[0]} shareText={(rows?.[0] as any)?._shareText ?? ""} />
            <PodiumCard rank={3} player={top3[2]} shareText={(rows?.[2] as any)?._shareText ?? ""} />
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-950/80 border-b border-gray-800">
                <th className="p-3 text-left text-sm text-gray-300">Rank</th>
                <th className="p-3 text-left text-sm text-gray-300">Player</th>
                <th className="p-3 text-center text-sm text-gray-300">Wins</th>
                <th className="p-3 text-center text-sm text-gray-300">Winrate</th>
                <th className="p-3 text-center text-sm text-gray-300">Volume (SOL)</th>
                <th className="p-3 text-center text-sm text-gray-300">Multiplier</th>
                <th className="p-3 text-center text-sm text-gray-300">Points</th>
                <th className="p-3 text-center text-sm text-gray-300">Last active</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((p: any) => {
                const wr = p._winrateShown as number | null;
                const isTop10 = Number(p._rank) <= 10;

                return (
                  <tr
                    key={p.wallet}
                    className={[
                      "border-t border-gray-900 hover:bg-white/5 transition-colors",
                      isTop10 ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "",
                    ].join(" ")}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span>{p._rank}</span>
                        {isTop10 ? <Top10Badge /> : null}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar wallet={p.wallet} size={36} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate">{shortWallet(p.wallet)}</div>
                            <ShareRankButton text={p._shareText} label="Share" />
                            <CopyButton value={p.wallet} />
                          </div>
                          <div className="text-xs text-gray-500 truncate">{p.wallet}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-center">{Number(p._winsShown ?? 0)}</td>
                    <td className="p-3 text-center">{wr === null ? "—" : `${wr.toFixed(0)}%`}</td>
                    <td className="p-3 text-center">{Number(p.volumeSol ?? 0).toFixed(2)}</td>
                    <td className="p-3 text-center">{Number(p.multiplier ?? 1).toFixed(2)}x</td>
                    <td className="p-3 text-center">{Number(p.pointsTotal ?? 0).toFixed(0)}</td>
                    <td className="p-3 text-center text-gray-400">{timeAgo(p.lastSeenAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <div className="p-4 text-gray-400">No players yet. Post a match to start the board.</div>
          ) : null}
        </div>
      </section>

      {effectiveShowActivity ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Live activity</h3>
            <div className="text-xs text-gray-500">Last {effectiveActivityLimit} events</div>
          </div>

          <div className="border border-gray-800 rounded-xl overflow-hidden">
            {eventsShown.length === 0 ? (
              <div className="p-4 text-gray-400">No events yet.</div>
            ) : (
              <ul className="divide-y divide-gray-900">
                {eventsShown.map((e) => {
                  const badge = eventBadge(e.type);
                  const game = parseGameFromType(e.type);
                  const gameLabel = game ? (gameLabels as any)[game] : null;

                  const shareText =
                    `Solarena activity • ${shortWallet(e.wallet)} • ${e.type}` +
                    (e.amountSol ? ` • ${e.amountSol.toFixed(2)} SOL` : "");

                  return (
                    <li key={e.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={[
                            "inline-flex items-center justify-center rounded-full border px-2 py-1 text-[10px] font-semibold",
                            badge.cls,
                          ].join(" ")}
                        >
                          {badge.label}
                        </span>

                        <div className="min-w-0">
                          <div className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</div>
                          <div className="font-medium truncate">
                            <span className="text-gray-200">{shortWallet(e.wallet)}</span>{" "}
                            <span className="text-gray-500">
                              {gameLabel ? `${gameLabel} • ` : ""}
                              {e.type}
                            </span>
                            {e.amountSol ? <span className="text-gray-500"> • {e.amountSol.toFixed(2)} SOL</span> : null}
                          </div>
                          {e.meta ? <div className="text-xs text-gray-600 truncate max-w-[72ch]">{e.meta}</div> : null}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <ShareRankButton text={shareText} label="Share" />
                        <CopyButton value={e.wallet} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      ) : null}
    </section>
  );
}