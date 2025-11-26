use anchor_lang::prelude::*;

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub escrow_authority: Pubkey,
    pub receiver: Pubkey,
}

#[event]
pub struct EscrowCompleted {
    pub escrow: Pubkey,
    pub escrow_authority: Pubkey,
    pub receiver: Pubkey,
}

#[event]
pub struct EscrowClosed {
    pub escrow: Pubkey,
    pub escrow_authority: Pubkey,
    pub receiver: Pubkey,
}
