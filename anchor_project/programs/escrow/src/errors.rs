use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Overflow")]
    OverFlow,

    #[msg("Invalid Deposit Token mint")]
    InvalidDepositMint,

    #[msg("Invalid Receive Token mint")]
    InvalidReceiveMint,

    #[msg("Token to the same token is not allowed")]
    SameTokenTransferNotAllowed,

    #[msg("Invalid Expiry date")]
    InvalidExpiryDate,

    #[msg("Escrow is not Active. Seller must accept before funding.")]
    EscrowNotActive,

    #[msg("Only the buyer can perform this action")]
    UnauthorizedBuyer,

    #[msg("Only the seller can perform this action")]
    UnauthorizedSeller,

    #[msg("Escrow Expired")]
    EscrowExpired,

    #[msg("Escrow Not Funded")]
    EscrowNotFunded,

    #[msg("Invalid State")]
    InvalidStateTransition,

    #[msg("Insufficient Balance")]
    InsufficientBalance,
}
