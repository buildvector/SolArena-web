// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import WalletProviders from "./wallet-providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://sol-arena.com"),

  title: "SolArena — PvP On-Chain Games",
  description: "Play. Burn. Climb the Leaderboard.",

  openGraph: {
    title: "SolArena — PvP On-Chain Games",
    description: "Play. Burn. Climb the Leaderboard.",
    url: "https://sol-arena.com",
    siteName: "SolArena",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SolArena — PvP On-Chain Games",
    description: "Play. Burn. Climb the Leaderboard.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProviders>{children}</WalletProviders>
      </body>
    </html>
  );
}