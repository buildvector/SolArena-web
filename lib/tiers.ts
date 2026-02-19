// lib/tiers.ts

export const TIERS = [
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
  ] as const;
  
  export function getTierFromBurn(burned: number) {
    const b = Math.max(0, Math.floor(Number(burned || 0)));
    let tierIndex = -1;
    for (let i = 0; i < TIERS.length; i++) {
      if (b >= TIERS[i].burn) tierIndex = i;
    }
    return tierIndex >= 0 ? tierIndex + 1 : 0; // 0..10
  }
  
  export function getTierProgress(burned: number) {
    const tier = getTierFromBurn(burned);
  
    const prev = tier <= 0 ? 0 : TIERS[tier - 1].burn;
    const next = tier >= TIERS.length ? null : TIERS[tier]?.burn;
  
    if (!next) return { tier, prev, next: null as number | null, pct: 100 };
  
    const denom = Math.max(1, next - prev);
    const pct = Math.max(0, Math.min(100, ((burned - prev) / denom) * 100));
    return { tier, prev, next, pct };
  }
  