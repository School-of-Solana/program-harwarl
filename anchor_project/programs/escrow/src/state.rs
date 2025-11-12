use anchor_lang::prelude::*;

pub const ESCROW_ID_LENGTH : usize = 32;
pub const ESCROW_SEED: &str = "ESCROW_SEED";

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub enum EscrowState {
    Pending,
    Active,
    AssetSent,
    Released,
    Closed,
    Cancel
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    // asset_mint: Pubkey,
    // token_amount: u32,
    pub state: EscrowState,
    pub expiry: i64,
    pub bump: u8,
    #[max_len(ESCROW_ID_LENGTH)]
    pub escrow_id: String,
}