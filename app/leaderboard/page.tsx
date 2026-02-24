// app/leaderboard/page.tsx
import TopNav from "@/app/components/TopNav";
import LeaderboardSection from "@/app/components/LeaderboardSection";

function GlowBg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(34,211,238,0.10),rgba(168,85,247,0.12),rgba(0,0,0,0)_65%)]" />
        <div className="absolute -bottom-40 right-1/4 h-[520px] w-[720px] translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(circle,rgba(168,85,247,0.14),rgba(0,0,0,0)_70%)]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.65),rgba(0,0,0,0.92))]" />
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen text-white">
      <GlowBg />
      <TopNav active="leaderboard" />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
        <div className="mt-6">
          <LeaderboardSection
            compact={false}
            showStats
            showActivity
            tableLimit={50}
            activityLimit={20}
            pollMs={6000}
          />
        </div>
      </div>
    </main>
  );
}