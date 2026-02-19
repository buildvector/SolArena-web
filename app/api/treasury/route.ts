// app/api/treasury/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type GameKey = "flip" | "reaction" | "ttt";

const GAME_LABEL: Record<GameKey, string> = {
  flip: "Flip",
  reaction: "Reaction",
  ttt: "Tic Tac Toe",
};

function gameFromEventType(type: string): GameKey | null {
  if (type.startsWith("flip_")) return "flip";
  if (type.startsWith("reaction_")) return "reaction";
  if (type.startsWith("ttt_")) return "ttt";
  return null;
}

export async function GET() {
  // Vi bruger allerede dine match events som kilden til "plays"
  // (flip_win/loss, reaction_win/loss, ttt_win/loss)
  const events = await prisma.event.findMany({
    where: {
      type: {
        in: ["flip_win", "flip_loss", "reaction_win", "reaction_loss", "ttt_win", "ttt_loss"],
      },
    },
    select: { type: true, amountSol: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const byGame: Record<GameKey, { plays: number; volumeSol: number }> = {
    flip: { plays: 0, volumeSol: 0 },
    reaction: { plays: 0, volumeSol: 0 },
    ttt: { plays: 0, volumeSol: 0 },
  };

  let totalPlays = 0;
  let totalVolumeSol = 0;

  for (const e of events) {
    const g = gameFromEventType(e.type);
    if (!g) continue;

    const vol = Number(e.amountSol ?? 0);
    byGame[g].plays += 1;
    byGame[g].volumeSol += vol;

    totalPlays += 1;
    totalVolumeSol += vol;
  }

  return NextResponse.json({
    totalPlays,
    totalVolumeSol,
    byGame: {
      flip: { label: GAME_LABEL.flip, ...byGame.flip },
      reaction: { label: GAME_LABEL.reaction, ...byGame.reaction },
      ttt: { label: GAME_LABEL.ttt, ...byGame.ttt },
    },
  });
}
