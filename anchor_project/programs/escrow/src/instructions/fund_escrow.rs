use crate::errors::*;
use crate::events::EscrowFunded;
use crate::state::*;
use anchor_lang::prelude::program::invoke;
use anchor_lang::prelude::system_instruction::transfer;
use anchor_lang::prelude::*;
use anchor_spl::token_2022::transfer_checked;
use anchor_spl::token_2022::TransferChecked;
use anchor_spl::token_interface::Mint;
use anchor_spl::{
    associated_token::AssociatedToken, token_2022::Token2022, token_interface::TokenAccount,
};

pub fn _fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let mint = &mut ctx.accounts.mint;
    let buyer = &mut ctx.accounts.buyer;
    let buyer_ata = &mut ctx.accounts.buyer_ata;
    let escrow_ata = &mut ctx.accounts.escrow_ata;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;
    let mint_decimals = mint.decimals;

    require!(
        escrow.expiry > Clock::get()?.unix_timestamp,
        EscrowError::EscrowExpired
    );

    // check state of the escrow
    require!(
        escrow.state == EscrowState::Active,
        EscrowError::EscrowNotActive
    );

    // check if th ebuyer is the. one funding
    require!(buyer.key() == escrow.buyer, EscrowError::UnauthorizedBuyer);

    // check if the deposit mint is default and do sol transfer
    if escrow.deposit_mint == Pubkey::default() {
        // fund the escrow with SOl
        // check for sufficient balance
        require!(
            buyer.to_account_info().lamports() >= escrow.receive_amount,
            EscrowError::InsufficientBalance
        );
        // check for overflow
        escrow
            .to_account_info()
            .lamports()
            .checked_add(escrow.deposit_amount)
            .ok_or(EscrowError::OverFlow)?;

        let transfer_ctx = transfer(&buyer.key(), &escrow.key(), escrow.deposit_amount);

        invoke(
            &transfer_ctx,
            &[
                buyer.to_account_info(),
                escrow.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;
    } else {
        // fund the escrow ata with token
        // check if the mint address matches what was agreed on
        require!(
            mint.key() == escrow.deposit_mint,
            EscrowError::InvalidDepositMint
        );

        // check if the buyer has sufficient balance
        require!(
            buyer_ata.amount > escrow.deposit_amount,
            EscrowError::InsufficientBalance
        );

        // check for overflow
        escrow_ata
            .amount
            .checked_add(escrow.deposit_amount)
            .ok_or(EscrowError::OverFlow)?;

        let transfer_ctx = CpiContext::new(
            token_program.to_account_info(),
            TransferChecked {
                authority: buyer.to_account_info(),
                mint: mint.to_account_info(),
                to: escrow.to_account_info(),
                from: buyer.to_account_info(),
            },
        );

        transfer_checked(transfer_ctx, escrow.deposit_amount, mint_decimals)?;
    }

    escrow.state = EscrowState::Funded;

    // emit event
    emit!(EscrowFunded {
        escrow: escrow.key(),
        mint: mint.key(),
        amount: escrow.deposit_amount,
        funded: escrow.deposit_amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program
    )]
    pub buyer_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), buyer.key().as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump,
        constraint = escrow.buyer == buyer.key() @ EscrowError::UnauthorizedBuyer
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
            init_if_needed,
            payer = buyer,
            associated_token::mint = mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_ata: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
