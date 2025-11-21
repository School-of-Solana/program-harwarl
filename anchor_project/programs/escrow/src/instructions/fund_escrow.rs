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
    let sol_vault = &mut ctx.accounts.sol_vault;
    let buyer = &mut ctx.accounts.buyer;
    let system_program = &mut ctx.accounts.system_program;
    let token_program = &mut ctx.accounts.token_program;

    // optionals
    let mint = ctx.accounts.mint.as_ref();
    let buyer_ata = ctx.accounts.buyer_ata.as_ref();
    let escrow_ata = ctx.accounts.escrow_ata.as_ref();

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
            buyer.to_account_info().lamports() >= escrow.deposit_amount,
            EscrowError::InsufficientBalance
        );
        // check for overflow
        sol_vault
            .to_account_info()
            .lamports()
            .checked_add(escrow.deposit_amount)
            .ok_or(EscrowError::OverFlow)?;

        let transfer_ctx = transfer(&buyer.key(), &sol_vault.key(), escrow.deposit_amount);

        invoke(
            &transfer_ctx,
            &[
                buyer.to_account_info(),
                sol_vault.to_account_info(),
                system_program.to_account_info(),
            ],
        )?;
    } else {
        // fund the escrow ata with token
        // check if the mint address matches what was agreed on
        let mint = mint.unwrap();
        let from_ata = buyer_ata.unwrap();
        let to_ata = escrow_ata.unwrap();
        require!(
            mint.key() == escrow.deposit_mint,
            EscrowError::InvalidDepositMint
        );

        // check if the buyer has sufficient balance
        require!(
            from_ata.amount > escrow.deposit_amount,
            EscrowError::InsufficientBalance
        );

        // check for overflow
        to_ata
            .amount
            .checked_add(escrow.deposit_amount)
            .ok_or(EscrowError::OverFlow)?;

        let transfer_ctx = CpiContext::new(
            token_program.to_account_info(),
            TransferChecked {
                authority: buyer.to_account_info(),
                mint: mint.to_account_info(),
                to: to_ata.to_account_info(),
                from: from_ata.to_account_info(),
            },
        );

        transfer_checked(transfer_ctx, escrow.deposit_amount, mint.decimals)?;
    }

    escrow.state = EscrowState::Funded;

    // emit event
    emit!(EscrowFunded {
        escrow: escrow.key(),
        mint: escrow.deposit_mint,
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
    pub mint: Option<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program
    )]
    pub buyer_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        seeds = [ESCROW_SEED.as_bytes(), escrow.escrow_id.as_bytes(), buyer.key().as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump,
        constraint = escrow.buyer == buyer.key() @ EscrowError::UnauthorizedBuyer
    )]
    pub escrow: Account<'info, Escrow>,
    /// CHECK: PDA holding SOL deposits
    #[account(
    mut,
    seeds = [b"sol_vault", escrow.key().as_ref()],
    bump
)]
    pub sol_vault: UncheckedAccount<'info>,
    #[account(
            init_if_needed,
            payer = buyer,
            associated_token::mint = mint,
            associated_token::authority = escrow,
            associated_token::token_program = token_program
        )]
    pub escrow_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
