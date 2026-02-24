// app/components/BrandRibbon.tsx
import Image from "next/image";

export default function BrandRibbon() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <div className="relative h-[78px] sm:h-[92px]">
          <Image
            src="/brand/solarena-banner.png"
            alt="SolArena"
            fill
            priority
            className="object-cover"
          />
          {/* Make it look expensive */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-black/70" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02),rgba(0,0,0,0))]" />
        </div>
      </div>
    </div>
  );
}