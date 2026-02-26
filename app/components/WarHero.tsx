// app/components/WarHero.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getSeasonWindow, msLeft, formatLeft, SEASON_NAME, SEASON_TAGLINE } from "@/lib/season";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-rose-500/20 bg-black/60 backdrop-blur-md px-4 py-3 shadow-[0_0_40px_rgba(244,63,94,0.12)]">
      <div className="text-[10px] uppercase tracking-widest text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-white tabular-nums">{value}</div>
    </div>
  );
}

export default function WarHero() {
  const season = useMemo(() => getSeasonWindow(), []);
  const [endsIn, setEndsIn] = useState<string>("—");

  useEffect(() => {
    function tick() {
      const left = msLeft(season.endIso);
      if (left === null) return setEndsIn("—");
      setEndsIn(formatLeft(left));
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [season.endIso]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-rose-500/15 bg-black/40 p-8 sm:p-10 shadow-[0_0_140px_rgba(244,63,94,0.08)]">

      {/* Massive arena glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[1000px] -translate-x-1/2 blur-[140px] bg-[radial-gradient(circle,rgba(244,63,94,0.25),rgba(168,85,247,0.18),rgba(34,211,238,0.10),rgba(0,0,0,0)_70%)]" />
      </div>

      <div className="relative">

        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1 text-xs font-semibold text-rose-200">
          <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
          {SEASON_NAME} • LIVE WAR
        </div>

        <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          SOLARENA
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-violet-200 to-cyan-200">
            {SEASON_TAGLINE}
          </span>
        </h1>

        <p className="mt-4 max-w-2xl text-gray-300 text-lg">
          Burn. Compete. Dominate.  
          This isn’t a launch.  
          It’s a seven day war.
        </p>

        <div className="mt-6 h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_40px_rgba(244,63,94,0.6)]"
            style={{ width: "72%" }}
          />
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Ends In" value={endsIn} />
          <StatBox label="Status" value="ACTIVE" />
          <StatBox label="Intensity" value="HIGH" />
          <StatBox label="Control" value="PUBLIC" />
        </div>

      </div>
    </div>
  );
}