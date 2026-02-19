// lib/token-config.ts
import { PublicKey, clusterApiUrl } from "@solana/web3.js";

export type SolanaCluster = "devnet" | "mainnet-beta";

export const SOLANA_CLUSTER = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as SolanaCluster) ?? "devnet";

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
  clusterApiUrl(SOLANA_CLUSTER);

function safePublicKey(value?: string | null) {
  const v = (value ?? "").trim();

  // treat empty / placeholders as not set
  if (!v || v === "undefined" || v === "null" || v === "...") return null;

  try {
    return new PublicKey(v);
  } catch {
    console.warn(`[token-config] Invalid public key in env: "${v}"`);
    return null;
  }
}

export const TOKEN_MINT = safePublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT);

export const TOKEN_SYMBOL = (process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "SARENA").trim();
export const TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? 9) || 9;

export const BURN_DESTINATION = safePublicKey(process.env.NEXT_PUBLIC_BURN_DESTINATION);

// backwards compat (så import { CLUSTER } virker)
export const CLUSTER = SOLANA_CLUSTER;
