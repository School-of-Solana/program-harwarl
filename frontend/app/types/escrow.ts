export type EscrowStatus =
  | "pending"
  | "active"
  | "funded"
  | "assetSent"
  | "released"
  | "buyerRefunded"
  | "sellerRefunded"
  | "closed";

export interface EscrowPayload {
  buyer: string;
  seller: string;
  escrowPda: string;
  description?: string;
}

export interface EscrowData extends EscrowPayload {
  _id: string;
}

export interface Escrow {
  id: string; // TODO: REMOVE
  buyer: string;
  seller: string;
  depositMint: string;
  depositAmount: number;
  receiveMint: string;
  receiveAmount: number;
  state: EscrowStatus;
  description?: string; // Remove
  createdAt: string;
  expiry: string;
  bump: number;
  buyer_refund: boolean;
  seller_refund: boolean;
  escrowPda: string; // Remove
}
