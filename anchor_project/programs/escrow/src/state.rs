use anchor_lang::prelude::*;

pub const ESCROW_ID_LENGTH: usize = 32;
pub const DESCRIPTION_LENGTH: usize = 500;
pub const ESCROW_SEED: &str = "ESCROW_SEED";

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, InitSpace)]
pub enum EscrowState {
    Pending,
    Active,
    Funded,
    AssetSent,
    Released,
    Closed,
    Cancel,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,

    // buyer token/sol details
    pub deposit_mint: Pubkey,
    pub deposit_amount: u64,
    pub deposit_account: Pubkey,

    // Seller token/sol
    pub receive_mint: Pubkey,
    pub receive_amount: u64,
    pub receive_account: Pubkey,

    pub state: EscrowState,
    pub created_at: i64,
    pub expiry: i64,
    pub bump: u8,

    pub requested_release: bool,

    #[max_len(ESCROW_ID_LENGTH)]
    pub escrow_id: String,

    #[max_len(DESCRIPTION_LENGTH)]
    pub description: String,
}
