export type EscrowStatus =
  | "pending"
  | "active"
  | "funded"
  | "assetSent"
  | "released"
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
  depositAsset: string;
  depositAmount: number;
  receiveAsset: string;
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
