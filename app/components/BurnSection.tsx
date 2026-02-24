"use client";

import BurnPanel from "@/app/components/BurnPanel";
import { TOKEN_SYMBOL } from "@/lib/token-config";

/**
 * NOTE:
 * Her er multiplier/next-level placeholders, så UI føles som “upgrade”.
 * Når du har data (fra API eller wallet balance), kan du erstatte værdierne.
 */
export default function BurnSection({ onBurned }: { onBurned?: () => void }) {
  // Placeholder værdier (hook dem op senere)
  const multiplier = "1.12×";
  const nextMultiplier = "1.13×";
  const burnToNext = `12,000 ${TOKEN_SYMBOL}`;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Burn</h2>
          <p className="text-sm text-gray-400 mt-1">
            Burn {TOKEN_SYMBOL} to unlock tiers & multiplier boosts.
          </p>
        </div>
      </div>

      {/* Upgrade summary */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
          <div className="text-xs text-gray-400">Your multiplier</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-white">
            {multiplier}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Applies to leaderboard points (wins, volume, streaks).
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
          <div className="text-xs text-gray-400">Next upgrade</div>
          <div className="mt-1 text-sm text-gray-200">
            Burn <span className="font-semibold text-white">{burnToNext}</span>{" "}
            → <span className="font-semibold text-white">{nextMultiplier}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Diminishing returns — early burns matter more.
          </div>
        </div>
      </div>

      <BurnPanel onBurned={onBurned} />
    </section>
  );
}