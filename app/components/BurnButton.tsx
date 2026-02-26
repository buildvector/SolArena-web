// app/components/BurnButton.tsx
"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createBurnCheckedInstruction } from "@solana/spl-token";

import { TOKEN_MINT, TOKEN_DECIMALS, TOKEN_SYMBOL } from "@/lib/token-config";

function fmtErr(e: any) {
  const msg =
    typeof e?.message === "string"
      ? e.message
      : typeof e === "string"
      ? e
      : "Unknown error";
  return msg.length > 180 ? msg.slice(0, 180) + "…" : msg;
}

export default function BurnButton({
  amount,
  onBurned,
}: {
  amount: number;
  onBurned?: (burnedWhole: number) => void;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const mint = TOKEN_MINT; // may be null
  const decimals = Number(TOKEN_DECIMALS ?? 9);

  const canBurn = useMemo(() => {
    if (!connected || !publicKey) return false;
    if (!mint) return false;
    if (!Number.isFinite(amount) || amount <= 0) return false;
    return true;
  }, [connected, publicKey, mint, amount]);

  async function handleBurn() {
    setErr(null);
    setOk(null);

    if (!publicKey) return setErr("Connect wallet first.");
    if (!mint) return setErr("TOKEN_MINT is not set. Add NEXT_PUBLIC_TOKEN_MINT in .env.local / Vercel env.");
    if (!Number.isFinite(amount) || amount <= 0) return setErr("Enter a valid amount > 0.");

    try {
      setLoading(true);

      // Build burn tx (burnChecked expects base units amount)
      const ata = await getAssociatedTokenAddress(mint, publicKey);
      const base = BigInt(Math.floor(amount)) * BigInt(10) ** BigInt(decimals);

      const tx = new Transaction().add(
        createBurnCheckedInstruction(
          ata, // token account
          mint, // mint
          publicKey, // owner/authority
          base, // amount base units
          decimals // decimals
        )
      );

      // Send & confirm
      const sig = await sendTransaction(tx, connection);
      const conf = await connection.confirmTransaction(sig, "confirmed");
      if (conf.value.err) throw new Error("Transaction failed on-chain.");

      // Notify backend (this will verify burn by parsing tx)
      const r = await fetch("/api/burn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature: sig,
          amount: Math.floor(amount),
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "Burn API error.");

      setOk(`Burned ${Math.floor(amount)} ${TOKEN_SYMBOL}.`);
      onBurned?.(Math.floor(amount));
    } catch (e: any) {
      setErr(fmtErr(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {!mint ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          Missing <span className="font-semibold">NEXT_PUBLIC_TOKEN_MINT</span>. Burn will work after you set the mint
          address (Pump.fun mint) in env.
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleBurn}
        disabled={!canBurn || loading}
        className={[
          "w-full inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all",
          "border border-rose-400/25 bg-rose-500/12 text-white",
          "hover:bg-rose-500/18 hover:border-rose-400/35 hover:shadow-[0_0_60px_rgba(244,63,94,0.16)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {loading ? "Burning…" : `Burn ${Math.floor(amount || 0)} ${TOKEN_SYMBOL}`}
      </button>

      {err ? (
        <div className="text-xs text-rose-300 border border-rose-500/15 bg-rose-500/10 rounded-xl px-3 py-2">
          {err}
        </div>
      ) : null}

      {ok ? (
        <div className="text-xs text-emerald-200 border border-emerald-500/15 bg-emerald-500/10 rounded-xl px-3 py-2">
          {ok}
        </div>
      ) : null}
    </div>
  );
}