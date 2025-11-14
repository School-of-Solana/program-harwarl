use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AutoRelease<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn _auto_release(ctx: Context<AutoRelease>) -> Result<()> {
    todo!()
}
