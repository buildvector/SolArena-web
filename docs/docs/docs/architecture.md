# SolArena Architecture Overview

SolArena is built as a modular, scalable Web3 PvP gaming platform on Solana.

Core Stack:
- Next.js (Frontend)
- TypeScript
- Solana Web3.js
- Serverless API routes
- On-chain SPL token integration

Architecture Principles:
- Minimal trust assumptions
- Transparent logic
- Modular game expansion
- Fast UX, low friction

System Layers:

1. Frontend Layer
- Wallet connection (Phantom compatible)
- Real-time PvP UI
- Leaderboard display
- Burn interaction panel

2. API Layer
- Game result validation
- Leaderboard calculation
- Burn multiplier calculation
- Snapshot endpoints

3. On-Chain Layer
- SPL Token (KRAV)
- Burn transactions
- Wallet verification
- Fee collection tracking

Game Modules:
- Flip (simple probability PvP)
- Reaction Duel (timing-based skill)
- Tic Tac Toe (strategy-based PvP)
- Future modular game expansion

Leaderboard Engine:
- Aggregated scoring
- Multiplier-adjusted points
- Anti-spam logic
- Season-based segmentation

Burn System:
- Direct token burn
- Multiplier curve calculation
- Diminishing returns algorithm
- Whale advantage protection

Scalability:
- New games can plug into scoring engine
- Season system is independent of games
- Token mechanics remain universal

Security Considerations:
- No custody of user funds
- Transparent fee model
- No hidden mint logic
- Public token supply verification

SolArena is designed to be:
Competitive.
Transparent.
Composable.
Season-driven.