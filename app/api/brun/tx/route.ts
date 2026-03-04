// app/api/brun/tx/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createBurnCheckedInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { SOLANA_RPC_URL, TOKEN_MINT } from "@/lib/token-config";

function jsonErr(error: string, status = 400, extra?: any) {
  return NextResponse.json({ error, ...(extra ?? {}) }, { status });
}

function toB64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return Buffer.from(s, "binary").toString("base64");
}

async function findToken2022AccountWithBalance(
  connection: any,
  owner: PublicKey,
  mint: PublicKey
) {
  const respAll = await connection.getTokenAccountsByOwner(
    owner,
    { programId: TOKEN_2022_PROGRAM_ID },
    "confirmed"
  );

  for (const v of respAll.value ?? []) {
    try {
      const acc = await getAccount(connection, v.pubkey, "confirmed", TOKEN_2022_PROGRAM_ID);
      if (acc.mint.equals(mint) && acc.amount > 0n) return v.pubkey;
    } catch {}
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const walletStr = String(body.wallet ?? "").trim();
    const amount = Math.floor(Number(body.amount ?? 0));

    if (!walletStr) return jsonErr("wallet required", 400);
    if (!Number.isFinite(amount) || amount <= 0) return jsonErr("amount must be > 0", 400);

    if (!TOKEN_MINT) return jsonErr("TOKEN_MINT not set", 500);

    const owner = new PublicKey(walletStr);
    const mint = TOKEN_MINT;

    const connection = new Connection(SOLANA_RPC_URL, "confirmed");

    const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
    const decimals = mintInfo.decimals;

    const tokenAccount = await findToken2022AccountWithBalance(connection, owner, mint);
    if (!tokenAccount) return jsonErr("No Token-2022 token account with balance for this mint", 400);

    const baseUnits = BigInt(amount) * (10n ** BigInt(decimals));

    const ix = createBurnCheckedInstruction(
      tokenAccount,
      mint,
      owner,
      baseUnits,
      decimals,
      [],
      TOKEN_2022_PROGRAM_ID
    );

    const tx = new Transaction().add(ix);
    tx.feePayer = owner;

    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;

    // Return as base64 bytes for client
    const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    return NextResponse.json({ ok: true, tx: toB64(bytes) });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", detail: String(e?.message ?? e) }, { status: 500 });
  }
}