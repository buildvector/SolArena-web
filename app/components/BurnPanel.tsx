// app/components/BurnPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createBurnCheckedInstruction,
  getAccount,
  getMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

import { TOKEN_MINT, TOKEN_SYMBOL } from "@/lib/token-config";

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
      setMsg("Reading mint decimals...");
      const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
      const decimals = mintInfo.decimals;

      const baseUnits = BigInt(whole) * (10n ** BigInt(decimals));

      setMsg("Finding token account with balance...");
      const { tokenAccount, balanceBaseUnits } = await findToken2022AccountWithBalance(
        connection,
        publicKey,
        mint
      );

      if (balanceBaseUnits < baseUnits) {
        const haveWhole = Number(balanceBaseUnits / (10n ** BigInt(decimals)));
        throw new Error(
          `Insufficient ${TOKEN_SYMBOL || "TOKEN"} balance. Have ~${haveWhole.toLocaleString()}, tried to burn ${whole.toLocaleString()}.`
        );
      }

      const ix = createBurnCheckedInstruction(
        tokenAccount,
        mint,
        publicKey,
        baseUnits,
        decimals,
        [],
        TOKEN_2022_PROGRAM_ID
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
          <div className="text-sm text-gray-400">Token-2022 burnChecked → tier & multiplier unlock</div>
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
        </div>
      </div>

      {msg ? <div className="text-sm text-gray-300">{msg}</div> : null}
      {err ? <div className="text-sm text-red-300">{err}</div> : null}
    </div>
  );
}