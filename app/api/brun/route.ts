// app/api/brun/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Connection } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";
import { SOLANA_RPC_URL, TOKEN_MINT } from "@/lib/token-config";

type Body = {
  wallet: string;
  signature?: string;
  amount?: number; // expected whole tokens
  allowDevBurn?: boolean;
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

/**
 * Robust burn detection: use token balance diffs.
 * For a burn, your token account balance decreases.
 */
function burnedBaseUnitsFromTokenBalanceDiff(
  tx: any,
  wallet: string,
  mint: string
): bigint {
  const pre = tx?.meta?.preTokenBalances ?? [];
  const post = tx?.meta?.postTokenBalances ?? [];

  const preMap = new Map<number, { owner?: string; mint?: string; amount: bigint }>();
  for (const b of pre) {
    const idx = Number(b.accountIndex);
    const owner = b.owner ? String(b.owner) : undefined;
    const m = b.mint ? String(b.mint) : undefined;
    const amtStr = b.uiTokenAmount?.amount ?? "0";
    let amt = 0n;
    try { amt = BigInt(String(amtStr)); } catch {}
    preMap.set(idx, { owner, mint: m, amount: amt });
  }

  let sum = 0n;

  for (const b of post) {
    const idx = Number(b.accountIndex);
    const owner = b.owner ? String(b.owner) : undefined;
    const m = b.mint ? String(b.mint) : undefined;
    if (m !== mint) continue;
    if (owner && owner !== wallet) continue;

    const postAmtStr = b.uiTokenAmount?.amount ?? "0";
    let postAmt = 0n;
    try { postAmt = BigInt(String(postAmtStr)); } catch {}

    const preRec = preMap.get(idx);
    const preAmt = preRec?.amount ?? 0n;

    if (preAmt > postAmt) sum += (preAmt - postAmt);
  }

  return sum;
}

/**
 * Detect token program by mint account owner.
 * Tokenkeg => TOKEN_PROGRAM_ID
 * TokenzQd => TOKEN_2022_PROGRAM_ID
 */
async function detectTokenProgramId(connection: Connection, mintPk58: string) {
  const info = await connection.getAccountInfo(new (await import("@solana/web3.js")).PublicKey(mintPk58), "confirmed");
  if (!info) throw new Error("Mint account not found on chain");
  const owner = info.owner.toBase58();
  if (owner === TOKEN_2022_PROGRAM_ID.toBase58()) return TOKEN_2022_PROGRAM_ID;
  if (owner === TOKEN_PROGRAM_ID.toBase58()) return TOKEN_PROGRAM_ID;
  throw new Error(`Unknown mint program owner: ${owner}`);
}

export async function POST(req: Request) {
  const body: Body = await req.json().catch(() => ({} as any));

  const wallet = clean(body.wallet);
  const signature = clean(body.signature);
  const expectedWhole = Number(body.amount ?? 0);

  if (!wallet) return jsonErr("wallet required", 400);

  // DEV fallback
  if (!signature) {
    if (!isLocal(req)) return jsonErr("signature required (real on-chain burn)", 400);
    if (!body.allowDevBurn) {
      return jsonErr('Missing signature. On localhost pass { "allowDevBurn": true }.', 400);
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

  if (!TOKEN_MINT) return jsonErr("NEXT_PUBLIC_TOKEN_MINT is not set (cannot verify burn)", 500);

  // Prevent replay
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

  const mintPk = TOKEN_MINT.toBase58();

  // burned base units via token balance diff
  const sumBase = burnedBaseUnitsFromTokenBalanceDiff(tx, wallet, mintPk);
  if (sumBase === 0n) return jsonErr("no SPL burn detected for this wallet + mint in transaction", 400);

  // ✅ decimals must come from chain (Token-2022 or classic)
  let decimals = 9;
  try {
    const programId = await detectTokenProgramId(connection, mintPk);
    const mintInfo = await getMint(connection, TOKEN_MINT, "confirmed", programId);
    decimals = mintInfo.decimals;
  } catch (e: any) {
    return jsonErr(`failed to read mint decimals on-chain: ${String(e?.message ?? e)}`, 500);
  }

  const denom = 10n ** BigInt(decimals);

  const whole = sumBase / denom;
  const remainder = sumBase % denom;

  if (remainder !== 0n) {
    return jsonErr(
      `burn amount is not whole tokens (baseUnits=${sumBase.toString()}, decimals=${decimals})`,
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
        method: "token_balance_diff",
      }),
    },
  });

  return jsonOk({ ok: true, mode: "onchain", burnedWhole, signature, player });
}