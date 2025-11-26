use anchor_lang::prelude::*;

pub const ESCROW_ID_LENGTH: usize = 32;
pub const ESCROW_SEED: &str = "ESCROW_SEED";
pub const SOL_VAULT_SEED: &str = "sol_vault";

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, InitSpace)]
pub enum EscrowState {
    Active,
    Completed,
    Closed,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub escrow_authority: Pubkey,
    pub receiver: Pubkey,

    // buyer token/sol details
    pub deposit_mint: Pubkey,
    pub deposit_amount: u64,

    // Seller token/sol details
    pub receive_mint: Pubkey,
    pub receive_amount: u64,

    pub state: EscrowState,
    pub bump: u8,

    #[max_len(ESCROW_ID_LENGTH)]
    pub escrow_id: String,
}
