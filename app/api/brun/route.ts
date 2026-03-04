// app/api/brun/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Connection } from "@solana/web3.js";
import { SOLANA_RPC_URL, TOKEN_MINT, TOKEN_DECIMALS } from "@/lib/token-config";

type Body = {
  wallet: string;
  signature?: string; // required for real on-chain burn
  amount?: number; // optional: expected whole-token amount (ex: 10000)
  allowDevBurn?: boolean; // optional: localhost test fallback (no chain verification)
};

function isLocal(req: Request) {
  const host = req.headers.get("host") || "";
  return host.includes("localhost") || host.startsWith("127.0.0.1");
}

function clean(s: any) {
  return String(s ?? "").trim();
}

function jsonErr(error: string, status = 400, extra?: any) {
  return NextResponse.json({ error, ...(extra ?? {}) }, { status });
}

function jsonOk(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Robust burn detection: use token balance diffs.
 * For a burn, your token account balance decreases.
 */
function burnedBaseUnitsFromTokenBalanceDiff(tx: any, wallet: string, mint: string): bigint {
  const pre = tx?.meta?.preTokenBalances ?? [];
  const post = tx?.meta?.postTokenBalances ?? [];

  // map accountIndex -> { owner, mint, amount }
  const preMap = new Map<number, { owner?: string; mint?: string; amount: bigint }>();
  for (const b of pre) {
    const idx = Number(b.accountIndex);
    const owner = b.owner ? String(b.owner) : undefined;
    const m = b.mint ? String(b.mint) : undefined;
    const amtStr = b.uiTokenAmount?.amount ?? "0";
    let amt = BigInt(0);
    try {
      amt = BigInt(String(amtStr));
    } catch {}
    preMap.set(idx, { owner, mint: m, amount: amt });
  }

  let sum = BigInt(0);

  for (const b of post) {
    const idx = Number(b.accountIndex);
    const owner = b.owner ? String(b.owner) : undefined;
    const m = b.mint ? String(b.mint) : undefined;
    if (m !== mint) continue;

    // If owner is present, enforce match to wallet (burn authority)
    if (owner && owner !== wallet) continue;

    const postAmtStr = b.uiTokenAmount?.amount ?? "0";
    let postAmt = BigInt(0);
    try {
      postAmt = BigInt(String(postAmtStr));
    } catch {}

    const preRec = preMap.get(idx);
    const preAmt = preRec?.amount ?? BigInt(0);

    // burned amount is decrease
    if (preAmt > postAmt) sum += preAmt - postAmt;
  }

  return sum;
}

type ParsedBurn = {
  authority: string;
  mint: string;
  amountBaseUnits: bigint;
};

/**
 * Fallback (less reliable): parse burn instructions if they appear.
 */
function extractBurnsFromParsedTx(tx: any): ParsedBurn[] {
  const out: ParsedBurn[] = [];

  const isTokenProgram = (p: string) => p === "spl-token" || p === "spl-token-2022";

  const pushIfBurn = (ix: any) => {
    if (!ix) return;

    const program = String(ix.program ?? "");
    if (!isTokenProgram(program)) return;

    const parsed = ix.parsed;
    const type = String(parsed?.type ?? "");
    if (type !== "burn" && type !== "burnChecked") return;

    const info = parsed?.info ?? {};
    const authority = String(info.authority || info.owner || info.multisigAuthority || "");
    const mint = String(info.mint || "");
    const amountStr = String(info.amount ?? "");

    if (!authority || !mint || !amountStr) return;

    try {
      out.push({ authority, mint, amountBaseUnits: BigInt(amountStr) });
    } catch {
      return;
    }
  };

  for (const ix of tx?.transaction?.message?.instructions ?? []) pushIfBurn(ix);

  for (const inner of tx?.meta?.innerInstructions ?? []) {
    for (const ix of inner?.instructions ?? []) pushIfBurn(ix);
  }

  return out;
}

/**
 * Some Prisma schemas have NOT NULL fields (ex: lastSeenAt) without defaults.
 * This helper makes the upsert resilient by always setting lastSeenAt if it exists.
 */
async function upsertPlayerBurn(wallet: string, inc: number) {
  const now = new Date();

  // Best-effort: if your schema has lastSeenAt required, this prevents crashes.
  // If it doesn't exist, Prisma will still throw at build-time, so keep it only if you have lastSeenAt.
  // If you are unsure, keep it — your project earlier showed lastSeenAt NOT NULL errors.
  return prisma.player.upsert({
    where: { wallet },
    update: {
      burnedAmount: { increment: inc },
      lastSeenAt: now as any,
    } as any,
    create: {
      wallet,
      burnedAmount: inc,
      lastSeenAt: now as any,
    } as any,
  });
}

export async function POST(req: Request) {
  try {
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

      const player = await upsertPlayerBurn(wallet, amount);

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

    // Prevent replay (better to parse meta as JSON, but keep your approach)
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

    // 1) Preferred: balance diff
    let sumBase = burnedBaseUnitsFromTokenBalanceDiff(tx, wallet, mintPk);

    // 2) Fallback: instruction parsing
    if (sumBase === BigInt(0)) {
      const burns = extractBurnsFromParsedTx(tx);
      const matches = burns.filter((b) => b.authority === wallet && b.mint === mintPk);
      if (matches.length > 0) {
        sumBase = matches.reduce((acc, b) => acc + b.amountBaseUnits, BigInt(0));
      }
    }

    if (sumBase === BigInt(0)) {
      return jsonErr("no SPL burn detected for this wallet + mint in transaction", 400);
    }

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
    if (!Number.isFinite(burnedWhole) || burnedWhole <= 0)
      return jsonErr("invalid burned amount", 400);

    if (expectedWhole && burnedWhole !== Math.floor(expectedWhole)) {
      return jsonErr(
        `burned amount mismatch. expected=${Math.floor(expectedWhole)} got=${burnedWhole}`,
        400
      );
    }

    const player = await upsertPlayerBurn(wallet, burnedWhole);

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
  } catch (e: any) {
    console.error("[api/brun] fatal", e);
    // IMPORTANT: always return JSON so client never gets "Unexpected end of JSON input"
    return NextResponse.json(
      { error: "internal_error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}