export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(events);
}
