// app/api/match/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { multiplierFromBurn } from "@/lib/multiplier";

type Body = {
  wallet: string;
  game: "flip" | "reaction" | "tic_tac_toe";
  result: "win" | "loss";
  amountSol?: number;
};

function isLocal(req: Request) {
  const host = req.headers.get("host") || "";
  return host.includes("localhost") || host.startsWith("127.0.0.1");
}

function cleanWallet(w: string) {
  return (w || "").trim();
}

function pointsRawDelta(params: { win: boolean; amountSol: number; streak: number }) {
  const winPts = params.win ? 10 : 0;
  const volPts = params.amountSol * 2;
  const streakPts = params.streak * 1;
  return winPts + volPts + streakPts;
}

export async function POST(req: Request) {
  // --- auth ---
  // Localhost: allow without key
  // Deployed: require x-game-key == GAME_POST_KEY
  if (!isLocal(req)) {
    const key = req.headers.get("x-game-key") || "";
    const expected = process.env.GAME_POST_KEY || "";
    if (!expected || key !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const wallet = cleanWallet(body.wallet);
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const game = body.game;
  if (!game) return NextResponse.json({ error: "game required" }, { status: 400 });

  const amountSol = Number(body.amountSol ?? 0);
  const isWin = body.result === "win";

  // Upsert player first
  const player = await prisma.player.upsert({
    where: { wallet },
    create: { wallet },
    update: {},
  });

  // streak logic
  const nextStreak = isWin ? player.winStreak + 1 : 0;
  const bestStreak = Math.max(player.bestStreak, nextStreak);

  // multiplier (burn-based)
  const multiplier = multiplierFromBurn(player.burnedAmount);

  const rawDelta = pointsRawDelta({
    win: isWin,
    amountSol,
    streak: nextStreak,
  });

  const pointsRaw = player.pointsRaw + rawDelta;
  const pointsTotal = pointsRaw * multiplier;

  const updated = await prisma.player.update({
    where: { wallet },
    data: {
      multiplier,
      gamesPlayed: player.gamesPlayed + 1,
      wins: player.wins + (isWin ? 1 : 0),
      losses: player.losses + (isWin ? 0 : 1),
      winStreak: nextStreak,
      bestStreak,
      volumeSol: player.volumeSol + amountSol,
      pointsRaw,
      pointsTotal,
    },
  });

  await prisma.event.create({
    data: {
      type: isWin ? `${game}_win` : `${game}_loss`,
      wallet,
      amountSol: amountSol || null,
      meta: JSON.stringify({ game, result: body.result }),
    },
  });

  return NextResponse.json({ ok: true, player: updated });
}
