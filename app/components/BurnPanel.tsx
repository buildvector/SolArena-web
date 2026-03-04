// app/components/BurnPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import { createBurnCheckedInstruction, getAccount } from "@solana/spl-token";

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
 * Important: Do NOT assume ATA.
 * Users can hold tokens in non-ATA token accounts.
 * We find the token account for this mint that actually has balance.
 */
async function findTokenAccountWithBalance(
  connection: any,
  owner: PublicKey,
  mint: PublicKey
): Promise<{ tokenAccount: PublicKey; balanceBaseUnits: bigint }> {
  const resp = await connection.getTokenAccountsByOwner(owner, { mint });

  if (!resp.value.length) {
    throw new Error(
      "This wallet has no token account for this mint. If you bought the token, try reconnecting / switching account and retry."
    );
  }

  // Pick the first token account with balance > 0
  for (const v of resp.value) {
    try {
      const acc = await getAccount(connection, v.pubkey);
      if (acc.amount > 0n) {
        return { tokenAccount: v.pubkey, balanceBaseUnits: acc.amount };
      }
    } catch {
      // ignore accounts that can't be parsed as SPL token accounts
    }
  }

  throw new Error("Token account exists, but balance is 0 (nothing to burn).");
}

export default function BurnPanel({ onBurned }: { onBurned?: () => void }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState<string>("10000"); // whole tokens
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => setMounted(true), []);

  const mint = useMemo(() => TOKEN_MINT, []);

  async function onBurn() {
    setErr("");
    setMsg("");

    if (!mint) {
      setErr(
        "TOKEN_MINT is not set yet. Set NEXT_PUBLIC_TOKEN_MINT in Vercel env after launch."
      );
      return;
    }
    if (!publicKey) {
      setErr("Connect wallet first.");
      return;
    }

    const whole = Math.floor(Number(amount));
    if (!Number.isFinite(whole) || whole <= 0) {
      setErr("Amount must be a whole number > 0");
      return;
    }

    setBusy(true);
    try {
      const decimals = Number(TOKEN_DECIMALS ?? 9);
      const baseUnits = BigInt(whole) * (BigInt(10) ** BigInt(decimals));

      setMsg("Finding token account...");
      const { tokenAccount, balanceBaseUnits } = await findTokenAccountWithBalance(
        connection,
        publicKey,
        mint
      );

      if (balanceBaseUnits < baseUnits) {
        const haveWhole = Number(balanceBaseUnits / (10n ** BigInt(decimals)));
        throw new Error(
          `Insufficient ${TOKEN_SYMBOL || "TOKEN"} balance on this wallet. Have ~${haveWhole.toLocaleString()}, tried to burn ${whole.toLocaleString()}.`
        );
      }

      // Burn from the *actual* token account holding tokens (not necessarily ATA)
      const ix = createBurnCheckedInstruction(
        tokenAccount, // token account (source)
        mint, // mint
        publicKey, // owner/authority
        baseUnits, // amount in base units
        decimals
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
      if (!res.ok) {
        throw new Error(data?.error || `Burn verify failed (status ${res.status})`);
      }

      setMsg(
        `✅ Burn counted: ${whole.toLocaleString()} ${TOKEN_SYMBOL || "TOKEN"} (tx: ${sig.slice(
          0,
          8
        )}...)`
      );
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
          <div className="text-sm text-gray-400">
            On-chain burn (burnChecked) → tier & multiplier unlock
          </div>
        </div>

        {/* Avoid hydration mismatch */}
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
          title={!mint ? "Set NEXT_PUBLIC_TOKEN_MINT first" : ""}
        >
          {busy ? "Burning..." : "Burn"}
        </button>

        <div className="text-xs text-gray-500">
          Mint:{" "}
          {mint
            ? `${mint.toBase58().slice(0, 6)}...${mint.toBase58().slice(-4)}`
            : "not set"}
          <br />
          Decimals: {String(TOKEN_DECIMALS ?? 9)}
        </div>
      </div>

      {msg ? <div className="text-sm text-gray-300">{msg}</div> : null}
      {err ? <div className="text-sm text-red-300">{err}</div> : null}

      {!mint ? (
        <div className="text-xs text-amber-200/90 border border-amber-500/30 bg-amber-500/10 rounded p-3">
          TOKEN_MINT is not set yet. That’s fine pre-launch. After launch, set{" "}
          <code>NEXT_PUBLIC_TOKEN_MINT</code> to your mint (base58) and reload.
        </div>
      ) : null}
    </div>
  );
}