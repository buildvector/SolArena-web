import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

// (optional) restrict allowed games
const ALLOWED_GAMES = new Set(["ttt", "flip", "reaction"]);

export async function POST(req: Request) {
  try {
    // Deployed: require x-game-key == GAME_POST_KEY
    if (!isLocal(req)) {
      const key = req.headers.get("x-game-key") || "";
      const expected = process.env.GAME_POST_KEY || "";
      if (!expected || key !== expected) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));

    const wallet = String(body?.wallet ?? "").trim();
    const gameRaw = String(body?.game ?? "").trim().toLowerCase(); // "ttt"
    const result = String(body?.result ?? "").trim().toLowerCase(); // "win" | "play" | "loss"
    const amountSol = Number(body?.amountSol ?? 0);
    const meta = body?.meta ? String(body.meta) : null;

    if (!wallet || wallet.length < 10) {
      return NextResponse.json({ error: "bad wallet" }, { status: 400 });
    }

    if (!gameRaw) {
      return NextResponse.json({ error: "bad game" }, { status: 400 });
    }

    // If you want strict:
    if (!ALLOWED_GAMES.has(gameRaw)) {
      return NextResponse.json({ error: "unsupported game" }, { status: 400 });
    }

    if (!["win", "play", "loss"].includes(result)) {
      return NextResponse.json({ error: "bad result" }, { status: 400 });
    }

    if (!Number.isFinite(amountSol) || amountSol < 0) {
      return NextResponse.json({ error: "bad amountSol" }, { status: 400 });
    }

    const pts = pointsFor(result);
    const ptsInt = Math.round(pts); // Prisma Int-safe

    // best-effort dedupe key
    const clientKey =
      meta && meta.length > 0 ? `${gameRaw}:${wallet}:${result}:${meta}`.slice(0, 500) : null;

    // If your Prisma uses enum for Event.game, TS can complain if we pass a string.
    // We validate above + cast to keep compile green.
    const game = gameRaw as any;

    // --- Persist event ---
    // If you later add `@@unique([clientKey])`, this prevents crashes on duplicate posts.
    try {
      await prisma.event.create({
        data: {
          wallet,
          game,
          result,
          amountSol,
          points: ptsInt,
          meta,
          clientKey,
        } as any,
      });
    } catch (e: any) {
      // Prisma unique violation: P2002 (ignore duplicates)
      if (e?.code !== "P2002") throw e;
    }

    // --- Upsert leaderboard player ---
    await prisma.player.upsert({
      where: { wallet },
      create: {
        wallet,
        points: ptsInt,
        volumeSol: amountSol,
        games: 1,
        wins: result === "win" ? 1 : 0,
        updatedAt: new Date(),
      } as any,
      update: {
        points: { increment: ptsInt },
        volumeSol: { increment: amountSol },
        games: { increment: 1 },
        ...(result === "win" ? { wins: { increment: 1 } } : {}),
        updatedAt: new Date(),
      } as any,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[match] error", e);
    return NextResponse.json(
      { error: "internal", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}