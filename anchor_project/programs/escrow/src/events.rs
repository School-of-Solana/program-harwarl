use anchor_lang::prelude::*;

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub deposit_amount: u64,
    pub receive_amount: u64,
}

#[event]
pub struct EscrowFunded {
    pub escrow: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub funded: u64,
}

#[event]
pub struct EscrowAccepted {
    pub escrow: Pubkey,
    pub seller: Pubkey,
}

#[event]
pub struct EscrowAssetSent {
    pub escrow: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EscrowReleased {
    pub escrow: Pubkey,
}

#[event]
pub struct EscrowBuyerRefund {
    pub escrow: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EscrowSellerRefund {
    pub escrow: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
}
