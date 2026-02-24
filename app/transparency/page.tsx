// app/transparency/page.tsx
import TopNav from "@/app/components/TopNav";

function GlowBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(34,211,238,0.11),rgba(168,85,247,0.10),rgba(0,0,0,0)_65%)]" />
        <div className="absolute -bottom-48 right-1/4 h-[560px] w-[820px] translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(236,72,153,0.07),rgba(168,85,247,0.06),rgba(0,0,0,0)_70%)]" />
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
        href="/leaderboard"
        className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/15 hover:shadow-[0_0_40px_rgba(255,255,255,0.06)] transition-all"
      >
        Leaderboard →
      </a>
      <a
        href="/burn"
        className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-violet-400/25 bg-violet-500/12 text-white hover:bg-violet-500/18 hover:border-violet-400/35 hover:shadow-[0_0_60px_rgba(168,85,247,0.18)] transition-all"
      >
        Burn →
      </a>
      <a
        href="/tokenomics"
        className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/15 hover:shadow-[0_0_40px_rgba(255,255,255,0.06)] transition-all"
      >
        Tokenomics →
      </a>
    </div>
  );
}

export default function TransparencyPage() {
  return (
    <main className="min-h-screen text-white">
      <GlowBg />
      <TopNav active="transparency" />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
        {/* HERO (premium card like Home) */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.55)]">
          <div className="relative p-6 sm:p-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-1/2 h-[420px] w-[860px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(34,211,238,0.12),rgba(168,85,247,0.10),rgba(0,0,0,0)_65%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/65" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-gray-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.35)]" />
                Transparency • Verify what happens
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight">
                Verify{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200">
                  what happens.
                </span>
              </h1>

              <p className="mt-3 max-w-3xl text-sm sm:text-base text-gray-200/80">
                SolArena is built around visible outcomes: games and burns show up in public feeds. This page explains
                what you can verify and where.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>✅ Burn events auditable</Pill>
                <Pill>✅ Leaderboard activity visible</Pill>
                <Pill>✅ No APY promises</Pill>
                <Pill>✅ No custody</Pill>
              </div>

              <div className="mt-7">
                <CtaRow />
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <Card title="What you can verify" desc="Core trust layer.">
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="mt-0.5">✅</span>
                <div>
                  <div className="font-semibold">Burn events</div>
                  <div className="text-gray-400">Token burns are on-chain and auditable.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5">✅</span>
                <div>
                  <div className="font-semibold">Leaderboard history</div>
                  <div className="text-gray-400">Ranks reflect recorded wins + activity.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5">✅</span>
                <div>
                  <div className="font-semibold">Live activity</div>
                  <div className="text-gray-400">Recent plays/wins/losses/burns show up in feeds.</div>
                </div>
              </li>
            </ul>
          </Card>

          <Card title="What we don’t claim" desc="Keeps it honest.">
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="mt-0.5 text-gray-500">⛔</span>
                <div>
                  <div className="font-semibold text-gray-200">No investment promises</div>
                  <div className="text-gray-400">We don’t promise profit, APY, or price outcomes.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 text-gray-500">⛔</span>
                <div>
                  <div className="font-semibold text-gray-200">No hidden mechanics</div>
                  <div className="text-gray-400">If it matters, it should be visible and explainable.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 text-gray-500">⛔</span>
                <div>
                  <div className="font-semibold text-gray-200">No custody</div>
                  <div className="text-gray-400">Users keep keys; we don’t hold user funds.</div>
                </div>
              </li>
            </ul>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <Card title="Leaderboard" desc="Public scoreboard for the arena.">
            <a
              href="/leaderboard"
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/15 transition-all"
            >
              Open leaderboard →
            </a>
          </Card>

          <Card title="Burn" desc="Burn tokens to increase multiplier.">
            <a
              href="/burn"
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-violet-400/25 bg-violet-500/12 text-white hover:bg-violet-500/18 hover:border-violet-400/35 transition-all"
            >
              Open burn page →
            </a>
          </Card>

          <Card title="Tokenomics" desc="Simple rules. Fast understanding.">
            <a
              href="/tokenomics"
              className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 hover:border-white/15 transition-all"
            >
              Read tokenomics →
            </a>
          </Card>
        </section>

        {/* PREMIUM CTA PANEL */}
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.45)]">
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-80">
              <div className="absolute -top-24 left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(34,211,238,0.10),rgba(0,0,0,0)_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
            </div>

            <div className="relative">
              <div className="text-lg font-bold">Verify it live</div>
              <div className="mt-1 text-sm text-gray-400 max-w-2xl">
                Open the leaderboard, burn a small amount, and confirm the updates.
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