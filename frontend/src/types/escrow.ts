export type EscrowStatus =
  | "pending"
  | "active"
  | "funded"
  | "assetSent"
  | "released"
  | "closed";

export interface Escrow {
  id: string;
  buyer: string;
  seller: string;
  depositAsset: string;
  depositAmount: number;
  receiveAsset: string;
  receiveAmount: number;
  status: EscrowStatus;
  description?: string;
  createdAt: string;
  expiry: string;
  bump: number;
  buyer_refund: boolean;
  seller_refund: boolean;
  escrowId: string;
}
