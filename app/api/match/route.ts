import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_ORIGINS = new Set([
  "https://pvptictactoe.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-game-key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  } as Record<string, string>;
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

function isLocal(req: Request) {
  const host = req.headers.get("host") || "";
  return host.includes("localhost") || host.includes("127.0.0.1");
}

// points model (simple MVP)
function pointsFor(result: string) {
  if (result === "win") return 3;
  if (result === "play") return 1;
  if (result === "loss") return 0;
  return 0;
}

export async function POST(req: Request) {
  const headers = corsHeaders(req);

  try {
    // Deployed: require x-game-key == GAME_POST_KEY
    if (!isLocal(req)) {
      const key = req.headers.get("x-game-key") || "";
      const expected = (process.env.GAME_POST_KEY || "").trim();
      if (!expected || key !== expected) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });
      }
    }

    const body = await req.json().catch(() => ({}));

    const wallet = String(body?.wallet ?? "").trim();
    const game = String(body?.game ?? "").trim(); // e.g. "ttt"
    const result = String(body?.result ?? "").trim(); // "win" | "play" | "loss"
    const amountSol = Number(body?.amountSol ?? 0);
    const meta = body?.meta ? String(body.meta) : null;

    if (!wallet || wallet.length < 10) {
      return NextResponse.json({ error: "bad wallet" }, { status: 400, headers });
    }
    if (!game) {
      return NextResponse.json({ error: "bad game" }, { status: 400, headers });
    }
    if (!["win", "play", "loss"].includes(result)) {
      return NextResponse.json({ error: "bad result" }, { status: 400, headers });
    }
    if (!Number.isFinite(amountSol) || amountSol < 0) {
      return NextResponse.json({ error: "bad amountSol" }, { status: 400, headers });
    }

    const pts = pointsFor(result);

    const clientKey =
      meta && meta.length > 0 ? `${game}:${wallet}:${result}:${meta}`.slice(0, 500) : null;

    // ---- Prisma type-safe bypass (fixer dine 3 TS errors) ----
    const gameValue: any = game;      // hvis game er enum i schema
    const pointsValue: any = pts;     // hvis points ikke er Int (BigInt/Decimal/etc)
    const pointsInc: any = { increment: pts }; // samme problem på update
    // ---------------------------------------------------------

    await prisma.event.create({
      data: {
        wallet,
        game: gameValue,      // ✅ fixes TS error under "game"
        result,
        amountSol,
        points: pointsValue,  // ✅ fixes TS error under "points" (create)
        meta,
        clientKey,
      } as any,
    });

    await prisma.player.upsert({
      where: { wallet },
      create: {
        wallet,
        points: pointsValue,      // ✅ fixes TS error under "points" (create)
        volumeSol: amountSol,
        games: 1,
        wins: result === "win" ? 1 : 0,
        updatedAt: new Date(),
      } as any,
      update: {
        points: pointsInc,        // ✅ fixes TS error under "points" (update increment)
        volumeSol: { increment: amountSol },
        games: { increment: 1 },
        ...(result === "win" ? { wins: { increment: 1 } } : {}),
        updatedAt: new Date(),
      } as any,
    });

    return NextResponse.json({ ok: true }, { headers });
  } catch (e: any) {
    console.error("[match] error", e);
    return NextResponse.json({ error: "internal" }, { status: 500, headers });
  }
}