// app/components/ActivityFeed.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TOKEN_SYMBOL } from "@/lib/token-config";

type EventRow = {
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

function safeJson(meta: string | null) {
  if (!meta) return null;
  try {
    return JSON.parse(meta);
  } catch {
    return null;
  }
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  const days = Math.floor(hr / 24);
  return `${days}d`;
}

type Synthetic = {
  id: string;
  createdAt: string;
  kind: "rank_change";
  message: string;
};

export default function ActivityFeed({
  pollMs = 5000,
  limit = 14,
  rankChangeMessage,
}: {
  pollMs?: number;
  limit?: number;
  rankChangeMessage?: string | null;
}) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [synthetic, setSynthetic] = useState<Synthetic | null>(null);
  const lastRankMsgRef = useRef<string | null>(null);

  useEffect(() => {
    if (!rankChangeMessage) return;
    if (rankChangeMessage === lastRankMsgRef.current) return;
    lastRankMsgRef.current = rankChangeMessage;

    setSynthetic({
      id: `rank-${Date.now()}`,
      createdAt: new Date().toISOString(),
      kind: "rank_change",
      message: rankChangeMessage,
    });
  }, [rankChangeMessage]);

  async function load() {
    try {
      const r = await fetch("/api/events", { cache: "no-store" });
      const j = await r.json().catch(() => []);
      if (r.ok && Array.isArray(j)) setEvents(j);
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

  const rows = useMemo(() => {
    const base = events.slice(0, limit);
    if (!synthetic) return base;

    // Put synthetic at top
    return [{ ...(synthetic as any), _synthetic: true }, ...base] as any[];
  }, [events, limit, synthetic]);

  function renderRow(e: any) {
    // Synthetic rank change
    if (e?._synthetic) {
      return (
        <li key={e.id} className="p-3">
          <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-yellow-200">🏆 RANK SHIFT</div>
              <div className="text-[11px] text-yellow-200/70">{timeAgo(e.createdAt)} ago</div>
            </div>
            <div className="mt-1 text-sm text-yellow-100">{e.message}</div>
          </div>
        </li>
      );
    }

    const type = String(e.type || "");
    const norm = type.includes(":") ? type.replace(":", "_") : type;

    const meta = safeJson(e.meta);
    const isBurn = norm === "burn" || norm === "burn_dev";
    const isWin = norm.endsWith("_win");
    const isLoss = norm.endsWith("_loss");
    const isPlay = norm.endsWith("_play");

    const burned =
      typeof meta?.burnedWhole === "number"
        ? meta.burnedWhole
        : typeof meta?.amount === "number"
          ? meta.amount
          : null;

    const burnText = burned ? `${burned.toLocaleString()} ${TOKEN_SYMBOL}` : `${TOKEN_SYMBOL}`;

    const baseCls =
      "rounded-xl border px-3 py-2 transition-colors";
    const cls = isWin
      ? `${baseCls} border-emerald-500/25 bg-emerald-500/10`
      : isBurn
        ? `${baseCls} border-rose-500/25 bg-rose-500/10`
        : isLoss
          ? `${baseCls} border-slate-500/25 bg-white/5`
          : isPlay
            ? `${baseCls} border-cyan-500/20 bg-cyan-500/8`
            : `${baseCls} border-white/10 bg-white/5`;

    const label = isWin ? "WIN" : isBurn ? "BURN" : isLoss ? "LOSS" : isPlay ? "PLAY" : "EVENT";
    const icon = isWin ? "🟢" : isBurn ? "🔥" : isLoss ? "⚫" : isPlay ? "⚡" : "•";

    const headline =
      isWin
        ? `${icon} ${shortWallet(e.wallet)} won${e.amountSol ? ` ${Number(e.amountSol).toFixed(2)} SOL` : ""}`
        : isBurn
          ? `${icon} ${shortWallet(e.wallet)} burned ${burnText}`
          : `${icon} ${shortWallet(e.wallet)} ${type}`;

    return (
      <li key={e.id} className="p-3">
        <div className={cls}>
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold tracking-widest text-gray-200/90">{label}</div>
            <div className="text-[11px] text-gray-300/60">{timeAgo(e.createdAt)} ago</div>
          </div>
          <div className="mt-1 text-sm text-gray-100 truncate">{headline}</div>
        </div>
      </li>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl overflow-hidden shadow-[0_0_70px_rgba(0,0,0,0.65)]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-extrabold tracking-tight">Live activity</div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)] animate-pulse" />
        </div>
        <div className="text-xs text-gray-500">{loading ? "Loading…" : `Last ${Math.min(limit, events.length)} events`}</div>
      </div>

      <ul className="divide-y divide-white/5">
        {rows.length === 0 ? (
          <li className="p-4 text-sm text-gray-400">No activity yet.</li>
        ) : (
          rows.map(renderRow)
        )}
      </ul>
    </section>
  );
}