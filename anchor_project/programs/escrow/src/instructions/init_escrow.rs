use crate::{errors::EscrowError, events::*, state::*};
use anchor_lang::prelude::{program::invoke_signed, *};

pub fn _init_escrow(
    ctx: Context<InitializeEscrow>,
    escrow_id: String,
    deposit_mint: Pubkey,
    deposit_amount: u64,
    receive_mint: Pubkey,
    receive_amount: u64,
    expiry: i64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let sol_vault = &mut ctx.accounts.sol_vault;
    let buyer = &mut ctx.accounts.buyer;
    let seller = &mut ctx.accounts.seller;
    let system_program = &mut ctx.accounts.system_program;
    let bump = ctx.bumps.escrow;
    let vault_bump = ctx.bumps.sol_vault;

    require!(
        expiry > Clock::get()?.unix_timestamp,
        EscrowError::InvalidExpiryDate
    );

    require!(
        buyer.key() != seller.key(),
        EscrowError::SameBuyerSellerNotAllowed
    );
    require!(deposit_amount > 0, EscrowError::InvalidDepositAmount);
    require!(receive_amount > 0, EscrowError::InvalidReceiveAmount);
    require!(
        deposit_mint != receive_mint,
        EscrowError::SameTokenTransferNotAllowed
    );

    // create vault is the deposit or receive mint are pubkey::default
    if deposit_mint == Pubkey::default() || receive_mint == Pubkey::default() {
        // create a sol vault
        let rent = Rent::get()?;
        let space = 0;
        let lamports = rent.minimum_balance(space);

        let create_ix = system_instruction::create_account(
            &buyer.key(),
            &sol_vault.key(),
            lamports,
            space as u64,
            &system_program.key(),
        );

        invoke_signed(
            &create_ix,
            &[
                buyer.to_account_info(),
                sol_vault.to_account_info(),
                system_program.to_account_info(),
            ],
            &[&[b"sol_vault", escrow.key().as_ref(), &[vault_bump]]],
        )?;
    };

    // initialize escrow state
    escrow.bump = bump;
    escrow.buyer = buyer.key();
    escrow.seller = seller.key();

    // Deposit details
    escrow.deposit_mint = deposit_mint;
    escrow.deposit_amount = deposit_amount;

    // Receivers Details
    escrow.receive_mint = receive_mint;
    escrow.receive_amount = receive_amount;

    // other data
    escrow.state = EscrowState::Pending;
    escrow.created_at = Clock::get()?.unix_timestamp;
    escrow.expiry = expiry;
    escrow.requested_release = false;
    escrow.escrow_id = escrow_id;

    emit!(EscrowCreated {
        escrow: escrow.key(),
        buyer: buyer.key(),
        seller: seller.key(),
        deposit_amount,
        receive_amount,
    });

    Ok(())
}

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
        bump,
        constraint = escrow_id.len() > 0 @ EscrowError::IdTooShort,
        constraint = escrow_id.len() <= ESCROW_ID_LENGTH @ EscrowError::IdTooLong
    )]
    pub escrow: Account<'info, Escrow>,
    /// CHECK: PDA holding SOL deposits
    #[account(mut, seeds = [b"sol_vault", escrow.key().as_ref()], bump)]
    pub sol_vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
