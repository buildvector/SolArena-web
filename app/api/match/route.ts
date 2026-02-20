import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isLocal(req: Request) {
  const host = req.headers.get("host") || "";
  return host.includes("localhost") || host.includes("127.0.0.1");
}

// ⬇️ Hvis din Player-model IKKE hedder "points", så ret KUN denne:
const PLAYER_POINTS_FIELD = "points" as const; // fx "score" eller "totalPoints"

// points model (simple MVP)
function pointsFor(result: string) {
  if (result === "win") return 3;
  if (result === "play") return 1;
  if (result === "loss") return 0;
  return 0;
}

function normalizeGame(gameRaw: string) {
  const g = gameRaw.trim().toLowerCase();
  // Hvis du har enum Game i Prisma, så match den her:
  // Typisk: Prisma.Game.TTT eller Prisma.Game.ttt findes ikke - det er normalt uppercase.
  const anyPrisma: any = Prisma as any;
  if (anyPrisma?.Game) {
    const candidates = Object.keys(anyPrisma.Game);
    const hit =
      candidates.find((k) => k.toLowerCase() === g) ||
      candidates.find((k) => k.toLowerCase() === "ttt" && g === "ttt");
    if (hit) return anyPrisma.Game[hit];
  }
  return g; // fallback (hvis din schema bruger String)
}

function normalizeResult(resultRaw: string) {
  const r = resultRaw.trim().toLowerCase();
  const anyPrisma: any = Prisma as any;
  if (anyPrisma?.Result) {
    const candidates = Object.keys(anyPrisma.Result);
    const hit = candidates.find((k) => k.toLowerCase() === r);
    if (hit) return anyPrisma.Result[hit];
  }
  return r;
}

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
    const gameRaw = String(body?.game ?? "").trim();
    const resultRaw = String(body?.result ?? "").trim();
    const amountSol = Number(body?.amountSol ?? 0);
    const meta = body?.meta ? String(body.meta) : null;

    if (!wallet || wallet.length < 10) {
      return NextResponse.json({ error: "bad wallet" }, { status: 400 });
    }
    if (!gameRaw) return NextResponse.json({ error: "bad game" }, { status: 400 });

    const resultNorm = resultRaw.toLowerCase();
    if (!["win", "play", "loss"].includes(resultNorm)) {
      return NextResponse.json({ error: "bad result" }, { status: 400 });
    }

    if (!Number.isFinite(amountSol) || amountSol < 0) {
      return NextResponse.json({ error: "bad amountSol" }, { status: 400 });
    }

    const pts = pointsFor(resultNorm);

    const clientKey =
      meta && meta.length > 0 ? `${gameRaw}:${wallet}:${resultNorm}:${meta}`.slice(0, 500) : null;

    const game = normalizeGame(gameRaw);
    const result = normalizeResult(resultRaw);

    // ✅ Event.type er REQUIRED i din schema (fra din Prisma-fejl)
    // Hvis type er enum i din schema, så matcher den her også (ellers string fallback)
    const anyPrisma: any = Prisma as any;
    const type = anyPrisma?.EventType?.MATCH ?? "MATCH";

    // 1) Create event
    await prisma.event.create({
      data: {
        wallet,
        game: game as any,       // enum eller string
        result: result as any,   // enum eller string
        amountSol,
        points: pts,
        meta,
        clientKey,
        type: type as any,
      } as any,
    });

    // 2) Upsert player
    // Vi bygger update/create dynamisk så vi kan skifte points-feltnavn ét sted
    const createData: any = {
      wallet,
      volumeSol: amountSol,
      games: 1,
      wins: resultNorm === "win" ? 1 : 0,
    };
    createData[PLAYER_POINTS_FIELD] = pts;

    const updateData: any = {
      volumeSol: { increment: amountSol },
      games: { increment: 1 },
      ...(resultNorm === "win" ? { wins: { increment: 1 } } : {}),
    };
    updateData[PLAYER_POINTS_FIELD] = { increment: pts };

    await prisma.player.upsert({
      where: { wallet },
      create: createData,
      update: updateData,
    } as any);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[match] error", e);
    return NextResponse.json(
      { error: "internal", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}