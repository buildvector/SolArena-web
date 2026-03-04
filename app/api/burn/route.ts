// app/api/burn/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Forward body to /api/brun
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const url = new URL(req.url);
  url.pathname = "/api/brun";

  const r = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await r.text().catch(() => "");
  // Always return JSON (even if backend returned empty/html)
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: r.status });
  } catch {
    return NextResponse.json(
      { error: "non_json_response_from_backend", detail: text.slice(0, 300) },
      { status: r.status || 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}