// app/api/burns/route.ts
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeJson(meta: string | null) {
  if (!meta) return null;
  try {
    return JSON.parse(meta);
  } catch {
    return null;
  }
}

export async function GET() {
  // We store burns as events:
  // - "burn" (onchain verify)
  // - "burn_dev" (localhost test)
  const events = await prisma.event.findMany({
    where: {
      type: { in: ["burn", "burn_dev"] },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const out = events.map((e) => {
    const meta = safeJson(e.meta);

    // onchain burns store: { signature, burnedWhole, ... }
    // dev burns store: { amount, note, ... }
    const burned =
      typeof meta?.burnedWhole === "number"
        ? meta.burnedWhole
        : typeof meta?.amount === "number"
          ? meta.amount
          : null;

    const signature = typeof meta?.signature === "string" ? meta.signature : null;

    return {
      id: e.id,
      createdAt: e.createdAt,
      type: e.type,
      wallet: e.wallet,
      burnedAmount: burned,
      signature,
      meta: e.meta,
    };
  });

  return NextResponse.json(out);
}
