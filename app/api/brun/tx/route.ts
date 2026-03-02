// app/api/burn/tx/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createBurnCheckedInstruction,
} from "@solana/spl-token";
import { SOLANA_RPC_URL, TOKEN_MINT, TOKEN_DECIMALS } from "@/lib/token-config";

function jsonErr(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const wallet = String(body.wallet ?? "").trim();
  const amountWhole = Number(body.amount ?? 0);

  if (!wallet) return jsonErr("wallet required", 400);
  if (!TOKEN_MINT) return jsonErr("TOKEN_MINT not set", 500);

  const amount = Math.floor(amountWhole);
  if (!Number.isFinite(amount) || amount <= 0) return jsonErr("amount must be > 0", 400);

  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  const owner = new PublicKey(wallet);
  const mint = TOKEN_MINT;

  const ata = await getAssociatedTokenAddress(mint, owner, false);

  const decimals = Number(TOKEN_DECIMALS ?? 9);
  const baseUnits = BigInt(amount) * (BigInt(10) ** BigInt(decimals));

  const ix = createBurnCheckedInstruction(
    ata,        // account (ATA)
    mint,       // mint
    owner,      // owner/authority
    baseUnits,  // amount (base units)
    decimals
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.feePayer = owner;
  tx.recentBlockhash = blockhash;
  tx.add(ix);

  const b64 = tx.serialize({ requireAllSignatures: false }).toString("base64");

  return NextResponse.json({ ok: true, tx: b64 });
}