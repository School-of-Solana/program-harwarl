
use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        close = buyer,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), buyer.key().as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn _cancel_escrow() -> Result<()>{
    todo!()
}