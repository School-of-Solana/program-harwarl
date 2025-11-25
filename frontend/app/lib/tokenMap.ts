import { PublicKey } from "@solana/web3.js";

// tokenMap.ts
export const TOKEN_MAP = {
  SOL: {
    symbol: "SOL",
    mint: PublicKey.default.toBase58(),
  },
  TOKX: {
    symbol: "TOKX",
    mint: "DnXUvjazdr3T6UVjGmDE7kLbzZKjaYs8hY2AFZeC7Nf3",
  },
};

export const MINT_TO_TOKEN: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_MAP).map(([key, value]) => [value.mint, key])
);
