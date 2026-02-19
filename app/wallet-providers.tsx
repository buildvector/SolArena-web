"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

import { SOLANA_RPC_URL } from "@/lib/token-config";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function WalletProviders({ children }: { children: ReactNode }) {
  const endpoint = SOLANA_RPC_URL;

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
