use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct SendAsset<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), seller.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn _send_asset(ctx: Context<SendAsset>) -> Result<()> {
    todo!()
}
