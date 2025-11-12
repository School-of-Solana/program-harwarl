mod instructions;
mod errors;
mod state;
mod events;


use anchor_lang::prelude::*;
use instructions::*;

declare_id!("52FQQ1ukCSkMKKKpYZvm3f3YSQKybWcrg4vdunioYKpm");

#[program]
pub mod escrow {
    use super::*;

    pub fn init_escrow(ctx: Context<InitializeEscrow>) -> Result<()> {
        todo!()
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        todo!()
    }

    pub fn AcceptEscrow(ctx: Context<AcceptEscrow>) -> Result<()> {
        todo!()
    }

    pub fn send_asset(ctx: Context<SendAsset>) -> Result<()> {
        todo!()
    }

    pub fn confirm_asset(ctx: Context<ConfirmAsset>) -> Result<()> {
        todo!()
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        todo!()
    }

    pub fn auto_release(ctx: Context<AutoRelease>) -> Result<()> {
        todo!()
    }
}

