export type EscrowStatus = "active" | "completed" | "closed";

export interface EscrowPayload {
  owner: string;
  receiver: string;
  escrowPda: string;
  description?: string;
}

export interface EscrowData extends EscrowPayload {
  _id: string;
}

export interface Escrow {
  id: string;
  owner: string;
  receiver: string;
  depositMint: string;
  depositAmount: number;
  receiveMint: string;
  receiveAmount: number;
  state: EscrowStatus;
  description?: string; // Remove
  createdAt: string;
  bump: number;
  escrowPda: string; // Remove
}
