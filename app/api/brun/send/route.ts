// app/api/brun/send/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Connection, Transaction } from "@solana/web3.js";
import { SOLANA_RPC_URL } from "@/lib/token-config";

function jsonErr(error: string, status = 400, extra?: any) {
  return NextResponse.json({ error, ...(extra ?? {}) }, { status });
}

function asString(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const signedTxB64 = asString(body.signedTx);

    if (!signedTxB64) return jsonErr("signedTx required", 400);

    // Decode base64 safely
    let raw: Buffer;
    try {
      raw = Buffer.from(signedTxB64, "base64");
    } catch {
      return jsonErr("signedTx must be base64", 400);
    }

    // Parse transaction safely
    let tx: Transaction;
    try {
      tx = Transaction.from(raw);
    } catch {
      return jsonErr("invalid signedTx (cannot parse transaction)", 400);
    }

    const connection = new Connection(SOLANA_RPC_URL, "confirmed");

    // sendRawTransaction can throw (RPC issues, simulation fail, blockhash, etc.)
    let sig: string;
    try {
      sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
    } catch (e: any) {
      return jsonErr("sendRawTransaction failed", 502, {
        detail: String(e?.message ?? e),
      });
    }

    // confirm can also throw
    try {
      await connection.confirmTransaction(sig, "confirmed");
    } catch (e: any) {
      return jsonErr("confirmTransaction failed", 502, {
        signature: sig,
        detail: String(e?.message ?? e),
      });
    }

    return NextResponse.json({ ok: true, signature: sig });
  } catch (e: any) {
    console.error("[api/brun/send] fatal", e);
    // IMPORTANT: always JSON so client never crashes on res.json()
    return NextResponse.json(
      { error: "internal_error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}