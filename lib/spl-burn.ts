import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createBurnCheckedInstruction,
} from "@solana/spl-token";

export function buildBurnTx(params: {
  owner: PublicKey;
  mint: PublicKey;
  amountUi: number;   // fx 100 (KRAV)
  decimals: number;   // fx 9
}): Transaction {
  const { owner, mint, amountUi, decimals } = params;

  if (!Number.isFinite(amountUi) || amountUi <= 0) {
    throw new Error("Enter a burn amount > 0");
  }

  // UI amount -> base units
  const baseUnits = BigInt(Math.round(amountUi * 10 ** decimals));
  if (baseUnits <= 0n) throw new Error("Burn amount too small.");

  const ata = getAssociatedTokenAddressSync(mint, owner, false);

  const ix = createBurnCheckedInstruction(
    ata,      // token account (ATA)
    mint,     // mint
    owner,    // authority
    baseUnits,
    decimals
  );

  return new Transaction().add(ix);
}