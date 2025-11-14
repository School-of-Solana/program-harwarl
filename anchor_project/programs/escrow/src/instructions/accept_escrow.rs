use crate::{errors::*, events::EscrowAccepted, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AcceptEscrow<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), seller.key().as_ref()],
        bump = escrow.bump,
        constraint = escrow.seller == seller.key() @ EscrowError::UnauthorizedSeller
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn _accept_escrow(ctx: Context<AcceptEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let seller = &mut ctx.accounts.seller;

    require!(escrow.expiry > Clock::get()?.unix_timestamp, EscrowError::EscrowExpired);
    require!(escrow.state == EscrowState::Pending, EscrowError::InvalidStateTransition);

    escrow.state = EscrowState::Active;

    emit!(
        EscrowAccepted {
            escrow: escrow.key(),
            seller: seller.key()
        }
    );

    Ok(())
}
