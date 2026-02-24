import TopNav from "@/app/components/TopNav";
import BurnSection from "@/app/components/BurnSection";

export default function BurnPage() {
  return (
    <main className="min-h-screen text-white bg-black">
      <TopNav active="burn" />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Burn</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-400 max-w-2xl">
          Burn tokens to increase your multiplier and climb the leaderboard.
        </p>

        <div className="mt-8">
          <BurnSection />
        </div>
      </div>
    </main>
  );
}