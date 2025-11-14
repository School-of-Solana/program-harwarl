use anchor_lang::prelude::*;

use crate::{errors::EscrowError, state::*};

#[derive(Accounts)]
pub struct SendAsset<'info> {
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

pub fn _send_asset(ctx: Context<SendAsset>) -> Result<()> {
    let seller: &mut Signer<'_> = &mut ctx.accounts.seller;
    let escrow: &mut Account<'_, Escrow> = &mut ctx.accounts.escrow;

    

    Ok(())
}


