use anchor_lang::prelude::*;

pub const ESCROW_ID_LENGTH: usize = 32;
pub const ESCROW_SEED: &str = "ESCROW_SEED";
pub const SOL_VAULT_SEED: &str = "sol_vault";

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, InitSpace)]
pub enum EscrowState {
    Pending,
    Active,
    Funded,
    AssetSent,
    Released,
    Closed,
    BuyerRefunded,
    SellerRefunded,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,

    // buyer token/sol details
    pub deposit_mint: Pubkey,
    pub deposit_amount: u64,

    // Seller token/sol
    pub receive_mint: Pubkey,
    pub receive_amount: u64,

    pub state: EscrowState,
    pub created_at: i64,
    pub expiry: i64,
    pub bump: u8,

    pub buyer_refund: bool,
    pub seller_refund: bool,

    #[max_len(ESCROW_ID_LENGTH)]
    pub escrow_id: String,
}
