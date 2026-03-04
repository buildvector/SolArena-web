// app/components/BurnPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createBurnCheckedInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

import { TOKEN_MINT, TOKEN_DECIMALS, TOKEN_SYMBOL } from "@/lib/token-config";

async function readJsonSafe(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

/**
 * Detect whether mint is classic SPL Token (Tokenkeg) or Token-2022 (TokenzQd)
 * by looking at mint account owner program id.
 */
async function detectTokenProgramId(connection: any, mint: PublicKey) {
  const info = await connection.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error("Mint account not found on chain (wrong mint/cluster/RPC).");

  const owner = info.owner?.toBase58?.() ? info.owner.toBase58() : String(info.owner);

  if (owner === TOKEN_2022_PROGRAM_ID.toBase58()) return TOKEN_2022_PROGRAM_ID;
  if (owner === TOKEN_PROGRAM_ID.toBase58()) return TOKEN_PROGRAM_ID;

  // If mint owner is neither, something is very wrong (or RPC parsing)
  throw new Error(`Unknown mint program owner: ${owner}`);
}

/**
 * Find the token account for (owner, mint) that actually has balance, using the correct token program.
 */
async function findTokenAccountWithBalance(
  connection: any,
  owner: PublicKey,
  mint: PublicKey,
  programId: PublicKey
): Promise<{ tokenAccount: PublicKey; balanceBaseUnits: bigint }> {
  // Some RPCs handle { mint } for both programs; if not, we fallback below.
  let accounts: { pubkey: PublicKey }[] = [];
  try {
    const resp = await connection.getTokenAccountsByOwner(owner, { mint }, "confirmed");
    accounts = resp.value.map((v: any) => ({ pubkey: v.pubkey }));
  } catch {
    accounts = [];
  }

  // Fallback: fetch all token accounts by programId, then filter by mint ourselves
  if (accounts.length === 0) {
    const respAll = await connection.getTokenAccountsByOwner(
      owner,
      { programId },
      "confirmed"
    );

    for (const v of respAll.value ?? []) {
      try {
        const acc = await getAccount(connection, v.pubkey, "confirmed", programId);
        if (acc.mint.equals(mint)) accounts.push({ pubkey: v.pubkey });
      } catch {
        // ignore
      }
    }
  }

  if (!accounts.length) {
    throw new Error(
      "No token account found for this mint on this wallet. (Mint/program mismatch or you have 0 balance.)"
    );
  }

  for (const a of accounts) {
    try {
      const acc = await getAccount(connection, a.pubkey, "confirmed", programId);
      if (acc.amount > 0n) return { tokenAccount: a.pubkey, balanceBaseUnits: acc.amount };
    } catch {
      // ignore non-token accounts / parse errors
    }
  }

  throw new Error("Token account exists, but balance is 0 (nothing to burn).");
}

export default function BurnPanel({ onBurned }: { onBurned?: () => void }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState<string>("10000");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => setMounted(true), []);
  const mint = useMemo(() => TOKEN_MINT, []);

  async function onBurn() {
    setErr("");
    setMsg("");

    if (!mint) return setErr("TOKEN_MINT is not set (NEXT_PUBLIC_TOKEN_MINT).");
    if (!publicKey) return setErr("Connect wallet first.");

    const whole = Math.floor(Number(amount));
    if (!Number.isFinite(whole) || whole <= 0) return setErr("Amount must be a whole number > 0");

    setBusy(true);
    try {
      const decimals = Number(TOKEN_DECIMALS ?? 9);
      const baseUnits = BigInt(whole) * (10n ** BigInt(decimals));

      setMsg("Detecting token program...");
      const programId = await detectTokenProgramId(connection, mint);

      setMsg("Finding token account with balance...");
      const { tokenAccount, balanceBaseUnits } = await findTokenAccountWithBalance(
        connection,
        publicKey,
        mint,
        programId
      );

      if (balanceBaseUnits < baseUnits) {
        const haveWhole = Number(balanceBaseUnits / (10n ** BigInt(decimals)));
        throw new Error(
          `Insufficient ${TOKEN_SYMBOL || "TOKEN"} balance. Have ~${haveWhole.toLocaleString()}, tried to burn ${whole.toLocaleString()}.`
        );
      }

      // ✅ Build burn instruction using the correct token program (Tokenkeg or Token-2022)
      const ix = createBurnCheckedInstruction(
        tokenAccount,
        mint,
        publicKey,
        baseUnits,
        decimals,
        [],
        programId
      );

      const tx = new Transaction().add(ix);

      setMsg("Sending burn transaction...");
      const sig = await sendTransaction(tx, connection);

      setMsg("Confirming...");
      const conf = await connection.confirmTransaction(sig, "confirmed");
      if (conf.value.err) throw new Error("Transaction failed during confirmation");

      setMsg("Validating burn on backend...");
      const res = await fetch("/api/brun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature: sig,
          amount: whole,
        }),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || `Burn verify failed (status ${res.status})`);

      setMsg(`✅ Burn counted: ${whole.toLocaleString()} ${TOKEN_SYMBOL || "TOKEN"}`);
      onBurned?.();
    } catch (e: any) {
      setErr(e?.message || "Burn failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold">Burn {TOKEN_SYMBOL || "TOKEN"}</div>
          <div className="text-sm text-gray-400">On-chain burn (burnChecked) → tier & multiplier unlock</div>
        </div>
        {mounted ? <WalletMultiButton /> : <div className="h-10 w-40 rounded bg-white/10" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="space-y-1">
          <div className="text-sm text-gray-400">Amount (whole tokens)</div>
          <input
            className="w-full rounded bg-black border border-gray-800 px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="10000"
          />
        </div>

        <button
          className="rounded bg-white text-black px-4 py-2 font-semibold disabled:opacity-50"
          onClick={onBurn}
          disabled={!mounted || !connected || !publicKey || busy || !mint}
        >
          {busy ? "Burning..." : "Burn"}
        </button>

        <div className="text-xs text-gray-500">
          Mint: {mint ? `${mint.toBase58().slice(0, 6)}...${mint.toBase58().slice(-4)}` : "not set"}
          <br />
          Decimals: {String(TOKEN_DECIMALS ?? 9)}
        </div>
      </div>

      {msg ? <div className="text-sm text-gray-300">{msg}</div> : null}
      {err ? <div className="text-sm text-red-300">{err}</div> : null}
    </div>
  );
}