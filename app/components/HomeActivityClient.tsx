// app/components/HomeActivityClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import ActivityFeed from "@/app/components/ActivityFeed";

export default function HomeActivityClient({
  pollMs = 5000,
  limit = 14,
}: {
  pollMs?: number;
  limit?: number;
}) {
  const [rankChangeMsg, setRankChangeMsg] = useState<string | null>(null);
  const prevTopRef = useRef<string | null>(null);
  const lastChangeAtRef = useRef<number | null>(null);

  function shortWallet(w: string) {
    return w.length > 10 ? `${w.slice(0, 6)}...${w.slice(-4)}` : w;
  }

  async function loadTop() {
    try {
      const r = await fetch("/api/leaderboard", { cache: "no-store" });
      const j = await r.json().catch(() => []);
      if (!r.ok || !Array.isArray(j) || j.length === 0) return;

      const topWallet = String(j[0]?.wallet ?? "") || null;
      if (!topWallet) return;

      if (prevTopRef.current && prevTopRef.current !== topWallet) {
        lastChangeAtRef.current = Date.now();
        setRankChangeMsg(
          `Rank #1 changed • ${shortWallet(prevTopRef.current)} → ${shortWallet(topWallet)}`
        );
      }

      prevTopRef.current = topWallet;
    } catch {}
  }

  useEffect(() => {
    loadTop();
    const t = setInterval(loadTop, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const at = lastChangeAtRef.current;
      if (!at) return;
      if (Date.now() - at > 6 * 60 * 1000) setRankChangeMsg(null);
    }, 15000);
    return () => clearInterval(t);
  }, []);

  return <ActivityFeed pollMs={pollMs} limit={limit} rankChangeMessage={rankChangeMsg} />;
}