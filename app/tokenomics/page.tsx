// app/tokenomics/page.tsx
import TopNav from "@/app/components/TopNav";

function GlowBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.14),rgba(34,211,238,0.08),rgba(0,0,0,0)_65%)]" />
        <div className="absolute -bottom-48 right-1/4 h-[560px] w-[820px] translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(34,211,238,0.10),rgba(236,72,153,0.06),rgba(0,0,0,0)_70%)]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.60),rgba(0,0,0,0.95))]" />
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-gray-200">
      {children}
    </span>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      {/* subtle sheen */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015),rgba(0,0,0,0))]" />
      </div>

      <div className="relative">
        <div className="text-lg font-bold tracking-tight">{title}</div>
        {desc ? <div className="mt-1 text-sm text-gray-400">{desc}</div> : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>

      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/0 group-hover:ring-white/10 transition" />
    </div>
  );
}

function CtaRow() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href="/burn"
        className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-violet-400/25 bg-violet-500/12 text-white hover:bg-violet-500/18 hover:border-violet-400/35 hover:shadow-[0_0_60px_rgba(168,85,247,0.18)] transition-all"
      >
        Burn & unlock →
      </a>
      <a
        href="/leaderboard"
        className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/15 hover:shadow-[0_0_40px_rgba(255,255,255,0.06)] transition-all"
      >
        View leaderboard →
      </a>
      <a
        href="/#games"
        className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/15 hover:shadow-[0_0_40px_rgba(255,255,255,0.06)] transition-all"
      >
        Play now →
      </a>
    </div>
  );
}

export default function TokenomicsPage() {
  return (
    <main className="min-h-screen text-white">
      <GlowBg />
      <TopNav active="tokenomics" />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
        {/* HERO (premium card like Home) */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.55)]">
          <div className="relative p-6 sm:p-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-[420px] w-[860px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.16),rgba(34,211,238,0.08),rgba(0,0,0,0)_65%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/65" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-gray-200">
                <span className="h-2 w-2 rounded-full bg-cyan-300/80 shadow-[0_0_18px_rgba(34,211,238,0.25)]" />
                Tokenomics • Fast to understand
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
                Simple utility.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200">
                  No promises.
                </span>
              </h1>

              <p className="mt-3 max-w-3xl text-sm sm:text-base text-gray-200/80">
                The token exists to make the arena more competitive: burn to increase your multiplier and earn more
                points on the leaderboard. No staking. No yield. No complicated mechanics.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>🔥 Burn → multiplier</Pill>
                <Pill>🏆 Multiplier → more points</Pill>
                <Pill>⚡ Wins + activity tracked</Pill>
                <Pill>🧾 Auditable events</Pill>
              </div>

              <div className="mt-7">
                <CtaRow />
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Card title="Core loop" desc="The fastest way to understand it.">
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                  1
                </span>
                <div>
                  <div className="font-semibold">Play games</div>
                  <div className="text-gray-400">Wins + activity get recorded on the leaderboard.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                  2
                </span>
                <div>
                  <div className="font-semibold">Burn token</div>
                  <div className="text-gray-400">Burning increases your multiplier (your score power).</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs">
                  3
                </span>
                <div>
                  <div className="font-semibold">Climb the board</div>
                  <div className="text-gray-400">Multiplier boosts points — not your win rate.</div>
                </div>
              </li>
            </ol>
          </Card>

          <Card title="What the token does" desc="Only the essentials.">
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="mt-0.5">✅</span>
                <div>
                  <div className="font-semibold">Burn-based multiplier</div>
                  <div className="text-gray-400">Burn token to increase your points multiplier over time.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5">✅</span>
                <div>
                  <div className="font-semibold">Leaderboard incentives</div>
                  <div className="text-gray-400">Points reflect wins + activity, scaled by multiplier.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5">✅</span>
                <div>
                  <div className="font-semibold">Verifiability</div>
                  <div className="text-gray-400">Burn events are auditable; key actions are visible.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-gray-500">⛔</span>
                <div>
                  <div className="font-semibold text-gray-200">No staking / yield / APY</div>
                  <div className="text-gray-400">No investment promises or passive income mechanics.</div>
                </div>
              </li>
            </ul>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <Card title="Multiplier philosophy" desc="Fair: commitment, not bankroll.">
            <div className="text-sm text-gray-300 space-y-2">
              <div>• Rewards commitment over time.</div>
              <div>• Doesn’t change game outcome.</div>
              <div>• Keeps rules easy to explain fast.</div>
            </div>
          </Card>

          <Card title="Fees & sustainability" desc="Lightweight MVP economics.">
            <div className="text-sm text-gray-300 space-y-2">
              <div>• Small fees can fund infra.</div>
              <div>• Costs stay predictable.</div>
              <div>• Important actions stay visible.</div>
            </div>
          </Card>

          <Card title="Roadmap" desc="Only what we can ship.">
            <div className="text-sm text-gray-300 space-y-2">
              <div>• More games</div>
              <div>• Better ranking signals (streaks/ELO)</div>
              <div>• Stronger transparency metrics</div>
            </div>
          </Card>
        </section>

        {/* PREMIUM CTA PANEL */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.45)]">
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-80">
              <div className="absolute -top-24 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.12),rgba(0,0,0,0)_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
            </div>

            <div className="relative">
              <div className="text-lg font-bold">Ready to climb?</div>
              <div className="mt-1 text-sm text-gray-400 max-w-2xl">
                Fast decision flow: play → see result → burn for multiplier → climb the board.
              </div>
              <div className="mt-5">
                <CtaRow />
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} SolArena</span>
          <span className="text-gray-600">Built on Solana</span>
        </footer>
      </div>
    </main>
  );
}