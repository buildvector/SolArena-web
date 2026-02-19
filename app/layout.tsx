// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import WalletProviders from "./wallet-providers";

export const metadata: Metadata = {
  title: "Solarena",
  description: "Play. Compete. Burn. Climb.",
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
