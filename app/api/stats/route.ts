// app/api/stats/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [
    playersCount,
    eventsCount,
    totalVolumeAgg,
    totalGamesAgg,
    totalBurnAgg,
    topPlayer,
  ] = await Promise.all([
    prisma.player.count(),
    prisma.event.count(),
    prisma.player.aggregate({ _sum: { volumeSol: true } }),
    prisma.player.aggregate({ _sum: { gamesPlayed: true } }),
    prisma.player.aggregate({ _sum: { burnedAmount: true } }),
    prisma.player.findFirst({ orderBy: { pointsTotal: "desc" } }),
  ]);

  return NextResponse.json({
    playersCount,
    eventsCount,
    totalVolumeSol: Number(totalVolumeAgg._sum.volumeSol ?? 0),
    totalGames: Number(totalGamesAgg._sum.gamesPlayed ?? 0),
    totalBurned: Number(totalBurnAgg._sum.burnedAmount ?? 0),
    topWallet: topPlayer?.wallet ?? null,
    topPoints: Number(topPlayer?.pointsTotal ?? 0),
  });
}
