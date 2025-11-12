use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct AcceptEscrow<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), escrow.buyer.as_ref(), seller.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
}


pub fn _accept_escrow (ctx: Context<AcceptEscrow>) -> Result<()> {
    todo!()
}