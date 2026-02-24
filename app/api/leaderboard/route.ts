// app/api/leaderboard/route.ts
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { multiplierFromBurn } from "@/lib/multiplier";
import { getTierFromBurn } from "@/lib/tiers";

type GameKey = "flip" | "reaction" | "ttt";

const GAME_LABEL: Record<GameKey, string> = {
  flip: "Flip",
  reaction: "Reaction",
  ttt: "Tic Tac Toe",
};

function normalizeEventType(type: string) {
  // Support BOTH formats:
  // - "flip_win"
  // - "flip:win"
  // - (keep other strings unchanged)
  const t = String(type || "").trim();
  return t.includes(":") ? t.replace(":", "_") : t;
}

function gameKeyFromEventType(type: string): { game: GameKey; result: "win" | "loss" } | null {
  const norm = normalizeEventType(type);

  if (norm === "flip_win") return { game: "flip", result: "win" };
  if (norm === "flip_loss") return { game: "flip", result: "loss" };

  if (norm === "reaction_win") return { game: "reaction", result: "win" };
  if (norm === "reaction_loss") return { game: "reaction", result: "loss" };

  if (norm === "ttt_win") return { game: "ttt", result: "win" };
  if (norm === "ttt_loss") return { game: "ttt", result: "loss" };

  return null;
}

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { pointsTotal: "desc" },
    take: 50,
  });

  const wallets = players.map((p) => p.wallet);

  // Pull both legacy underscore + current colon formats (safe, backwards compatible)
  const allowedTypes = [
    // underscore
    "flip_win",
    "flip_loss",
    "reaction_win",
    "reaction_loss",
    "ttt_win",
    "ttt_loss",
    // colon
    "flip:win",
    "flip:loss",
    "reaction:win",
    "reaction:loss",
    "ttt:win",
    "ttt:loss",
  ];

  const events = await prisma.event.findMany({
    where: {
      wallet: { in: wallets },
      type: { in: allowedTypes },
    },
    select: { wallet: true, type: true },
  });

  // Aggregate wins/losses per wallet per game
  const map = new Map<
    string,
    {
      winsByGame: Record<GameKey, number>;
      lossesByGame: Record<GameKey, number>;
    }
  >();

  for (const e of events) {
    const parsed = gameKeyFromEventType(e.type);
    if (!parsed) continue;

    if (!map.has(e.wallet)) {
      map.set(e.wallet, {
        winsByGame: { flip: 0, reaction: 0, ttt: 0 },
        lossesByGame: { flip: 0, reaction: 0, ttt: 0 },
      });
    }

    const row = map.get(e.wallet)!;
    if (parsed.result === "win") row.winsByGame[parsed.game] += 1;
    else row.lossesByGame[parsed.game] += 1;
  }

  const enriched = players.map((p) => {
    const burned = p.burnedAmount ?? 0;
    const tier = getTierFromBurn(burned);
    const multiplier = multiplierFromBurn(burned);

    const agg = map.get(p.wallet) ?? {
      winsByGame: { flip: 0, reaction: 0, ttt: 0 },
      lossesByGame: { flip: 0, reaction: 0, ttt: 0 },
    };

    return {
      ...p,
      tier,
      multiplier, // source of truth from burn
      winsByGame: agg.winsByGame,
      lossesByGame: agg.lossesByGame,
      gameLabels: GAME_LABEL,
    };
  });

  return NextResponse.json(enriched);
}