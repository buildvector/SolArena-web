// lib/multiplier.ts
import { getTierFromBurn } from "./tiers";

/**
 * Tier-based multiplier system.
 *
 * Design goals:
 * - Prevent whale dominance
 * - Reward early burners
 * - Keep scaling predictable
 * - Easy to tune without touching business logic
 */

export const MAX_TIER = 10;

export const TIER_MULTIPLIERS: Record<number, number> = {
  0: 1.0,
  1: 1.03,
  2: 1.05,
  3: 1.08,
  4: 1.12,
  5: 1.17,
  6: 1.23,
  7: 1.30,
  8: 1.38,
  9: 1.47,
  10: 1.60,
};

/**
 * Safely clamps tier into valid range.
 */
function clampTier(tier: number): number {
  if (!Number.isFinite(tier)) return 0;
  return Math.max(0, Math.min(MAX_TIER, Math.floor(tier)));
}

/**
 * Returns multiplier from tier.
 */
export function multiplierFromTier(tier: number): number {
  const safeTier = clampTier(tier);
  return TIER_MULTIPLIERS[safeTier] ?? 1.0;
}

/**
 * Returns multiplier based on total burned tokens.
 */
export function multiplierFromBurn(burned: number): number {
  if (!Number.isFinite(burned) || burned <= 0) {
    return 1.0;
  }

  const tier = getTierFromBurn(burned);
  return multiplierFromTier(tier);
}