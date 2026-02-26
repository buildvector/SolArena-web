// app/games/page.tsx
import Image from "next/image";
import TopNav from "@/app/components/TopNav";

function GlowBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute -top-28 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(34,211,238,0.08),rgba(168,85,247,0.10),rgba(0,0,0,0)_65%)]" />
        <div className="absolute -bottom-40 right-1/4 h-[520px] w-[720px] translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.10),rgba(34,211,238,0.06),rgba(0,0,0,0)_70%)]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.58),rgba(0,0,0,0.93))]" />
    </div>
  );
}

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
      {/* sheen */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01),rgba(0,0,0,0))]" />
      </div>

      <div className="relative p-3">
        <div className="flex items-center justify-between">
          <span
            className={[
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold",
              badgeCls,
            ].join(" ")}
          >
            {badge}
          </span>
          <span className="text-[11px] text-gray-500 group-hover:text-gray-300 transition">Open ↗</span>
        </div>

        {/* IMAGE ZONE (robust layering) */}
        <div className="mt-2">
          <div className="relative w-full h-[360px] sm:h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            {/* soft vignette UNDER image */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.08),rgba(0,0,0,0)_62%)]" />
            {/* image ABOVE overlays */}
            <div className="absolute inset-0 z-10">
              <Image
                src={imageSrc}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
                className="object-contain drop-shadow-[0_28px_70px_rgba(0,0,0,0.78)] transition-transform duration-200 group-hover:scale-[1.06]"
              />
            </div>
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

export default function GamesPage() {
  return (
    <main className="min-h-screen text-white">
      <GlowBg />
      <TopNav active="games" />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
        <header className="mt-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Games</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl">
            Open a game in a new tab. Wins & volume are tracked on the leaderboard.
          </p>
        </header>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} SolArena</span>
          <span className="text-gray-600">Built on Solana</span>
        </footer>
      </div>
    </main>
  );
}