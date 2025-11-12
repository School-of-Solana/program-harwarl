use anchor_lang::prelude::*;
use crate::state::*;

pub fn _fund_escrow(){}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), buyer.key().as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}