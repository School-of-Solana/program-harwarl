mod errors;
mod events;
mod instructions;
mod state;

use anchor_lang::prelude::*;
use instructions::*;
use state::*;

declare_id!("52FQQ1ukCSkMKKKpYZvm3f3YSQKybWcrg4vdunioYKpm");

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
        description: String,
        expiry: i64,
    ) -> Result<()> {
        _init_escrow(
            ctx,
            escrow_id,
            deposit_mint,
            deposit_amount,
            receive_mint,
            receive_amount,
            description,
            expiry,
        )
    }
    pub fn accept_escrow(ctx: Context<AcceptEscrow>) -> Result<()> {
        _accept_escrow(ctx)
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        _fund_escrow(ctx)
    }

    pub fn send_asset(ctx: Context<SendAsset>) -> Result<()> {
        _send_asset(ctx)
    }

    pub fn confirm_asset(ctx: Context<ConfirmAsset>) -> Result<()> {
        _confirm_asset(ctx)
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        _cancel_escrow(ctx)
    }

    // pub fn auto_release(ctx: Context<AutoRelease>) -> Result<()> {
    //     todo!()
    // }
}
