// app/api/burn/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Connection } from "@solana/web3.js";
import { SOLANA_RPC_URL, TOKEN_MINT, TOKEN_DECIMALS } from "@/lib/token-config";

type Body = {
  wallet: string;
  signature?: string;     // required for real on-chain burn
  amount?: number;        // optional: expected whole-token amount (ex: 10000)
  allowDevBurn?: boolean; // optional: localhost test fallback (no chain verification)
};

function isLocal(req: Request) {
  const host = req.headers.get("host") || "";
  return host.includes("localhost") || host.startsWith("127.0.0.1");
}

function clean(s: any) {
  return String(s ?? "").trim();
}

function jsonErr(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function jsonOk(data: any) {
  return NextResponse.json(data);
}

type ParsedBurn = {
  authority: string;
  mint: string;
  amountBaseUnits: bigint; // burn amount in base units
};

function extractBurnsFromParsedTx(tx: any): ParsedBurn[] {
  const out: ParsedBurn[] = [];

  const isTokenProgram = (p: string) =>
    p === "spl-token" || p === "spl-token-2022";

  const pushIfBurn = (ix: any) => {
    if (!ix) return;

    const program = String(ix.program ?? "");
    if (!isTokenProgram(program)) return;

    const parsed = ix.parsed;
    const type = String(parsed?.type ?? "");
    if (type !== "burn" && type !== "burnChecked") return;

    const info = parsed?.info ?? {};
    const authority = String(
      info.authority || info.owner || info.multisigAuthority || ""
    );
    const mint = String(info.mint || "");
    const amountStr = String(info.amount ?? "");

    if (!authority || !mint || !amountStr) return;

    try {
      out.push({ authority, mint, amountBaseUnits: BigInt(amountStr) });
    } catch {
      return;
    }
  };

  // top-level parsed instructions
  for (const ix of tx?.transaction?.message?.instructions ?? []) pushIfBurn(ix);

  // inner instructions (often where token burns show up)
  for (const inner of tx?.meta?.innerInstructions ?? []) {
    for (const ix of inner?.instructions ?? []) pushIfBurn(ix);
  }

  return out;
}

export async function POST(req: Request) {
  const body: Body = await req.json().catch(() => ({} as any));

  const wallet = clean(body.wallet);
  const signature = clean(body.signature);
  const expectedWhole = Number(body.amount ?? 0);

  if (!wallet) return jsonErr("wallet required", 400);

  // --- DEV fallback (localhost only) ---
  if (!signature) {
    if (!isLocal(req)) {
      return jsonErr("signature required (real on-chain burn)", 400);
    }
    if (!body.allowDevBurn) {
      return jsonErr(
        'Missing signature. On localhost you can pass { "allowDevBurn": true } for test burns.',
        400
      );
    }

    const amount = Math.floor(expectedWhole);
    if (!Number.isFinite(amount) || amount <= 0) return jsonErr("amount must be > 0", 400);

    const player = await prisma.player.upsert({
      where: { wallet },
      update: { burnedAmount: { increment: amount } },
      create: { wallet, burnedAmount: amount },
    });

    await prisma.event.create({
      data: {
        type: "burn_dev",
        wallet,
        amountSol: null,
        meta: JSON.stringify({ amount, note: "dev burn (no chain verification)" }),
      },
    });

    return jsonOk({ ok: true, mode: "dev", player });
  }

  // --- REAL ON-CHAIN VERIFICATION ---
  if (!TOKEN_MINT) {
    return jsonErr("NEXT_PUBLIC_TOKEN_MINT is not set (cannot verify burn)", 500);
  }

  // Prevent replay (same tx counted twice)
  const already = await prisma.event.findFirst({
    where: { type: "burn", meta: { contains: signature } },
  });
  if (already) return jsonErr("burn signature already used", 409);

  const connection = new Connection(SOLANA_RPC_URL, "confirmed");

  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!tx) return jsonErr("transaction not found (wrong signature or RPC)", 404);
  if (tx.meta?.err) return jsonErr("transaction failed on-chain (meta.err)", 400);

  const burns = extractBurnsFromParsedTx(tx);
  if (burns.length === 0) return jsonErr("no SPL burn instruction found in transaction", 400);

  const mintPk = TOKEN_MINT.toBase58();

  // match wallet + mint
  const matches = burns.filter((b) => b.authority === wallet && b.mint === mintPk);
  if (matches.length === 0) {
    return jsonErr("no burn found for this wallet + mint in tx", 400);
  }

  // sum burns (base units)
  const sumBase = matches.reduce((acc, b) => acc + b.amountBaseUnits, BigInt(0));

  // base units -> whole tokens
  const decimals = Number(TOKEN_DECIMALS ?? 9);
  const denom = BigInt(10) ** BigInt(decimals);

  const whole = sumBase / denom;
  const remainder = sumBase % denom;

  if (remainder !== BigInt(0)) {
    return jsonErr(
      `burn amount is not whole tokens (baseUnits=${sumBase.toString()}, decimals=${decimals}). Burn must be an exact whole token amount for tiers.`,
      400
    );
  }

  const burnedWhole = Number(whole);
  if (!Number.isFinite(burnedWhole) || burnedWhole <= 0) return jsonErr("invalid burned amount", 400);

  if (expectedWhole && burnedWhole !== Math.floor(expectedWhole)) {
    return jsonErr(`burned amount mismatch. expected=${Math.floor(expectedWhole)} got=${burnedWhole}`, 400);
  }

  const player = await prisma.player.upsert({
    where: { wallet },
    update: { burnedAmount: { increment: burnedWhole } },
    create: { wallet, burnedAmount: burnedWhole },
  });

  await prisma.event.create({
    data: {
      type: "burn",
      wallet,
      amountSol: null,
      meta: JSON.stringify({
        signature,
        mint: mintPk,
        burnedWhole,
        burnedBaseUnits: sumBase.toString(),
        decimals,
      }),
    },
  });

  return jsonOk({ ok: true, mode: "onchain", burnedWhole, signature, player });
}