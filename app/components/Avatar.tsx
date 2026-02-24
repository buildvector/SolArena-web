// app/components/Avatar.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";

function seedFromWallet(wallet: string) {
  // deterministic 32-bit seed
  let h = 2166136261;
  for (let i = 0; i < wallet.length; i++) {
    h ^= wallet.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function Avatar({
  wallet,
  size = 32,
  className = "",
}: {
  wallet: string;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const seed = useMemo(() => seedFromWallet(wallet || ""), [wallet]);

  useEffect(() => {
    if (!ref.current) return;

    // clear
    ref.current.innerHTML = "";

    // Use require to avoid TS module typing issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jazzicon = require("@metamask/jazzicon");

    const el: HTMLElement =
      typeof jazzicon === "function" ? jazzicon(size, seed) : jazzicon.default(size, seed);

    el.style.borderRadius = "9999px";
    ref.current.appendChild(el);
  }, [seed, size]);

  return (
    <div
      ref={ref}
      className={`shrink-0 overflow-hidden rounded-full border border-white/10 ${className}`}
      style={{ width: size, height: size }}
      title={wallet}
    />
  );
}