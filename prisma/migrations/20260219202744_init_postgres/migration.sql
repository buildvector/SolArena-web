-- CreateTable
CREATE TABLE "Player" (
    "wallet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "burnedAmount" INTEGER NOT NULL DEFAULT 0,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "volumeSol" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pointsRaw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pointsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "amountSol" DOUBLE PRECISION,
    "meta" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
