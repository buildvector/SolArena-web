// app/api/brun/send/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Connection, Transaction } from "@solana/web3.js";
import { SOLANA_RPC_URL } from "@/lib/token-config";

function jsonErr(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const signedTxB64 = String(body.signedTx ?? "").trim();

  if (!signedTxB64) return jsonErr("signedTx required", 400);

  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  const raw = Buffer.from(signedTxB64, "base64");
  const tx = Transaction.from(raw);

  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  await connection.confirmTransaction(sig, "confirmed");

  return NextResponse.json({ ok: true, signature: sig });
}