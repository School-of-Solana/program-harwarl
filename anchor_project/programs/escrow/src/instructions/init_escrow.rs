use anchor_lang::prelude::*;
use crate::{events::*, state::*};

#[derive(Accounts)]
#[instruction(escrow_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK this is just the sellers account
    pub seller: AccountInfo<'info>,
    #[account(
        init, 
        payer = buyer,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [ESCROW_SEED.as_bytes(), escrow_id.as_bytes(), buyer.key().as_ref(), seller.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub system_program: Program<'info, System>
}

pub fn _init_escrow(ctx: Context<InitializeEscrow>, amount: u64) -> Result<()>{
    let escrow = &mut ctx.accounts.escrow;
    let buyer = &mut ctx.accounts.buyer;
    let seller = &mut ctx.accounts.seller;
    

    emit!( EscrowCreated {
        escrow: escrow.key(),
        buyer: buyer.key(),
        seller: seller.key(),
        amount
    });

    todo!()
}