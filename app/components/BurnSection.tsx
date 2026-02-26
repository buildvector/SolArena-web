// app/components/BurnSection.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

import BurnButton from "@/app/components/BurnButton";
import { TOKEN_SYMBOL } from "@/lib/token-config";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function BurnSection() {
  const { connected, publicKey } = useWallet();
  const [amount, setAmount] = useState<number>(10000);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.45)]">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-extrabold tracking-tight">
              🔥 Burn
            </div>
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
            <div className="text-xs uppercase tracking-widest text-gray-500">
              Amount
            </div>

            <div className="mt-2 flex items-center gap-3">
              <input
                type="number"
                min={1}
                step={1}
                value={Number.isFinite(amount) ? amount : 0}
                onChange={(e) =>
                  setAmount(
                    Math.max(0, Math.floor(Number(e.target.value || 0)))
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-white/20"
              />
              <div className="text-sm font-semibold text-gray-200">
                {TOKEN_SYMBOL}
              </div>
            </div>

            {connected && publicKey && (
              <div className="mt-3 text-xs text-gray-500">
                Wallet:{" "}
                <span className="text-gray-300">
                  {publicKey.toBase58().slice(0, 6)}…
                </span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-widest text-gray-500">
              Action
            </div>
            <div className="mt-2">
              <BurnButton amount={amount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}