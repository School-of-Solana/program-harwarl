use crate::{errors::EscrowError, escrow, events::CancelEscrow, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ConfirmAsset<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), escrow.seller.key().as_ref()],
        bump = escrow.bump,
        constraint = buyer.key() == escrow.buyer @ EscrowError::UnauthorizedSeller
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn _confirm_asset(ctx: Context<ConfirmAsset>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;

    // handle the sending of funds to the buyer and the seller
    escrow.state = EscrowState::Released;

    Ok(())
}
