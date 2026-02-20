import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isLocal(req: Request) {
  const host = req.headers.get("host") || "";
  return host.includes("localhost") || host.includes("127.0.0.1");
}

function corsHeaders(req: Request) {
  // If you want to lock this down later, you can set a specific origin instead of "*"
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-game-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// points model (simple MVP)
function pointsFor(result: string) {
  if (result === "win") return 3;
  if (result === "play") return 1;
  if (result === "loss") return 0;
  return 0;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  try {
    // Deployed: require x-game-key == GAME_POST_KEY
    if (!isLocal(req)) {
      const key = req.headers.get("x-game-key") || "";
      const expected = process.env.GAME_POST_KEY || "";
      if (!expected || key !== expected) {
        return NextResponse.json(
          { error: "unauthorized" },
          { status: 401, headers: corsHeaders(req) }
        );
      }
    }

    const body = await req.json().catch(() => ({}));

    const wallet = String(body?.wallet ?? "").trim();
    const game = String(body?.game ?? "").trim(); // e.g. "ttt"
    const result = String(body?.result ?? "").trim(); // "win" | "play" | "loss"
    const amountSolRaw = body?.amountSol;
    const amountSol =
      amountSolRaw === undefined || amountSolRaw === null
        ? null
        : Number(amountSolRaw);
    const metaIn = body?.meta ? String(body.meta) : null;

    if (!wallet || wallet.length < 10) {
      return NextResponse.json(
        { error: "bad wallet" },
        { status: 400, headers: corsHeaders(req) }
      );
    }
    if (!game) {
      return NextResponse.json(
        { error: "bad game" },
        { status: 400, headers: corsHeaders(req) }
      );
    }
    if (!["win", "play", "loss"].includes(result)) {
      return NextResponse.json(
        { error: "bad result" },
        { status: 400, headers: corsHeaders(req) }
      );
    }
    if (amountSol !== null && (!Number.isFinite(amountSol) || amountSol < 0)) {
      return NextResponse.json(
        { error: "bad amountSol" },
        { status: 400, headers: corsHeaders(req) }
      );
    }

    const pts = pointsFor(result);

    // Event.type is REQUIRED by your schema
    const eventType = `${game}:${result}`;

    // Store richer details inside meta (since Event has no game/result/points columns)
    const meta =
      metaIn && metaIn.length
        ? metaIn
        : JSON.stringify({ game, result, points: pts });

    // Do everything in a transaction to keep streak/points consistent
    const out = await prisma.$transaction(async (tx) => {
      // Ensure player exists
      let player = await tx.player.findUnique({ where: { wallet } });

      if (!player) {
        player = await tx.player.create({
          data: {
            wallet,
            // all other fields have defaults in schema
          },
        });
      }

      const multiplier = Number(player.multiplier ?? 1.0);
      const addRaw = pts; // base points
      const addTotal = pts * multiplier;

      // Streak logic
      let winStreak = player.winStreak ?? 0;
      let bestStreak = player.bestStreak ?? 0;

      let winsInc = 0;
      let lossesInc = 0;

      if (result === "win") {
        winsInc = 1;
        winStreak = winStreak + 1;
        if (winStreak > bestStreak) bestStreak = winStreak;
      } else if (result === "loss") {
        lossesInc = 1;
        winStreak = 0;
      }
      // result === "play": counts as a game, but no win/loss and no streak change

      // Create event row
      await tx.event.create({
        data: {
          type: eventType,
          wallet,
          amountSol: amountSol ?? null,
          meta,
        },
      });

      // Update player totals
      const updated = await tx.player.update({
        where: { wallet },
        data: {
          gamesPlayed: { increment: 1 },
          wins: winsInc ? { increment: winsInc } : undefined,
          losses: lossesInc ? { increment: lossesInc } : undefined,
          winStreak,
          bestStreak,
          volumeSol: amountSol !== null ? { increment: amountSol } : undefined,
          pointsRaw: { increment: addRaw },
          pointsTotal: { increment: addTotal },
          // lastSeenAt is @updatedAt, don't set it manually
        },
      });

      return {
        ok: true,
        wallet,
        game,
        result,
        pts,
        multiplier,
        pointsAddedTotal: addTotal,
        player: {
          gamesPlayed: updated.gamesPlayed,
          wins: updated.wins,
          losses: updated.losses,
          winStreak: updated.winStreak,
          bestStreak: updated.bestStreak,
          volumeSol: updated.volumeSol,
          pointsRaw: updated.pointsRaw,
          pointsTotal: updated.pointsTotal,
        },
      };
    });

    return NextResponse.json(out, { headers: corsHeaders(req) });
  } catch (e: any) {
    console.error("[match] error", e);
    return NextResponse.json(
      { error: "internal", detail: String(e?.message ?? e) },
      { status: 500, headers: corsHeaders(req) }
    );
  }
}