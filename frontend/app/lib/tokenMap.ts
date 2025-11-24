import { PublicKey } from "@solana/web3.js";

// tokenMap.ts
export const TOKEN_MAP = {
  SOL: {
    symbol: "SOL",
    mint: PublicKey.default,
  },
  USDT: {
    symbol: "USDT",
    mint: "Es9vMFrzaC1H6zzggBqqqEgakx4eCnmLmJtZNe5yW3sn",
  },
  USDC: {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  BONK: {
    symbol: "BONK",
    mint: "DezXAZ8z7PnrnEj9VfZY9QKp5rdSYpX2VgAmuutx7wa4",
  },
  TRUMP: {
    symbol: "TRUMP",
    mint: "6C3gBe8f6c3y7hqGac3fPdcHn7zFhT4UygnC48nNXYnR",
  },
};
