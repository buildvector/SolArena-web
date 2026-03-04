// app/components/BurnSection.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { TOKEN_SYMBOL } from "@/lib/token-config";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

function b64ToBytes(b64: string) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function bytesToB64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export default function BurnSection() {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;

  const [amount, setAmount] = useState<number>(10000);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function handleBurn() {
    try {
      if (!publicKey || !wallet.signTransaction) {
        alert("Connect wallet first");
        return;
      }

      setLoading(true);
      setStatus("Building transaction...");

      // 1) Build unsigned tx on server
      const r1 = await fetch("/api/brun/tx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          amount,
        }),
      });

      const j1 = await r1.json();
      if (!r1.ok) throw new Error(j1.error || "tx build failed");

      const bytes = b64ToBytes(j1.tx);

      // 2) Parse as versioned first, fallback legacy
      let signedBytes: Uint8Array;

      try {
        const vtx = VersionedTransaction.deserialize(bytes);
        setStatus("Signing in wallet...");
        const signedV = await wallet.signTransaction(vtx as any);
        signedBytes = signedV.serialize();
      } catch {
        const ltx = Transaction.from(bytes);
        setStatus("Signing in wallet...");
        const signedL = await wallet.signTransaction(ltx as any);
        signedBytes = signedL.serialize();
      }

      const signedB64 = bytesToB64(signedBytes);

      setStatus("Sending transaction...");

      // 3) Send via server
      const r2 = await fetch("/api/brun/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signedTx: signedB64 }),
      });

      const j2 = await r2.json();
      if (!r2.ok) throw new Error(j2.error || "send failed");

      setStatus("Verifying burn...");

      // 4) Verify + update DB
      const r3 = await fetch("/api/brun", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          signature: j2.signature,
          amount,
        }),
      });

      const j3 = await r3.json();
      if (!r3.ok) throw new Error(j3.error || "verify failed");

      setStatus("🔥 Burn successful!");
    } catch (err: any) {
      console.error(err);
      setStatus("❌ " + (err.message || "Burn failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.45)]">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold tracking-tight">🔥 Burn</div>
            <div className="mt-1 text-sm text-gray-400 max-w-2xl">
              Burn {TOKEN_SYMBOL} to increase multiplier and rank.
            </div>
          </div>

          <div className="shrink-0">
            <WalletMultiButton />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-widest text-gray-500">Amount</div>

            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                min={1}
                step={1}
                value={Number.isFinite(amount) ? amount : 0}
                onChange={(e) => setAmount(Math.max(0, Math.floor(Number(e.target.value || 0))))}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-white/20"
              />
              <div className="text-sm font-semibold text-gray-200">{TOKEN_SYMBOL}</div>
            </div>

            {connected && publicKey && (
              <div className="mt-3 text-xs text-gray-500">
                Wallet: <span className="text-gray-300">{publicKey.toBase58().slice(0, 6)}…</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-widest text-gray-500">Action</div>
            <div className="mt-2">
              <button
                onClick={handleBurn}
                disabled={!connected || loading || amount <= 0}
                className="w-full rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-3 text-sm font-bold transition"
              >
                {loading ? "Processing..." : `Burn ${amount} ${TOKEN_SYMBOL}`}
              </button>

              {status && <div className="mt-3 text-xs text-gray-400">{status}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}