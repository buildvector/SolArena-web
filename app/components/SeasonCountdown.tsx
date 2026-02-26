// app/components/SeasonCountdown.tsx
"use client";

import React from "react";
import { getCountdownParts } from "@/lib/season";

type Parts = {
  days: string;
  hours: string;
  mins: string;
  secs: string;
};

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-gray-500">{label}</div>
      <div className="mt-0.5 text-xl font-extrabold text-white tabular-nums">{value}</div>
    </div>
  );
}

export default function SeasonCountdown({
  endIso,
  tickMs = 250,
}: {
  endIso: string | null;
  tickMs?: number;
}) {
  // ✅ Important: start with placeholders so SSR/CSR never mismatch
  const [mounted, setMounted] = React.useState(false);
  const [parts, setParts] = React.useState<Parts>({
    days: "--",
    hours: "--",
    mins: "--",
    secs: "--",
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    function tick() {
      const p = getCountdownParts(endIso);
      setParts({
        days: p.days,
        hours: p.hours,
        mins: p.mins,
        secs: p.secs,
      });
    }

    tick();
    const t = setInterval(tick, Math.max(100, tickMs));
    return () => clearInterval(t);
  }, [endIso, tickMs, mounted]);

  return (
    <div className="grid grid-cols-4 gap-2">
      <Box label="Days" value={parts.days} />
      <Box label="Hours" value={parts.hours} />
      <Box label="Mins" value={parts.mins} />
      <Box label="Secs" value={parts.secs} />
    </div>
  );
}