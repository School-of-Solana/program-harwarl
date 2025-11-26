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
  SAMPX: {
    symbol: "SAMPX",
    mint: "5MT51ZzSA6ePHKZYSKPxFY9bppugLhdzfQ1BkBWwUnPN",
  },
  YING: {
    symbol: "YING",
    mint: "CKkRk6vWyTkuLkyJjw2GNs1jc7MHYj1UrSi7KzGVLeP5",
  },
};

export const MINT_TO_TOKEN: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_MAP).map(([key, value]) => [value.mint, key])
);
