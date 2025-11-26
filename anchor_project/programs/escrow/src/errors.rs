use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Overflow")]
    OverFlow,

    #[msg("Invalid State")]
    InvalidState,

    #[msg("Invalid Deposit Token mint")]
    InvalidDepositMint,

    #[msg("Invalid Receive Token mint")]
    InvalidReceiveMint,

    #[msg("Token to the same token is not allowed")]
    SameTokenTransferNotAllowed,

    #[msg("Token to same buyer and seller is not allowed")]
    SameBuyerSellerNotAllowed,

    #[msg("Escrow is not Active")]
    EscrowNotActive,

    #[msg("Unauthorized Signer")]
    UnauthorizedSigner,

    #[msg("EscrowId too long")]
    IdTooLong,

    #[msg("EscrowId too short")]
    IdTooShort,

    #[msg("Low Deposit Amount")]
    DepositAmountLow,

    #[msg("Low Receive Amount")]
    ReceiveAmountLow,

    #[msg("Insufficient balance")]
    InsufficientBalance,
}
