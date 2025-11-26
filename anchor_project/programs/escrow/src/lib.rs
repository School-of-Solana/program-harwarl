mod errors;
mod events;
mod instructions;
mod state;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("nj9z1iSrdSBhFt3jmxmgHzhBLVqE6b2bh7MwLjiDWuq");

#[program]
pub mod escrow {
    use super::*;

    pub fn init_escrow(
        ctx: Context<InitializeEscrow>,
        escrow_id: String,
        deposit_mint: Pubkey,
        deposit_amount: u64,
        receive_mint: Pubkey,
        receive_amount: u64,
    ) -> Result<()> {
        _init_escrow(
            ctx,
            escrow_id,
            deposit_mint,
            deposit_amount,
            receive_mint,
            receive_amount,
        )
    }

    pub fn accept(ctx: Context<Accept>, escrow_id: String) -> Result<()> {
        _accept(ctx, escrow_id)
    }

    pub fn close(ctx: Context<Close>, escrow_id: String) -> Result<()> {
        _close(ctx, escrow_id)
    }
}
