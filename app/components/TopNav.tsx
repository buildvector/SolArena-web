// app/components/TopNav.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type NavKey =
  | "home"
  | "games"
  | "leaderboard"
  | "brun"
  | "tokenomics"
  | "transparency";

export default function TopNav({ active }: { active?: NavKey }) {
  const pathname = usePathname();
  const [openMore, setOpenMore] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  const current: NavKey = useMemo(() => {
    if (active) return active;
    if (pathname === "/") return "home";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/brun")) return "brun";
    if (pathname.startsWith("/tokenomics")) return "tokenomics";
    if (pathname.startsWith("/transparency")) return "transparency";
    return "home";
  }, [active, pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!moreRef.current) return;
      if (!moreRef.current.contains(e.target as Node)) setOpenMore(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMore(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const navItem = (isActive: boolean) =>
    [
      "inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold",
      "border border-white/10 bg-white/5 text-gray-200",
      "hover:bg-white/10 hover:border-white/15 transition-all",
      isActive
        ? "bg-white/10 border-white/15 text-white shadow-[0_0_30px_rgba(168,85,247,0.14)]"
        : "",
    ].join(" ");

  const ghostBtn =
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/15 transition-all";

  return (
    <header className="sticky top-0 z-50">
      {/* Premium glass bar */}
      <div className="relative border-b border-white/10 bg-black/35 backdrop-blur-xl">
        {/* subtle top glow */}
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-10 left-1/2 h-24 w-[520px] -translate-x-1/2 blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.18),rgba(34,211,238,0.10),rgba(0,0,0,0)_65%)]" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Brand */}
            <Link href="/" className="group flex items-center gap-3">
              {/* icon capsule */}
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle,rgba(168,85,247,0.25),rgba(34,211,238,0.18),rgba(0,0,0,0)_65%)]" />
                <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Image
                    src="/brand/solarena-logo.png"
                    alt="SolArena"
                    fill
                    priority
                    className="object-contain p-1.5"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
                </div>
              </div>

              {/* text */}
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <div className="text-[15px] font-extrabold tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200">
                      SolArena
                    </span>
                  </div>
                  <span className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-gray-200">
                    LIVE
                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]" />
                  </span>
                </div>

                <div className="mt-1 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[11px] text-gray-300">
                  On-chain PvP hub
                </div>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-2">
              <Link href="/" className={navItem(current === "home")}>
                Home
              </Link>

              <Link href="/#games" className={navItem(current === "games")}>
                Games
              </Link>

              <Link
                href="/leaderboard"
                className={navItem(current === "leaderboard")}
              >
                Leaderboard
              </Link>

              <Link href="/brun" className={navItem(current === "brun")}>
                Brun
              </Link>

              {/* More */}
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setOpenMore((v) => !v)}
                  className={ghostBtn}
                  aria-expanded={openMore}
                  aria-haspopup="menu"
                >
                  More <span className="text-xs opacity-70">▾</span>
                </button>

                {openMore ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-black/85 backdrop-blur-xl shadow-[0_0_70px_rgba(0,0,0,0.75)]"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-70">
                      <div className="absolute -top-16 left-1/2 h-40 w-80 -translate-x-1/2 blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.20),rgba(34,211,238,0.10),rgba(0,0,0,0)_65%)]" />
                    </div>

                    <Link
                      role="menuitem"
                      href="/tokenomics"
                      onClick={() => setOpenMore(false)}
                      className={[
                        "relative block px-4 py-3 text-sm text-gray-200",
                        "hover:bg-white/10 hover:text-white transition",
                        current === "tokenomics"
                          ? "bg-white/10 text-white"
                          : "",
                      ].join(" ")}
                    >
                      <div className="font-semibold">Tokenomics</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Utility loop, brun → multiplier
                      </div>
                    </Link>

                    <div className="h-px bg-white/10" />

                    <Link
                      role="menuitem"
                      href="/transparency"
                      onClick={() => setOpenMore(false)}
                      className={[
                        "relative block px-4 py-3 text-sm text-gray-200",
                        "hover:bg-white/10 hover:text-white transition",
                        current === "transparency"
                          ? "bg-white/10 text-white"
                          : "",
                      ].join(" ")}
                    >
                      <div className="font-semibold">Transparency</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Verify bruns, fees, leaderboard data
                      </div>
                    </Link>
                  </div>
                ) : null}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}