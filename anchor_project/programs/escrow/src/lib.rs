use anchor_lang::prelude::*;

declare_id!("52FQQ1ukCSkMKKKpYZvm3f3YSQKybWcrg4vdunioYKpm");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
