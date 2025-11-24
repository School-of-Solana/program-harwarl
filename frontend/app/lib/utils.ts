import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanOnChainEscrow(raw: any) {
  return {
    escrowId: raw.escrowId,

    buyer: raw.buyer.toBase58(),
    seller: raw.seller.toBase58(),

    depositMint: raw.depositMint.toBase58(),
    receiveMint: raw.receiveMint.toBase58(),

    depositAmount:
      raw.depositMint.toBase58() === PublicKey.default.toBase58()
        ? Number(raw.depositAmount) / LAMPORTS_PER_SOL
        : Number(raw.depositAmount),
    receiveAmount:
      raw.receiveMint.toBase58() === PublicKey.default.toBase58()
        ? Number(raw.receiveAmount) / LAMPORTS_PER_SOL
        : Number(raw.receiveAmount),

    createdAt: Number(raw.createdAt.toString()),
    expiry: Number(raw.expiry.toString()),

    bump: raw.bump,

    state: extractState(raw.state),

    buyerRefund: raw.buyerRefund,
    sellerRefund: raw.sellerRefund,
  };
}

export function extractState(stateObj: any) {
  if (stateObj.pending) return "pending";
  if (stateObj.released) return "released";
  if (stateObj.cancelled) return "cancelled";
  if (stateObj.assetSent) return "assetSent";
  if (stateObj.funded) return "funded";
  if (stateObj.active) return "active";
  return "unknown";
}
