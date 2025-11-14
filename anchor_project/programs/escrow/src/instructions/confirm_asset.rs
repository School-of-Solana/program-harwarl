use crate::{events::CancelEscrow, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ConfirmAsset<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), seller.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}

pub fn _confirm_asset(ctx: Context<ConfirmAsset>) -> Result<()> {
    todo!()
}
