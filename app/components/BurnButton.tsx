// app/components/BurnButton.tsx
"use client";

import { useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createBurnCheckedInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";

import { TOKEN_MINT, TOKEN_SYMBOL } from "@/lib/token-config";

function fmtErr(e: any) {
  const msg =
    typeof e?.message === "string"
      ? e.message
      : typeof e === "string"
      ? e
      : "Transaction failed";
  return msg.length > 220 ? msg.slice(0, 220) + "…" : msg;
}

async function readJsonSafe(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 200) };
  }
}

async function findToken2022AccountWithBalance(
  connection: any,
  owner: PublicKey,
  mint: PublicKey
): Promise<{ tokenAccount: PublicKey; balanceBaseUnits: bigint }> {
  const respAll = await connection.getTokenAccountsByOwner(
    owner,
    { programId: TOKEN_2022_PROGRAM_ID },
    "confirmed"
  );

  for (const v of respAll.value ?? []) {
    try {
      const acc = await getAccount(connection, v.pubkey, "confirmed", TOKEN_2022_PROGRAM_ID);
      if (acc.mint.equals(mint) && acc.amount > 0n) {
        return { tokenAccount: v.pubkey, balanceBaseUnits: acc.amount };
      }
    } catch {}
  }

  throw new Error("No Token-2022 token account with balance found for this mint on this wallet.");
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

  const mint = TOKEN_MINT;

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
    if (!mint) return setErr("Burn unavailable (TOKEN_MINT missing).");
    if (!Number.isFinite(amount) || amount <= 0) return setErr("Enter valid amount.");

    try {
      setLoading(true);

      // Read decimals from chain (Token-2022)
      const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
      const decimals = mintInfo.decimals;

      const whole = Math.floor(amount);
      const base = BigInt(whole) * (10n ** BigInt(decimals));

      // Find the real token account with balance (Token-2022)
      const { tokenAccount, balanceBaseUnits } = await findToken2022AccountWithBalance(
        connection,
        publicKey,
        mint
      );

      if (balanceBaseUnits < base) {
        const haveWhole = Number(balanceBaseUnits / (10n ** BigInt(decimals)));
        throw new Error(`Insufficient balance. Have ~${haveWhole}, tried to burn ${whole}.`);
      }

      const tx = new Transaction().add(
        createBurnCheckedInstruction(
          tokenAccount,
          mint,
          publicKey,
          base,
          decimals,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      const sig = await sendTransaction(tx, connection);
      const conf = await connection.confirmTransaction(sig, "confirmed");
      if (conf.value.err) throw new Error("On-chain error.");

      const r = await fetch("/api/brun", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature: sig,
          amount: whole,
        }),
      });

      const j = await readJsonSafe(r);
      if (!r.ok) throw new Error(j?.error || `API error (${r.status}).`);

      setOk("Burn successful.");
      onBurned?.(whole);
    } catch (e: any) {
      setErr(fmtErr(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
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

      {err && (
        <div className="text-xs text-rose-300 border border-rose-500/15 bg-rose-500/10 rounded-xl px-3 py-2">
          {err}
        </div>
      )}

      {ok && (
        <div className="text-xs text-emerald-200 border border-emerald-500/15 bg-emerald-500/10 rounded-xl px-3 py-2">
          {ok}
        </div>
      )}
    </div>
  );
}