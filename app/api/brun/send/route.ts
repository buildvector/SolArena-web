// app/api/brun/send/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  Connection,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { SOLANA_RPC_URL } from "@/lib/token-config";

function jsonErr(error: string, status = 400, extra?: any) {
  return NextResponse.json({ error, ...(extra ?? {}) }, { status });
}

function asString(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

function parseAnyTx(raw: Buffer): { kind: "versioned" | "legacy"; tx: any } {
  // Try versioned first
  try {
    const vtx = VersionedTransaction.deserialize(new Uint8Array(raw));
    return { kind: "versioned", tx: vtx };
  } catch {
    // Fallback to legacy
    const ltx = Transaction.from(raw);
    return { kind: "legacy", tx: ltx };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const signedTxB64 = asString(body.signedTx);

    if (!signedTxB64) return jsonErr("signedTx required", 400);

    let raw: Buffer;
    try {
      raw = Buffer.from(signedTxB64, "base64");
    } catch {
      return jsonErr("signedTx must be base64", 400);
    }

    let parsed: { kind: "versioned" | "legacy"; tx: any };
    try {
      parsed = parseAnyTx(raw);
    } catch {
      return jsonErr("invalid signedTx (cannot parse transaction)", 400);
    }

    const connection = new Connection(SOLANA_RPC_URL, "confirmed");

    // Best-effort simulation: never block sending
    let simNote: any = null;
    try {
      const sim = await connection.simulateTransaction(parsed.tx, {
        sigVerify: false,
        replaceRecentBlockhash: true, // helps if blockhash is stale (RPC-dependent)
        commitment: "confirmed",
      } as any);

      if (sim?.value?.err) {
        return jsonErr("simulation failed", 400, {
          txKind: parsed.kind,
          err: sim.value.err,
          logs: sim.value.logs ?? [],
        });
      }
    } catch (e: any) {
      // Don't fail here — keep for debugging if send fails
      simNote = String(e?.message ?? e);
    }

    // Send raw bytes exactly as received (works for both legacy + versioned)
    let sig: string;
    try {
      sig = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        maxRetries: 3,
      });
    } catch (e: any) {
      return jsonErr("sendRawTransaction failed", 502, {
        txKind: parsed.kind,
        detail: String(e?.message ?? e),
        simNote,
      });
    }

    try {
      await connection.confirmTransaction(sig, "confirmed");
    } catch (e: any) {
      return jsonErr("confirmTransaction failed", 502, {
        txKind: parsed.kind,
        signature: sig,
        detail: String(e?.message ?? e),
        simNote,
      });
    }

    return NextResponse.json({ ok: true, signature: sig, txKind: parsed.kind, simNote });
  } catch (e: any) {
    console.error("[api/brun/send] fatal", e);
    return NextResponse.json(
      { error: "internal_error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}