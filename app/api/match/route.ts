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
  // If you want to lock this down later, set a specific origin instead of reflecting it
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-game-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// simple MVP scoring
function pointsFor(result: string) {
  if (result === "win") return 3;
  if (result === "play") return 1;
  if (result === "loss") return 0;
  return 0;
}

function normalizeGame(gameRaw: string) {
  // keep it stable + predictable
  return String(gameRaw || "").trim().toLowerCase();
}

function normalizeResult(resultRaw: string) {
  return String(resultRaw || "").trim().toLowerCase();
}

/**
 * We now accept these games (so Flip won't 400 "bad game").
 * If you later add more games, just add them here.
 */
const ALLOWED_GAMES = new Set(["ttt", "flip", "reaction"]);

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
    const game = normalizeGame(body?.game);
    const result = normalizeResult(body?.result);

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

    if (!game || !ALLOWED_GAMES.has(game)) {
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

    // Event.type is REQUIRED by schema
    const eventType = `${game}:${result}`;

    // Store richer details inside meta (Event has only: type, wallet, amountSol, meta)
    const meta =
      metaIn && metaIn.length
        ? metaIn
        : JSON.stringify({ game, result, points: pts });

    const out = await prisma.$transaction(async (tx) => {
      // Ensure player exists
      let player = await tx.player.findUnique({ where: { wallet } });

      if (!player) {
        player = await tx.player.create({
          data: { wallet },
        });
      }

      const multiplier = Number(player.multiplier ?? 1.0);
      const addRaw = pts;
      const addTotal = pts * multiplier;

      // streak logic
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
      // "play": no win/loss, streak unchanged

      await tx.event.create({
        data: {
          type: eventType,
          wallet,
          amountSol: amountSol ?? null,
          meta,
        },
      });

      const updated = await tx.player.update({
        where: { wallet },
        data: {
          gamesPlayed: { increment: 1 },
          ...(winsInc ? { wins: { increment: winsInc } } : {}),
          ...(lossesInc ? { losses: { increment: lossesInc } } : {}),
          winStreak,
          bestStreak,
          ...(amountSol !== null ? { volumeSol: { increment: amountSol } } : {}),
          pointsRaw: { increment: addRaw },
          pointsTotal: { increment: addTotal },
          // lastSeenAt is @updatedAt (Prisma handles)
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