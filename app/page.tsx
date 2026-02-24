import Image from "next/image";
import TopNav from "@/app/components/TopNav";
import LeaderboardSection from "@/app/components/LeaderboardSection";
import BurnSection from "@/app/components/BurnSection";

function GlowBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(34,211,238,0.09),rgba(168,85,247,0.10),rgba(0,0,0,0)_65%)]" />
        <div className="absolute -bottom-40 right-1/4 h-[520px] w-[720px] translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.10),rgba(34,211,238,0.06),rgba(0,0,0,0)_70%)]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.58),rgba(0,0,0,0.93))]" />
    </div>
  );
}

function SecondaryButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className={[
        "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold",
        "border border-white/10 bg-white/5 text-gray-200",
        "hover:bg-white/10 hover:border-white/15",
        "transition-all",
      ].join(" ")}
    >
      {label}
    </a>
  );
}

function PrimaryCta({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className={[
        "group inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold",
        "border border-violet-400/25 bg-violet-500/12 text-white",
        "hover:bg-violet-500/18 hover:border-violet-400/35",
        "transition-all",
      ].join(" ")}
    >
      <span className="mr-2">{label}</span>
      <span className="opacity-70 group-hover:opacity-100 transition">↓</span>
    </a>
  );
}

/** Minimal “Shuffle-ish” game poster card: tight, big art, little chrome */
function GamePoster({
  title,
  subtitle,
  badge,
  href,
  accent,
  imageSrc,
}: {
  title: string;
  subtitle: string;
  badge: string;
  href: string;
  accent: "violet" | "cyan" | "fuchsia";
  imageSrc: string;
}) {
  const badgeCls =
    accent === "violet"
      ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
      : accent === "cyan"
      ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
      : "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200";

  const hoverGlow =
    accent === "violet"
      ? "hover:shadow-[0_0_60px_rgba(168,85,247,0.16)]"
      : accent === "cyan"
      ? "hover:shadow-[0_0_60px_rgba(34,211,238,0.14)]"
      : "hover:shadow-[0_0_60px_rgba(236,72,153,0.14)]";

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={[
        "group relative block overflow-hidden rounded-2xl",
        "border border-white/10 bg-white/[0.018]",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:bg-white/[0.03]",
        hoverGlow,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01),rgba(0,0,0,0))]" />
      </div>

      <div className="relative p-3">
        <div className="flex items-center justify-between">
          <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold", badgeCls].join(" ")}>
            {badge}
          </span>
          <span className="text-[11px] text-gray-500 group-hover:text-gray-300 transition">Open ↗</span>
        </div>

        {/* Bigger image, less air */}
        <div className="mt-2">
          <div className="relative w-full h-[340px] sm:h-[420px]">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.06),rgba(0,0,0,0)_62%)]" />
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-contain drop-shadow-[0_28px_70px_rgba(0,0,0,0.78)] transition-transform duration-200 group-hover:scale-[1.06]"
            />
          </div>
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base sm:text-lg font-extrabold tracking-tight">{title}</div>
            <div className="mt-0.5 truncate text-sm text-gray-400">{subtitle}</div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-white/90 group-hover:text-white transition">Play ↗</span>
        </div>
      </div>

      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/0 group-hover:ring-white/10 transition" />
    </a>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen text-white">
      <GlowBg />
      <TopNav active="home" />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
        {/* HERO */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.55)]">
          <div className="relative p-6 sm:p-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.15),rgba(34,211,238,0.07),rgba(0,0,0,0)_65%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/60" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-gray-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)]" />
                On-chain PvP • Verifiable outcomes
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
                Play. Compete.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200">
                  Burn.
                </span>{" "}
                Climb.
              </h1>

              <p className="mt-3 max-w-2xl text-sm sm:text-base text-gray-200/80">
                The fastest on-chain PvP hub on Solana. Skill, streaks, and volume — all tracked on the leaderboard.
                Burn to unlock tiers and multipliers.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <PrimaryCta href="#games" label="Play now" />
                <SecondaryButton href="/games" label="Open Games" />
                <SecondaryButton href="/burn" label="Burn & unlock" />
                <SecondaryButton href="/tokenomics" label="Tokenomics" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-gray-200/90">🏆 Win streaks → rank up</div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-gray-200/90">🔥 Burn token → points multiplier</div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-gray-200/90">⚡ Fast PvP games, low friction</div>
              </div>
            </div>
          </div>
        </section>

        {/* GAMES PREVIEW (scroll) */}
        <section id="games" className="mt-10 scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Games</h2>
              <p className="mt-1 text-sm text-gray-400">
                Click. Play. Results hit the leaderboard.
              </p>
            </div>

            <a
              href="/games"
              className="hidden sm:inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 hover:border-white/15 transition"
            >
              Open Games →
            </a>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <GamePoster
              title="Flip"
              subtitle="50/50. Fast. Addictive."
              badge="CLASSIC"
              href="https://filponsol.vercel.app/"
              accent="violet"
              imageSrc="/games/flip.png"
            />
            <GamePoster
              title="Reaction Duel"
              subtitle="Click faster. Prove skill."
              badge="SKILL"
              href="https://reaction-duel.vercel.app/"
              accent="cyan"
              imageSrc="/games/reaction.png"
            />
            <GamePoster
              title="Tic Tac Toe"
              subtitle="PvP mind games."
              badge="PVP"
              href="https://pvptictactoe.vercel.app/"
              accent="fuchsia"
              imageSrc="/games/ttt.png"
            />
          </div>
        </section>

        {/* LEADERBOARD PREVIEW (scroll) */}
        <section className="mt-12">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Live rankings <span className="text-gray-600">•</span> Updates every 8s
            </div>
            <a href="/leaderboard" className="text-sm text-gray-300 hover:text-white transition">
              Open →
            </a>
          </div>

          <LeaderboardSection compact showStats={false} showActivity={false} tableLimit={10} pollMs={8000} />

          <div className="mt-4 flex justify-center">
            <a
              href="/leaderboard"
              className="inline-flex items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/12 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500/18 hover:border-violet-400/35 transition"
            >
              Open full leaderboard →
            </a>
          </div>
        </section>

        {/* BURN PREVIEW (scroll) */}
        <section className="mt-14">
          <BurnSection />
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} SolArena</span>
          <div className="flex items-center gap-3">
            <a className="hover:text-gray-300 transition" href="/tokenomics">Tokenomics</a>
            <span className="text-gray-700">•</span>
            <a className="hover:text-gray-300 transition" href="/transparency">Transparency</a>
          </div>
        </footer>
      </div>
    </main>
  );
}